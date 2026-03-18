package com.sakib_jeter.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.sakib_jeter.backend.dto.SignupRequest;
import com.sakib_jeter.backend.service.SignupService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final SignupService service;

    public AuthController(SignupService service) {
        this.service = service;
    }

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@Valid @RequestBody SignupRequest request) {

        service.register(request.getEmail(), request.getPassword());

        return ResponseEntity.ok("User registered successfully");
    } 
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody SignupRequest request) {
        service.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok("Login successful");
    }
}