package com.sakib_jeter.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;

@Entity
@Table(name = "stock_cache")
@Data
@AllArgsConstructor
public class StockCache {
    

    @Id
    private String symbol;

    @Column(name = "current_price", precision = 10, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "open_price", precision = 10, scale = 2)
    private BigDecimal openPrice;

    @Column(name = "high_price", precision = 10, scale = 2)
    private BigDecimal highPrice;

    @Column(name = "low_price", precision = 10, scale = 2)
    private BigDecimal lowPrice;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public StockCache() {
    }
}
