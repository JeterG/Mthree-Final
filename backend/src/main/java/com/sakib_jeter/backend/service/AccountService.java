package com.sakib_jeter.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.sakib_jeter.backend.entity.Account;
import com.sakib_jeter.backend.repository.AccountRepository;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Account getAccountByUserId(Long userId) {
        Account account = accountRepository.findByUserId(userId);
        if (account == null)
            throw new RuntimeException("Account not found");
        return account;
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
}