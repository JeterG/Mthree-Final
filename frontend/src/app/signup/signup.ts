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
  hasSubmitted = false;
  emailExists = false;

  constructor(
    private api: ApiService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private toast: ToastService,
  ) {}

  checkEmailExists() {
    if (!this.email) return;
    this.api.get(`/api/auth/check-email?email=${this.email}`).subscribe({
      next: (res: any) => {
        this.emailExists = res.exists;
      },
      error: () => {
        this.emailExists = false;
      },
    });
  }

  signup() {
    if (this.isSubmitting) return;

    this.hasSubmitted = true;

    if (this.password !== this.confirmPassword) {
      this.toast.error('Passwords do not match');
      return;
    }

    if (this.emailExists) {
      this.toast.error('An account with this email already exists');
      return;
    }

    this.isSubmitting = true;
    this.cd.detectChanges();

    this.api
      .postWithOptions(
        '/api/auth/signup',
        {
          email: this.email,
          password: this.password,
        },
        { responseType: 'text' },
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toast.success('Account created! You can now log in.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = (err?.error?.message || err?.error || '').toString().toLowerCase();
          if (msg.includes('exist') || msg.includes('duplicate')) {
            this.toast.error('An account with this email already exists');
          } else {
            this.toast.error('Signup failed — please check your details');
          }
          this.cd.detectChanges();
        },
      });
  }
}
