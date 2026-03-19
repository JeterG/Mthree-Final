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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Holding Controller", description = "Manage stock holdings")
@RestController
@RequestMapping("/api/holdings")
public class HoldingController {

    private final HoldingService holdingService;

    public HoldingController(HoldingService holdingService) {
        this.holdingService = holdingService;
    }

    @Operation(summary = "Get user holdings")
    @GetMapping("/{userId}")
    public List<Holding> getHoldings(@PathVariable Long userId) {
        return holdingService.getHoldingsByUser(userId);
    }

    @Operation(summary = "Buy stock")
    @PostMapping("/buy")
    public ResponseEntity<Holding> buy(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String symbol = body.get("stockSymbol").toString().toUpperCase();
        BigDecimal quantity = new BigDecimal(body.get("quantity").toString());
        return ResponseEntity.ok(holdingService.buyStock(userId, symbol, quantity));
    }

    @Operation(summary = "Sell stock")
    @PostMapping("/sell")
    public ResponseEntity<Transaction> sell(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String symbol = body.get("stockSymbol").toString().toUpperCase();
        BigDecimal quantity = new BigDecimal(body.get("quantity").toString());
        return ResponseEntity.ok(holdingService.sellStock(userId, symbol, quantity));
    }
}