package com.sakib_jeter.backend.external;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sakib_jeter.backend.dto.Stock;
import com.sakib_jeter.backend.entity.StockHistoryCache;
import com.sakib_jeter.backend.repository.StockHistoryCacheRepository;

// Fetches 1 year of daily OHLC stock data from Yahoo Finance
// No API key required
// Caches results in stock_history_cache table for 240 minutes
@Service
public class YahooFinanceService {

    // Injected from application.properties
    @Value("${yahoo.base.url}")
    private String baseUrl;

    @Value("${yahoo.interval}")
    private String interval;

    private final StockHistoryCacheRepository repo;
    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    public YahooFinanceService(StockHistoryCacheRepository repo) {
        this.repo = repo;
    }

    // Public method called by controller and seeder
    // Returns cached data if fresh, otherwise fetches from Yahoo
    public List<Stock> getHistory(String symbol) {
        return repo.findBySymbolAndTimeInterval(symbol, interval)
                .filter(c -> c.getExpiresAt().isAfter(LocalDateTime.now())) // check if cache is still valid
                .map(this::fromCache) // return from cache if valid
                .orElseGet(() -> fetchAndSave(symbol)); // otherwise fetch from Yahoo
    }

    // Deserialize the JSON string stored in the database back into a list of Stock
    // objects
    private List<Stock> fromCache(StockHistoryCache c) {
        try {
            return Arrays.asList(mapper.readValue(c.getHistoryJson(), Stock[].class));
        } catch (Exception e) {
            System.err.println("Cache parse error: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    // Fetch from Yahoo and save to cache before returning
    private List<Stock> fetchAndSave(String symbol) {
        List<Stock> data = fetch(symbol);
        if (!data.isEmpty())
            save(symbol, data);
        return data;
    }

    // Call Yahoo Finance API and parse the response
    // Yahoo response structure: chart -> result[0] -> timestamp + indicators ->
    // quote[0] -> ohlc
    private List<Stock> fetch(String symbol) {
        try {
            String url = baseUrl + "/" + symbol + "?interval=1d&range=1y";

            // Browser-like User-Agent header required to avoid Yahoo 429 rate limiting
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");

            Map body = rest.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Map.class).getBody();
            if (body == null)
                return List.of();

            // Navigate the nested Yahoo response
            Map chart = (Map) body.get("chart");
            List result = (List) chart.get("result");
            if (result == null || result.isEmpty())
                return List.of();

            Map data = (Map) result.get(0);

            // Timestamps are Unix epoch seconds
            List<Number> timestamps = (List<Number>) data.get("timestamp");

            // OHLC prices are nested under indicators -> quote -> first element
            Map indicators = (Map) data.get("indicators");
            Map prices = (Map) ((List) indicators.get("quote")).get(0);

            return buildStocks(timestamps, prices);

        } catch (Exception e) {
            System.err.println("Yahoo fetch failed: " + e.getMessage());
            return List.of();
        }
    }

    // Convert raw timestamp and price arrays into a list of Stock DTOs
    private List<Stock> buildStocks(List<Number> timestamps, Map prices) {
        if (timestamps == null)
            return List.of();

        List<Number> opens = (List<Number>) prices.get("open");
        List<Number> highs = (List<Number>) prices.get("high");
        List<Number> lows = (List<Number>) prices.get("low");
        List<Number> closes = (List<Number>) prices.get("close");

        List<Stock> stocks = new ArrayList<>();
        for (int i = 0; i < timestamps.size(); i++) {
            if (closes.get(i) == null)
                continue; // skip missing data points

            // Convert Unix epoch seconds to LocalDateTime
            LocalDateTime date = LocalDateTime.ofInstant(
                    Instant.ofEpochSecond(timestamps.get(i).longValue()),
                    ZoneId.systemDefault());

            double close = closes.get(i).doubleValue();

            stocks.add(new Stock(
                    date,
                    safeGet(opens, i, close),
                    safeGet(highs, i, close),
                    safeGet(lows, i, close),
                    close));
        }

        return stocks;
    }

    // Safely get a value from a list — falls back to close price if null
    private double safeGet(List<Number> list, int i, double fallback) {
        return list != null && list.get(i) != null ? list.get(i).doubleValue() : fallback;
    }

    // Serialize Stock list to JSON and save to stock_history_cache table
    private void save(String symbol, List<Stock> data) {
        try {
            // Reuse existing cache entry if present, otherwise create new one
            StockHistoryCache entry = repo
                    .findBySymbolAndTimeInterval(symbol, interval)
                    .orElse(new StockHistoryCache());

            LocalDateTime now = LocalDateTime.now();
            entry.setSymbol(symbol);
            entry.setTimeInterval(interval);
            entry.setHistoryJson(mapper.writeValueAsString(data));
            entry.setCachedAt(now);
            entry.setExpiresAt(now.plusMinutes(240));
            repo.save(entry);

        } catch (Exception e) {
            System.err.println("Cache save failed: " + e.getMessage());
        }
    }
}