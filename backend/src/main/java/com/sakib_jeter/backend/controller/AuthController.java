package com.sakib_jeter.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sakib_jeter.backend.dto.ChangePasswordRequest;
import com.sakib_jeter.backend.dto.SignupRequest;
import com.sakib_jeter.backend.service.JwtService;
import com.sakib_jeter.backend.service.SignupService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SignupService service;
    private final JwtService jwtService;

    public AuthController(SignupService service, JwtService jwtService) {
        this.service = service;
        this.jwtService = jwtService;
    }

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@Valid @RequestBody SignupRequest request) {

        service.register(request.getEmail(), request.getPassword());

        return ResponseEntity.ok("User registered successfully");
    }

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
                "email", request.getEmail()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @RequestBody ChangePasswordRequest request,
            @RequestHeader("Authorization") String authHeader) {

        service.changePassword(
                authHeader,
                request.getCurrentPassword(),
                request.getNewPassword());

        return ResponseEntity.ok("Password updated successfully");
    }
}