package com.antigravity.workflow_tramites.controllers;

import com.antigravity.workflow_tramites.models.Tramite;
import com.antigravity.workflow_tramites.models.TareaInstancia;
import com.antigravity.workflow_tramites.models.TareaDefinicion;
import com.antigravity.workflow_tramites.models.PoliticaNegocio;
import com.antigravity.workflow_tramites.repositories.TramiteRepository;
import com.antigravity.workflow_tramites.repositories.TareaInstanciaRepository;
import com.antigravity.workflow_tramites.repositories.TareaDefinicionRepository;
import com.antigravity.workflow_tramites.repositories.PoliticaNegocioRepository;
import com.antigravity.workflow_tramites.engine.BpmEngineService;
import com.antigravity.workflow_tramites.services.GeminiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tramites")
@CrossOrigin(origins = "http://localhost:4200")
public class TramiteController {
    @Autowired
    private TramiteRepository tramiteRepository;
    @Autowired
    private TareaInstanciaRepository tareaInstanciaRepository;
    @Autowired
    private TareaDefinicionRepository tareaDefinicionRepository;
    @Autowired
    private PoliticaNegocioRepository politicaRepository;
    @Autowired
    private BpmEngineService bpmEngine;
    @Autowired
    private GeminiService geminiService;

    @GetMapping("/empresa/{empresaId}")
    public List<Tramite> obtenerTramites(@PathVariable String empresaId) {
        return tramiteRepository.findByEmpresaId(empresaId);
    }

