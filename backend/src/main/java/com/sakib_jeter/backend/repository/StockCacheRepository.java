package com.sakib_jeter.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sakib_jeter.backend.entity.StockCache;

public interface StockCacheRepository extends JpaRepository<StockCache, String> {
    // findById(symbol) inherited from JpaRepository
}
