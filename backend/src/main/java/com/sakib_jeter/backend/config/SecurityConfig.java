package com.sakib_jeter.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // ❌ Disable CSRF for APIs
                .csrf(csrf -> csrf.disable())

                // ✅ Enable CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 🔒 Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // ✅ Public AUTH endpoints
                        .requestMatchers("/api/auth/**").permitAll()

                        // ✅ Public market data (optional)
                        .requestMatchers("/api/market/**").permitAll()

                        // ✅ Swagger
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html")
                        .permitAll()

                        // ✅ Angular docs
                        .requestMatchers("/docs/**").permitAll()

                        // ✅ Preflight (VERY IMPORTANT)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 🔐 EVERYTHING ELSE REQUIRES JWT
                        .anyRequest().authenticated()
                )

                // ❌ Disable basic auth popup
                .httpBasic(httpBasic -> httpBasic.disable())

                // ❗ Fix Swagger + H2 console issues
                .headers(headers -> headers
                        .frameOptions(frame -> frame.disable()))

                // 🔥 ADD JWT FILTER HERE
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}