package com.sakib_jeter.backend.external;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.sakib_jeter.backend.entity.StockCache;
import com.sakib_jeter.backend.repository.StockCacheRepository;

@Service
public class StockDataSeeder {

    @Value("${finnhub.api.key}")
    private String finnhubKey;

    @Value("${finnhub.base.url}")
    private String finnhubUrl;

    private final StockCacheRepository stockCacheRepository;
    private final YahooFinanceService yahooFinanceService;
    private final RestTemplate restTemplate = new RestTemplate();

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

    public StockCache fetchQuote(String symbol) {
        try {
            String url = finnhubUrl + "/quote?symbol=" + symbol + "&token=" + finnhubKey;
            Map<String, Object> r = restTemplate.getForObject(url, Map.class);
            if (r == null)
                return null;

            BigDecimal current = toBD(r.get("c"));
            BigDecimal prevClose = toBD(r.get("pc"));

            if (current.compareTo(BigDecimal.ZERO) == 0)
                current = prevClose;
            if (current.compareTo(BigDecimal.ZERO) == 0)
                return null;

            BigDecimal open = toBD(r.get("o"));
            if (open.compareTo(BigDecimal.ZERO) == 0)
                open = prevClose;

            // Finnhub "v" = current day volume
            Long volume = toLong(r.get("v"));

            String companyName = getCompanyName(symbol);

            return new StockCache(
                    symbol,
                    companyName,
                    current,
                    open,
                    toBD(r.get("h")),
                    toBD(r.get("l")),
                    LocalDateTime.now(),
                    volume);

        } catch (Exception e) {
            System.err.println("Finnhub seed failed for " + symbol + ": " + e.getMessage());
            return null;
        }
    }

    private BigDecimal toBD(Object v) {
        if (v == null)
            return BigDecimal.ZERO;
        try {
            return new BigDecimal(v.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private Long toLong(Object v) {
        if (v == null)
            return 0L;
        try {
            return ((Number) v).longValue();
        } catch (Exception e) {
            return 0L;
        }
    }

    private String getCompanyName(String symbol) {
        try {
            String url = finnhubUrl + "/stock/profile2?symbol=" + symbol + "&token=" + finnhubKey;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("name") != null) {
                return response.get("name").toString();
            }
        } catch (Exception e) {
            System.out.println("Failed to fetch name for " + symbol);
        }
        return symbol;
    }
}