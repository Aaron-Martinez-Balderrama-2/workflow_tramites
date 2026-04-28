import sys
import os
import json
import requests
import subprocess
import time
import xml.etree.ElementTree as ET
import uuid
from doctor_seguridad import check_safety

# --- RUTAS DINÁMICAS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEBUG_FILE = os.path.join(BASE_DIR, "ia_debug_output.xml")
BRAIN_LOG = os.path.join(BASE_DIR, "ia_last_brain_response.txt")

# --- CONFIGURACIÓN ---
OLLAMA_URL = "http://ollama:11434/api/generate"
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

        return ET.tostring(root, encoding='utf-8', xml_declaration=True).decode('utf-8')
    except Exception as e:
        return f"Error Arquitecto: {str(e)}"

def aplicar_cambio_quirurgico(xml_string, instruccion_json):
    """
    MODO CIRUJANO: Edita un XML existente.
    """
    try:
        data = json.loads(instruccion_json)
        accion, id_t, val, tipo = data.get("accion"), data.get("id_elemento"), data.get("nuevo_valor"), data.get("tipo_elemento", "task")
        root = ET.fromstring(xml_string)

        if accion == "eliminar" and id_t:
            for p in root.iter():
                for c in list(p):
                    if c.get("id") == id_t: p.remove(c)
            for plane in root.findall('.//bpmndi:BPMNPlane', NS):
                for s in list(plane):
                    if s.get("bpmnElement") == id_t: plane.remove(s)
        elif accion == "editar_nombre" and id_t:
            for el in root.iter():
                if el.get("id") == id_t: el.set("name", val)
        elif accion == "crear":
            new_id = f"{tipo}_{uuid.uuid4().hex[:6]}"
            proc = root.find('.//bpmn:process', NS)
            if proc is not None:
                new_el = ET.SubElement(proc, f"{{http://www.omg.org/spec/BPMN/20100524/MODEL}}{tipo}")
                new_el.set("id", new_id)
                new_el.set("name", val if val else "Nuevo")
                plane = root.find('.//bpmndi:BPMNPlane', NS)
                if plane is not None:
                    shape = ET.SubElement(plane, f"{{http://www.omg.org/spec/BPMN/20100524/DI}}BPMNShape")
                    shape.set("id", f"{new_id}_di"); shape.set("bpmnElement", new_id)
                    b = ET.SubElement(shape, f"{{http://www.omg.org/spec/DD/20100524/DC}}Bounds")
                    b.set("x", "200"); b.set("y", "200"); b.set("width", "100" if tipo=="task" else "36"); b.set("height", "80" if tipo=="task" else "36")

        return ET.tostring(root, encoding='utf-8', xml_declaration=True).decode('utf-8')
    except: return xml_string

def ejecutar_ia_maestra(prompt, diagrama_xml):
    """
    EL GRAN CEREBRO: Decide si ser Cirujano o Arquitecto.
    """
    check_safety()
    system_instr = (
        "Eres el Maestro de PolicyFlow AI. Analiza la solicitud del usuario.\n"
        "1. Si pide un diagrama NUEVO o COMPLETO, usa accion: 'crear_diagrama'.\n"
        "2. Si pide EDITAR algo existente, usa accion: 'eliminar', 'editar_nombre' o 'crear'.\n"
        "3. Si solo charla, usa 'conversar'.\n\n"
        "ESTRUCTURA PARA 'crear_diagrama':\n"
        "{\n"
        "  \"accion\": \"crear_diagrama\",\n"
        "  \"nodos\": [{\"id\": \"n1\", \"tipo\": \"startEvent\", \"nombre\": \"...\"}, ...],\n"
        "  \"conexiones\": [{\"origen\": \"n1\", \"destino\": \"n2\"}, ...]\n"
        "}\n"
        "RESPONDE SOLO CON JSON."
    )
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": f"System: {system_instr}\n\nXML ACTUAL: {diagrama_xml}\n\nORDEN: {prompt}",
        "stream": False,
        "options": {"temperature": 0.0, "num_ctx": 16384}
    }
    try:
        res = requests.post(OLLAMA_URL, json=payload, timeout=120)
        return res.json().get("response", "").strip()
    except: return None

if __name__ == "__main__":
    prompt = sys.argv[1]
    diag_path = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] != "null" else None
    xml_base = ""
    if diag_path and os.path.exists(diag_path):
        with open(diag_path, 'r', encoding='utf-8') as f: xml_base = f.read()

    print("--- OLLAMA: Procesando orden maestra... ---")
    inst = ejecutar_ia_maestra(prompt, xml_base)
    with open(BRAIN_LOG, "w", encoding="utf-8") as f: f.write(str(inst))

    if inst:
        try:
            if "{" in inst: inst = inst[inst.find("{"):inst.rfind("}")+1]
            data = json.loads(inst)
            accion = data.get("accion")
            
            if accion == "crear_diagrama":
                resultado = generar_diagrama_completo(inst)
            elif accion == "conversar":
                resultado = data.get("comentario", "Hola.")
            else:
                resultado = aplicar_cambio_quirurgico(xml_base, inst)
                
            with open(DEBUG_FILE, "w", encoding="utf-8") as f: f.write(resultado)
        except Exception as e: resultado = f"Error: {str(e)}"
    else: resultado = "Error de IA."

    print("\n--- RESULTADO FINAL ---")
    print(resultado)
