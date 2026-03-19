package com.sakib_jeter.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sakib_jeter.backend.entity.Watchlist;
import com.sakib_jeter.backend.repository.WatchlistRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Watchlist Controller", description = "Manage user watchlists")
@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    private final WatchlistRepository watchlistRepository;

    public WatchlistController(WatchlistRepository watchlistRepository) {
        this.watchlistRepository = watchlistRepository;
    }

    @Operation(summary = "Get watchlist by user")
    @GetMapping("/{userId}")
    public List<Watchlist> getWatchlist(@PathVariable Long userId) {
        return watchlistRepository.findByUserId(userId);
    }

    @Operation(summary = "Add stock to watchlist")
    @PostMapping
    public ResponseEntity<Watchlist> addToWatchlist(@RequestBody Map<String, Object> body) {
        Long userId = Long.parseLong(body.get("userId").toString());
        String symbol = body.get("stockSymbol").toString();

        if (watchlistRepository.existsByUserIdAndStockSymbol(userId, symbol)) {
            return ResponseEntity.badRequest().build();
        }

        Watchlist entry = new Watchlist();
        entry.setUserId(userId);
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