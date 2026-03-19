import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule, HttpClientModule],
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
    private http: HttpClient,
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

    this.http
      .post(
        'http://localhost:8080/api/auth/signup',
        {
          email: this.email,
          password: this.password,
        },
        {
          responseType: 'text', // ✅ FIX: prevents Angular JSON parse error
        },
      )
      .subscribe({
        next: (res: string) => {
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
