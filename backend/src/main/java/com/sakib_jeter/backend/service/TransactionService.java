package com.sakib_jeter.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.sakib_jeter.backend.entity.Transaction;
import com.sakib_jeter.backend.repository.TransactionRepository;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<Transaction> getTransactionsByUser(Long userId) {// Get all transaction ordered by most recent
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Transaction saveTransaction(Transaction transaction) {// save a new transaction
        return transactionRepository.save(transaction);
    }
}