package com.azobioz.task.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())                    // Отключаем CSRF
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))  // без сессий

                .authorizeHttpRequests(auth -> auth
                        // Все internal эндпоинты разрешаем, потому-что проверка будет в aggregator-service
                        .anyRequest().permitAll()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.disable());

        return http.build();
    }
}
