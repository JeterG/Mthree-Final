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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Market Controller", description = "Market data APIs")
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

    @Operation(summary = "Get ticker data")
    @GetMapping("/ticker")
    public List<Map<String, Object>> getTicker() {
        return marketService.getMostActiveStocks();
    }

    @Operation(summary = "Search stocks")
    @GetMapping("/search")
    public List<Map<String, Object>> search(@RequestParam String q) {
        return finnhubService.searchSymbol(q);
    }

    @Operation(summary = "Get stock history")
    @GetMapping("/history/{symbol}")
    public List<Stock> getHistory(@PathVariable String symbol) {
        return yahooService.getHistory(symbol.toUpperCase());
    }

    @Operation(summary = "Seed stock prices")
    @GetMapping("/seed")
    public String seed() {
        new Thread(() -> stockDataSeeder.seedAll()).start();
        return "Price seeding started in background";
    }

    @Operation(summary = "Seed stock history")
    @GetMapping("/seed/history")
    public String seedHistory() {
        stockDataSeeder.seedHistory();
        return "History seeding started in background";
    }

    @Operation(summary = "Get cached stocks")
    @GetMapping("/cached")
    public List<StockCache> getCachedStocks() {
        return marketService.getAllCachedStocks();
    }

    @Operation(summary = "Get stock quote")
    @GetMapping("/quote/{symbol}")
    public ResponseEntity<StockCache> getStock(@PathVariable String symbol) {
        StockCache stock = marketService.getOrFetch(symbol.toUpperCase());
        return stock != null
                ? ResponseEntity.ok(stock)
                : ResponseEntity.notFound().build();
    }
}