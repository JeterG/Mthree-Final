import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.services';
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupComponent {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  signup() {
    this.errorMessage = '';
    this.successMessage = '';

    // ✅ confirm password check
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.api
      .post(
        '/api/auth/signup',

        {
          email: this.email,
          password: this.password,
        },
        {
          responseType: 'text', // ✅ FIX: prevents Angular JSON parse error
        },
      )
      .subscribe({
        next: (res: any) => {
          console.log('SUCCESS HIT');
          console.log(res);

          this.successMessage = 'Signup successful! Redirecting...';

          // ✅ redirect to login
          this.router.navigate(['/login']).then((success) => {
            console.log('NAV RESULT:', success);
          });
        },

        error: (err) => {
          console.log(err);

          this.errorMessage =
            typeof err.error === 'string'
              ? err.error
              : 'Signup failed (maybe email already exists)';
        },
      });
  }
}
