import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
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
