import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
        top: 64px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
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
          transform: translateY(-10px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .toast-success {
        background: #1a2e1a;
        color: #69f0ae;
        border-left: 4px solid #43a047;
      }
      .toast-error {
        background: #2e1a1a;
        color: #ff8a80;
        border-left: 4px solid #e53935;
      }
      .toast-info {
        background: #1a1e2e;
        color: #82b1ff;
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

  constructor(
    public toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.sub = this.toastService.toasts$.subscribe((t) => {
      this.toasts = t;
      this.cdr.detectChanges();
    });
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
