package com.sakib_jeter.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sakib_jeter.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    // Check if email already exists (used in signup)
    boolean existsByEmail(String email);

    // Find user by email (used later for login)
    Optional<User> findByEmail(String email);
}