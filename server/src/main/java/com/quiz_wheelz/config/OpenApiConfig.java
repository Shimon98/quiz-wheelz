package com.quiz_wheelz.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private final AppConfig appConfig;

    public OpenApiConfig(AppConfig appConfig) {
        this.appConfig = appConfig;
    }

    @Bean
    public OpenAPI customOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title(appConfig.getAppName() + " API")
                        .version("1.0.0")
                        .description("Reusable Spring Boot boilerplate API"));
    }
}