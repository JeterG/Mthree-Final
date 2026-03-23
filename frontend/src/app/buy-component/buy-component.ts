import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.services';

@Component({
  selector: 'app-buy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buy-component.html',
  styleUrls: ['./buy-component.css'],
})
export class BuyComponent implements OnInit, OnChanges {
  @Input() symbol = 'TSLA';
  @Input() refreshTrigger = 0; // increments from parent to force cash balance refresh
  @Output() buyComplete = new EventEmitter<void>();
  @Output() watchlistComplete = new EventEmitter<void>();

  currentPrice: number | null = null;
  cashBalance: number | null = null;
  watchlistMap: { [symbol: string]: number } = {}; // symbol -> watchlist entry id
  action: 'buy' | 'cart' | 'watchlist' = 'buy';
  quantity = 1;
  loading = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCashBalance();
    this.loadWatchlist();
    if (this.symbol) {
      this.loadPrice(this.symbol);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['symbol'] && this.symbol) {
      this.resetMessages();
      this.quantity = 1;
      this.loadPrice(this.symbol);
      this.loadCashBalance();
      this.loadWatchlist();
    }
    // Refresh cash balance whenever parent signals a portfolio change
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      this.loadCashBalance();
      this.loadWatchlist();
    }
  }

  loadCashBalance(): void {
    this.api.get<any>('/api/account/me').subscribe({
      next: (account) => {
        this.cashBalance = account.cashBalance;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadWatchlist(): void {
    this.api.get<any[]>('/api/watchlist/me').subscribe({
      next: (watchlist) => {
        this.watchlistMap = {};
        watchlist.forEach((w) => (this.watchlistMap[w.stockSymbol] = w.id));
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadPrice(symbol: string): void {
    this.loading = true;
    this.currentPrice = null;
    this.api.get<any>(`/api/market/quote/${symbol}`).subscribe({
      next: (stock) => {
        this.currentPrice = stock.currentPrice;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = `Price not available for ${symbol}`;
        this.cdr.detectChanges();
      },
    });
  }

  // Set quantity to max affordable shares based on cash balance
  setMaxQuantity(): void {
    if (this.currentPrice && this.currentPrice > 0 && this.cashBalance !== null) {
      this.quantity = Math.floor(this.cashBalance / this.currentPrice);
      if (this.quantity < 1) this.quantity = 1;
      this.cdr.detectChanges();
    }
  }

  get totalCost(): number {
    return (this.currentPrice ?? 0) * this.quantity;
  }

  get maxAffordable(): number {
    if (!this.currentPrice || this.currentPrice <= 0 || this.cashBalance === null) return 0;
    return Math.floor(this.cashBalance / this.currentPrice);
  }

  get isAlreadyWatched(): boolean {
    return this.symbol in this.watchlistMap;
  }

  get watchlistEntryId(): number | null {
    return this.watchlistMap[this.symbol] ?? null;
  }

  get cannotAffordOne(): boolean {
    if (!this.currentPrice || this.currentPrice <= 0 || this.cashBalance === null) return false;
    return this.cashBalance < this.currentPrice;
  }

  get buyDisabled(): boolean {
    return this.submitting || this.loading || this.currentPrice === null || this.cannotAffordOne;
  }

  get watchlistDisabled(): boolean {
    return this.submitting;
  }

  get buttonLabel(): string {
    if (this.submitting) return '';
    switch (this.action) {
      case 'buy':
        return `Buy ${this.symbol}`;
      case 'cart':
        return `Add ${this.symbol} to Cart`;
      case 'watchlist':
        return this.isAlreadyWatched
          ? `Remove ${this.symbol} from Watchlist`
          : `Watch ${this.symbol}`;
    }
  }

  submit(): void {
    if (!this.symbol || !this.symbol.trim()) return;
    if ((this.action === 'buy' || this.action === 'cart') && this.quantity <= 0) return;

    this.submitting = true;
    this.resetMessages();

    if (this.action === 'buy' || this.action === 'cart') {
      this.api
        .post<any>('/api/holdings/buy', {
          stockSymbol: this.symbol,
          quantity: this.quantity,
        })
        .subscribe({
          next: () => {
            this.successMessage =
              this.action === 'buy'
                ? `Bought ${this.quantity} share(s) of ${this.symbol}`
                : `${this.quantity} share(s) of ${this.symbol} added to cart`;
            this.submitting = false;
            // Refresh cash balance after purchase
            this.loadCashBalance();
            this.buyComplete.emit();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.errorMessage = err.error?.message || 'Purchase failed';
            this.submitting = false;
            this.cdr.detectChanges();
          },
        });
    } else {
      if (this.isAlreadyWatched && this.watchlistEntryId !== null) {
        // Remove from watchlist
        this.api.delete(`/api/watchlist/${this.watchlistEntryId}`).subscribe({
          next: () => {
            this.successMessage = `${this.symbol} removed from watchlist`;
            this.submitting = false;
            this.loadWatchlist();
            this.watchlistComplete.emit();
            this.cdr.detectChanges();
          },
          error: () => {
            this.errorMessage = 'Failed to remove from watchlist';
            this.submitting = false;
            this.cdr.detectChanges();
          },
        });
      } else {
        // Add to watchlist
        this.api
          .post<any>('/api/watchlist', {
            stockSymbol: this.symbol,
          })
          .subscribe({
            next: () => {
              this.successMessage = `${this.symbol} added to watchlist`;
              this.submitting = false;
              this.loadWatchlist();
              this.watchlistComplete.emit();
              this.cdr.detectChanges();
            },
            error: (err) => {
              this.errorMessage =
                err.status === 400
                  ? `${this.symbol} is already in your watchlist`
                  : 'Failed to add to watchlist';
              this.submitting = false;
              this.cdr.detectChanges();
            },
          });
      }
    }
  }

  private resetMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
