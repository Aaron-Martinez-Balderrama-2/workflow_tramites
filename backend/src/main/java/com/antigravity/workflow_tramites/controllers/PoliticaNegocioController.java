package com.antigravity.workflow_tramites.controllers;

import com.antigravity.workflow_tramites.models.PoliticaNegocio;
import com.antigravity.workflow_tramites.repositories.PoliticaNegocioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/politicas")
@CrossOrigin(origins = "http://localhost:4200")
public class PoliticaNegocioController {

    @Autowired
    private PoliticaNegocioRepository repository;

    @Autowired
    private com.antigravity.workflow_tramites.services.GeminiService geminiService;

    @PostMapping("/asistente-ia")
    public String consultarGemini(@RequestBody Map<String, Object> payload) {
        String prompt = payload.get("prompt") != null ? payload.get("prompt").toString() : "";
        Object diagramaActual = payload.get("diagrama");
        String base64Image = (payload.get("imagen") != null) ? payload.get("imagen").toString() : null;
        String base64Audio = (payload.get("audio") != null) ? payload.get("audio").toString() : null;
        
        if (prompt.isEmpty() && base64Image == null && base64Audio == null) {
            return "{\"error\": \"Prompt, imagen y audio vacíos\"}";
        }
        
        return geminiService.procesarPrompt(prompt, diagramaActual, base64Image, base64Audio);
    }

    @PostMapping("/verificar")
    public String verificarUsurpacion(@RequestBody Map<String, Object> payload) {
        String xmlDiagrama = payload.get("diagrama").toString();
        return geminiService.verificarUsurpacion(xmlDiagrama);
    }
    @GetMapping("/empresa/{empresaId}")
    public List<PoliticaNegocio> obtenerPorEmpresa(@PathVariable String empresaId) {
        // En un entorno real usaríamos una consulta filtrada en el repositorio
        // Por ahora filtramos manualmente para simplificar sin tocar el Repo
        return repository.findAll().stream()
                .filter(p -> empresaId.equals(p.getEmpresaId()))
                .toList();
    }

    @GetMapping
    public List<PoliticaNegocio> obtenerTodas() {
        return repository.findAll();
    }

    @PostMapping
    public PoliticaNegocio guardarNuevaPolitica(@RequestBody PoliticaNegocio politica) {
        politica.setFechaCreacion(LocalDateTime.now().toString());
        // Aquí MongoDB creará el documento guardando todo el JSON dinámico de JointJS
        return repository.save(politica);
    }
    
    @PutMapping("/{id}")
    public PoliticaNegocio actualizarPolitica(@PathVariable String id, @RequestBody PoliticaNegocio politica) {
        politica.setId(id);
        return repository.save(politica);
    }
}
