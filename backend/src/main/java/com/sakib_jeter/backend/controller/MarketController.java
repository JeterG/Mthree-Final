package com.sakib_jeter.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sakib_jeter.backend.dto.Stock;
import com.sakib_jeter.backend.entity.StockCache;
import com.sakib_jeter.backend.external.FinnhubService;
import com.sakib_jeter.backend.external.StockDataSeeder;
import com.sakib_jeter.backend.external.YahooFinanceService;
import com.sakib_jeter.backend.service.MarketService;

@RestController
@RequestMapping("/api/market")
@CrossOrigin(origins = "http://localhost:4200")
public class MarketController {

    private final MarketService marketService;
    private final FinnhubService finnhubService;
    private final YahooFinanceService yahooService;
    private final StockDataSeeder stockDataSeeder;

    public MarketController(MarketService marketService,
            FinnhubService finnhubService,
            YahooFinanceService yahooService,
            StockDataSeeder stockDataSeeder) {
        this.marketService = marketService;
        this.finnhubService = finnhubService;
        this.yahooService = yahooService;
        this.stockDataSeeder = stockDataSeeder;
    }

    // Ticker marquee — reads from cache only
    @GetMapping("/ticker")
    public List<Map<String, Object>> getTicker() {
        return marketService.getMostActiveStocks();
    }

    // Symbol search via Finnhub
    @GetMapping("/search")
    public List<Map<String, Object>> search(@RequestParam String q) {
        return finnhubService.searchSymbol(q);
    }

    // Historical candle data via Yahoo Finance
    @GetMapping("/history/{symbol}")
    public List<Stock> getHistory(@PathVariable String symbol) {
        return yahooService.getHistory(symbol.toUpperCase());
    }

    // Seed live prices for all stocks via Finnhub
    @GetMapping("/seed")
    public String seed() {
        new Thread(() -> stockDataSeeder.seedAll()).start();
        return "Price seeding started in background";
    }

    // Seed yearly history for all stocks via Yahoo Finance
    @GetMapping("/seed/history")
    public String seedHistory() {
        stockDataSeeder.seedHistory();
        return "History seeding started in background";
    }

    // Returns all cached stocks — used by buy stock component
    @GetMapping("/cached")
    public List<StockCache> getCachedStocks() {
        return marketService.getAllCachedStocks();
    }

    // Get single stock price from cache — MUST be last mapping
    @GetMapping("/quote/{symbol}")
    public ResponseEntity<StockCache> getStock(@PathVariable String symbol) {
        StockCache stock = marketService.getOrFetch(symbol.toUpperCase());
        return stock != null
                ? ResponseEntity.ok(stock)
                : ResponseEntity.notFound().build();
    }
    
}