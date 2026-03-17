package com.sakib_jeter.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sakib_jeter.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    // Use jpa query methods to generate the sql for each of the methods for
    // specific use cases like look up and checking if a value exists etc.
    User findByEmail(String email);

    boolean existsByEmail(String email);
}
