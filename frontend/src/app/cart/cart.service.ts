import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  stockSymbol: string;
  quantity: number;
  priceAtAdd: number;
  totalAtAdd: number;
}

const CART_KEY = 'papertrade_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartSubject = new BehaviorSubject<CartItem[]>(this.load());
  cart$ = this.cartSubject.asObservable();

  get items(): CartItem[] {
    return this.cartSubject.value;
  }

  get count(): number {
    return this.items.length;
  }

  get estimatedTotal(): number {
    return this.items.reduce((sum: number, i: CartItem) => sum + i.totalAtAdd, 0);
  }

  addItem(symbol: string, quantity: number, currentPrice: number): void {
    const items: CartItem[] = [...this.items];
    const existing: number = items.findIndex((i: CartItem) => i.stockSymbol === symbol);

    if (existing >= 0) {
      const prev = items[existing];
      items[existing] = {
        ...prev,
        quantity: prev.quantity + quantity,
        priceAtAdd: currentPrice,
        totalAtAdd: (prev.quantity + quantity) * currentPrice,
      };
    } else {
      items.push({
        stockSymbol: symbol,
        quantity,
        priceAtAdd: currentPrice,
        totalAtAdd: quantity * currentPrice,
      });
    }

    this.save(items);
  }

  removeItem(symbol: string): void {
    this.save(this.items.filter((i: CartItem) => i.stockSymbol !== symbol));
  }

  updateQuantity(symbol: string, quantity: number, currentPrice: number): void {
    const items: CartItem[] = this.items.map((i: CartItem) =>
      i.stockSymbol === symbol
        ? { ...i, quantity, priceAtAdd: currentPrice, totalAtAdd: quantity * currentPrice }
        : i,
    );
    this.save(items);
  }

  clear(): void {
    this.save([]);
  }

  private load(): CartItem[] {
    try {
      const raw: string | null = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch (e: unknown) {
      return [];
    }
  }

  private save(items: CartItem[]): void {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    this.cartSubject.next(items);
  }
}
