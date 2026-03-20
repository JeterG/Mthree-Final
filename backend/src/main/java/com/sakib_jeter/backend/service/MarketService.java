package com.sakib_jeter.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import com.sakib_jeter.backend.entity.StockCache;
import com.sakib_jeter.backend.repository.StockCacheRepository;
import org.springframework.web.client.RestTemplate;
@Service
public class MarketService {

    private final StockCacheRepository stockCacheRepository;

    @Value("${finnhub.api.key}")
    private String finnhubKey;
    // Stocks shown in the ticker
    private static final String[] TICKER_SYMBOLS = {
            "AAPL", "AMZN", "GOOGL", "JPM", "META", "MSFT", "NVDA", "TSLA", "V", "WMT"
    };

    public MarketService(StockCacheRepository stockCacheRepository) {
        this.stockCacheRepository = stockCacheRepository;
    }

    // Read from cache only — cache is populated by the seed endpoint
    public StockCache getOrFetch(String symbol) {
        return stockCacheRepository.findById(symbol).orElse(null);
    }

    // Returns all cached stocks — used by buy stock search dropdown
    public List<StockCache> getAllCachedStocks() {
        return stockCacheRepository.findAll();
    }

    // Ticker data — reads from cache only, never calls Finnhub
    public List<Map<String, Object>> getMostActiveStocks() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (String symbol : TICKER_SYMBOLS) {
            Optional<StockCache> cached = stockCacheRepository.findById(symbol);
            if (cached.isPresent()) {
                result.add(buildTicker(cached.get()));
            }
        }
        return result;
    }

    // Build ticker map from stock cache entry
    private Map<String, Object> buildTicker(StockCache stock) {
        BigDecimal current = stock.getCurrentPrice();
        BigDecimal open = stock.getOpenPrice() != null ? stock.getOpenPrice() : current;
        BigDecimal change = current.subtract(open);
        BigDecimal pct = open.signum() != 0
                ? change.divide(open, 2, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        Map<String, Object> ticker = new HashMap<>();
        ticker.put("symbol", stock.getSymbol());
        ticker.put("name", stock.getSymbol());
        ticker.put("price", current);
        ticker.put("change", change);
        ticker.put("changesPercentage", pct);
        return ticker;
    }
    public Map<String, Object> getStockDetails(String symbol) {
    RestTemplate restTemplate = new RestTemplate();

    // 🔹 QUOTE (daily stats)
    String quoteUrl = "https://finnhub.io/api/v1/quote?symbol=" + symbol + "&token=" + finnhubKey;
    Map<String, Object> quote = restTemplate.getForObject(quoteUrl, Map.class);

    // 🔹 METRICS (key stats)
    String metricUrl = "https://finnhub.io/api/v1/stock/metric?symbol=" + symbol + "&metric=all&token=" + finnhubKey;
    Map<String, Object> metricResponse = restTemplate.getForObject(metricUrl, Map.class);

    // 🔹 PROFILE (basic info)
    String profileUrl = "https://finnhub.io/api/v1/stock/profile2?symbol=" + symbol + "&token=" + finnhubKey;
    Map<String, Object> profile = restTemplate.getForObject(profileUrl, Map.class);

    Map<String, Object> result = new HashMap<>();
    result.put("quote", quote);
Map<String, Object> metrics = null;
if (metricResponse != null && metricResponse.get("metric") != null) {
    metrics = (Map<String, Object>) metricResponse.get("metric");
}

result.put("metrics", metrics);    result.put("profile", profile);

    return result;
}

    
}