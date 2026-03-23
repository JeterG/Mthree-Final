import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.services';

// Reusable stock search dropdown component
// Loads all symbols from stock_cache on init
// Emits the selected symbol to the parent component
// Example: <app-stock-search (symbolSelected)="onSymbolSelected($event)"></app-stock-search>
// With default: <app-stock-search [defaultSymbol]="'TSLA'" (symbolSelected)="onSymbolSelected($event)"></app-stock-search>
@Component({
  selector: 'app-stock-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'stock-search-component.html',
  styleUrls: ['stock-search-component.css'],
})
export class StockSearchComponent implements OnInit {
  @Output() symbolSelected = new EventEmitter<string>();

  // Optional default symbol to pre-populate the search input
  @Input() defaultSymbol: string = '';

  searchQuery = '';
  allStocks: any[] = [];
  filteredStocks: any[] = [];
  showDropdown = false;
  selectedStock: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStocks();
  }

  loadStocks(): void {
    this.api.get<any[]>('/api/market/cached').subscribe({
      next: (stocks: any[]) => {
        this.allStocks = stocks;
        // Pre-populate with default symbol once stocks are loaded
        if (this.defaultSymbol) {
          const match = stocks.find((s) => s.symbol === this.defaultSymbol.toUpperCase());
          if (match) {
            this.searchQuery = match.symbol;
            this.selectedStock = match;
          } else {
            // If not in cache yet just show the symbol text
            this.searchQuery = this.defaultSymbol.toUpperCase();
          }
        }
      },
      error: (err) => console.error('Failed to load stocks:', err),
    });
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredStocks = [];
      this.showDropdown = false;
      return;
    }
    this.filteredStocks = this.allStocks
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          (s.companyName && s.companyName.toLowerCase().includes(query)),
      )
      .slice(0, 8);
    this.showDropdown = this.filteredStocks.length > 0;
  }

  selectStock(stock: any) {
    this.selectedStock = stock;
    this.searchQuery = stock.symbol;
    this.showDropdown = false;
    this.symbolSelected.emit(stock.symbol);
  }

  onBlur(): void {
    setTimeout(() => (this.showDropdown = false), 200);
  }
}
