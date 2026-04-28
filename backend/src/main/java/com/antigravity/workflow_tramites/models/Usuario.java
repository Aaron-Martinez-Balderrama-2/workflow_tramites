package com.antigravity.workflow_tramites.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Data
@Document(collection = "usuarios")
public class Usuario {
    @Id
    private String id;
    private String nombre;
    private String email;
    private String ci;
    private String telefono;
    private String password;
    private String rol; // ADMINISTRADOR, FUNCIONARIO, DISENADOR
    private String areaTrabajo;
    private String empresaId; // Soporte Multi-Tenant (SaaS)
}
