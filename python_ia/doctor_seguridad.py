import os
import time
import json
from datetime import datetime

LOCK_FILE = os.path.join(os.path.dirname(__file__), 'ia_lock.json')
MIN_INTERVAL = 3  # Segundos minimos entre llamadas

def check_safety():
    """
    Doctor 2: Seguridad y Diagnostico.
    Evita llamadas infinitas y detecta saturacion.
    """
    now = time.time()
    
    print("\n--- DOCTOR 2: SEGURIDAD Y DIAGNOSTICO ---")
    
    if os.path.exists(LOCK_FILE):
        with open(LOCK_FILE, 'r') as f:
            data = json.load(f)
            last_call = data.get('last_call', 0)
            total_calls = data.get('total_calls', 0)
            
            diff = now - last_call
            if diff < MIN_INTERVAL:
                wait_time = round(MIN_INTERVAL - diff, 2)
                print(f"!!! ALERTA ! Llamada demasiado frecuente. Bloqueando por seguridad.")
                print(f"STOP Debes esperar {wait_time} segundos mas para evitar quemar la API Key.")
                return False, total_calls
            
            total_calls += 1
    else:
        total_calls = 1

    # Guardar nuevo estado
    with open(LOCK_FILE, 'w') as f:
        json.dump({
            'last_call': now,
            'total_calls': total_calls,
            'last_status': 'OK',
            'timestamp': str(datetime.now())
        }, f)
    
    print(f"SEGURIDAD OK. Llamadas totales hoy: {total_calls}")
    return True, total_calls

def report_error(error_msg):
    """Registra el error para el diagnostico"""
    if os.path.exists(LOCK_FILE):
        with open(LOCK_FILE, 'r') as f:
            data = json.load(f)
        
        data['last_status'] = f"ERROR: {error_msg}"
        data['error_timestamp'] = str(datetime.now())
        
        with open(LOCK_FILE, 'w') as f:
            json.dump(data, f)
    print(f"Error registrado por el Doctor: {error_msg}")

if __name__ == "__main__":
    allowed, total = check_safety()
    if not allowed:
        exit(1)
