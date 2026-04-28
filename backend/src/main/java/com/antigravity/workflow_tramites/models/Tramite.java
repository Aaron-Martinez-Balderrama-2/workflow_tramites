package com.antigravity.workflow_tramites.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Document(collection = "tramites")
public class Tramite {
    @Id
    private String id;
    private String clienteNombre;
    private String descripcion;
    private String estado; // PENDIENTE, EN_PROCESO, FINALIZADO
    private String empresaId;
    private String fechaCreacion;
    private String sectorId;
    private int porcentajeAvance;
    private String notasGenerales;
}
