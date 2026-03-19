package com.sakib_jeter.backend.repository;

import com.sakib_jeter.backend.entity.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {
    List<Watchlist> findByUserId(Long userId);
    Optional<Watchlist> findByUserIdAndStockSymbol(Long userId, String stockSymbol);
    boolean existsByUserIdAndStockSymbol(Long userId, String stockSymbol);
}
