package com.antigravity.workflow_tramites.controllers;

import com.antigravity.workflow_tramites.models.PoliticaNegocio;
import com.antigravity.workflow_tramites.repositories.PoliticaNegocioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/sistema")
@CrossOrigin(origins = "http://localhost:4200")
public class GeneradorSistemaController {

    @Autowired
    private PoliticaNegocioRepository politicaRepository;

    @Autowired
    private com.antigravity.workflow_tramites.repositories.EmpresaRepository empresaRepository;

    @Autowired
    private com.antigravity.workflow_tramites.repositories.SectorRepository sectorRepository;

    @Autowired
    private com.antigravity.workflow_tramites.repositories.TareaDefinicionRepository tareaDefinicionRepository;

    @PostMapping("/generar/{politicaId}")
    public ResponseEntity<?> generarSistema(@PathVariable String politicaId) {
        try {
            Optional<PoliticaNegocio> politicaOpt = politicaRepository.findById(politicaId);
            if (politicaOpt.isEmpty())
                return ResponseEntity.notFound().build();

            PoliticaNegocio politica = politicaOpt.get();
            String xml = politica.getXmlBpmn();
            String empresaId = politica.getEmpresaId();

            if (xml == null || xml.isEmpty()) {
                return ResponseEntity.badRequest().body("{\"error\": \"El diagrama está vacío\"}");
            }

            // --- LOGICA DE PARSEO BPMN ---
            javax.xml.parsers.DocumentBuilderFactory factory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            javax.xml.parsers.DocumentBuilder builder = factory.newDocumentBuilder();
            org.w3c.dom.Document doc = builder.parse(new org.xml.sax.InputSource(new java.io.StringReader(xml)));

            // Limpiar datos previos de la empresa para evitar duplicados al regenerar
            sectorRepository.deleteByEmpresaId(empresaId);
            tareaDefinicionRepository.deleteByEmpresaId(empresaId);

            org.w3c.dom.NodeList lanes = doc.getElementsByTagNameNS("*", "lane");

            for (int i = 0; i < lanes.getLength(); i++) {
                org.w3c.dom.Element laneEl = (org.w3c.dom.Element) lanes.item(i);
                String laneName = laneEl.getAttribute("name");
                String laneId = laneEl.getAttribute("id");

                // Crear Sector
                com.antigravity.workflow_tramites.models.Sector sector = new com.antigravity.workflow_tramites.models.Sector();
                sector.setNombre(laneName);
                sector.setEmpresaId(empresaId);
                sector = sectorRepository.save(sector);

                // Buscar nodos hijos (flowNodeRef) para identificar tareas en este carril
                org.w3c.dom.NodeList nodeRefs = laneEl.getElementsByTagNameNS("*", "flowNodeRef");
                for (int j = 0; j < nodeRefs.getLength(); j++) {
                    String taskRef = nodeRefs.item(j).getTextContent();

                    // Buscar el UserTask correspondiente en el documento
                    org.w3c.dom.NodeList allTasks = doc.getElementsByTagNameNS("*", "userTask");
                    for (int k = 0; k < allTasks.getLength(); k++) {
                        org.w3c.dom.Element taskEl = (org.w3c.dom.Element) allTasks.item(k);
                        if (taskEl.getAttribute("id").equals(taskRef)) {
                            String taskName = taskEl.getAttribute("name");

                            // Obtener Requisitos (documentation)
                            String requisitos = "";
                            org.w3c.dom.NodeList docs = taskEl.getElementsByTagNameNS("*", "documentation");
                            if (docs.getLength() > 0) {
                                requisitos = docs.item(0).getTextContent();
                            }

                            // Crear Definición de Tarea
                            com.antigravity.workflow_tramites.models.TareaDefinicion def = new com.antigravity.workflow_tramites.models.TareaDefinicion();
                            def.setNombre(taskName);
                            def.setRequisitos(requisitos);
                            def.setSectorId(sector.getId());
                            def.setEmpresaId(empresaId);
                            tareaDefinicionRepository.save(def);
                        }
                    }
                }
            }

            // Marcar empresa como sistema generado
            Optional<com.antigravity.workflow_tramites.models.Empresa> empOpt = empresaRepository.findById(empresaId);
            if (empOpt.isPresent()) {
                com.antigravity.workflow_tramites.models.Empresa emp = empOpt.get();
                emp.setSistemaGenerado(true);
                empresaRepository.save(emp);
            }

            politica.setActiva(true);
            politicaRepository.save(politica);

            return ResponseEntity.ok(
                    "{\"mensaje\": \"¡Sistema Activado! Se han extraído los sectores y requisitos del diagrama.\"}");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("{\"error\": \"Error al procesar el diagrama: " + e.getMessage() + "\"}");
        }
    }
}
