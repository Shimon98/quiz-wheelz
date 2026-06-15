package com.quiz_wheelz.health;

import com.quiz_wheelz.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PingController {

    @GetMapping("/api/ping")
    public ApiResponse<String> ping() {
        return ApiResponse.ok("Server is running", "pong");
    }
}