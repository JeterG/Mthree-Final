import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { StockChartComponent } from '../stock-chart.component/stock-chart.component';
import { StockSearchComponent } from '../stock-search-component/stock-search-component';
StockSearchComponent;
StockChartComponent;

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, StockSearchComponent, StockChartComponent],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css',
})
export class Portfolio {
  selectedSymbol = '';

  onSymbolSelected(symbol: string): void {
    this.selectedSymbol = symbol;
  }
}
