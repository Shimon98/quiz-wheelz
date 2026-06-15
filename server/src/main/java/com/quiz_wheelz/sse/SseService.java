package com.quiz_wheelz.sse;

import com.quiz_wheelz.config.SseConfig;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SseService {

    private final SseConfig sseConfig;
    private final Map<String, SseConnection> connections = new ConcurrentHashMap<>();

    public SseService(SseConfig sseConfig) {
        this.sseConfig = sseConfig;
    }

    public SseEmitter connect(String clientId) {
        SseEmitter emitter = new SseEmitter(sseConfig.getSseTimeoutMillis());

        SseConnection connection = new SseConnection(
                clientId,
                emitter,
                LocalDateTime.now()
        );

        connections.put(clientId, connection);

        emitter.onCompletion(() -> connections.remove(clientId));
        emitter.onTimeout(() -> connections.remove(clientId));
        emitter.onError(error -> connections.remove(clientId));

        sendToClient(clientId, "connected", "SSE connected");

        return emitter;
    }

    public void sendToClient(String clientId, String eventName, Object data) {
        SseConnection connection = connections.get(clientId);

        if (connection == null) {
            return;
        }

        try {
            connection.emitter().send(
                    SseEmitter.event()
                            .name(eventName)
                            .data(data)
            );
        } catch (IOException e) {
            connections.remove(clientId);
        }
    }

    public void broadcast(String eventName, Object data) {
        connections.keySet().forEach(clientId ->
                sendToClient(clientId, eventName, data)
        );
    }

    public int getConnectionCount() {
        return connections.size();
    }
}