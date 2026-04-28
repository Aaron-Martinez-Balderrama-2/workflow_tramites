package com.antigravity.workflow_tramites.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Data
@Document(collection = "areas_trabajo")
public class AreaTrabajo {
    @Id
    private String id;
    private String nombre;
    private String descripcion;
    private String responsableId; // ID del Usuario que es jefe del área
}
