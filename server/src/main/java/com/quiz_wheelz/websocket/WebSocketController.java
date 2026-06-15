package com.quiz_wheelz.websocket;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    @MessageMapping("/demo")
    @SendTo("/topic/demo")
    public WebSocketMessage send(WebSocketMessage message) {
        return message;
    }
}