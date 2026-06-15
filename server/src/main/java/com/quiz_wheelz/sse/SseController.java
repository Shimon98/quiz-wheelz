package com.quiz_wheelz.sse;

import com.quiz_wheelz.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/sse")
public class SseController {

    private final SseService sseService;

    public SseController(SseService sseService) {
        this.sseService = sseService;
    }

    @GetMapping("/connect/{clientId}")
    public SseEmitter connect(@PathVariable String clientId) {
        return sseService.connect(clientId);
    }

    @PostMapping("/broadcast")
    public ApiResponse<Void> broadcast(@RequestParam String message) {
        sseService.broadcast("message", message);
        return ApiResponse.ok("Message broadcasted");
    }

    @GetMapping("/count")
    public ApiResponse<Integer> countConnections() {
        return ApiResponse.ok("SSE connection count", sseService.getConnectionCount());
    }
}