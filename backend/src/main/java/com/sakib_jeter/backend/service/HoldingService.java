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

    public List<Holding> getHoldingsByUser(Long userId) {
        return holdingRepository.findByUserId(userId);
    }

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

    @Transactional
    public Transaction sellStock(Long userId, String symbol, BigDecimal quantity) {
        Holding holding = getHolding(userId, symbol);
        checkShares(holding, quantity);

        BigDecimal sellPrice = holding.getAvgBuyPrice();
        BigDecimal totalProceeds = sellPrice.multiply(quantity);

        Account account = getAccount(userId);
        account.setCashBalance(account.getCashBalance().add(totalProceeds));
        accountRepository.save(account);

        reduceHolding(holding, quantity);
        return recordTransaction(userId, symbol, Transaction.TransactionType.SELL, sellPrice, quantity);
    }

    private BigDecimal getCachedPrice(String symbol) {
        StockCache cached = stockCacheRepository.findById(symbol)
                .orElseThrow(() -> new RuntimeException("Stock not found in cache: " + symbol));
        return cached.getCurrentPrice();
    }

    private Account getAccount(Long userId) {
        return accountRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    private Holding getHolding(Long userId, String symbol) {
        return holdingRepository.findByUserIdAndStockSymbol(userId, symbol)
                .orElseThrow(() -> new RuntimeException("You don't own " + symbol));
    }

    private void checkFunds(Account account, BigDecimal totalCost) {
        if (account.getCashBalance().compareTo(totalCost) < 0)
            throw new RuntimeException("Insufficient funds");
    }

    private void checkShares(Holding holding, BigDecimal quantity) {
        if (holding.getQuantity().compareTo(quantity) < 0)
            throw new RuntimeException("Not enough shares to sell");
    }

    private void deductBalance(Account account, BigDecimal amount) {
        account.setCashBalance(account.getCashBalance().subtract(amount));
        accountRepository.save(account);
    }

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

    private void reduceHolding(Holding holding, BigDecimal quantity) {
        BigDecimal remaining = holding.getQuantity().subtract(quantity);
        if (remaining.compareTo(BigDecimal.ZERO) == 0) {
            holdingRepository.delete(holding);
        } else {
            holding.setQuantity(remaining);
            holdingRepository.save(holding);
        }
    }

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