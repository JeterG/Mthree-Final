import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../services/api.services';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupComponent {
  email = '';
  password = '';
  confirmPassword = '';
  isSubmitting = false;

  constructor(
    private api: ApiService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private toast: ToastService,
  ) {}

  signup() {
    if (this.isSubmitting) return;

    // Client-side validation via toasts
    if (!this.email.trim()) {
      this.toast.error('Please enter your email');
      return;
    }
    if (!this.password) {
      this.toast.error('Please enter a password');
      return;
    }
    if (this.password.length < 6) {
      this.toast.error('Password must be at least 6 characters');
      return;
    }
    if (!/[A-Z]/.test(this.password)) {
      this.toast.error('Password must contain at least 1 uppercase letter');
      return;
    }
    if (!/[0-9]/.test(this.password)) {
      this.toast.error('Password must contain at least 1 number');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.toast.error('Passwords do not match');
      return;
    }

    this.isSubmitting = true;
    this.cd.detectChanges();

    this.api
      .post('/api/auth/signup', {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toast.success('Account created! You can now log in.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = (err?.error?.message || err?.error?.userMessage || '').toLowerCase();
          if (msg.includes('exist') || msg.includes('duplicate') || msg.includes('already')) {
            this.toast.error('An account with this email already exists');
          } else {
            this.toast.error('Signup failed — please check your details');
          }
          this.cd.detectChanges();
        },
      });
  }
}
