package com.antigravity.workflow_tramites.controllers;

import com.antigravity.workflow_tramites.services.DocumentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import org.zwobble.mammoth.DocumentConverter;
import org.zwobble.mammoth.Result;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documentos")
@CrossOrigin(originPatterns = "*")
public class DocumentoController {

    @Autowired
    private DocumentoService documentoService;

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> handleSecurityException(SecurityException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @PostMapping("/{tramiteId}/guardar")
    public Map<String, String> guardarDocumento(
            @PathVariable String tramiteId, 
            @RequestBody Map<String, String> payload) {
        
        String contenidoHtml = payload.get("contenido");
        String autorId = payload.get("autorId");
        String autorNombre = payload.get("autorNombre");
        
        String resultMsg = documentoService.guardarDocumento(tramiteId, contenidoHtml, autorId, autorNombre);
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", resultMsg);
        return response;
    }

    @GetMapping("/{tramiteId}/actual")
    public Map<String, String> obtenerActual(@PathVariable String tramiteId) {
        String contenidoHtml = documentoService.obtenerContenidoActual(tramiteId);
        Map<String, String> response = new HashMap<>();
        response.put("contenido", contenidoHtml);
        return response;
    }

    @GetMapping("/{tramiteId}/versiones")
    public List<String> listarVersiones(@PathVariable String tramiteId) {
        return documentoService.listarVersionesKeys(tramiteId);
    }

    @PostMapping("/descargar")
    public Map<String, String> obtenerDocumento(@RequestBody Map<String, String> payload) {
        String objectKey = payload.get("objectKey"); // En local, objectKey es el versionId
        
        // Si mandan "versionId" o lo que mapea a key
        String versionId = objectKey;
        if (versionId.contains("|")) {
            versionId = versionId.split("\\|")[0];
        }
        
        String contenidoHtml = documentoService.obtenerContenidoVersion(versionId);
        
        Map<String, String> response = new HashMap<>();
        response.put("contenido", contenidoHtml);
        return response;
    }

    @PostMapping("/{tramiteId}/rollback")
    public Map<String, String> hacerRollback(
            @PathVariable String tramiteId,
            @RequestBody Map<String, String> payload) {
        
        String versionId = payload.get("versionId");
        if (versionId.contains("|")) {
            versionId = versionId.split("\\|")[0];
        }
        String autorId = payload.get("autorId");
        String autorNombre = payload.get("autorNombre");
        
        String resultMsg = documentoService.hacerRollback(tramiteId, versionId, autorId, autorNombre);
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", resultMsg);
        return response;
    }

    @PostMapping("/importar")
    public Map<String, String> importarDocumento(@RequestParam("file") MultipartFile file) {
        try {
            DocumentConverter converter = new DocumentConverter();
            Result<String> result = converter.convertToHtml(file.getInputStream());
            
            Map<String, String> response = new HashMap<>();
            response.put("html", result.getValue());
            return response;
        } catch (Exception e) {
            throw new IllegalArgumentException("Error al procesar el archivo Word. Asegúrate de que es un archivo .docx válido.");
        }
    }
}
