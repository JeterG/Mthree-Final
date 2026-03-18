package com.sakib_jeter.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sakib_jeter.backend.entity.Account;
import com.sakib_jeter.backend.service.AccountService;

@RestController
@RequestMapping("/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public List<Account> getAllAccounts() {
        return accountService.getAllAccounts();
    }

    @GetMapping("/{userId}") // user userId instead of account id to not expose account id
    public Account getAccount(@PathVariable Long userId) {
        return accountService.getAccountByUserId(userId);
    }

    @PostMapping
    public Account createAccount(@RequestBody Account account) {
        return accountService.createAccount(account);
    }

    @PutMapping("/{userId}") // user userId instead of account id to not expose account id
    public Account updateAccount(@PathVariable Long userId, @RequestBody Account updatedAccount) {
        return accountService.updateAccount(userId, updatedAccount);
    }

    @DeleteMapping("/{userId}") // user userId instead of account id to not expose account id
    public void deleteAccount(@PathVariable Long userId) {
        accountService.deleteAccount(userId);
    }
}