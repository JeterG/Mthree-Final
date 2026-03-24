import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CartService } from '../cart/cart.service';
import { ApiService } from '../services/api.services';
import { ToastService } from '../toast/toast.service';

interface CartItem {
  stockSymbol: string;
  quantity: number;
  priceAtAdd: number;
  totalAtAdd: number;
}

interface BulkBuyResult {
  succeeded: string[];
  failed: string[];
  total: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart-component.html',
  styleUrls: ['./cart-component.css'],
})
export class CartComponent implements OnInit, OnDestroy {
  @Input() cashBalance = 0;
  @Output() checkoutComplete = new EventEmitter<void>();

  items: CartItem[] = [];
  isOpen = false;
  checkingOut = false;
  checkoutResult: BulkBuyResult | null = null;

  private sub!: Subscription;

  constructor(
    private cartService: CartService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.sub = this.cartService.cart$.subscribe((items) => {
      this.items = items;
      this.cdr.detectChanges();
    });
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get count(): number {
    return this.cartService.count;
  }
  get estimatedTotal(): number {
    return this.cartService.estimatedTotal;
  }
  get canAfford(): boolean {
    return this.cashBalance >= this.estimatedTotal;
  }
  get remaining(): number {
    return this.cashBalance - this.estimatedTotal;
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.checkoutResult = null;
  }
  close(): void {
    this.isOpen = false;
  }
  remove(symbol: string): void {
    this.cartService.removeItem(symbol);
  }

  updateQty(item: CartItem, qty: number): void {
    if (qty <= 0) {
      this.cartService.removeItem(item.stockSymbol);
      return;
    }
    this.cartService.updateQuantity(item.stockSymbol, qty, item.priceAtAdd);
  }

  checkout(): void {
    if (!this.items.length || this.checkingOut) return;
    this.checkingOut = true;
    this.checkoutResult = null;
    this.cdr.detectChanges();

    const payload = this.items.map((i) => ({ stockSymbol: i.stockSymbol, quantity: i.quantity }));

    this.api.post('/api/holdings/buy-bulk', payload).subscribe({
      next: (res: unknown) => {
        const result = res as BulkBuyResult;
        this.checkoutResult = result;
        this.checkingOut = false;
        (result.succeeded || []).forEach((sym) => this.cartService.removeItem(sym));
        this.checkoutComplete.emit();

        // Toast for each result
        if (result.succeeded.length > 0) {
          this.toast.success(`✓ Bought: ${result.succeeded.join(', ')}`);
        }
        (result.failed || []).forEach((f) => this.toast.error(`✕ ${f}`));

        // Auto-close panel after success if no failures
        if (result.failed.length === 0) {
          setTimeout(() => {
            this.isOpen = false;
            this.checkoutResult = null;
          }, 1500);
        }

        this.cdr.detectChanges();
      },
      error: (err: any) => {
        const msg = err.error?.userMessage || err.error?.message || 'Unknown error';
        this.checkoutResult = {
          succeeded: [],
          failed: [`Checkout failed: ${msg}`],
          total: this.items.length,
        };
        this.toast.error(`Checkout failed: ${msg}`);
        this.checkingOut = false;
        this.cdr.detectChanges();
      },
    });
  }
}
