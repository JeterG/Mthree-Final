package com.sakib_jeter.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sakib_jeter.backend.entity.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId); // Get all transactions based on user_id sorted by
                                                                     // most recent first
}