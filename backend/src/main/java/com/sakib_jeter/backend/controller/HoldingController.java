package com.sakib_jeter.backend.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sakib_jeter.backend.entity.Holding;
import com.sakib_jeter.backend.entity.Transaction;
import com.sakib_jeter.backend.service.HoldingService;

// REST controller for holding operations
// Endpoints:
//   GET  /api/holdings/{userId}  — get all holdings for a user
//   POST /api/holdings/buy       — buy a stock
//   POST /api/holdings/sell      — sell a stock
@RestController
@RequestMapping("/api/holdings")
public class HoldingController {

    private final HoldingService holdingService;

    public HoldingController(HoldingService holdingService) {
        this.holdingService = holdingService;
    }

    // Returns all current holdings for a user
    // Used by the portfolio page to show positions, quantities, and gain/loss
    @GetMapping("/{userId}")
    public List<Holding> getHoldings(@PathVariable Long userId) {
        return holdingService.getHoldingsByUser(userId);
    }

    // Buy a stock
    // Request body: { userId, stockSymbol, quantity }
    // Price is pulled from stock_cache — no live API call at buy time
    @PostMapping("/buy")
    public ResponseEntity<Holding> buy(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String symbol = body.get("stockSymbol").toString().toUpperCase();
        BigDecimal quantity = new BigDecimal(body.get("quantity").toString());
        return ResponseEntity.ok(holdingService.buyStock(userId, symbol, quantity));
    }

    // Sell a stock
    // Request body: { userId, stockSymbol, quantity }
    // Price is fetched live from Finnhub at exact moment of sale
    @PostMapping("/sell")
    public ResponseEntity<Transaction> sell(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String symbol = body.get("stockSymbol").toString().toUpperCase();
        BigDecimal quantity = new BigDecimal(body.get("quantity").toString());
        return ResponseEntity.ok(holdingService.sellStock(userId, symbol, quantity));
    }
}
