package com.sakib_jeter.backend.repository;
import com.sakib_jeter.backend.entity.StockHistoryCache;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StockHistoryCacheRepository extends JpaRepository<StockHistoryCache, Long> {
    Optional<StockHistoryCache> findBySymbolAndTimeInterval(String symbol, String timeInterval);
}
