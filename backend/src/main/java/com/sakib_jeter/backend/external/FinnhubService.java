package com.sakib_jeter.backend.external;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

// Direct Finnhub API calls — no caching
// Used for: live price at sell time, symbol search
// Docs: https://finnhub.io/docs/api
@Service
public class FinnhubService {

    @Value("${finnhub.api.key}")
    private String apiKey;

    @Value("${finnhub.base.url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Called only at moment of sell — returns live current price
    // Finnhub field: c = current price
    public BigDecimal getLivePrice(String symbol) {
        try {
            Map<String, Object> r = restTemplate.getForObject(
                    baseUrl + "/quote?symbol=" + symbol + "&token=" + apiKey, Map.class);
            if (r == null)
                throw new RuntimeException("No response from Finnhub");
            return new BigDecimal(r.get("c").toString());
        } catch (Exception e) {
            throw new RuntimeException("Failed to get live price for " + symbol + ": " + e.getMessage());
        }
    }

    // Returns full quote — c, o, h, l, pc fields
    public Map<String, Object> getFullQuote(String symbol) {
        try {
            return restTemplate.getForObject(
                    baseUrl + "/quote?symbol=" + symbol + "&token=" + apiKey, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get quote for " + symbol);
        }
    }

    // Symbol search autocomplete — used in buy stock component
    public List<Map<String, Object>> searchSymbol(String query) {
        try {
            Map<String, Object> r = restTemplate.getForObject(
                    baseUrl + "/search?q=" + query + "&token=" + apiKey, Map.class);
            if (r == null)
                return new ArrayList<>();
            return (List<Map<String, Object>>) r.get("result");
        } catch (Exception e) {
            System.err.println("Finnhub search failed: " + e.getMessage());
            return new ArrayList<>();
        }
    }
}