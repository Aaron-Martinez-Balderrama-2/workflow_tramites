package com.antigravity.workflow_tramites.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Data
@Document(collection = "tareas_definicion")
public class TareaDefinicion {
    @Id
    private String id;
    private String nombre;
    private String requisitos; // "Checklist" (Separado por comas) O JSON de Formulario
    private String sectorId;   // A qué área pertenece
    private String empresaId;
    
    // ANCLA CON EL XML
    private String bpmnNodeId;
}
