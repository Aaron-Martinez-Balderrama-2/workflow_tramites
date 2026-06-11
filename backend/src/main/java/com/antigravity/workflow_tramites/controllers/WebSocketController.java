package com.antigravity.workflow_tramites.controllers;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class WebSocketController {

    // El cliente envía a /app/diagrama/{empresaId}
    // y esto se retransmite a /topic/diagrama/{empresaId}
    @MessageMapping("/diagrama/{empresaId}")
    @SendTo("/topic/diagrama/{empresaId}")
    public Map<String, Object> syncDiagrama(@DestinationVariable String empresaId, Map<String, Object> payload) {
        // payload contiene el XML o el delta enviado por el usuario
        // Podemos añadir timestamps o validaciones aquí si es necesario
        return payload;
    }

    // El cliente envía a /app/tramite/{tramiteId}
    // y esto se retransmite a /topic/tramite/{tramiteId}
    @MessageMapping("/tramite/{tramiteId}")
    @SendTo("/topic/tramite/{tramiteId}")
    public Map<String, Object> syncFormulario(@DestinationVariable String tramiteId, Map<String, Object> payload) {
        // payload debería contener: 
        // { emisorId: "...", campoId: "presupuesto", valor: "500", timestamp: "..." }
        // Se añade un timestamp en el servidor para garantizar sincronización correcta
        payload.put("serverTimestamp", System.currentTimeMillis());
        return payload;
    }
}
