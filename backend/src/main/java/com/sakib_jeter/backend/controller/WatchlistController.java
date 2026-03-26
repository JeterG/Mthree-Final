package com.sakib_jeter.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sakib_jeter.backend.entity.User;
import com.sakib_jeter.backend.entity.Watchlist;
import com.sakib_jeter.backend.repository.UserRepository;
import com.sakib_jeter.backend.repository.WatchlistRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Watchlist Controller", description = "Manage user watchlists")
@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    private final WatchlistRepository watchlistRepository;
    private final UserRepository userRepository;

    public WatchlistController(WatchlistRepository watchlistRepository,
            UserRepository userRepository) {
        this.watchlistRepository = watchlistRepository;
        this.userRepository = userRepository;
    }

    @Operation(summary = "Get current user's watchlist")
    @GetMapping("/me")
    public List<Watchlist> getMyWatchlist(Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return watchlistRepository.findByUserId(user.getId());
    }

    @Operation(summary = "Get watchlist by user")
    @GetMapping("/{userId}")
    public List<Watchlist> getWatchlist(@PathVariable Long userId) {
        return watchlistRepository.findByUserId(userId);
    }

    @Operation(summary = "Add stock to watchlist")
    @PostMapping
    public ResponseEntity<Watchlist> addToWatchlist(@RequestBody Map<String, Object> body,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String symbol = body.get("stockSymbol").toString().toUpperCase();

        if (watchlistRepository.existsByUserIdAndStockSymbol(user.getId(), symbol)) {
            return ResponseEntity.badRequest().build();
        }

        Watchlist entry = new Watchlist();
        entry.setUserId(user.getId());
        entry.setStockSymbol(symbol);

        return ResponseEntity.ok(watchlistRepository.save(entry));
    }

    @Operation(summary = "Remove from watchlist")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable Long id) {
        watchlistRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

}