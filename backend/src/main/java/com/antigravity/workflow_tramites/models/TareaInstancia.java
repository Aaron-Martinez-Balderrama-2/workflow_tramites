package com.antigravity.workflow_tramites.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Data
@Document(collection = "tareas_instancia")
public class TareaInstancia {
    @Id
    private String id;
    private String tramiteId;
    private String tareaDefinicionId;
    private String nombre;
    private String requisitos;
    private String estado; // PENDIENTE, EN_PROCESO, COMPLETADA
    private String asignadoA; // UsuarioId
    private String sectorId;
    private String empresaId;
    private String requisitosCompletados;
    private String notas;
    
    // ANCLA CON EL XML
    private String bpmnNodeId; 
}
