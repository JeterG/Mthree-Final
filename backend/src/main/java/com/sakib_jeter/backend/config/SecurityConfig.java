package com.sakib_jeter.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // ❌ Disable CSRF for API usage
                .csrf(csrf -> csrf.disable())

                // ✅ Enable CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // ✅ Allow Swagger + Angular + APIs
                .authorizeHttpRequests(auth -> auth

                        // Auth endpoints
                        .requestMatchers("/api/auth/**").permitAll()

                        // Public APIs (adjust later if needed)
                        .requestMatchers("/api/**").permitAll()

                        // Swagger / OpenAPI
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html")
                        .permitAll()

                        // Allow Angular docs route (frontend)
                        .requestMatchers("/docs/**").permitAll()

                        // Preflight requests (VERY IMPORTANT for Angular)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Everything else
                        .anyRequest().authenticated())

                // ❌ Disable basic auth popup
                .httpBasic(httpBasic -> httpBasic.disable())

                // ❗ IMPORTANT: allows embedding + fixes some Swagger issues
                .headers(headers -> headers
                        .frameOptions(frame -> frame.disable()));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        // ✅ Allow Angular frontend
        config.setAllowedOrigins(List.of("http://localhost:4200"));

        // ✅ Allow all headers (needed for Swagger + Angular)
        config.setAllowedHeaders(List.of("*"));

        // ✅ Allow all HTTP methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // ✅ Allow cookies/auth headers if needed later
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // Apply to all routes
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}