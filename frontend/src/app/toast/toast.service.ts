import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private idCounter = 0;
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  show(message: string, type: Toast['type'] = 'success', duration = 2500): void {
    const id = ++this.idCounter;
    const toast: Toast = { id, message, type };
    // Use setTimeout(0) to push outside the current change detection cycle
    // so toasts appear instantly even on pages with OnPush or standalone routing
    setTimeout(() => {
      this.toastsSubject.next([...this.toastsSubject.value, toast]);
    }, 0);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((t) => t.id !== id));
  }

  success(message: string): void {
    this.show(message, 'success');
  }
  error(message: string): void {
    this.show(message, 'error', 3500);
  }
  info(message: string): void {
    this.show(message, 'info');
  }
}
