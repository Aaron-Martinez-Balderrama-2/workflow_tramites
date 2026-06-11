import requests
import json

base_url = "http://localhost:8080/api"

# 1. Crear Tramite
payload = {
    "clienteNombre": "Test API",
    "descripcion": "Problema de software autogenerado",
    "empresaId": "123",
    "datosDinamicosBPMN": json.dumps({"tipo_tramite": "software"})
}
print("Creando tramite...")
res1 = requests.post(f"{base_url}/tramites", json=payload)
print(res1.status_code, res1.text)
tramite = res1.json()

# 2. Obtener tareas
print("\nObteniendo tareas...")
res2 = requests.get(f"{base_url}/tramites/tareas/empresa/123")
print(res2.status_code, res2.text)
tareas = res2.json()

first_task = next((t for t in tareas if t.get("tramiteId") == tramite.get("id") and t.get("estado") == "PENDIENTE"), None)
print("\nFirst task:", first_task)

if first_task:
    # 3. Completar tarea
    print("\nCompletando tarea...")
    put_payload = {
        "requisitos": json.dumps({"tipo_tramite": "software"})
    }
    res3 = requests.put(f"{base_url}/tramites/tareas/{first_task['id']}/completar", json=put_payload)
    print(res3.status_code, res3.text)
