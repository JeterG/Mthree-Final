import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BuyComponent } from '../buy-component/buy-component';
import { ApiService } from '../services/api.services';
import { StockChartComponent } from '../stock-chart.component/stock-chart.component';
import { StockSearchComponent } from '../stock-search-component/stock-search-component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, StockSearchComponent, StockChartComponent, BuyComponent, FormsModule],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css',
})
export class Portfolio implements OnInit {
  Math = Math;
  selectedSymbol = 'TSLA';
  activeTab: 'holdings' | 'transactions' | 'watchlist' | 'analytics' = 'holdings';
  refreshTrigger = 0; // increments to force buy component to refresh

  cashBalance = 0;
  holdingsValue = 0;
  totalPortfolioValue = 0;
  totalGainLoss = 0;
  holdingsCount = 0;
  holdings: any[] = [];
  transactions: any[] = [];
  watchlist: any[] = [];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadPortfolio();
    this.loadTransactions();
    this.loadWatchlist();
    setTimeout(() => this.loadPortfolio(), 1000);
    setTimeout(() => this.loadTransactions(), 1000);
    setTimeout(() => this.loadWatchlist(), 1000);
  }

  onSymbolSelected(symbol: string): void {
    this.selectedSymbol = symbol;
  }

  loadPortfolio(): void {
    this.loadAccount();
  }

  loadAccount(): void {
    this.api.get<any>(`/api/account/me`).subscribe({
      next: (account) => {
        this.ngZone.run(() => {
          this.cashBalance = account.cashBalance;
          this.cdr.detectChanges();
        });
        this.loadHoldings();
      },
      error: (err) => console.error('Account load error:', err),
    });
  }

  loadHoldings(): void {
    this.api.get<any[]>(`/api/holdings/me`).subscribe({
      next: (holdings) => {
        if (holdings.length === 0) {
          this.ngZone.run(() => {
            this.holdings = [];
            this.holdingsCount = 0;
            this.holdingsValue = 0;
            this.totalGainLoss = 0;
            this.totalPortfolioValue = 0;
            this.cdr.detectChanges();
          });
          return;
        }

        const enriched: any[] = new Array(holdings.length);
        let completed = 0;
        let totalValue = 0;
        let totalGain = 0;

        holdings.forEach((h, index) => {
          this.api.get<any>(`/api/market/quote/${h.stockSymbol}`).subscribe({
            next: (stock) => {
              const currentPrice = +stock.currentPrice;
              const currentValue = currentPrice * +h.quantity;
              const costBasis = +h.avgBuyPrice * +h.quantity;
              const gainLoss = currentValue - costBasis;
              totalValue += currentValue;
              totalGain += gainLoss;
              enriched[index] = { ...h, currentPrice, currentValue, gainLoss };
              completed++;
              if (completed === holdings.length) {
                this.ngZone.run(() => {
                  this.holdings = [...enriched];
                  this.holdingsCount = holdings.reduce((sum, h) => sum + +h.quantity, 0);
                  this.holdingsValue = totalValue;
                  this.totalGainLoss = totalGain;
                  this.totalPortfolioValue = totalValue;
                  this.cdr.detectChanges();
                });
              }
            },
            error: () => {
              enriched[index] = {
                ...h,
                currentPrice: +h.avgBuyPrice,
                currentValue: 0,
                gainLoss: 0,
              };
              completed++;
              if (completed === holdings.length) {
                this.ngZone.run(() => {
                  this.holdings = [...enriched];
                  this.holdingsCount = holdings.reduce((sum, h) => sum + +h.quantity, 0);
                  this.holdingsValue = totalValue;
                  this.totalGainLoss = totalGain;
                  this.totalPortfolioValue = totalValue;
                  this.cdr.detectChanges();
                });
              }
            },
          });
        });
      },
      error: (err) => console.error('Holdings load error:', err),
    });
  }

  loadTransactions(): void {
    this.api.get<any[]>(`/api/transactions/me`).subscribe({
      next: (transactions) => {
        this.ngZone.run(() => {
          this.transactions = transactions.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Transactions load error:', err),
    });
  }

  loadWatchlist(): void {
    this.api.get<any[]>(`/api/watchlist/me`).subscribe({
      next: (watchlist) => {
        if (watchlist.length === 0) {
          this.ngZone.run(() => {
            this.watchlist = [];
            this.cdr.detectChanges();
          });
          return;
        }
        const enriched: any[] = new Array(watchlist.length);
        let completed = 0;
        watchlist.forEach((w, index) => {
          this.api.get<any>(`/api/market/quote/${w.stockSymbol}`).subscribe({
            next: (stock) => {
              enriched[index] = { ...w, currentPrice: stock.currentPrice };
              completed++;
              if (completed === watchlist.length) {
                this.ngZone.run(() => {
                  this.watchlist = [...enriched];
                  this.cdr.detectChanges();
                });
              }
            },
            error: () => {
              enriched[index] = { ...w, currentPrice: null };
              completed++;
              if (completed === watchlist.length) {
                this.ngZone.run(() => {
                  this.watchlist = [...enriched];
                  this.cdr.detectChanges();
                });
              }
            },
          });
        });
      },
      error: (err) => console.error('Watchlist load error:', err),
    });
  }

  removeFromWatchlistBtn(id: number): void {
    this.api.delete(`/api/watchlist/${id}`).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.loadWatchlist();
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Remove watchlist error:', err),
    });
  }

  sell(holding: any): void {
    const quantity = holding.sellQuantity || holding.quantity;
    if (!quantity || quantity <= 0) return;
    this.api
      .post<any>('/api/holdings/sell', { stockSymbol: holding.stockSymbol, quantity })
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.loadPortfolio();
            this.loadTransactions();
            this.refreshTrigger++;
            this.cdr.detectChanges();
          });
        },
        error: (err) => console.error('Sell error:', err),
      });
  }

  isPositive(value: number): boolean {
    return value >= 0;
  }

  get transactionsForChart(): any[] {
    const sorted = [...this.transactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    let runningBalance = 0;
    return sorted.map((t) => {
      const amount = +t.totalAmount;
      if (t.type === 'BUY') runningBalance += amount;
      else runningBalance -= amount;
      return {
        date: t.createdAt,
        close: +runningBalance.toFixed(2),
        open: +runningBalance.toFixed(2),
        high: +runningBalance.toFixed(2),
        low: +runningBalance.toFixed(2),
      };
    });
  }

  // ── Analytics ─────────────────────────────────────────────────

  get analytics() {
    if (!this.transactions.length && !this.holdings.length) return null;

    const sorted = [...this.transactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const buys = sorted.filter((t) => t.type === 'BUY');
    const sells = sorted.filter((t) => t.type === 'SELL');

    // Total spent buying stocks (cost basis)
    const totalInvested = buys.reduce((sum, t) => sum + +t.totalAmount, 0);
    // Total received from selling stocks
    const totalReturned = sells.reduce((sum, t) => sum + +t.totalAmount, 0);
    // Current market value of unsold holdings
    const currentHoldingsValue = this.holdingsValue;

    // Net gain/loss = (what holdings are worth now + what we got from sells) - what we paid
    const totalReturnDollar = currentHoldingsValue + totalReturned - totalInvested;
    const totalReturnPct = totalInvested > 0 ? (totalReturnDollar / totalInvested) * 100 : 0;

    // Sells that resulted in gains — compare sell price vs avg buy price for that symbol
    const sellsWithGain = sells.filter((t) => {
      const matchingBuys = buys.filter((b) => b.stockSymbol === t.stockSymbol);
      if (!matchingBuys.length) return false;
      const avgBuyPrice = matchingBuys.reduce((sum, b) => sum + +b.price, 0) / matchingBuys.length;
      return +t.price > avgBuyPrice;
    });

    // Best and worst performing current holdings
    const holdingsWithGain = this.holdings.filter((h) => h.gainLoss !== undefined);
    const bestHolding = holdingsWithGain.length
      ? holdingsWithGain.reduce((best, h) => (h.gainLoss > best.gainLoss ? h : best))
      : null;
    const worstHolding = holdingsWithGain.length
      ? holdingsWithGain.reduce((worst, h) => (h.gainLoss < worst.gainLoss ? h : worst))
      : null;

    // Portfolio value over time (running balance per transaction)
    let running = 0;
    const portfolioValues = sorted.map((t) => {
      const amt = +t.totalAmount;
      if (t.type === 'BUY') running += amt;
      else running -= amt;
      return running;
    });

    // Maximum Drawdown — largest peak-to-trough drop
    let maxDrawdown = 0;
    let peak = portfolioValues[0] ?? 0;
    for (const val of portfolioValues) {
      if (val > peak) peak = val;
      const drawdown = peak > 0 ? ((peak - val) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Standard Deviation of portfolio values
    const mean = portfolioValues.reduce((sum, v) => sum + v, 0) / (portfolioValues.length || 1);
    const variance =
      portfolioValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
      (portfolioValues.length || 1);
    const stdDev = Math.sqrt(variance);

    // Most traded symbol
    const symbolCounts: { [sym: string]: number } = {};
    sorted.forEach((t) => {
      symbolCounts[t.stockSymbol] = (symbolCounts[t.stockSymbol] || 0) + 1;
    });
    const mostTraded = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    return {
      totalInvested,
      totalReturnDollar,
      totalReturnPct,
      totalTransactions: sorted.length,
      buyCount: buys.length,
      sellCount: sells.length,
      sellsWithGain: sellsWithGain.length,
      sellsWithLoss: sells.length - sellsWithGain.length,
      bestHolding,
      worstHolding,
      maxDrawdown,
      stdDev,
      mostTraded,
    };
  }
}
