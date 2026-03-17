package com.sakib_jeter.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.sakib_jeter.backend.entity.User;
import com.sakib_jeter.backend.repository.UserRepository;

@Service
public class UserService {
    private UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);

    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User addUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email Exists");
        }
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (userRepository.findById(id) != null) {
            userRepository.deleteById(id);
        }
    }

    public User updateUser(User user) {
        User currentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        currentUser.setEmail(user.getEmail());
        currentUser.setLastLogin(user.getLastLogin());

        return userRepository.save(currentUser);
    }

}
