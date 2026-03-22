import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockSearchComponent } from '../stock-search-component/stock-search-component';
import { Router } from '@angular/router';
import { StockChartComponent } from '../stock-chart.component/stock-chart.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    StockSearchComponent,
    StockChartComponent
  ],
  templateUrl: './search.html',
  styleUrls: ['./search.css']
})
export class Search {

  constructor(private router: Router) {}

  symbols = ['AAPL', 'NVDA', 'MSFT', 'TSLA'];
  selectedSymbol: string = 'AAPL';

  selectSymbol(symbol: string) {
    this.selectedSymbol = symbol;
  }

  onSymbolSelected(symbol: string): void {
    this.router.navigate(['/stock', symbol]);
  }
}