package com.sakib_jeter.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sakib_jeter.backend.entity.Holding;

// JPA repository for the holdings table
// findAll, findById, save, delete come for free from JpaRepository
public interface HoldingRepository extends JpaRepository<Holding, Long> {

    // Get all holdings for a user — used by portfolio page to show current
    // positions
    List<Holding> findByUserId(Long userId);

    // Get a specific holding by user and symbol
    // Used by buy/sell to update quantity and recalculate average buy price
    Optional<Holding> findByUserIdAndStockSymbol(Long userId, String stockSymbol);
}
