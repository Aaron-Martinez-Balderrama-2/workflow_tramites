package com.antigravity.workflow_tramites.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

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
    private String datosDinamicosBPMN;
    
    // CAMPOS PARA EL MOTOR DE WORKFLOW
    private String politicaId; // El mapa XML que está siguiendo este trámite
    private String variablesGlobales; // JSON acumulativo de todas las decisiones tomadas
    private List<VersionDatos> historialVersiones = new ArrayList<>(); // Auditoría de modificaciones (Gestor Documental)
}
