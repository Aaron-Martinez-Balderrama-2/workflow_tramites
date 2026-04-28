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
}
