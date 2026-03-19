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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Account Controller", description = "Manage user accounts")
@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @Operation(summary = "Get all accounts")
    @GetMapping
    public List<Account> getAllAccounts() {
        return accountService.getAllAccounts();
    }

    @Operation(summary = "Get account by user ID")
    @GetMapping("/{userId}")
    public Account getAccount(@PathVariable Long userId) {
        return accountService.getAccountByUserId(userId);
    }

    @Operation(summary = "Create new account")
    @PostMapping
    public Account createAccount(@RequestBody Account account) {
        return accountService.createAccount(account);
    }

    @Operation(summary = "Update account by user ID")
    @PutMapping("/{userId}")
    public Account updateAccount(@PathVariable Long userId, @RequestBody Account updatedAccount) {
        return accountService.updateAccount(userId, updatedAccount);
    }

    @Operation(summary = "Delete account by user ID")
    @DeleteMapping("/{userId}")
    public void deleteAccount(@PathVariable Long userId) {
        accountService.deleteAccount(userId);
    }
}