import os
from google import genai
import sys

def get_api_key():
    try:
        # Buscamos el archivo subiendo un nivel o dos segun donde se ejecute
        path = os.path.join(os.path.dirname(__file__), '../backend/src/main/resources/application.properties')
        if not os.path.exists(path):
             path = 'backend/src/main/resources/application.properties'
        
        with open(path, 'r') as f:
            for line in f:
                if line.startswith('gemini.api.key='):
                    return line.split('=')[1].strip()
    except Exception as e:
        print(f"Error leyendo la clave: {e}")
        return None

def listar_modelos():
    api_key = get_api_key()
    if not api_key:
        print("No se encontro la API Key en application.properties")
        return

    client = genai.Client(api_key=api_key)
    print("\n--- DOCTOR 1: VERSIONES DISPONIBLES ---")
    try:
        modelos = client.models.list()
        for m in modelos:
            if hasattr(m, 'supported_actions') and 'generateContent' in m.supported_actions:
                 print(f"[OK] {m.name}")
            elif hasattr(m, 'name'):
                 print(f"[INFO] {m.name}")
    except Exception as e:
        print(f"[ERROR] Error al listar modelos: {e}")

if __name__ == "__main__":
    listar_modelos()
