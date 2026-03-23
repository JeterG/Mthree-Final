package com.sakib_jeter.backend.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sakib_jeter.backend.entity.Holding;
import com.sakib_jeter.backend.entity.Transaction;
import com.sakib_jeter.backend.entity.User;
import com.sakib_jeter.backend.repository.UserRepository;
import com.sakib_jeter.backend.service.HoldingService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Holding Controller", description = "Manage stock holdings")
@RestController
@RequestMapping("/api/holdings")
public class HoldingController {

    private final HoldingService holdingService;
    private final UserRepository userRepository;

    public HoldingController(HoldingService holdingService, UserRepository userRepository) {
        this.holdingService = holdingService;
        this.userRepository = userRepository;
    }

    // ✅ NEW JWT endpoint
    @Operation(summary = "Get current user's holdings")
    @GetMapping("/me")
    public List<Holding> getMyHoldings(Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return holdingService.getHoldingsByUser(user.getId());
    }

    // (optional: keep for admin/testing)
    @GetMapping("/{userId}")
    public List<Holding> getHoldings(@PathVariable Long userId) {
        return holdingService.getHoldingsByUser(userId);
    }

    @PostMapping("/buy")
    public ResponseEntity<Holding> buy(@RequestBody Map<String, Object> body,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String symbol = body.get("stockSymbol").toString().toUpperCase();
        BigDecimal quantity = new BigDecimal(body.get("quantity").toString());

        return ResponseEntity.ok(
                holdingService.buyStock(user.getId(), symbol, quantity));
    }

    @PostMapping("/sell")
    public ResponseEntity<Transaction> sell(@RequestBody Map<String, Object> body,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String symbol = body.get("stockSymbol").toString().toUpperCase();
        BigDecimal quantity = new BigDecimal(body.get("quantity").toString());

        return ResponseEntity.ok(
                holdingService.sellStock(user.getId(), symbol, quantity));
    }
}