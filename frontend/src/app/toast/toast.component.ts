import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let t of toasts"
        class="toast-item toast-{{ t.type }}"
        (click)="toastService.dismiss(t.id)"
      >
        <span class="toast-icon">
          {{ t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ' }}
        </span>
        {{ t.message }}
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }
      .toast-item {
        pointer-events: all;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 18px;
        border-radius: 8px;
        font-size: 14px;
        font-family: Arial, sans-serif;
        font-weight: 500;
        min-width: 260px;
        max-width: 380px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.2s ease;
      }
      @keyframes slideIn {
        from {
          transform: translateX(40px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .toast-success {
        background: #e8f5e9;
        color: #1b5e20;
        border-left: 4px solid #43a047;
      }
      .toast-error {
        background: #ffebee;
        color: #b71c1c;
        border-left: 4px solid #e53935;
      }
      .toast-info {
        background: #e3f2fd;
        color: #0d47a1;
        border-left: 4px solid #1e88e5;
      }
      .toast-icon {
        font-weight: 700;
        font-size: 16px;
      }
    `,
  ],
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub!: Subscription;

  constructor(public toastService: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toastService.toasts$.subscribe((t) => (this.toasts = t));
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
