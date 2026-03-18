package com.sakib_jeter.backend.controller;

import com.sakib_jeter.backend.service.MarketService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/market")
@CrossOrigin(origins = "http://localhost:4200")
public class MarketController {

    private final MarketService service;

    public MarketController(MarketService service) {
        this.service = service;
    }

    // ✅ QUOTE
    @GetMapping("/{symbol}")
    public ResponseEntity<?> getQuote(@PathVariable String symbol) {
        return ResponseEntity.ok(service.getQuote(symbol));
    }

    // 🔥 REAL-TIME CHART
    @GetMapping("/chart/{symbol}")
    public ResponseEntity<?> getChart(@PathVariable String symbol) {
        return ResponseEntity.ok(service.getRealtimeChart(symbol));
    }
}