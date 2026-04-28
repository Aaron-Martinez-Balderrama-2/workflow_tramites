package com.antigravity.workflow_tramites.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Data
@Document(collection = "sectores")
public class Sector {
    @Id
    private String id;
    private String nombre;
    private String empresaId;
}
