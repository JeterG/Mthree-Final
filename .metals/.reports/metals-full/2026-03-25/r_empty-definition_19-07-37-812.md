error id: file:///C:/Users/Sakib/Desktop/Mthree-Final/backend/src/main/java/com/sakib_jeter/backend/config/JwtAuthenticationFilter.java:_empty_/HttpServletRequest#getHeader#
file:///C:/Users/Sakib/Desktop/Mthree-Final/backend/src/main/java/com/sakib_jeter/backend/config/JwtAuthenticationFilter.java
empty definition using pc, found symbol in pc: _empty_/HttpServletRequest#getHeader#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 2409
uri: file:///C:/Users/Sakib/Desktop/Mthree-Final/backend/src/main/java/com/sakib_jeter/backend/config/JwtAuthenticationFilter.java
text:
```scala
package com.sakib_jeter.backend.config;

import java.io.IOException;
import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sakib_jeter.backend.service.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        // Always allow OPTIONS preflight through
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip JWT check for auth endpoints — login/signup don't need a token
        // This prevents an old/expired token in the browser from blocking login
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {

            String token = authHeader.substring(7);

            if (jwtService.isValid(token)) {

                String email = jwtService.extractEmail(token);

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        Collections.emptyList());

                SecurityContextHolder.getContext().setAuthentication(auth);

            } else {
                // Set CORS header before returning 401
                // so browser doesn't treat it as a CORS error
                String origin = request.getHeader@@("Origin");
                if (origin != null) {
                    response.setHeader("Access-Control-Allow-Origin", origin);
                    response.setHeader("Access-Control-Allow-Credentials", "true");
                }
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: _empty_/HttpServletRequest#getHeader#