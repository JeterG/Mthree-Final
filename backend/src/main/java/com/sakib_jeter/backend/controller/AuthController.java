package com.sakib_jeter.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.sakib_jeter.backend.service.JwtService;
import com.sakib_jeter.backend.dto.SignupRequest;
import com.sakib_jeter.backend.service.SignupService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Tag(name = "Auth Controller", description = "Authentication APIs")
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final SignupService service;
    private final JwtService jwtService;

    public AuthController(SignupService service, JwtService jwtService) {
        this.service = service;
        this.jwtService = jwtService;
    }

    @Operation(summary = "Register a new user")
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@Valid @RequestBody SignupRequest request) {
        service.register(request.getEmail(), request.getPassword());
        return ResponseEntity.ok("User registered successfully");
    }

    @Operation(summary = "Login user")
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody SignupRequest request) {

        // ✅ Validate user credentials
        Long userId = service.login(request.getEmail(), request.getPassword());

        // 🔐 Generate JWT token
        String token = jwtService.generateToken(request.getEmail(), userId);

        // ✅ Return token + user info
        return ResponseEntity.ok(Map.of(
                "token", token,
                "userId", userId,
                "email", request.getEmail()
        ));
    }
}