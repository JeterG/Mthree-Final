package com.sakib_jeter.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sakib_jeter.backend.entity.StockHistoryCache;

public interface StockHistoryCacheRepository extends JpaRepository<StockHistoryCache, Long> {
    Optional<StockHistoryCache> findBySymbolAndTimeInterval(String symbol, String timeInterval);
}
