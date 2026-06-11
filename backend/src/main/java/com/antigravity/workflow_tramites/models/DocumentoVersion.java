package com.antigravity.workflow_tramites.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "documento_versiones")
public class DocumentoVersion {
    @Id
    private String id;
    private String tramiteId;
    private int version;
    private String contenidoHtml;
    private byte[] archivoDocx;
    private String autor;
    private LocalDateTime fechaGuardado;
}
