package com.antigravity.workflow_tramites.models;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class VersionDatos {
    private int version;
    private String autorId;       // ID del usuario que hizo el cambio
    private String autorNombre;   // Nombre de quien hizo la modificación ("Git blame")
    private String taskId;        // En qué tarea ocurrió
    private LocalDateTime fecha;  // Timestamp exacto
    private String variables;     // JSON de los datos en ese momento
    private String campoModificado; // Opcional, para saber exactamente qué campo tocó en colaboración
}
