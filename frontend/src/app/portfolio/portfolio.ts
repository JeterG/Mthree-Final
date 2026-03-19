import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
export class Portfolio {
  selectedSymbol = '';
  activeTab: 'holdings' | 'transactions' | 'watchlist' = 'holdings';
  userId: number = parseInt(localStorage.getItem('userId') || '0');

  onSymbolSelected(symbol: string): void {
    this.selectedSymbol = symbol;
  }
}
