package com.antigravity.workflow_tramites.controllers;

import com.antigravity.workflow_tramites.models.PoliticaNegocio;
import com.antigravity.workflow_tramites.repositories.PoliticaNegocioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/sistema")
@CrossOrigin(originPatterns = "*")
public class GeneradorSistemaController {

    @Autowired
    private PoliticaNegocioRepository politicaRepository;

    @Autowired
    private com.antigravity.workflow_tramites.repositories.EmpresaRepository empresaRepository;

    @Autowired
    private com.antigravity.workflow_tramites.repositories.SectorRepository sectorRepository;

    @Autowired
    private com.antigravity.workflow_tramites.repositories.TareaDefinicionRepository tareaDefinicionRepository;

    // Método de extracción de componentes extensionElements y formField a una cadena estructurada JSON
    private String extraerCamposDinamicos(org.w3c.dom.Element element) {
        org.w3c.dom.NodeList extensionElements = element.getElementsByTagNameNS("*", "extensionElements");
        if (extensionElements.getLength() == 0) return "[]";

        org.w3c.dom.Element extEl = (org.w3c.dom.Element) extensionElements.item(0);
        org.w3c.dom.NodeList formDatas = extEl.getElementsByTagNameNS("*", "formData");
        if (formDatas.getLength() == 0) return "[]";

        org.w3c.dom.Element formDataEl = (org.w3c.dom.Element) formDatas.item(0);
        org.w3c.dom.NodeList formFields = formDataEl.getElementsByTagNameNS("*", "formField");
        
        java.util.List<String> fieldsList = new java.util.ArrayList<>();
        for (int f = 0; f < formFields.getLength(); f++) {
            org.w3c.dom.Element fieldEl = (org.w3c.dom.Element) formFields.item(f);
            String fId = fieldEl.getAttribute("id");
            String fLabel = fieldEl.getAttribute("label");
            String fType = fieldEl.getAttribute("type");
            
            String enumOptions = "";
            if ("enum".equals(fType)) {
                org.w3c.dom.NodeList values = fieldEl.getElementsByTagNameNS("*", "value");
                java.util.List<String> opts = new java.util.ArrayList<>();
                for(int v = 0; v < values.getLength(); v++){
                    org.w3c.dom.Element valEl = (org.w3c.dom.Element) values.item(v);
                    opts.add(String.format("{\"id\":\"%s\", \"name\":\"%s\"}", valEl.getAttribute("id"), valEl.getAttribute("name")));
                }
                enumOptions = ", \"options\": [" + String.join(",", opts) + "]";
            }
            fieldsList.add(String.format("{\"id\":\"%s\", \"label\":\"%s\", \"type\":\"%s\"%s}", fId, fLabel, fType, enumOptions));
        }
        return "[" + String.join(",", fieldsList) + "]";
    }

    @GetMapping("/start-form/{empresaId}")
    public ResponseEntity<?> getStartForm(@PathVariable String empresaId) {
        java.util.List<com.antigravity.workflow_tramites.models.TareaDefinicion> defs = tareaDefinicionRepository.findAll();
        for (com.antigravity.workflow_tramites.models.TareaDefinicion def : defs) {
            if (empresaId.equals(def.getEmpresaId()) && "START_EVENT".equals(def.getNombre())) {
                return ResponseEntity.ok("{\"formFields\": " + def.getRequisitos() + "}");
            }
        }
        return ResponseEntity.ok("{\"formFields\": []}");
    }

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

            javax.xml.parsers.DocumentBuilderFactory factory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            javax.xml.parsers.DocumentBuilder builder = factory.newDocumentBuilder();
            org.w3c.dom.Document doc = builder.parse(new org.xml.sax.InputSource(new java.io.StringReader(xml)));

            sectorRepository.deleteByEmpresaId(empresaId);
            tareaDefinicionRepository.deleteByEmpresaId(empresaId);

            org.w3c.dom.NodeList lanes = doc.getElementsByTagNameNS("*", "lane");

            for (int i = 0; i < lanes.getLength(); i++) {
                org.w3c.dom.Element laneEl = (org.w3c.dom.Element) lanes.item(i);
                String laneName = laneEl.getAttribute("name");

                com.antigravity.workflow_tramites.models.Sector sector = new com.antigravity.workflow_tramites.models.Sector();
                sector.setNombre(laneName);
                sector.setEmpresaId(empresaId);
                sector = sectorRepository.save(sector);

                org.w3c.dom.NodeList nodeRefs = laneEl.getElementsByTagNameNS("*", "flowNodeRef");
                for (int j = 0; j < nodeRefs.getLength(); j++) {
                    String taskRef = nodeRefs.item(j).getTextContent();
                    boolean isUserTask = false;

                    org.w3c.dom.NodeList allTasks = doc.getElementsByTagNameNS("*", "userTask");
                    for (int k = 0; k < allTasks.getLength(); k++) {
                        org.w3c.dom.Element taskEl = (org.w3c.dom.Element) allTasks.item(k);
                        if (taskEl.getAttribute("id").equals(taskRef)) {
                            String taskName = taskEl.getAttribute("name");
                            String jsonCampos = extraerCamposDinamicos(taskEl);

                            com.antigravity.workflow_tramites.models.TareaDefinicion def = new com.antigravity.workflow_tramites.models.TareaDefinicion();
                            def.setNombre(taskName);
                            def.setRequisitos(jsonCampos);
                            def.setSectorId(sector.getId());
                            def.setEmpresaId(empresaId);
                            def.setBpmnNodeId(taskRef);
                            tareaDefinicionRepository.save(def);
                            isUserTask = true;
                            break;
                        }
                    }

                    if (!isUserTask) {
                        org.w3c.dom.NodeList allStarts = doc.getElementsByTagNameNS("*", "startEvent");
                        for (int k = 0; k < allStarts.getLength(); k++) {
                            org.w3c.dom.Element startEl = (org.w3c.dom.Element) allStarts.item(k);
                            if (startEl.getAttribute("id").equals(taskRef)) {
                                String jsonCampos = extraerCamposDinamicos(startEl);
                                com.antigravity.workflow_tramites.models.TareaDefinicion def = new com.antigravity.workflow_tramites.models.TareaDefinicion();
                                def.setNombre("START_EVENT");
                                def.setRequisitos(jsonCampos);
                                def.setSectorId(sector.getId());
                                def.setEmpresaId(empresaId);
                                def.setBpmnNodeId(taskRef);
                                tareaDefinicionRepository.save(def);
                                break;
                            }
                        }
                    }
                }
            }

            Optional<com.antigravity.workflow_tramites.models.Empresa> empOpt = empresaRepository.findById(empresaId);
            if (empOpt.isPresent()) {
                com.antigravity.workflow_tramites.models.Empresa emp = empOpt.get();
                emp.setSistemaGenerado(true);
                empresaRepository.save(emp);
            }

            java.util.List<PoliticaNegocio> todas = politicaRepository.findAll();
            for(PoliticaNegocio p : todas) {
                if(p.getEmpresaId().equals(empresaId)) {
                    p.setActiva(p.getId().equals(politica.getId()));
                    politicaRepository.save(p);
                }
            }

            return ResponseEntity.ok(
                    "{\"mensaje\": \"¡Sistema Activado! Workflow dinámico listo.\"}");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("{\"error\": \"Error al procesar el diagrama: " + e.getMessage() + "\"}");
        }
    }
}
