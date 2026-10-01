package com.quiz_wheelz.config;

import com.quiz_wheelz.common.ApiPaths;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Registers open-in-view here instead of through Spring Boot's default (Boot backs off when this
// interceptor bean exists) so the live-event SSE streams can be excluded. Open-in-view keeps one
// EntityManager, and the pooled JDBC connection it has borrowed, until the request completes; for an
// SSE stream that is the whole life of the stream, so without the exclusion every open stream pins
// one connection of the pool. The streams do their database work in short service transactions and
// do not need it. Every other endpoint keeps open-in-view exactly as before.
@Configuration
public class OpenEntityManagerInViewConfig implements WebMvcConfigurer {

    @Bean
    public OpenEntityManagerInViewInterceptor openEntityManagerInViewInterceptor() {
        return new OpenEntityManagerInViewInterceptor();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addWebRequestInterceptor(openEntityManagerInViewInterceptor())
                .excludePathPatterns(ApiPaths.LIVE_EVENT_STREAMS);
    }
}
