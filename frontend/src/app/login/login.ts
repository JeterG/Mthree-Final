import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.services';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  login() {
    if (this.loading) return;

    if (!this.email.trim()) {
      this.toast.error('Please enter your email');
      return;
    }
    if (!this.password) {
      this.toast.error('Please enter your password');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.api
      .post<any>('/api/auth/login', {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          if (!res?.token) {
            this.toast.error('Invalid email or password');
            this.cdr.detectChanges();
            return;
          }
          localStorage.setItem('token', res.token);
          localStorage.setItem('userId', res.userId.toString());
          localStorage.setItem('email', res.email);
          this.toast.success('Welcome back!');
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.loading = false;
          const msg = (err?.error?.message || err?.error?.userMessage || '').toLowerCase();
          if (msg.includes('not found') || msg.includes('no such')) {
            this.toast.error('No account found with that email');
          } else if (
            msg.includes('password') ||
            msg.includes('credential') ||
            msg.includes('invalid')
          ) {
            this.toast.error('Wrong password — please try again');
          } else {
            this.toast.error('Invalid email or password');
          }
          this.cdr.detectChanges();
        },
      });
  }
}
