package com.quiz_wheelz.config;

import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.security.JwtAuthenticationFilter;
import com.quiz_wheelz.security.RestAccessDeniedHandler;
import com.quiz_wheelz.security.RestAuthenticationEntryPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthenticationEntryPoint restAuthenticationEntryPoint,
            RestAccessDeniedHandler restAccessDeniedHandler
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.restAuthenticationEntryPoint = restAuthenticationEntryPoint;
        this.restAccessDeniedHandler = restAccessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, ApiPaths.AUTH_LOGIN).permitAll()
                        .requestMatchers(HttpMethod.POST, ApiPaths.AUTH_LOGOUT).permitAll()
                        .requestMatchers(HttpMethod.POST, ApiPaths.RACE_PLAYERS_JOIN).permitAll()
                        .requestMatchers(HttpMethod.GET, ApiPaths.RACE_PLAYERS_CURRENT_QUESTION).permitAll()
                        .requestMatchers(HttpMethod.GET, ApiPaths.ACTUATOR_HEALTH).permitAll()
                        .requestMatchers(ApiPaths.SWAGGER_UI).permitAll()
                        .requestMatchers(ApiPaths.API_DOCS).permitAll()
                        .requestMatchers(ApiPaths.AUTH_ME).authenticated()
                        .requestMatchers(ApiPaths.ALL_API_ENDPOINTS).authenticated()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
