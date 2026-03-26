package com.sakib_jeter.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.sakib_jeter.backend.entity.Account;
import com.sakib_jeter.backend.entity.User;
import com.sakib_jeter.backend.repository.AccountRepository;
import com.sakib_jeter.backend.repository.UserRepository;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public AccountService(AccountRepository accountRepository, UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Account getAccountByUserId(Long userId) {
        return accountRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    //(JWT-based)
    public Account getAccountByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return accountRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    public Account createAccount(Account account) {
        return accountRepository.save(account);
    }

    public Account updateAccount(Long userId, Account updatedAccount) {
        Account account = getAccountByUserId(userId);
        account.setFirstName(updatedAccount.getFirstName());
        account.setLastName(updatedAccount.getLastName());
        return accountRepository.save(account);
    }

    public void deleteAccount(Long userId) {
        Account account = getAccountByUserId(userId);
        accountRepository.delete(account);
    }

    public Account updateNameByEmail(String email, String firstName, String lastName) {

        // Step 1: find user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Step 2: find account
        Account account = accountRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Account not found"));

        // Step 3: update fields
        account.setFirstName(firstName);
        account.setLastName(lastName);

        return accountRepository.save(account);
    }
}