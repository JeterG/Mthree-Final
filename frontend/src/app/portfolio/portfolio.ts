import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { BuyComponent } from '../buy-component/buy-component';
import { StockChartComponent } from '../stock-chart.component/stock-chart.component';
import { StockSearchComponent } from '../stock-search-component/stock-search-component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, StockSearchComponent, StockChartComponent, BuyComponent],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css',
})
export class Portfolio implements OnInit {
  selectedSymbol = '';
  activeTab: 'holdings' | 'transactions' | 'watchlist' = 'holdings';
  userId: number = parseInt(localStorage.getItem('userId') || '0');

  cashBalance = 0;
  holdingsValue = 0;
  totalPortfolioValue = 0;
  totalGainLoss = 0;
  holdingsCount = 0;
  holdings: any[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadPortfolio();
  }

  onSymbolSelected(symbol: string): void {
    this.selectedSymbol = symbol;
  }

  loadPortfolio(): void {
    this.loadAccount();
  }

  loadAccount(): void {
    this.http.get<any>(`http://localhost:8080/api/account/${this.userId}`).subscribe({
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
    this.http.get<any[]>(`http://localhost:8080/api/holdings/${this.userId}`).subscribe({
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
          this.http.get<any>(`http://localhost:8080/api/market/quote/${h.stockSymbol}`).subscribe({
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

  sell(holding: any): void {
    this.http
      .post<any>('http://localhost:8080/api/holdings/sell', {
        userId: this.userId,
        stockSymbol: holding.stockSymbol,
        quantity: holding.quantity,
      })
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.loadPortfolio();
            this.cdr.detectChanges();
          });
        },
        error: (err) => console.error('Sell error:', err),
      });
  }

  isPositive(value: number): boolean {
    return value >= 0;
  }
}
