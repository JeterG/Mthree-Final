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

    const payload = this.items.map((i) => ({
      stockSymbol: i.stockSymbol,
      quantity: i.quantity,
    }));

    this.api.post('/api/holdings/buy-bulk', payload).subscribe({
      next: (res: unknown) => {
        const result = res as BulkBuyResult;
        this.checkoutResult = result;
        this.checkingOut = false;
        (result.succeeded || []).forEach((sym: string) => this.cartService.removeItem(sym));
        this.checkoutComplete.emit();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.checkoutResult = {
          succeeded: [],
          failed: [
            'Checkout failed: ' + (err.error?.userMessage || err.error?.message || 'Unknown error'),
          ],
          total: this.items.length,
        };
        this.checkingOut = false;
        this.cdr.detectChanges();
      },
    });
  }
}
