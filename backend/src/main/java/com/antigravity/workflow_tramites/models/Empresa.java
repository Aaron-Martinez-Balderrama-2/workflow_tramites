package com.antigravity.workflow_tramites.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Data
@Document(collection = "empresas")
public class Empresa {
    @Id
    private String id;
    private String nombre;
    private boolean sistemaGenerado; // false por defecto, true cuando el diagrama genera el sistema
}
