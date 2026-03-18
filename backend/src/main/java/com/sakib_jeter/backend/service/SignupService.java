package com.sakib_jeter.backend.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.sakib_jeter.backend.entity.User;
import com.sakib_jeter.backend.repository.UserRepository;
import com.sakib_jeter.backend.exception.EmailAlreadyExistsException;
import java.time.LocalDateTime;

@Service
public class SignupService {

    private final UserRepository repo;
    private final BCryptPasswordEncoder encoder;

    public SignupService(UserRepository repo, BCryptPasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public void register(String email, String password) {

        //Checks if email already exists
        if (repo.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        //Creates user
        User user = new User();
        user.setEmail(email);

        //hashes password w bcrypt
        user.setPassword(encoder.encode(password));

        // createdAt is handled by @PrePersist
        repo.save(user);
    }
    public void login(String email, String password) {

        User user = repo.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        //updates last login
        user.setLastLogin(LocalDateTime.now());
        repo.save(user);
}
}