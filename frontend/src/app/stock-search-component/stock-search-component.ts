import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Reusable stock search dropdown component
// Loads all symbols from stock_cache on init
// Emits the selected symbol to the parent component
// Example: <app-stock-search (symbolSelected)="onSymbolSelected($event)"></app-stock-search>
@Component({
  selector: 'app-stock-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'stock-search-component.html',
  styleUrls: ['stock-search-component.css'],
})
export class StockSearchComponent implements OnInit {
  // Emits the selected symbol string to the parent
  @Output() symbolSelected = new EventEmitter<string>();

  searchQuery = '';
  allStocks: any[] = [];
  filteredStocks: any[] = [];
  showDropdown = false;
  selectedStock: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStocks();
  }

  // Load all cached stocks from stock_cache table
  loadStocks(): void {
    this.http.get<any[]>('http://localhost:8080/api/market/cached').subscribe({
      next: (stocks) => {
        this.allStocks = stocks;
      },
      error: (err) => console.error('Failed to load stocks:', err),
    });
  }

  // Filter stocks by symbol as user types
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

  // Select a stock from the dropdown
  selectStock(stock: any): void {
    this.selectedStock = stock;
    this.searchQuery = `${stock.companyName} (${stock.symbol})`; // 🔥 nicer UX    this.showDropdown = false;
    this.symbolSelected.emit(stock.symbol);
  }

  // Close dropdown when input loses focus
  onBlur(): void {
    setTimeout(() => (this.showDropdown = false), 200);
  }
}
