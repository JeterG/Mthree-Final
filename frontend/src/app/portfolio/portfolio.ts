import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
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

  // Load account first, then load holdings after
  loadAccount(): void {
    this.http.get<any>(`http://localhost:8080/api/account/${this.userId}`).subscribe({
      next: (account) => {
        this.cashBalance = account.cashBalance;
        this.cdr.detectChanges();
        this.loadHoldings();
      },
      error: (err) => console.error('Account load error:', err),
    });
  }

  // Load holdings and calculate total value and gain/loss
  loadHoldings(): void {
    this.http.get<any[]>(`http://localhost:8080/api/holdings/${this.userId}`).subscribe({
      next: (holdings) => {
        // Total shares across all holdings
        this.holdingsCount = holdings.reduce((sum, h) => sum + +h.quantity, 0);

        if (holdings.length === 0) {
          this.holdingsValue = 0;
          this.totalGainLoss = 0;
          this.totalPortfolioValue = this.cashBalance;
          this.cdr.detectChanges();
          return;
        }

        let completed = 0;
        let totalValue = 0;
        let totalGain = 0;

        holdings.forEach((h) => {
          this.http.get<any>(`http://localhost:8080/api/market/quote/${h.stockSymbol}`).subscribe({
            next: (stock) => {
              const currentPrice = +stock.currentPrice;
              const currentValue = currentPrice * +h.quantity;
              const costBasis = +h.avgBuyPrice * +h.quantity;
              totalValue += currentValue;
              totalGain += currentValue - costBasis;
              completed++;

              if (completed === holdings.length) {
                this.holdingsValue = totalValue;
                this.totalGainLoss = totalGain;
                this.totalPortfolioValue = this.cashBalance + totalValue;
                this.cdr.detectChanges();
              }
            },
            error: () => {
              completed++;
              if (completed === holdings.length) {
                this.holdingsValue = totalValue;
                this.totalGainLoss = totalGain;
                this.totalPortfolioValue = this.cashBalance + totalValue;
                this.cdr.detectChanges();
              }
            },
          });
        });
      },
      error: (err) => console.error('Holdings load error:', err),
    });
  }

  isPositive(value: number): boolean {
    return value >= 0;
  }
}
