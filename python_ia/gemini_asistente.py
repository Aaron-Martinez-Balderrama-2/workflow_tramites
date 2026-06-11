import sys
import os
import json
import requests
import subprocess
import time
import xml.etree.ElementTree as ET
import uuid
from doctor_seguridad import check_safety

sys.stdout.reconfigure(encoding='utf-8')

# --- RUTAS DINÁMICAS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEBUG_FILE = os.path.join(BASE_DIR, "ia_debug_output.xml")
BRAIN_LOG = os.path.join(BASE_DIR, "ia_last_brain_response.txt")

# --- CONFIGURACIÓN ---
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3:latest"

NS = {
    'bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
    'bpmndi': 'http://www.omg.org/spec/BPMN/20100524/DI',
    'dc': 'http://www.omg.org/spec/DD/20100524/DC',
    'di': 'http://www.omg.org/spec/DD/20100524/DI'
}
for prefix, uri in NS.items():
    ET.register_namespace(prefix, uri)

def generar_diagrama_completo(instruccion_json):
    """
    MODO ARQUITECTO: Genera un XML completo desde cero con Auto-Layout lineal.
    """
    try:
        data = json.loads(instruccion_json)
        nodos = data.get("nodos", [])
        conexiones = data.get("conexiones", [])

        # 1. Raíz y Proceso
        root = ET.Element(f"{{http://www.omg.org/spec/BPMN/20100524/MODEL}}definitions")
        root.set("id", f"Definitions_{uuid.uuid4().hex[:8]}")
        root.set("targetNamespace", "http://bpmn.io/schema/bpmn")
        
        proc_id = f"Process_1"
        process = ET.SubElement(root, f"{{http://www.omg.org/spec/BPMN/20100524/MODEL}}process")
        process.set("id", proc_id)
        process.set("isExecutable", "true")

        # 2. DI (Lienzo)
        diagram = ET.SubElement(root, f"{{http://www.omg.org/spec/BPMN/20100524/DI}}BPMNDiagram")
        diagram.set("id", "BPMNDiagram_1")
        plane = ET.SubElement(diagram, f"{{http://www.omg.org/spec/BPMN/20100524/DI}}BPMNPlane")
        plane.set("id", "BPMNPlane_1")
        plane.set("bpmnElement", proc_id)

        # 3. Dibujar Nodos (Layout Lineal X)
        pos_x = 100
        coordenadas = {}

        for nodo in nodos:
            nid = nodo["id"]
            tipo = nodo["tipo"]
            nombre = nodo.get("nombre", "")

            # Lógica
            el = ET.SubElement(process, f"{{http://www.omg.org/spec/BPMN/20100524/MODEL}}{tipo}")
            el.set("id", nid)
            el.set("name", nombre)

            # Visual
            w, h = (100, 80) if tipo == "task" else (36, 36)
            y_off = 100 if tipo == "task" else 122
            
            shape = ET.SubElement(plane, f"{{http://www.omg.org/spec/BPMN/20100524/DI}}BPMNShape")
            shape.set("id", f"{nid}_di")
            shape.set("bpmnElement", nid)
            bounds = ET.SubElement(shape, f"{{http://www.omg.org/spec/DD/20100524/DC}}Bounds")
            bounds.set("x", str(pos_x))
            bounds.set("y", str(y_off))
            bounds.set("width", str(w))
            bounds.set("height", str(h))

            coordenadas[nid] = {"x": pos_x, "y": y_off, "w": w, "h": h}
            pos_x += 200

        # 4. Dibujar Conexiones
        for conn in conexiones:
            fid = f"Flow_{uuid.uuid4().hex[:8]}"
            src, dst = conn["origen"], conn["destino"]
            
            flow = ET.SubElement(process, f"{{http://www.omg.org/spec/BPMN/20100524/MODEL}}sequenceFlow")
            flow.set("id", fid)
            flow.set("sourceRef", src)
            flow.set("targetRef", dst)

            if src in coordenadas and dst in coordenadas:
                edge = ET.SubElement(plane, f"{{http://www.omg.org/spec/BPMN/20100524/DI}}BPMNEdge")
                edge.set("id", f"{fid}_di")
                edge.set("bpmnElement", fid)
                
                # Waypoint Salida
                wp1 = ET.SubElement(edge, f"{{http://www.omg.org/spec/DD/20100524/DI}}waypoint")
                wp1.set("x", str(coordenadas[src]["x"] + coordenadas[src]["w"]))
                wp1.set("y", str(coordenadas[src]["y"] + (coordenadas[src]["h"] // 2)))
                
                # Waypoint Entrada
                wp2 = ET.SubElement(edge, f"{{http://www.omg.org/spec/DD/20100524/DI}}waypoint")
                wp2.set("x", str(coordenadas[dst]["x"]))
                wp2.set("y", str(coordenadas[dst]["y"] + (coordenadas[dst]["h"] // 2)))

        xml_res = ET.tostring(root, encoding='utf-8', xml_declaration=True).decode('utf-8')
        xml_res = xml_res.replace("ns0:", "bpmn:").replace("xmlns:ns0", "xmlns:bpmn")
        xml_res = xml_res.replace("ns1:", "bpmndi:").replace("xmlns:ns1", "xmlns:bpmndi")
        xml_res = xml_res.replace("ns2:", "dc:").replace("xmlns:ns2", "xmlns:dc")
        xml_res = xml_res.replace("ns3:", "di:").replace("xmlns:ns3", "xmlns:di")
        return xml_res
    except Exception as e:
        return f"Error Arquitecto: {str(e)}"

def aplicar_cambio_quirurgico(xml_string, instruccion_json):
    """
    MODO CIRUJANO: Edita un XML existente de forma segura limpiando referencias muertas.
    """
    try:
        data = json.loads(instruccion_json)
        accion = data.get("accion")
        id_t = data.get("id_elemento")
        val = data.get("nuevo_valor")
        tipo = data.get("tipo_elemento", "task")
        
        root = ET.fromstring(xml_string)

        if accion == "eliminar" and id_t:
            # 1. Buscar secuencias conectadas (entrantes o salientes)
            flujos_a_borrar = []
            for flow in root.findall('.//bpmn:sequenceFlow', NS):
                if flow.get('sourceRef') == id_t or flow.get('targetRef') == id_t:
                    flujos_a_borrar.append(flow.get('id'))
            
            # 2. Barrido total en el árbol lógico del proceso
            for parent in root.iter():
                for child in list(parent):
                    # Eliminar el objeto en sí o sus flujos
                    if child.get("id") == id_t or child.get("id") in flujos_a_borrar:
                        parent.remove(child)
                    # Solución al Bug: Aplicar .strip() al texto para evitar falsos negativos en Lanes
                    elif child.tag.endswith('flowNodeRef') and child.text and child.text.strip() == id_t:
                        parent.remove(child)
            
            # 3. Barrido total en el plano visual (BPMNDiagram)
            for plane in root.findall('.//bpmndi:BPMNPlane', NS):
                for visual_element in list(plane):
                    elem_id = visual_element.get("bpmnElement")
                    if elem_id == id_t or elem_id in flujos_a_borrar:
                        plane.remove(visual_element)

        elif accion == "editar_nombre" and id_t:
            for el in root.iter():
                if el.get("id") == id_t: 
                    el.set("name", val)
                    
        elif accion == "crear":
            # Extraer referencias de conexión si Ollama las envió
            origen = data.get("origen")
            destino = data.get("destino")
            
            # Si la IA no envía un tipo estructurado, deduce del valor
            if not tipo or tipo == "task":
                if val and ("start" in str(val).lower() or "inicio" in str(val).lower()):
                    tipo = "startEvent"
            
            new_id = f"{tipo}_{uuid.uuid4().hex[:6]}"
            proc = root.find('.//bpmn:process', NS)
            if proc is not None:
                # 1. Crear el nuevo elemento lógico
                new_el = ET.SubElement(proc, f"{{http://www.omg.org/spec/BPMN/20100524/MODEL}}{tipo}")
                new_el.set("id", new_id)
                new_el.set("name", val if val else "Nuevo Elemento")
                
                # 2. Crear la forma visual del elemento
                plane = root.find('.//bpmndi:BPMNPlane', NS)
                if plane is not None:
                    shape = ET.SubElement(plane, f"{{http://www.omg.org/spec/BPMN/20100524/DI}}BPMNShape")
                    shape.set("id", f"{new_id}_di")
                    shape.set("bpmnElement", new_id)
                    b = ET.SubElement(shape, f"{{http://www.omg.org/spec/DD/20100524/DC}}Bounds")
                    b.set("x", "180")
                    b.set("y", "120") # Lo dejamos fijo temporalmente, el usuario o bpmn-js lo acomoda
                    b.set("width", "100" if tipo == "task" else "36")
                    b.set("height", "80" if tipo == "task" else "36")

                # --- 3. NUEVA LÓGICA DE CONEXIÓN ---
                if origen:
                    flow_id = f"Flow_{uuid.uuid4().hex[:6]}"
                    flow = ET.SubElement(proc, f"{{http://www.omg.org/spec/BPMN/20100524/MODEL}}sequenceFlow")
                    flow.set("id", flow_id)
                    flow.set("sourceRef", origen)
                    flow.set("targetRef", new_id)
                    
                    if plane is not None:
                        edge = ET.SubElement(plane, f"{{http://www.omg.org/spec/BPMN/20100524/DI}}BPMNEdge")
                        edge.set("id", f"{flow_id}_di")
                        edge.set("bpmnElement", flow_id)
                        wp1 = ET.SubElement(edge, f"{{http://www.omg.org/spec/DD/20100524/DI}}waypoint")
                        wp1.set("x", "216")
                        wp1.set("y", "138")
                        wp2 = ET.SubElement(edge, f"{{http://www.omg.org/spec/DD/20100524/DI}}waypoint")
                        wp2.set("x", "250")
                        wp2.set("y", "138")

                if destino:
                    flow_id = f"Flow_{uuid.uuid4().hex[:6]}"
                    flow = ET.SubElement(proc, f"{{http://www.omg.org/spec/BPMN/20100524/MODEL}}sequenceFlow")
                    flow.set("id", flow_id)
                    flow.set("sourceRef", new_id)
                    flow.set("targetRef", destino)
                    
                    if plane is not None:
                        edge = ET.SubElement(plane, f"{{http://www.omg.org/spec/BPMN/20100524/DI}}BPMNEdge")
                        edge.set("id", f"{flow_id}_di")
                        edge.set("bpmnElement", flow_id)
                        wp1 = ET.SubElement(edge, f"{{http://www.omg.org/spec/DD/20100524/DI}}waypoint")
                        wp1.set("x", "216")
                        wp1.set("y", "138")
                        wp2 = ET.SubElement(edge, f"{{http://www.omg.org/spec/DD/20100524/DI}}waypoint")
                        wp2.set("x", "250")
                        wp2.set("y", "138")

        # Re-serializar asegurando que los namespaces se mantengan intactos
        xml_res = ET.tostring(root, encoding='utf-8', xml_declaration=True).decode('utf-8')
        xml_res = xml_res.replace("ns0:", "bpmn:").replace("xmlns:ns0", "xmlns:bpmn")
        xml_res = xml_res.replace("ns1:", "bpmndi:").replace("xmlns:ns1", "xmlns:bpmndi")
        xml_res = xml_res.replace("ns2:", "dc:").replace("xmlns:ns2", "xmlns:dc")
        xml_res = xml_res.replace("ns3:", "di:").replace("xmlns:ns3", "xmlns:di")
        return xml_res
    except Exception as e:
        # Ya no falla en silencio
        return f"Error Quirúrgico: {str(e)}"

def extraer_contexto_bpmn(diagrama_xml):
    """
    Parsea el XML y extrae los nodos mapeados con su respectivo Carril (Lane).
    """
    if not diagrama_xml or not diagrama_xml.strip():
        return "No hay diagrama"
    
    try:
        root = ET.fromstring(diagrama_xml)
        
        # 1. Mapear Nodos a Carriles
        nodo_a_carril = {}
        for proc in root.findall('.//bpmn:process', NS):
            # Buscar lanes dentro de laneSets o directos
            lanes = proc.findall('.//bpmn:laneSet/bpmn:lane', NS) + proc.findall('.//bpmn:lane', NS)
            for lane in lanes:
                nombre_carril = lane.attrib.get('name', 'Carril Sin Nombre')
                for ref in lane.findall('.//bpmn:flowNodeRef', NS):
                    if ref.text:
                        nodo_a_carril[ref.text.strip()] = nombre_carril

        # 2. Extraer Elementos Lógicos con su Carril
        elementos = []
        tipos_validos = ['startEvent', 'task', 'userTask', 'serviceTask', 'exclusiveGateway', 'parallelGateway', 'endEvent']
        
        for proc in root.findall('.//bpmn:process', NS):
            for elem in proc:
                tipo = elem.tag.split('}')[-1]
                if tipo in tipos_validos and 'id' in elem.attrib:
                    nodo_id = elem.attrib['id']
                    elementos.append({
                        "id": nodo_id,
                        "tipo": tipo,
                        "nombre": elem.attrib.get('name', 'Sin Nombre'),
                        "carril": nodo_a_carril.get(nodo_id, "Proceso General / Sin Carril")
                    })
                    
        return json.dumps(elementos, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"Error parseando XML: {str(e)}"

def ejecutar_ia_maestra(prompt, diagrama_xml):
    """
    EL GRAN CEREBRO (MODO EDICIÓN): Decide si ser Cirujano o Arquitecto.
    """
    check_safety()
    xml_json_str = extraer_contexto_bpmn(diagrama_xml)

    system_instr = (
        "Eres el Maestro de PolicyFlow AI. Analiza la solicitud del usuario basándote en el DIAGRAMA ACTUAL.\n\n"
        "REGLAS CRÍTICAS DE ACCIÓN:\n"
        "1. AGREGAR A LO EXISTENTE: Usa accion: 'crear'. Si el usuario pide conectarlo a un elemento existente, incluye 'destino' (si el nuevo va antes) u 'origen' (si el nuevo va después) con el ID del elemento existente.\n"
        "   Ejemplo JSON: {\"accion\": \"crear\", \"tipo_elemento\": \"startEvent\", \"nuevo_valor\": \"Inicio\", \"destino\": \"Task_Cliente_1\"}\n"
        "2. ELIMINAR ELEMENTO: Usa accion: 'eliminar'.\n"
        "   Ejemplo JSON: {\"accion\": \"eliminar\", \"id_elemento\": \"StartEvent_1\"}\n"
        "3. MODIFICAR NOMBRE: Usa accion: 'editar_nombre'.\n"
        "   Ejemplo JSON: {\"accion\": \"editar_nombre\", \"id_elemento\": \"Task_2\", \"nuevo_valor\": \"Nuevo nombre\"}\n"
        "4. VACIAR/BORRAR TODO: Usa accion: 'crear_diagrama' con arrays vacíos.\n"
        "   Ejemplo JSON: {\"accion\": \"crear_diagrama\", \"nodos\": [], \"conexiones\": []}\n"
        "5. CREAR DESDE CERO: Usa accion: 'crear_diagrama'.\n"
        "   Ejemplo JSON: {\"accion\": \"crear_diagrama\", \"nodos\": [{\"id\": \"n1\", \"tipo\": \"startEvent\", \"nombre\": \"Inicio\"}], \"conexiones\": []}\n\n"
        "IMPORTANTE: RESPONDE ÚNICAMENTE CON JSON VÁLIDO. BAJO NINGUNA CIRCUNSTANCIA uses puntos suspensivos."
    )
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": f"System: {system_instr}\n\nDIAGRAMA ACTUAL (JSON): {xml_json_str}\n\nORDEN: {prompt}",
        "stream": False,
        "options": {"temperature": 0.0, "num_ctx": 4096, "num_gpu": 0}
    }
    try:
        res = requests.post(OLLAMA_URL, json=payload, timeout=300)
        raw_text = res.text
        with open(os.path.join(BASE_DIR, "ia_debug_request.log"), "w", encoding="utf-8") as f:
            f.write(f"STATUS: {res.status_code}\nRAW TEXT: {raw_text}\nPAYLOAD: {json.dumps(payload)}\n")
        return res.json().get("response", "").strip()
    except Exception as e:
        with open(os.path.join(BASE_DIR, "ia_debug_request.log"), "w", encoding="utf-8") as f:
            f.write(f"EXCEPTION: {str(e)}\n")
        return None

def ejecutar_auditoria(prompt, diagrama_xml):
    """
    EL AUDITOR (MODO ANÁLISIS): Evalúa usurpación de funciones basándose en los roles (Carriles).
    """
    check_safety()
    xml_json_str = extraer_contexto_bpmn(diagrama_xml)

    system_instr = (
        "Eres un Auditor Experto en Procesos de Negocio BPMN. Tu tarea es analizar el diagrama actual y detectar estrictamente 'Usurpación de Funciones'.\n"
        "La usurpación ocurre cuando una tarea es ejecutada por un Rol (Carril) que lógicamente no tiene la autoridad o competencia para hacerla.\n\n"
        "INSTRUCCIONES:\n"
        "1. Revisa la relación entre el 'nombre' de cada tarea y su 'carril'.\n"
        "2. Si detectas incongruencias (ej. un 'Cliente' realizando una 'Aprobación de Crédito' o 'Firma de Contrato Interno'), detállalo claramente.\n"
        "3. Si los roles y funciones son coherentes, indica que no se encontraron anomalías.\n"
        "4. Redacta tu reporte en texto claro, profesional y estructurado usando viñetas.\n"
        "IMPORTANTE: Responde SOLO con el reporte de texto. NO devuelvas JSON ni código XML."
    )
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": f"System: {system_instr}\n\nDIAGRAMA ACTUAL (JSON con Carriles): {xml_json_str}\n\nINSTRUCCIÓN: {prompt}",
        "stream": False,
        "options": {"temperature": 0.3, "num_ctx": 4096, "num_gpu": 0}
    }
    try:
        res = requests.post(OLLAMA_URL, json=payload, timeout=300)
        return res.json().get("response", "").strip()
    except Exception as e:
        return f"Error en el análisis de auditoría: {str(e)}"

if __name__ == "__main__":
    # SOLUCIÓN AL ESPACIO EN BLANCO: Forzar un .strip() al argumento de entrada del prompt
    prompt = sys.argv[1].strip() if len(sys.argv) > 1 else ""
    modo = sys.argv[2] if len(sys.argv) > 2 else "edicion"
    img_path = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != "null" else None
    audio_path = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != "null" else None
    diag_path = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] != "null" else None
    
    SUPER_DOCTOR_LOG = os.path.join(BASE_DIR, "SUPER_DOCTOR.log")
    
    with open(SUPER_DOCTOR_LOG, "w", encoding="utf-8") as doc:
        doc.write("=== SUPER DOCTOR: INICIO DE DIAGNOSTICO ===\n")
        doc.write(f"1. ARGS RECIBIDOS: {sys.argv}\n")
        doc.write(f"2. PROMPT LIMPIO: '{prompt}'\n")
        doc.write(f"3. MODO: {modo}\n")
        if audio_path:
            doc.write(f"4. AUDIO: Ruta={audio_path} | Existe={os.path.exists(audio_path)}")
            if os.path.exists(audio_path):
                doc.write(f" | Tamaño={os.path.getsize(audio_path)} bytes\n")
            else:
                doc.write("\n")
        else:
            doc.write("4. AUDIO: No recibido (null)\n")
            
        if diag_path:
            doc.write(f"5. DIAGRAMA: Ruta={diag_path} | Existe={os.path.exists(diag_path)}\n")
        else:
            doc.write("5. DIAGRAMA: No recibido (null)\n")

    # SI NO HAY TEXTO PERO HAY AUDIO, TRADUCIR AUDIO A TEXTO CON WHISPER
    if not prompt and audio_path and os.path.exists(audio_path):
        with open(SUPER_DOCTOR_LOG, "a", encoding="utf-8") as doc:
            doc.write("\n=== TRANSCRIPCION DE AUDIO (WHISPER) ===\n")
            doc.write("Cargando modelo local y escuchando audio...\n")
        try:
            import whisper
            import warnings
            import imageio_ffmpeg
            
            # Inyectar el ffmpeg de imageio al PATH para que whisper no explote en Windows
            os.environ["PATH"] += os.pathsep + os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())
            
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                model = whisper.load_model("base")
                
            res_audio = model.transcribe(audio_path)
            prompt = res_audio.get("text", "").strip()
            
            with open(SUPER_DOCTOR_LOG, "a", encoding="utf-8") as doc:
                doc.write(f"EXITO! Texto extraido: '{prompt}'\n")
                
        except Exception as e:
            with open(SUPER_DOCTOR_LOG, "a", encoding="utf-8") as doc:
                doc.write(f"ERROR FATAL DE AUDIO: {str(e)}\n")

    xml_base = ""
    if diag_path and os.path.exists(diag_path):
        with open(diag_path, 'r', encoding='utf-8') as f: xml_base = f.read()

    print("--- OLLAMA: Procesando orden... ---")
    
    try:
        if modo == "analisis":
            # RUTA DE AUDITORÍA: Bypass total al JSON y al Cirujano
            resultado = ejecutar_auditoria(prompt, xml_base)
            
            with open(SUPER_DOCTOR_LOG, "a", encoding="utf-8") as doc:
                doc.write(f"\n=== RESPUESTA AUDITORIA ===\n{resultado}\n")
                
        elif modo == "llenado":
            # RUTA DE AUTO-LLENADO
            prompt_llenado = f"""
Eres un asistente de llenado automático de formularios.
Tu tarea es leer el 'Texto del usuario' y extraer la información para llenar los campos requeridos según la 'Metadata del formulario'.
Devuelve UNICAMENTE un objeto JSON válido donde las claves son los IDs de los campos y los valores son las respuestas extraídas o deducidas. 
Para campos boolean (type="boolean"), usa true o false. 
Para campos numéricos (type="long" o "integer"), usa enteros. 
Para enums, usa el ID del valor correspondiente si coincide conceptualmente.
Si una información no se menciona ni se puede deducir, omite esa clave en el JSON.
NO devuelvas explicaciones ni texto adicional, SOLO JSON puro.

Metadata del formulario:
{xml_base}

Texto del usuario (o transcripción de audio):
{prompt}
"""
            payload = {
                "model": OLLAMA_MODEL,
                "prompt": prompt_llenado,
                "stream": False,
                "format": "json"
            }
            resp = requests.post(OLLAMA_URL, json=payload, timeout=60)
            data = resp.json()
            resultado = data.get("response", "{}").strip()
            
            with open(SUPER_DOCTOR_LOG, "a", encoding="utf-8") as doc:
                doc.write(f"\n=== RESPUESTA LLENADO ===\n{resultado}\n")
                
        else:
            # RUTA DE EDICIÓN NORMAL: Arquitecto o Cirujano
            inst = ejecutar_ia_maestra(prompt, xml_base)
            with open(SUPER_DOCTOR_LOG, "a", encoding="utf-8") as doc:
                doc.write(f"\n=== RESPUESTA DE OLLAMA (MAESTRA) ===\n{inst}\n")
                
            with open(BRAIN_LOG, "w", encoding="utf-8") as f: f.write(str(inst))

            if inst:
                if "{" in inst: inst = inst[inst.find("{"):inst.rfind("}")+1]
                data = json.loads(inst)
                accion = data.get("accion")
                
                with open(SUPER_DOCTOR_LOG, "a", encoding="utf-8") as doc:
                    doc.write(f"\n=== ACCION DETECTADA ===\n{accion}\n")
                
                if accion == "crear_diagrama":
                    resultado = generar_diagrama_completo(inst)
                elif accion == "conversar":
                    resultado = data.get("comentario", "Hola.")
                else:
                    resultado = aplicar_cambio_quirurgico(xml_base, inst)
                    
                with open(DEBUG_FILE, "w", encoding="utf-8") as f: f.write(resultado)
                
                with open(SUPER_DOCTOR_LOG, "a", encoding="utf-8") as doc:
                    doc.write("\n=== EJECUCION EXITOSA ===\nTodo salio bien.\n")
                    
            else: 
                resultado = "Error de IA. Ollama devolvió vacío."

    except Exception as e:
        resultado = f"Error: {str(e)}"
        with open(SUPER_DOCTOR_LOG, "a", encoding="utf-8") as doc:
            doc.write(f"\n=== EXCEPCION FATAL ===\n{str(e)}\n")

    print("\n--- RESULTADO FINAL ---")
    print(resultado)
