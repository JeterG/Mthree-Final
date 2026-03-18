package com.sakib_jeter.backend.repository;

import com.sakib_jeter.backend.entity.StockCache;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockCacheRepository extends JpaRepository<StockCache, String> {
    // findById(symbol) inherited from JpaRepository
}
