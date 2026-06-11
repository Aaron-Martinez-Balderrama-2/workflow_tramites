package com.antigravity.workflow_tramites.controllers;

import com.antigravity.workflow_tramites.models.Documento;
import com.antigravity.workflow_tramites.models.DocumentoVersion;
import com.antigravity.workflow_tramites.repositories.DocumentoRepository;
import com.antigravity.workflow_tramites.repositories.DocumentoVersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.List;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import java.security.Key;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/onlyoffice")
@CrossOrigin(originPatterns = "*")
public class OnlyOfficeController {

    @Autowired
    private DocumentoRepository documentoRepository;

    @Autowired
    private DocumentoVersionRepository versionRepository;

    // Endpoint for OnlyOffice Document Server to DOWNLOAD the file when opening
    @GetMapping("/download/{tramiteId}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable String tramiteId) {
        Optional<Documento> docOpt = documentoRepository.findByTramiteId(tramiteId);
        
        byte[] docxData = null;
        if (docOpt.isPresent() && docOpt.get().getArchivoDocx() != null) {
            docxData = docOpt.get().getArchivoDocx();
        } else {
            // Provide an empty DOCX if none exists (a tiny valid base64 docx would be needed)
            // Or just return 404, OnlyOffice might fail. We should have a blank template.
            // For now, let's return a basic blank DOCX byte array or throw error.
            // Actually, if it's the first time, Angular should just create a new empty file.
            // We can return a pre-generated blank docx byte array.
            try {
                InputStream is = getClass().getResourceAsStream("/blank.docx");
                if (is != null) {
                    ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                    int nRead;
                    byte[] data = new byte[1024];
                    while ((nRead = is.read(data, 0, data.length)) != -1) {
                        buffer.write(data, 0, nRead);
                    }
                    buffer.flush();
                    docxData = buffer.toByteArray();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        if (docxData == null) {
            return ResponseEntity.notFound().build();
        }

        ByteArrayResource resource = new ByteArrayResource(docxData);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"documento_" + tramiteId + ".docx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .contentLength(docxData.length)
                .body(resource);
    }

    // Endpoint for OnlyOffice to POST the saved file
    @PostMapping("/callback/{tramiteId}")
    public Map<String, Integer> callback(@PathVariable String tramiteId, @RequestBody Map<String, Object> body) {
        int status = (Integer) body.get("status");

        // Status 2 means the document is ready for saving (user closed the editor)
        // Status 6 means the document is being edited, but a force save was triggered
        if (status == 2 || status == 6) {
            String downloadUri = (String) body.get("url");

            try {
                // Descargar el nuevo .docx desde el Document Server
                RestTemplate restTemplate = new RestTemplate();
                byte[] newDocxData = restTemplate.getForObject(downloadUri, byte[].class);

                // Guardar en MongoDB
                Optional<Documento> docOpt = documentoRepository.findByTramiteId(tramiteId);
                Documento doc;
                if (docOpt.isPresent()) {
                    doc = docOpt.get();
                } else {
                    doc = new Documento();
                    doc.setTramiteId(tramiteId);
                }
                doc.setArchivoDocx(newDocxData);
                doc.setUltimaModificacion(LocalDateTime.now());
                
                // Get users who edited it (from OnlyOffice users array)
                doc.setUltimoEditor("OnlyOffice Users"); 
                documentoRepository.save(doc);

                // Create a version history if status == 2 (final save)
                if (status == 2) {
                    DocumentoVersion version = new DocumentoVersion();
                    version.setTramiteId(tramiteId);
                    version.setVersion((int) versionRepository.count() + 1);
                    version.setArchivoDocx(newDocxData);
                    version.setAutor("OnlyOffice");
                    version.setFechaGuardado(LocalDateTime.now());
                    versionRepository.save(version);
                }

            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Must return {"error": 0} to tell OnlyOffice the callback was processed successfully
        Map<String, Integer> response = new HashMap<>();
        response.put("error", 0);
        return response;
    }

    @PostMapping("/sign")
    public Map<String, String> signPayload(@RequestBody Map<String, Object> configFront) {
        String secret = "JjCtkxwMcOYX1sjvh4q53lhb2JYcSd_00";
        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        
        String jws = Jwts.builder()
                .setHeaderParam("typ", "JWT")
                .setClaims(configFront)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
                
        Map<String, String> res = new HashMap<>();
        res.put("token", jws);
        return res;
    }
    @GetMapping("/history/{tramiteId}")
    public ResponseEntity<List<DocumentoVersion>> getHistory(@PathVariable String tramiteId) {
        List<DocumentoVersion> versiones = versionRepository.findByTramiteIdOrderByVersionAsc(tramiteId);
        // We might not want to return the full byte array in the list, but it's fine for small documents
        return ResponseEntity.ok(versiones);
    }

    @PostMapping("/upload/{tramiteId}")
    public ResponseEntity<Map<String, String>> uploadFile(@PathVariable String tramiteId, @RequestParam("file") MultipartFile file) {
        try {
            byte[] fileBytes = file.getBytes();
            Optional<Documento> docOpt = documentoRepository.findByTramiteId(tramiteId);
            Documento doc = docOpt.orElse(new Documento());
            doc.setTramiteId(tramiteId);
            doc.setArchivoDocx(fileBytes);
            doc.setUltimaModificacion(LocalDateTime.now());
            doc.setUltimoEditor("Usuario (Importación)");
            documentoRepository.save(doc);

            DocumentoVersion version = new DocumentoVersion();
            version.setTramiteId(tramiteId);
            version.setVersion((int) versionRepository.count() + 1);
            version.setArchivoDocx(fileBytes);
            version.setAutor("Usuario (Importación)");
            version.setFechaGuardado(LocalDateTime.now());
            versionRepository.save(version);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Archivo importado exitosamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/rollback/{tramiteId}/{versionId}")
    public ResponseEntity<Map<String, String>> rollbackVersion(@PathVariable String tramiteId, @PathVariable String versionId) {
        try {
            DocumentoVersion versionDestino = versionRepository.findById(versionId).orElseThrow();
            
            Optional<Documento> docOpt = documentoRepository.findByTramiteId(tramiteId);
            Documento doc = docOpt.orElse(new Documento());
            doc.setTramiteId(tramiteId);
            doc.setArchivoDocx(versionDestino.getArchivoDocx());
            doc.setUltimaModificacion(LocalDateTime.now());
            doc.setUltimoEditor("Usuario (Rollback a V" + versionDestino.getVersion() + ")");
            documentoRepository.save(doc);

            DocumentoVersion nuevaVersion = new DocumentoVersion();
            nuevaVersion.setTramiteId(tramiteId);
            nuevaVersion.setVersion((int) versionRepository.count() + 1);
            nuevaVersion.setArchivoDocx(versionDestino.getArchivoDocx());
            nuevaVersion.setAutor("Usuario (Rollback a V" + versionDestino.getVersion() + ")");
            nuevaVersion.setFechaGuardado(LocalDateTime.now());
            versionRepository.save(nuevaVersion);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Rollback exitoso a la versión " + versionDestino.getVersion());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
