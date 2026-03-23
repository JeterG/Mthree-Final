package com.sakib_jeter.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stock_history_cache")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockHistoryCache {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String symbol;
    @Column(name = "time_interval", nullable = false)
    private String timeInterval;
    @Column(columnDefinition = "LONGTEXT")
    private String historyJson;
    @Column(name = "cached_at")
    private LocalDateTime cachedAt;
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}
