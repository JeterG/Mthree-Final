package com.sakib_jeter.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class MarketService {

    private final String FINNHUB_KEY = "d6tbgghr01qhkb43ge2gd6tbgghr01qhkb43ge30";

    // 🔥 REAL-TIME STORAGE
    private final Map<String, List<Double>> priceHistory = new HashMap<>();
    private final Map<String, List<Long>> timeHistory = new HashMap<>();

    // ✅ QUOTE (unchanged)
    public Map<String, Object> getQuote(String symbol) {
        RestTemplate restTemplate = new RestTemplate();

        String url = "https://finnhub.io/api/v1/quote?symbol=" + symbol + "&token=" + FINNHUB_KEY;

        try {
            return restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("error", "quote_failed");
        }
    }

    // 🔥 REAL-TIME CHART (QUOTE-BASED)
    public Map<String, Object> getRealtimeChart(String symbol) {

        Map<String, Object> quote = getQuote(symbol);

        if (quote == null || quote.get("c") == null) {
            return Map.of("s", "error");
        }

        double currentPrice = ((Number) quote.get("c")).doubleValue();
        long now = System.currentTimeMillis();

        priceHistory.putIfAbsent(symbol, new ArrayList<>());
        timeHistory.putIfAbsent(symbol, new ArrayList<>());

        List<Double> prices = priceHistory.get(symbol);
        List<Long> times = timeHistory.get(symbol);

        // 🔥 avoid duplicate spam (only every ~10s)
        if (times.isEmpty() || now - times.get(times.size() - 1) > 9000) {
            prices.add(currentPrice);
            times.add(now);
        }

        // 🔥 keep last 100 points max
        if (prices.size() > 100) {
            prices.remove(0);
            times.remove(0);
        }

        return Map.of(
                "s", "ok",
                "c", prices,
                "t", times
        );
    }
}