    @PostMapping
    public Tramite crearTramite(@RequestBody Tramite tramite) {
        tramite.setFechaCreacion(LocalDateTime.now().toString());
        tramite.setEstado("PENDIENTE");
        tramite.setPorcentajeAvance(0);
        tramite.setNotasGenerales("");
        
        // Iniciar Variables Globales con los datos del StartEvent (Formulario Inicial)
        tramite.setVariablesGlobales(tramite.getDatosDinamicosBPMN() != null ? tramite.getDatosDinamicosBPMN() : "{}");
        
        // Buscar Política Activa
        PoliticaNegocio politicaActiva = null;
        if (tramite.getPoliticaId() != null && !tramite.getPoliticaId().isEmpty()) {
            politicaActiva = politicaRepository.findById(tramite.getPoliticaId()).orElse(null);
        } else {
            for (PoliticaNegocio p : politicaRepository.findAll()) {
                if (p.getEmpresaId().equals(tramite.getEmpresaId()) && p.isActiva()) {
                    politicaActiva = p; break;
                }
            }
        }
        
        if (politicaActiva == null) throw new RuntimeException("No hay política activa para esta empresa o el ID de política es inválido");
        
        // Asignar el ID de la política al trámite por si no lo tenía
        tramite.setPoliticaId(politicaActiva.getId());
        tramite.setPoliticaId(politicaActiva.getId());
        Tramite nuevo = tramiteRepository.save(tramite);
        
        try {
            List<TareaDefinicion> defs = tareaDefinicionRepository.findByEmpresaId(nuevo.getEmpresaId());
            TareaDefinicion startDef = defs.stream().filter(d -> "START_EVENT".equals(d.getNombre())).findFirst().orElse(null);
            
            if (startDef != null) {
                // Preguntar al Motor cuál es la PRIMERA tarea
                String nextNodeId = bpmEngine.getNextNode(politicaActiva.getXmlBpmn(), startDef.getBpmnNodeId(), nuevo.getVariablesGlobales());
                
                if (!"END".equals(nextNodeId)) {
                    crearNuevaTareaInstancia(nuevo, nextNodeId, defs);
                } else {
                    nuevo.setEstado("FINALIZADO");
                    tramiteRepository.save(nuevo);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return nuevo;
    }

    @PutMapping("/{id}")
    public Tramite actualizarTramite(@PathVariable String id, @RequestBody Tramite tramite) {
        Tramite existente = tramiteRepository.findById(id).orElseThrow();
        existente.setClienteNombre(tramite.getClienteNombre());
        existente.setDescripcion(tramite.getDescripcion());
        if (tramite.getSectorId() != null) existente.setSectorId(tramite.getSectorId());
        return tramiteRepository.save(existente);
    }

    @DeleteMapping("/{id}")
    public void eliminarTramite(@PathVariable String id) {
        tramiteRepository.deleteById(id);
        List<TareaInstancia> tareas = tareaInstanciaRepository.findByTramiteId(id);
        tareaInstanciaRepository.deleteAll(tareas);
    }

    @GetMapping("/tareas/empresa/{empresaId}")
    public List<TareaInstancia> obtenerTodasLasTareas(@PathVariable String empresaId) {
        return tareaInstanciaRepository.findByEmpresaId(empresaId);
    }

    @PutMapping("/tareas/{id}/asignar")
    public TareaInstancia asignarTarea(@PathVariable String id, @RequestParam String usuarioId) {
        TareaInstancia inst = tareaInstanciaRepository.findById(id).orElseThrow();
        inst.setAsignadoA(usuarioId);
        inst.setEstado("EN_PROCESO");
        return tareaInstanciaRepository.save(inst);
    }

    @PostMapping("/tareas/llenar-ia")
    public org.springframework.http.ResponseEntity<String> autoLlenarTarea(@RequestBody Map<String, String> payload) {
        String texto = payload.get("texto");
        String metadata = payload.get("metadata");
        String audioBase64 = payload.get("audio");
        
        String jsonResult = geminiService.autoLlenarFormulario(texto, metadata, audioBase64);
        return org.springframework.http.ResponseEntity.ok(jsonResult);
    }

    @GetMapping("/{id}/historial")
    public List<com.antigravity.workflow_tramites.models.VersionDatos> getHistorial(@PathVariable String id) {
        Tramite tramite = tramiteRepository.findById(id).orElseThrow();
        return tramite.getHistorialVersiones();
    }



    @PutMapping("/tareas/{id}/completar")
    public TareaInstancia completarTarea(@PathVariable String id, @RequestBody Map<String, Object> data) {
        TareaInstancia inst = tareaInstanciaRepository.findById(id).orElseThrow();
        Tramite tramite = tramiteRepository.findById(inst.getTramiteId()).orElseThrow();
        
        if (data.containsKey("requisitos")) {
            String nuevasResp = (String) data.get("requisitos");
            inst.setRequisitosCompletados(nuevasResp);
            
            try {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> globales = mapper.readValue(
                    tramite.getVariablesGlobales() != null && !tramite.getVariablesGlobales().isEmpty() ? tramite.getVariablesGlobales() : "{}", 
                    Map.class
                );
                Map<String, Object> locales = mapper.readValue(
                    nuevasResp != null && !nuevasResp.isEmpty() ? nuevasResp : "{}", 
                    Map.class
                );
                globales.putAll(locales); // Mezclar respuestas
                String nuevoJson = mapper.writeValueAsString(globales);
                tramite.setVariablesGlobales(nuevoJson);

                // GESTOR DOCUMENTAL: Agregar versión inmutable
                com.antigravity.workflow_tramites.models.VersionDatos version = new com.antigravity.workflow_tramites.models.VersionDatos();
                version.setVersion(tramite.getHistorialVersiones().size() + 1);
                version.setAutorId(data.containsKey("usuarioId") ? (String) data.get("usuarioId") : inst.getAsignadoA());
                version.setTaskId(inst.getTareaDefinicionId());
                version.setFecha(LocalDateTime.now());
                version.setVariables(nuevoJson);
                version.setCampoModificado("Formulario completo de la tarea");
                tramite.getHistorialVersiones().add(version);
                
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        
        if (data.containsKey("notas")) {
            String nuevaNota = (String) data.get("notas");
            inst.setNotas(nuevaNota);
            
            if (nuevaNota != null && !nuevaNota.trim().isEmpty()) {
                String notasActuales = tramite.getNotasGenerales() != null ? tramite.getNotasGenerales() : "";
                String meta = "[" + inst.getNombre() + " - " + LocalDateTime.now().toString().substring(0,16) + "]: ";
                tramite.setNotasGenerales(notasActuales + "\n" + meta + nuevaNota);
            }
        }

        inst.setEstado("COMPLETADA");
        TareaInstancia saved = tareaInstanciaRepository.save(inst);
        
        // MAGIA DEL ENGINE: ¿Qué sigue ahora?
        try {
            PoliticaNegocio politica = politicaRepository.findById(tramite.getPoliticaId()).orElseThrow();
            List<TareaDefinicion> defs = tareaDefinicionRepository.findByEmpresaId(tramite.getEmpresaId());
            
            String nextNodeId = bpmEngine.getNextNode(politica.getXmlBpmn(), inst.getBpmnNodeId(), tramite.getVariablesGlobales());
            
            if ("END".equals(nextNodeId)) {
                tramite.setEstado("FINALIZADO");
                tramite.setPorcentajeAvance(100);
            } else {
                tramite.setEstado("EN_PROCESO");
                crearNuevaTareaInstancia(tramite, nextNodeId, defs);
            }
            tramiteRepository.save(tramite);
            
        } catch (Exception e) { 
            e.printStackTrace(); 
        }

        return saved;
    }

    private void crearNuevaTareaInstancia(Tramite tramite, String nextNodeId, List<TareaDefinicion> defs) {
        TareaDefinicion nextDef = defs.stream().filter(d -> nextNodeId.equals(d.getBpmnNodeId())).findFirst().orElse(null);
        if (nextDef != null) {
            TareaInstancia nuevaInstancia = new TareaInstancia();
            nuevaInstancia.setTramiteId(tramite.getId());
            nuevaInstancia.setTareaDefinicionId(nextDef.getId());
            nuevaInstancia.setBpmnNodeId(nextDef.getBpmnNodeId());
            nuevaInstancia.setNombre(nextDef.getNombre());
            nuevaInstancia.setRequisitos(nextDef.getRequisitos());
            nuevaInstancia.setSectorId(nextDef.getSectorId());
            nuevaInstancia.setEmpresaId(tramite.getEmpresaId());
            nuevaInstancia.setEstado("PENDIENTE");
            tareaInstanciaRepository.save(nuevaInstancia);
            
            tramite.setSectorId(nextDef.getSectorId()); // Actualiza dónde está la "pelota"
        }
    }
}
