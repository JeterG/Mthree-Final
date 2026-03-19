package com.sakib_jeter.backend.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.sakib_jeter.backend.entity.Account;
import com.sakib_jeter.backend.entity.User;
import com.sakib_jeter.backend.exception.EmailAlreadyExistsException;
import com.sakib_jeter.backend.repository.AccountRepository;
import com.sakib_jeter.backend.repository.UserRepository;

@Service
public class SignupService {

    private final UserRepository repo;
    private final BCryptPasswordEncoder encoder;
    private final AccountRepository accountRepository;

    public SignupService(UserRepository repo, BCryptPasswordEncoder encoder, AccountRepository accountRepository) {
        this.repo = repo;
        this.encoder = encoder;
        this.accountRepository = accountRepository;
    }

    public void register(String email, String password) {
        if (repo.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(encoder.encode(password));
        User savedUser = repo.save(user);

        // Auto-create account with default $10,000 balance
        Account account = new Account();
        account.setUserId(savedUser.getId());
        account.setFirstName("");
        account.setLastName("");
        accountRepository.save(account);
    }

public Long login(String email, String password) {

    User user = repo.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    // ✅ IMPORTANT: use bcrypt match
    if (!encoder.matches(password, user.getPassword())) {
        throw new RuntimeException("Invalid credentials");
    }

    return user.getId();
}
}