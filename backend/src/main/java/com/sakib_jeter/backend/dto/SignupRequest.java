package com.sakib_jeter.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class SignupRequest {

    @Email
    @NotBlank
    private String email;

    @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).{6,}$", message = "Password must be at least 6 characters, contain one uppercase letter and one number")
    @NotBlank
    private String password;

    // getters & setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}