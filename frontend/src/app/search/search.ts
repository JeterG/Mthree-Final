import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StockChartComponent } from '../stock-chart.component/stock-chart.component';
import { StockSearchComponent } from '../stock-search-component/stock-search-component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, StockSearchComponent, StockChartComponent],
  templateUrl: './search.html',
  styleUrls: ['./search.css'],
})
export class Search {
  constructor(private router: Router) {}
  //4 most popular companies hardcoded 
  symbols = ['AAPL', 'NVDA', 'MSFT', 'TSLA'];
  selectedSymbol: string = 'AAPL';
  //filters for chart
  ranges: string[] = ['1D', '1W', '1M', '3M', '1Y'];
  selectedRange: string = '1D';

  selectSymbol(symbol: string) {
    this.selectedSymbol = symbol;
  }

  selectRange(range: string) {
    this.selectedRange = range;
  }

  onSymbolSelected(symbol: string): void {
    this.router.navigate(['/stock', symbol]);
  }
}
