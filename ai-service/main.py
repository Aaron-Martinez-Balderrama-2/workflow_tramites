import os
import json
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import tempfile

# Configuración básica de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Microservice for Workflow Tramites")

# Permitir CORS para desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variable global para el modelo Whisper (carga diferida/perezosa para evitar bloqueos al arrancar)
whisper_model = None

def load_whisper_model():
    global whisper_model
    if whisper_model is None:
        try:
            import whisper
            logger.info("Cargando modelo Whisper (tiny)... esto puede tardar la primera vez.")
            whisper_model = whisper.load_model("tiny")
            logger.info("Modelo Whisper cargado exitosamente.")
        except Exception as e:
            logger.error(f"Error al cargar Whisper: {e}. Asegúrate de tener ffmpeg y torch instalados.")
            whisper_model = "MOCK"

@app.on_event("startup")
async def startup_event():
    # Podemos intentar cargar el modelo al inicio, o dejarlo perezoso
    logger.info("Servicio de IA iniciado. Modelo Whisper cargará en la primera petición.")

@app.post("/api/ai/transcribe-and-analyze")
async def transcribe_and_analyze(
    audio: UploadFile = File(...),
    schemaStr: str = Form("{}")
):
    """
    Recibe un archivo de audio y el esquema del formulario dinámico.
    1. Transcribe el audio con Whisper.
    2. Usa procesamiento de lenguaje natural (NLP) para mapear el texto al esquema.
    """
    logger.info(f"Recibido archivo: {audio.filename}")
    
    # 1. Cargar modelo si no está cargado
    load_whisper_model()
    
    # 2. Guardar archivo temporal
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_audio:
        shutil.copyfileobj(audio.file, tmp_audio)
        tmp_audio_path = tmp_audio.name
        
    try:
        # 3. Transcribir
        transcribed_text = ""
        if whisper_model == "MOCK":
            logger.warning("Usando MOCK de transcripción debido a que Whisper no está disponible.")
            transcribed_text = "Quiero reportar un problema de tipo grave que ocurrió hoy. El nombre es Juan Pérez y el área es ventas."
        else:
            logger.info("Iniciando transcripción...")
            result = whisper_model.transcribe(tmp_audio_path, language="es")
            transcribed_text = result["text"]
            logger.info(f"Texto transcrito: {transcribed_text}")
            
        # 4. Procesamiento de Lenguaje Natural (NLP) para rellenar el formulario
        # Aquí idealmente se usa un LLM (ej. un modelo pequeño de transformers o llamada a API)
        # Para esta implementación inicial, usaremos heurística/búsqueda de palabras clave simulando una red neuronal simple.
        
        form_schema = json.loads(schemaStr)
        extracted_data = {}
        
        # Lógica heurística simulando NLP
        texto_lower = transcribed_text.lower()
        
        for field in form_schema:
            field_id = field.get("id", "").lower()
            field_label = field.get("label", "").lower()
            field_type = field.get("type", "string")
            
            if field_type == "boolean":
                # Detectar palabras de afirmación
                if any(word in texto_lower for word in ["sí", "si", "confirmado", "afirmativo", "claro", "por supuesto"]):
                    extracted_data[field_id] = True
                elif any(word in texto_lower for word in ["no", "negativo", "nunca"]):
                    extracted_data[field_id] = False
                    
            elif field_type == "enum" and "options" in field:
                # Detectar si alguna opción es mencionada
                for opt in field.get("options", []):
                    opt_name = opt.get("name", "").lower()
                    if opt_name in texto_lower:
                        extracted_data[field_id] = opt.get("id")
                        break
                        
            elif field_type == "string":
                if "descripcion" in field_id or "descripción" in field_id or "descripcion" in field_label or "descripción" in field_label:
                    extracted_data[field_id] = transcribed_text.strip()
                elif "nombre" in field_id or "programa" in field_id or "nombre" in field_label or "programa" in field_label:
                    if "programa es " in texto_lower:
                        parts = texto_lower.split("programa es ")
                        extracted_data[field_id] = parts[1].split()[0].capitalize()
                    elif "nombre es " in texto_lower:
                        parts = texto_lower.split("nombre es ")
                        extracted_data[field_id] = parts[1].split()[0].capitalize()
                    elif "falla en " in texto_lower:
                        parts = texto_lower.split("falla en ")
                        extracted_data[field_id] = parts[1].split()[0].capitalize()
                    elif "me llamo " in texto_lower:
                        parts = texto_lower.split("me llamo ")
                        extracted_data[field_id] = parts[1].split()[0].capitalize()
                    else:
                        # Fallback robusto: si no usa las palabras clave, intentamos buscar nombres conocidos o tomar la última palabra
                        palabras = texto_lower.replace('.', '').split()
                        if len(palabras) == 1:
                            extracted_data[field_id] = palabras[0].capitalize()
                        elif "es " in texto_lower:
                            extracted_data[field_id] = texto_lower.split("es ")[1].split()[0].capitalize()
                        else:
                            extracted_data[field_id] = palabras[-1].capitalize()
                elif "area" in field_id or "área" in field_id or "area" in field_label or "área" in field_label:
                    if "área de " in texto_lower:
                        parts = texto_lower.split("área de ")
                        extracted_data[field_id] = parts[1].split()[0].capitalize()
                    elif "area de " in texto_lower:
                        parts = texto_lower.split("area de ")
                        extracted_data[field_id] = parts[1].split()[0].capitalize()
            elif field_type == "long" or field_type == "int":
                import re
                text_to_num = {
                    "cero": 0, "uno": 1, "un": 1, "una": 1, "dos": 2, "tres": 3, "cuatro": 4, 
                    "cinco": 5, "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10
                }
                
                # Buscar contexto clave basado en el nombre del campo
                context_word = field_id.split('_')[-1] # ej: "involucrados"
                
                palabras = texto_lower.replace(',', '').replace('.', '').split()
                encontrado = False
                
                # Intentar buscar el número justo antes de la palabra de contexto
                if context_word in texto_lower:
                    try:
                        idx = palabras.index(context_word)
                        # Revisar las 3 palabras anteriores
                        for i in range(max(0, idx-3), idx):
                            if palabras[i] in text_to_num:
                                extracted_data[field_id] = text_to_num[palabras[i]]
                                encontrado = True
                                break
                            elif palabras[i].isdigit():
                                extracted_data[field_id] = int(palabras[i])
                                encontrado = True
                                break
                    except ValueError:
                        pass
                        
                if not encontrado:
                    # Fallback original
                    numeros = re.findall(r'\d+', texto_lower)
                    if numeros:
                        extracted_data[field_id] = int(numeros[0])
                    else:
                        for palabra in palabras:
                            if palabra in text_to_num:
                                extracted_data[field_id] = text_to_num[palabra]
                                break
                        
        logger.info(f"Datos extraídos: {extracted_data}")
        
        return {
            "success": True,
            "transcription": transcribed_text,
            "extractedData": extracted_data
        }
        
    except Exception as e:
        logger.error(f"Error en análisis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Limpiar archivo temporal
        if os.path.exists(tmp_audio_path):
            os.remove(tmp_audio_path)

@app.post("/api/ai/classify-intent")
async def classify_intent(
    audio: UploadFile = File(...),
    policiesStr: str = Form("[]"),
    schemaStr: str = Form("[]")
):
    """
    Recibe un archivo de audio, lista de políticas y esquema de requisitos.
    Transcribe el audio, decide la política y autocompleta los requisitos.
    """
    logger.info(f"Recibido archivo para clasificación: {audio.filename}")
    load_whisper_model()
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_audio:
        shutil.copyfileobj(audio.file, tmp_audio)
        tmp_audio_path = tmp_audio.name
        
    try:
        logger.info("Iniciando transcripción para clasificación...")
        result = whisper_model.transcribe(tmp_audio_path, language="es")
        transcribed_text = result["text"]
        logger.info(f"Texto transcrito (Intención): {transcribed_text}")
        
        # Parsear las políticas disponibles
        policies = json.loads(policiesStr)
        texto_lower = transcribed_text.lower()
        
        # 1. Extraer nombre del cliente de la narrativa
        cliente_nombre = "Desconocido"
        if "nombre es " in texto_lower:
            parts = texto_lower.split("nombre es ")
            cliente_nombre = parts[1].split()[0].capitalize()
        elif "me llamo " in texto_lower:
            parts = texto_lower.split("me llamo ")
            cliente_nombre = parts[1].split()[0].capitalize()
        elif "cliente " in texto_lower:
            parts = texto_lower.split("cliente ")
            cliente_nombre = parts[1].split()[0].capitalize()
        elif "usuario " in texto_lower:
            parts = texto_lower.split("usuario ")
            cliente_nombre = parts[1].split()[0].capitalize()
            
        # 2. Heurística de similitud para encontrar la política ganadora
        mejor_puntaje = -1
        politica_ganadora_id = None
        
        for pol in policies:
            palabras_clave = [p.lower() for p in pol.get("nombre", "").split() if len(p) > 3]
            puntaje = sum(1 for p in palabras_clave if p in texto_lower)
            
            if puntaje > mejor_puntaje:
                mejor_puntaje = puntaje
                politica_ganadora_id = pol.get("id")
                
        if mejor_puntaje == 0 and len(policies) > 0:
            politica_ganadora_id = policies[0].get("id")
            
        logger.info(f"Política seleccionada: {politica_ganadora_id} para cliente {cliente_nombre}")
        
        # 3. Extracción de Requisitos (Schema)
        form_schema = json.loads(schemaStr)
        extracted_data = {}
        for field in form_schema:
            field_id = field.get("id", "")
            field_type = field.get("type", "string")
            
            if field_type == "enum":
                for opt in field.get("options", []):
                    opt_name = opt.get("name", "").lower()
                    opt_id = opt.get("id", "").lower()
                    # Buscar el id ("software", "hardware") en el texto o la opción exacta
                    if opt_id in texto_lower or opt_name in texto_lower or opt_name.replace("problema de ", "") in texto_lower:
                        extracted_data[field_id] = opt.get("id")
                        break
            elif field_type == "string":
                if "descripcion" in field_id or "descripción" in field_id:
                    extracted_data[field_id] = transcribed_text.strip()
                    
        return {
            "success": True,
            "transcription": transcribed_text,
            "clienteNombre": cliente_nombre,
            "selectedPolicyId": politica_ganadora_id,
            "extractedData": extracted_data
        }
        
    except Exception as e:
        logger.error(f"Error en transcribe_and_analyze: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/predict-risk")
async def predict_risk(tramites_data: dict):
    """
    Recibe un diccionario con una lista de trámites: {"tramites": [...]}
    Pasa cada uno por la red neuronal de TensorFlow para predecir riesgos y rutas.
    """
    try:
        from risk_model import predict_tramite_risk
        
        resultados = []
        tramites_list = tramites_data.get("tramites", [])
        
        for t in tramites_list:
            estado = t.get("estado", "PENDIENTE")
            avance = int(t.get("porcentajeAvance", 0))
            descripcion = t.get("descripcion", "")
            
            # Llamar a TensorFlow
            prediccion = predict_tramite_risk(estado, avance, descripcion)
            
            resultados.append({
                "tramiteId": t.get("id"),
                "clienteNombre": t.get("clienteNombre"),
                "estado": estado,
                "aiPredictions": prediccion
            })
            
        return {"success": True, "predictions": resultados}
        
    except Exception as e:
        logger.error(f"Error en predict_risk: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/classify-intent")
async def classify_intent(
    audio: UploadFile = File(...),
    policiesStr: str = Form("[]"),
    schemaStr: str = Form("[]")
):
    """
    Ruta original para el One-Click Dispatch
    """
    try:
        # 1. Cargar modelo Whisper
        load_whisper_model()
        
        # 2. Guardar archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_audio:
            shutil.copyfileobj(audio.file, tmp_audio)
            tmp_audio_path = tmp_audio.name
            
        transcribed_text = ""
        if whisper_model == "MOCK":
            logger.warning("Usando MOCK de transcripción debido a que Whisper no está disponible.")
            transcribed_text = "Quiero reportar un problema de tipo grave que ocurrió hoy. El nombre es Juan Pérez y el área es ventas."
        else:
            logger.info("Iniciando transcripción en classify_intent...")
            result = whisper_model.transcribe(tmp_audio_path, language="es")
            transcribed_text = result["text"]
            logger.info(f"Texto transcrito: {transcribed_text}")
            
        # [TODO: Implementar NLP real para seleccionar la mejor política usando LLM/Transformers]
        # Por ahora enviamos una respuesta dummy o básica basada en palabras clave
        
        return {"success": True, "transcription": transcribed_text, "selectedPolicyId": "dummy", "extractedData": {}}
        
    except Exception as e:
        logger.error(f"Error en clasificación: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'tmp_audio_path' in locals() and os.path.exists(tmp_audio_path):
            os.remove(tmp_audio_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
