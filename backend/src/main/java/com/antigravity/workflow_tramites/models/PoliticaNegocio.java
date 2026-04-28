package com.antigravity.workflow_tramites.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "politicas")
public class PoliticaNegocio {
    @Id
    private String id;
    private String nombre;
    private String descripcion;
    
    // Almacenamos el diagrama BPMN 2.0 real generado por bpmn-js
    private String xmlBpmn;
    
    private boolean isActiva; // Bandera para saber si el sistema está generado/activo
    
    private String creadorId;
    private String empresaId; // Relación con la empresa del diseñador
    private String fechaCreacion;
}
