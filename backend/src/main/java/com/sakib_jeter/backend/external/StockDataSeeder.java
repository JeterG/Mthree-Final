package com.sakib_jeter.backend.external;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.sakib_jeter.backend.entity.StockCache;
import com.sakib_jeter.backend.repository.StockCacheRepository;

// Seeds stock_cache and stock_history_cache tables
// stock_cache         — live prices via Finnhub API (docs: https://finnhub.io/docs/api/quote)
// stock_history_cache — 1 year daily OHLC data via Yahoo Finance
@Service
public class StockDataSeeder {

    @Value("${finnhub.api.key}")
    private String finnhubKey;

    @Value("${finnhub.base.url}")
    private String finnhubUrl;

    private final StockCacheRepository stockCacheRepository;
    private final YahooFinanceService yahooFinanceService;
    private final RestTemplate restTemplate = new RestTemplate();

    // All symbols seeded into both tables
    private static final String[] SYMBOLS = {
            "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "ORCL",
            "INTC", "AMD", "QCOM", "ADBE", "CRM", "NFLX", "UBER", "PYPL",
            "CSCO", "IBM", "TXN", "AVGO", "MU", "AMAT",
            "JPM", "BAC", "WFC", "GS", "MS", "C", "AXP", "V", "MA", "BLK",
            "SCHW", "COF", "USB", "PNC", "AIG", "MET", "PRU",
            "WMT", "TGT", "COST", "HD", "LOW", "MCD", "SBUX", "NKE", "DIS",
            "EBAY", "ETSY", "BBY", "DG", "DLTR",
            "JNJ", "PFE", "MRK", "ABBV", "UNH", "CVS", "BMY", "AMGN",
            "GILD", "BIIB", "REGN", "VRTX", "ZTS", "MDT",
            "XOM", "CVX", "COP", "EOG", "SLB", "HAL", "MPC", "VLO",
            "SPY", "QQQ", "DIA", "IWM", "VTI", "VOO", "GLD",
            "PLTR", "SNOW", "DDOG", "NET", "ZS", "CRWD", "OKTA", "PANW",
            "SHOP", "SQ", "COIN", "SOFI", "AFRM", "ZM", "DOCU", "TWLO",
            "MDB", "HUBS", "ABNB", "DASH", "LYFT", "RBLX",
            "F", "GM", "RIVN", "NIO",
            "BA", "RTX", "LMT", "NOC", "GD",
            "GE", "HON", "MMM", "CAT", "DE",
            "T", "VZ", "TMUS", "CMCSA",
            "NEE", "DUK", "SO", "AEP",
            "AMT", "PLD", "EQIX", "PSA", "O"
    };

    public StockDataSeeder(StockCacheRepository stockCacheRepository,
            YahooFinanceService yahooFinanceService) {
        this.stockCacheRepository = stockCacheRepository;
        this.yahooFinanceService = yahooFinanceService;
    }

    // Seed live prices into stock_cache via Finnhub
    // Free tier rate limit is 60 requests per minute so we sleep 1100ms between
    // calls
    public int seedAll() {
        int count = 0;
        for (String symbol : SYMBOLS) {
            try {
                StockCache stock = fetchQuote(symbol);
                if (stock != null) {
                    stockCacheRepository.save(stock);
                    count++;
                    System.out.println("Seeded: " + symbol + " @ $" + stock.getCurrentPrice());
                }
                Thread.sleep(1100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                System.err.println("Seed failed for " + symbol + ": " + e.getMessage());
            }
        }
        return count;
    }

    // Seed yearly history into stock_history_cache via Yahoo Finance
    // Runs in a background thread so it does not block HTTP requests
    public void seedHistory() {
        new Thread(() -> {
            for (String symbol : SYMBOLS) {
                try {
                    yahooFinanceService.getHistory(symbol);
                    System.out.println("History seeded: " + symbol);
                    Thread.sleep(1000);
                } catch (Exception e) {
                    System.err.println("History seed failed for " + symbol + ": " + e.getMessage());
                }
            }
            System.out.println("History seeding complete for " + SYMBOLS.length + " stocks");
        }).start();
    }

    // Fetch a single quote from Finnhub
    // Finnhub returns 0 for current price (c) when market is closed
    // so we fall back to previous close (pc) in that case
    public StockCache fetchQuote(String symbol) {
        try {
            String url = finnhubUrl + "/quote?symbol=" + symbol + "&token=" + finnhubKey;
            Map<String, Object> r = restTemplate.getForObject(url, Map.class);
            if (r == null)
                return null;

            BigDecimal current = toBD(r.get("c"));
            BigDecimal prevClose = toBD(r.get("pc"));

            // Fall back to previous close if market is closed
            if (current.compareTo(BigDecimal.ZERO) == 0)
                current = prevClose;
            if (current.compareTo(BigDecimal.ZERO) == 0)
                return null;

            BigDecimal open = toBD(r.get("o"));
            if (open.compareTo(BigDecimal.ZERO) == 0)
                open = prevClose;

            return new StockCache(symbol, current, open, toBD(r.get("h")), toBD(r.get("l")), LocalDateTime.now());

        } catch (Exception e) {
            System.err.println("Finnhub seed failed for " + symbol + ": " + e.getMessage());
            return null;
        }
    }

    // Safely convert Finnhub response value to BigDecimal
    // Finnhub returns numbers as Double — BigDecimal is needed for financial
    // precision
    private BigDecimal toBD(Object v) {
        if (v == null)
            return BigDecimal.ZERO;
        try {
            return new BigDecimal(v.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}