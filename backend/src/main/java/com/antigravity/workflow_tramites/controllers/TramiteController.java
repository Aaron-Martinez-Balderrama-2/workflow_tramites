package com.antigravity.workflow_tramites.controllers;

import com.antigravity.workflow_tramites.models.Tramite;
import com.antigravity.workflow_tramites.models.TareaInstancia;
import com.antigravity.workflow_tramites.models.TareaDefinicion;
import com.antigravity.workflow_tramites.repositories.TramiteRepository;
import com.antigravity.workflow_tramites.repositories.TareaInstanciaRepository;
import com.antigravity.workflow_tramites.repositories.TareaDefinicionRepository;
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
        
        List<TareaDefinicion> definiciones = tareaDefinicionRepository.findByEmpresaId(tramite.getEmpresaId());
        if (!definiciones.isEmpty()) {
            tramite.setSectorId(definiciones.get(0).getSectorId());
        }

        Tramite nuevo = tramiteRepository.save(tramite);
        
        for (TareaDefinicion def : definiciones) {
            TareaInstancia inst = new TareaInstancia();
            inst.setTramiteId(nuevo.getId());
            inst.setTareaDefinicionId(def.getId());
            inst.setNombre(def.getNombre());
            inst.setRequisitos(def.getRequisitos());
            inst.setSectorId(def.getSectorId());
            inst.setEmpresaId(nuevo.getEmpresaId());
            inst.setEstado("PENDIENTE");
            tareaInstanciaRepository.save(inst);
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

    @PutMapping("/tareas/{id}/completar")
    public TareaInstancia completarTarea(@PathVariable String id, @RequestBody Map<String, Object> data) {
        TareaInstancia inst = tareaInstanciaRepository.findById(id).orElseThrow();
        
        if (data.containsKey("requisitos")) {
            inst.setRequisitosCompletados((List<String>) data.get("requisitos"));
        }
        
        if (data.containsKey("notas")) {
            String nuevaNota = (String) data.get("notas");
            inst.setNotas(nuevaNota);
            
            // Heredar nota al Trámite
            Tramite tramite = tramiteRepository.findById(inst.getTramiteId()).orElse(null);
            if (tramite != null && nuevaNota != null && !nuevaNota.trim().isEmpty()) {
                String notasActuales = tramite.getNotasGenerales() != null ? tramite.getNotasGenerales() : "";
                String meta = "[" + inst.getNombre() + " - " + LocalDateTime.now().toString().substring(0,16) + "]: ";
                tramite.setNotasGenerales(notasActuales + "\n" + meta + nuevaNota);
                tramiteRepository.save(tramite);
            }
        }

        inst.setEstado("COMPLETADA");
        TareaInstancia saved = tareaInstanciaRepository.save(inst);
        recalcularAvance(inst.getTramiteId());
        return saved;
    }

    private void recalcularAvance(String tramiteId) {
        Tramite tramite = tramiteRepository.findById(tramiteId).orElse(null);
        if (tramite == null) return;

        List<TareaInstancia> todas = tareaInstanciaRepository.findByTramiteId(tramiteId);
        if (todas.isEmpty()) return;

        long completadas = todas.stream().filter(t -> "COMPLETADA".equals(t.getEstado())).count();
        int porcentaje = (int) ((completadas * 100) / todas.size());
        
        tramite.setPorcentajeAvance(porcentaje);
        if (porcentaje == 100) {
            tramite.setEstado("FINALIZADO");
        } else {
            tramite.setEstado("EN_PROCESO");
        }

        todas.stream()
            .filter(t -> !"COMPLETADA".equals(t.getEstado()))
            .findFirst()
            .ifPresent(t -> tramite.setSectorId(t.getSectorId()));

        tramiteRepository.save(tramite);
    }
}
