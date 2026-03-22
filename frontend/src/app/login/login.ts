import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef // 🔥 ADD THIS
  ) {}

  login() {
    this.errorMessage = '';

    this.api
      .post<any>('/api/auth/login', {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (res: any) => {

          // 🔥 HANDLE FAILED LOGIN EVEN IF 200 RESPONSE
          if (!res || !res.token) {
            this.errorMessage = 'Invalid email or password';
            this.cdr.detectChanges(); // 🔥 FORCE UI UPDATE
            return;
          }

          // ✅ SUCCESS
          localStorage.setItem('token', res.token);
          localStorage.setItem('userId', res.userId.toString());
          localStorage.setItem('email', res.email);

          this.router.navigate(['/home']);
        },

        error: (err) => {
          console.log('ERROR TRIGGERED:', err);

          // 🔥 ALWAYS SHOW MESSAGE
          this.errorMessage = 'Invalid email or password';

          // 🔥 FORCE UI UPDATE (CRITICAL FIX)
          this.cdr.detectChanges();
        },
      });
  }
}