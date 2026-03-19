import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockSearchComponent } from '../stock-search-component/stock-search-component';
import { Router } from '@angular/router';
import { MarketIndexComponent } from './market-index';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    StockSearchComponent,
    MarketIndexComponent // ✅ ADD THIS
  ],
  templateUrl: './search.html',
  styleUrls: ['./search.css']
})
export class Search {

  constructor(private router: Router) {}

  // 🔥 SAME PATTERN AS PORTFOLIO
  onSymbolSelected(symbol: string): void {
    // redirect instead of setting local state
    this.router.navigate(['/stock', symbol]);
  }
}