package com.quiz_wheelz.websocket;

public record WebSocketMessage(
        String sender,
        String content
) {
}