package com.antigravity.workflow_tramites.models;

import lombok.Data;

@Data
public class PasoHistorial {
    private String nodoId;
    private String nombrePaso;
    private String funcionarioId;
    private String accionTomada; // APROBADO, RECHAZADO, DERIVADO
    private String fecha;
    private String comentarios;
}
