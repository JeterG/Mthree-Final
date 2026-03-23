package com.sakib_jeter.backend.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Validation errors (@Valid) ────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

        return ResponseEntity.badRequest().body(errors);
    }

    // ── Email already exists ──────────────────────────────────────
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<Map<String, Object>> handleEmailExists(
            EmailAlreadyExistsException ex, HttpServletRequest request) {

        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI());
    }

    // ── Spring ResponseStatusException (404, 400, etc.) ──────────
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(
            ResponseStatusException ex, HttpServletRequest request) {

        return build(HttpStatus.valueOf(ex.getStatusCode().value()),
                ex.getReason() != null ? ex.getReason() : ex.getMessage(),
                request.getRequestURI());
    }

    // ── Illegal argument ──────────────────────────────────────────
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {

        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI());
    }

    // ── Runtime exceptions ────────────────────────────────────────
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(
            RuntimeException ex, HttpServletRequest request) {

        String message = ex.getMessage();
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

        if (message != null) {
            String lower = message.toLowerCase();

            // Auth failures → 401 (not 404)
            if (lower.contains("invalid password") || lower.contains("wrong password")
                    || lower.contains("incorrect password") || lower.contains("bad credentials")) {
                status = HttpStatus.UNAUTHORIZED;

                // Resource not found (non-auth contexts) → 404
            } else if (lower.contains("not found") || lower.contains("no such")) {
                // But if this is an auth endpoint, treat as 401
                String path = request.getRequestURI();
                if (path.contains("/api/auth/")) {
                    status = HttpStatus.UNAUTHORIZED;
                } else {
                    status = HttpStatus.NOT_FOUND;
                }

                // Business rule violations → 400
            } else if (lower.contains("insufficient") || lower.contains("already exists")
                    || lower.contains("duplicate") || lower.contains("already in")
                    || lower.contains("already watching")) {
                status = HttpStatus.BAD_REQUEST;

                // Explicit auth failures → 401
            } else if (lower.contains("unauthorized") || lower.contains("access denied")) {
                status = HttpStatus.UNAUTHORIZED;
            }
        }

        return build(status, message, request.getRequestURI());
    }

    // ── Catch-all ─────────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(
            Exception ex, HttpServletRequest request) {

        return build(HttpStatus.INTERNAL_SERVER_ERROR,
                ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred",
                request.getRequestURI());
    }

    // ── Helper ────────────────────────────────────────────────────
    private ResponseEntity<Map<String, Object>> build(
            HttpStatus status, String message, String path) {

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message != null ? message : "An unexpected error occurred");
        body.put("path", path);

        return ResponseEntity.status(status).body(body);
    }
}