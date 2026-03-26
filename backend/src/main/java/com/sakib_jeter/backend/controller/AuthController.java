package com.sakib_jeter.backend.controller;
 
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
 
        //Validate user credentials through SignupService
        Long userId = service.login(request.getEmail(), request.getPassword());
 
        //Generates JWT token
        String token = jwtService.generateToken(request.getEmail(), userId);
 
        //Return token + user info for JWT purposes
        return ResponseEntity.ok(Map.of(
                "token", token,
                "userId", userId,
                "email", request.getEmail()));
    }
 
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestBody ChangePasswordRequest request,
            @RequestHeader("Authorization") String authHeader) {
 
        service.changePassword(
                authHeader,
                request.getCurrentPassword(),
                request.getNewPassword());
 
        return ResponseEntity.ok(
                Map.of("message", "Password updated successfully")
        );
    }
    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestParam String email) {
        boolean exists = service.emailExists(email);
        return ResponseEntity.ok(Map.of("exists", exists));
}
 
}
 