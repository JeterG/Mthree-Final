package com.sakib_jeter.backend.controller;

import com.sakib_jeter.backend.entity.Watchlist;
import com.sakib_jeter.backend.repository.WatchlistRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    private final WatchlistRepository watchlistRepository;

    public WatchlistController(WatchlistRepository watchlistRepository) {
        this.watchlistRepository = watchlistRepository;
    }

    // GET /api/watchlist/{userId}
    @GetMapping("/{userId}")
    public List<Watchlist> getWatchlist(@PathVariable Long userId) {
        return watchlistRepository.findByUserId(userId);
    }

    // POST /api/watchlist
    @PostMapping
    public ResponseEntity<Watchlist> addToWatchlist(@RequestBody Map<String, Object> body) {
        Long userId   = Long.parseLong(body.get("userId").toString());
        String symbol = body.get("stockSymbol").toString();

        if (watchlistRepository.existsByUserIdAndStockSymbol(userId, symbol)) {
            return ResponseEntity.badRequest().build();
        }

        Watchlist entry = new Watchlist();
        entry.setUserId(userId);
        entry.setStockSymbol(symbol);
        return ResponseEntity.ok(watchlistRepository.save(entry));
    }

    // DELETE /api/watchlist/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable Long id) {
        watchlistRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
