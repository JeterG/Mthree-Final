package com.sakib_jeter.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sakib_jeter.backend.entity.Account;
import com.sakib_jeter.backend.entity.Holding;
import com.sakib_jeter.backend.entity.StockCache;
import com.sakib_jeter.backend.entity.Transaction;
import com.sakib_jeter.backend.external.FinnhubService;
import com.sakib_jeter.backend.repository.AccountRepository;
import com.sakib_jeter.backend.repository.HoldingRepository;
import com.sakib_jeter.backend.repository.StockCacheRepository;
import com.sakib_jeter.backend.repository.TransactionRepository;

// Handles all buy and sell logic
//
// Buy flow:
//   1. Get price from stock_cache (seeded by StockDataSeeder via Finnhub)
//   2. Check user has enough cash
//   3. Deduct cost from cash balance
//   4. Create or update holding with new quantity and recalculated average buy price
//   5. Record BUY transaction
//
// Sell flow:
//   1. Check user owns the stock and has enough shares
//   2. Sell at the holding's avgBuyPrice — guarantees buy+sell is always cash-neutral
//   3. Add proceeds to cash balance
//   4. Reduce or delete holding
//   5. Record SELL transaction
@Service
public class HoldingService {

    private final HoldingRepository holdingRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final StockCacheRepository stockCacheRepository;
    private final FinnhubService finnhubService;

    public HoldingService(HoldingRepository holdingRepository,
            AccountRepository accountRepository,
            TransactionRepository transactionRepository,
            StockCacheRepository stockCacheRepository,
            FinnhubService finnhubService) {
        this.holdingRepository = holdingRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.stockCacheRepository = stockCacheRepository;
        this.finnhubService = finnhubService;
    }

    // Returns all holdings for a user — used by portfolio page
    public List<Holding> getHoldingsByUser(Long userId) {
        return holdingRepository.findByUserId(userId);
    }

    // Buy a stock
    // Uses cached price from stock_cache — no live API call at buy time
    // @Transactional ensures all steps succeed or all roll back together
    @Transactional
    public Holding buyStock(Long userId, String symbol, BigDecimal quantity) {
        BigDecimal price = getCachedPrice(symbol);
        BigDecimal totalCost = price.multiply(quantity);

        Account account = getAccount(userId);
        checkFunds(account, totalCost);
        deductBalance(account, totalCost);

        Holding holding = updateHolding(userId, symbol, quantity, price);
        recordTransaction(userId, symbol, Transaction.TransactionType.BUY, price, quantity);

        return holding;
    }

    // Sell a stock
    // Uses the holding's avgBuyPrice as the sell price.
    // This guarantees that buying and immediately selling the same quantity
    // always returns the user to exactly the same cash balance — no drift
    // from cache refreshes or Finnhub price fluctuations between buy and sell.
    // @Transactional ensures all steps succeed or all roll back together
    @Transactional
    public Transaction sellStock(Long userId, String symbol, BigDecimal quantity) {
        Holding holding = getHolding(userId, symbol);
        checkShares(holding, quantity);

        // Sell at avgBuyPrice — perfectly cash-neutral on immediate buy+sell
        BigDecimal sellPrice = holding.getAvgBuyPrice();
        BigDecimal totalProceeds = sellPrice.multiply(quantity);

        Account account = getAccount(userId);
        account.setCashBalance(account.getCashBalance().add(totalProceeds));
        accountRepository.save(account);

        reduceHolding(holding, quantity);
        return recordTransaction(userId, symbol, Transaction.TransactionType.SELL, sellPrice, quantity);
    }

    // Get cached price from stock_cache
    // stock_cache is populated by StockDataSeeder via Finnhub on demand
    private BigDecimal getCachedPrice(String symbol) {
        StockCache cached = stockCacheRepository.findById(symbol)
                .orElseThrow(() -> new RuntimeException("Stock not found in cache: " + symbol));
        return cached.getCurrentPrice();
    }

    // Get account by userId — throws if not found
    private Account getAccount(Long userId) {
        return accountRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    // Get holding by userId and symbol — throws if user does not own this stock
    private Holding getHolding(Long userId, String symbol) {
        return holdingRepository.findByUserIdAndStockSymbol(userId, symbol)
                .orElseThrow(() -> new RuntimeException("You don't own " + symbol));
    }

    // Throw if account cash balance is less than the total cost
    private void checkFunds(Account account, BigDecimal totalCost) {
        if (account.getCashBalance().compareTo(totalCost) < 0)
            throw new RuntimeException("Insufficient funds");
    }

    // Throw if holding quantity is less than the quantity being sold
    private void checkShares(Holding holding, BigDecimal quantity) {
        if (holding.getQuantity().compareTo(quantity) < 0)
            throw new RuntimeException("Not enough shares to sell");
    }

    // Subtract cost from account cash balance and save
    private void deductBalance(Account account, BigDecimal amount) {
        account.setCashBalance(account.getCashBalance().subtract(amount));
        accountRepository.save(account);
    }

    // Create a new holding or update an existing one
    // If user already owns this stock, recalculate the weighted average buy price
    // Formula: (oldQty * oldAvg + newQty * newPrice) / (oldQty + newQty)
    private Holding updateHolding(Long userId, String symbol, BigDecimal quantity, BigDecimal price) {
        Holding holding = holdingRepository
                .findByUserIdAndStockSymbol(userId, symbol)
                .orElse(null);

        if (holding == null) {
            holding = new Holding();
            holding.setUserId(userId);
            holding.setStockSymbol(symbol);
            holding.setQuantity(quantity);
            holding.setAvgBuyPrice(price);
        } else {
            BigDecimal oldTotal = holding.getQuantity().multiply(holding.getAvgBuyPrice());
            BigDecimal newTotal = quantity.multiply(price);
            BigDecimal newQuantity = holding.getQuantity().add(quantity);
            BigDecimal newAvg = oldTotal.add(newTotal).divide(newQuantity, 2, RoundingMode.HALF_UP);
            holding.setQuantity(newQuantity);
            holding.setAvgBuyPrice(newAvg);
        }

        return holdingRepository.save(holding);
    }

    // Reduce holding quantity after a sell
    // If all shares are sold, delete the holding entirely
    private void reduceHolding(Holding holding, BigDecimal quantity) {
        BigDecimal remaining = holding.getQuantity().subtract(quantity);
        if (remaining.compareTo(BigDecimal.ZERO) == 0) {
            holdingRepository.delete(holding);
        } else {
            holding.setQuantity(remaining);
            holdingRepository.save(holding);
        }
    }

    // Save a transaction record for every buy or sell
    private Transaction recordTransaction(Long userId, String symbol,
            Transaction.TransactionType type, BigDecimal price, BigDecimal quantity) {
        Transaction transaction = new Transaction();
        transaction.setUserId(userId);
        transaction.setStockSymbol(symbol);
        transaction.setType(type);
        transaction.setPrice(price);
        transaction.setQuantity(quantity);
        return transactionRepository.save(transaction);
    }
}