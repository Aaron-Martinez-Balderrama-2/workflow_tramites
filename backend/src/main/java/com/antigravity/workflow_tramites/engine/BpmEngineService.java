package com.antigravity.workflow_tramites.engine;

import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import org.xml.sax.InputSource;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;

@Service
public class BpmEngineService {

    public String getNextNode(String xmlBpmn, String currentNodeId, String variablesJson) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new InputSource(new StringReader(xmlBpmn)));

        return findNext(doc, currentNodeId, variablesJson);
    }

    private String findNext(Document doc, String nodeId, String variablesJson) throws Exception {
        NodeList flows = doc.getElementsByTagNameNS("*", "sequenceFlow");
        for (int i = 0; i < flows.getLength(); i++) {
            Element flow = (Element) flows.item(i);
            if (nodeId.equals(flow.getAttribute("sourceRef"))) {
                String targetRef = flow.getAttribute("targetRef");
                return evaluateTargetNode(doc, targetRef, variablesJson);
            }
        }
        return "END";
    }

    private String evaluateGateway(Document doc, String gatewayId, String variablesJson) throws Exception {
        Map<String, Object> vars = new ObjectMapper().readValue(
            variablesJson != null && !variablesJson.isEmpty() ? variablesJson : "{}", Map.class);
        
        ExpressionParser parser = new SpelExpressionParser();
        StandardEvaluationContext context = new StandardEvaluationContext(vars);
        context.addPropertyAccessor(new org.springframework.context.expression.MapAccessor());
        
        // Asignar variables al contexto SpEL
        for (Map.Entry<String, Object> entry : vars.entrySet()) {
            context.setVariable(entry.getKey(), entry.getValue());
        }

        NodeList flows = doc.getElementsByTagNameNS("*", "sequenceFlow");
        String defaultFlow = null;

        for (int i = 0; i < flows.getLength(); i++) {
            Element flow = (Element) flows.item(i);
            if (gatewayId.equals(flow.getAttribute("sourceRef"))) {
                NodeList conditions = flow.getElementsByTagNameNS("*", "conditionExpression");
                if (conditions.getLength() > 0) {
                    String expr = conditions.item(0).getTextContent().trim();
                    
                    // Convertir sintaxis de Camunda ${var == 'val'} a SpEL puro #var == 'val'
                    expr = expr.replaceAll("^\\$\\{", "").replaceAll("\\}$", "");
                    for (String key : vars.keySet()) {
                        expr = expr.replaceAll("\\b" + key + "\\b", "#" + key);
                    }
                    
                    try {
                        Boolean result = parser.parseExpression(expr).getValue(context, Boolean.class);
                        if (Boolean.TRUE.equals(result)) {
                            return evaluateTargetNode(doc, flow.getAttribute("targetRef"), variablesJson);
                        }
                    } catch (Exception e) {
                        System.err.println("Error evaluando Gateway: " + e.getMessage() + " | Expresión: " + expr);
                    }
                } else {
                    defaultFlow = flow.getAttribute("targetRef"); 
                }
            }
        }
        
        if (defaultFlow != null) return evaluateTargetNode(doc, defaultFlow, variablesJson);
        return "END";
    }

    private String evaluateTargetNode(Document doc, String targetRef, String variablesJson) throws Exception {
        Element targetNode = getElementById(doc, targetRef);
        if (targetNode == null) return "END";
        
        String tagName = targetNode.getLocalName();
        if ("userTask".equals(tagName) || "serviceTask".equals(tagName)) {
            return targetRef;
        } else if ("exclusiveGateway".equals(tagName)) {
            return evaluateGateway(doc, targetRef, variablesJson);
        } else if ("endEvent".equals(tagName)) {
            return "END";
        } else {
            return findNext(doc, targetRef, variablesJson);
        }
    }

    private Element getElementById(Document doc, String id) {
        NodeList elements = doc.getElementsByTagName("*");
        for (int i = 0; i < elements.getLength(); i++) {
            Element el = (Element) elements.item(i);
            if (id.equals(el.getAttribute("id"))) return el;
        }
        return null;
    }
}
