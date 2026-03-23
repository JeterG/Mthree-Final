package com.sakib_jeter.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

// Represents a user's current stock position
// A holding is created on first buy and updated on every subsequent buy or sell
// If all shares are sold the holding is deleted entirely
@Entity
@Table(name = "holdings")
@Data
@NoArgsConstructor
public class Holding {

    // Auto-generated primary key
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Foreign key to users table — stored as plain Long, not a JPA relationship
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Stock ticker symbol e.g. AAPL, MSFT
    @Column(name = "stock_symbol", nullable = false)
    private String stockSymbol;

    // Supports fractional shares e.g. 0.5 shares of AAPL
    // scale = 4 allows up to 4 decimal places
    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal quantity;

    // Weighted average of all buy prices for this symbol
    // Recalculated on every buy using: (oldQty * oldAvg + newQty * newPrice) /
    // (oldQty + newQty)
    @Column(name = "avg_buy_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal avgBuyPrice;

    // Timestamp of first purchase — set automatically before insert
    // Used to calculate how long the position has been held
    @Column(name = "purchased_at")
    private LocalDateTime purchasedAt;

    // Runs automatically before a new holding is saved to the database
    @PrePersist
    public void prePersist() {
        this.purchasedAt = LocalDateTime.now();
    }
}
