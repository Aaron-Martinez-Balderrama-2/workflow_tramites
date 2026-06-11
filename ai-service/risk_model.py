import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suprimir warnings de TF

import numpy as np
import logging
import random

logger = logging.getLogger(__name__)

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    logger.warning("TensorFlow no está instalado o no es compatible con esta versión de Python. Usando Mock Neuronal para desarrollo.")
    TF_AVAILABLE = False

# Definición de sectores para la clasificación
SECTORES = ["SOPORTE_TECNICO", "RECEPCION", "DIRECCION"]

# Variable global para mantener el modelo cargado en memoria
_model = None

class MockModel:
    def predict(self, input_data, verbose=0):
        # input_data: [[estado_val, avance_val, desc_len]]
        # Retorna predicciones simuladas
        riesgo = [[random.uniform(0.1, 0.9)]]
        anomalia = [[random.uniform(0.1, 0.9)]]
        prioridad = [[random.uniform(0.1, 0.9)]]
        ruta = [[random.uniform(0.1, 0.9), random.uniform(0.1, 0.9), random.uniform(0.1, 0.9)]]
        return [riesgo, anomalia, prioridad, ruta]

def build_and_train_model():
    """
    Construye y entrena una red neuronal profunda usando TensorFlow/Keras
    para predecir riesgos operativos en los trámites.
    """
    logger.info("Iniciando construcción y entrenamiento de la red neuronal de Riesgos...")
    
    if not TF_AVAILABLE:
        logger.info("Entrenando MOCK MODEL en memoria (TensorFlow no disponible)...")
        return MockModel()
    
    # 1. Definición de la arquitectura de la Red Neuronal (API Funcional)
    inputs = tf.keras.Input(shape=(3,), name="features") # [estado, avance, length_desc]
    
    x = tf.keras.layers.Dense(32, activation='relu')(inputs)
    x = tf.keras.layers.Dropout(0.1)(x)
    x = tf.keras.layers.Dense(16, activation='relu')(x)
    
    # Multi-salida
    riesgo = tf.keras.layers.Dense(1, activation='sigmoid', name='riesgo')(x)
    anomalia = tf.keras.layers.Dense(1, activation='sigmoid', name='anomalia')(x)
    prioridad = tf.keras.layers.Dense(1, activation='sigmoid', name='prioridad')(x)
    ruta = tf.keras.layers.Dense(3, activation='softmax', name='ruta')(x)
    
    model = tf.keras.Model(inputs=inputs, outputs=[riesgo, anomalia, prioridad, ruta])
    
    model.compile(
        optimizer='adam',
        loss={
            'riesgo': 'binary_crossentropy',
            'anomalia': 'binary_crossentropy',
            'prioridad': 'binary_crossentropy',
            'ruta': 'sparse_categorical_crossentropy'
        }
    )
    
    # 2. Generación de datos de entrenamiento ficticios (simulando histórico de la empresa)
    num_samples = 1000
    
    # Features: [estado (0=Pendiente, 1=Proceso), porcentaje_avance (0-1), length_descripcion (normalizado 0-1)]
    X_train = np.random.rand(num_samples, 3)
    
    # Labels simulados basados en reglas lógicas para que la red "aprenda" un comportamiento coherente
    # Si estado=0 y avance bajo, alto riesgo
    y_riesgo = np.where((X_train[:, 0] < 0.5) & (X_train[:, 1] < 0.3), 1.0, 0.0) 
    # Anomalía si la descripción es muy corta pero el avance es muy alto
    y_anomalia = np.where((X_train[:, 2] < 0.1) & (X_train[:, 1] > 0.8), 1.0, 0.0)
    # Prioridad alta si el riesgo es alto
    y_prioridad = np.where(y_riesgo == 1.0, 1.0, 0.0)
    # Ruta: Asignación aleatoria sesgada
    y_ruta = np.random.randint(0, 3, size=(num_samples,))
    
    # 3. Entrenamiento
    logger.info(f"Entrenando modelo con {num_samples} registros históricos...")
    model.fit(
        X_train, 
        {'riesgo': y_riesgo, 'anomalia': y_anomalia, 'prioridad': y_prioridad, 'ruta': y_ruta},
        epochs=10,
        batch_size=32,
        verbose=0 # Silencioso para no inundar logs
    )
    
    logger.info("Entrenamiento finalizado. Modelo de IA listo para inferencia.")
    return model

def get_model():
    global _model
    if _model is None:
        _model = build_and_train_model()
    return _model

def predict_tramite_risk(estado: str, avance: int, descripcion: str):
    """
    Toma un trámite en vivo y lo pasa por la red neuronal para predecir sus indicadores.
    """
    model = get_model()
    
    # Preprocesamiento
    estado_val = 0.0 if estado == "PENDIENTE" else 1.0
    avance_val = min(max(avance / 100.0, 0.0), 1.0)
    desc_len = min(len(descripcion if descripcion else "") / 500.0, 1.0)
    
    input_data = np.array([[estado_val, avance_val, desc_len]])
    
    # Inferencia
    predictions = model.predict(input_data, verbose=0)
    
    riesgo_prob = float(predictions[0][0][0])
    anomalia_prob = float(predictions[1][0][0])
    prioridad_prob = float(predictions[2][0][0])
    ruta_probs = predictions[3][0]
    
    # Post-procesamiento
    ruta_idx = int(np.argmax(ruta_probs))
    
    if riesgo_prob > 0.7:
        riesgo_label = "ALTA"
    elif riesgo_prob > 0.4:
        riesgo_label = "MEDIA"
    else:
        riesgo_label = "BAJA"
        
    return {
        "riesgoDemora": riesgo_label,
        "riesgoScore": round(riesgo_prob * 100, 1),
        "anomaliaDetectada": anomalia_prob > 0.6,
        "prioridad": "ALTA" if prioridad_prob > 0.5 else "NORMAL",
        "mejorRutaSugerida": SECTORES[ruta_idx]
    }
