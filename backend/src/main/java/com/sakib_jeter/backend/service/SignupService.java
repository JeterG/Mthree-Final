package com.sakib_jeter.backend.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.sakib_jeter.backend.entity.User;
import com.sakib_jeter.backend.repository.UserRepository;
import com.sakib_jeter.backend.exception.EmailAlreadyExistsException;

@Service
public class SignupService {

    private final UserRepository repo;
    private final BCryptPasswordEncoder encoder;

    public SignupService(UserRepository repo, BCryptPasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public void register(String email, String password) {

        // 🔍 Check if email already exists
        if (repo.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        // 🧱 Create user
        User user = new User();
        user.setEmail(email);

        // 🔐 Hash password (IMPORTANT)
        user.setPassword(encoder.encode(password));

        // createdAt is handled by @PrePersist
        repo.save(user);
    }
}