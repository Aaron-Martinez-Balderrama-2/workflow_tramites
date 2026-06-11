package com.antigravity.workflow_tramites.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "documentos")
public class Documento {
    @Id
    private String id;
    private String tramiteId;
    private String contenidoHtml;
    private byte[] archivoDocx;
    private String ultimoEditor;
    private LocalDateTime ultimaModificacion;
}
