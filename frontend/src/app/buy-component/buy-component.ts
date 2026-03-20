import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-buy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buy-component.html',
  styleUrls: ['./buy-component.css'],
})
export class BuyComponent implements OnChanges {
  @Input() symbol = '';
  @Output() buyComplete = new EventEmitter<void>();
  @Output() watchlistComplete = new EventEmitter<void>();

  currentPrice: number | null = null;
  action: 'buy' | 'watchlist' = 'buy';
  quantity = 1;
  loading = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['symbol'] && this.symbol) {
      this.resetMessages();
      this.loadPrice(this.symbol);
    }
  }

  loadPrice(symbol: string): void {
    this.loading = true;
    this.currentPrice = null;

    this.http.get<any>(`http://localhost:8080/api/market/quote/${symbol}`).subscribe({
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

  get totalCost(): number {
    return (this.currentPrice ?? 0) * this.quantity;
  }

  submit(): void {
    if (!this.symbol || !this.symbol.trim()) return;
    if (this.action === 'buy' && this.quantity <= 0) return;

    this.submitting = true;
    this.resetMessages();

    if (this.action === 'buy') {
      this.http
        .post<any>('http://localhost:8080/api/holdings/buy', {
          stockSymbol: this.symbol,
          quantity: this.quantity,
        })
        .subscribe({
          next: () => {
            this.successMessage = `Bought ${this.quantity} share(s) of ${this.symbol}`;
            this.submitting = false;
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
      this.http
        .post<any>('http://localhost:8080/api/watchlist', {
          stockSymbol: this.symbol,
        })
        .subscribe({
          next: () => {
            this.successMessage = `${this.symbol} added to watchlist`;
            this.submitting = false;
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

  private resetMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}