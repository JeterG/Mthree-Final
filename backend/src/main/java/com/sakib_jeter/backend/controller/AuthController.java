package com.sakib_jeter.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    public AuthController(SignupService service) {
        this.service = service;
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
        Long userId = service.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(Map.of("userId", userId, "email", request.getEmail()));
    }
}