package com.sakib_jeter.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "accounts")
public class Account {

    public Account() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto Incrementing account id
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true) // referenced one to one relationship user_id with users
                                                               // id
    private Long userId;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "cash_balance", nullable = false, precision = 10, scale = 2) // Default to 10000 starting paper cash
    private BigDecimal cashBalance = new BigDecimal("10000.00");
}