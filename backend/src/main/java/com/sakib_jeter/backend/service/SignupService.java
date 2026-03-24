package com.sakib_jeter.backend.service;

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
    private final JwtService jwtService; // NEW

    public SignupService(
            UserRepository repo,
            BCryptPasswordEncoder encoder,
            AccountRepository accountRepository,
            JwtService jwtService // NEW
    ) {
        this.repo = repo;
        this.encoder = encoder;
        this.accountRepository = accountRepository;
        this.jwtService = jwtService; // NEW
    }

    public void register(String email, String password) {
        if (repo.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(encoder.encode(password));
        User savedUser = repo.save(user);

        Account account = new Account();
        account.setUserId(savedUser.getId());
        account.setFirstName("");
        account.setLastName("");
        accountRepository.save(account);
    }

    public Long login(String email, String password) {

        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        return user.getId();
    }

    public void changePassword(String token, String currentPassword, String newPassword) {

        String email = jwtService.extractEmail(token.replace("Bearer ", ""));

        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(encoder.encode(newPassword));
        repo.save(user);

        System.out.println("Password updated for: " + email);
    }
    public boolean emailExists(String email) {
    return repo.existsByEmail(email);
}
}