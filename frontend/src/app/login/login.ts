import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login() {
    this.errorMessage = '';

    this.http
      .post<any>('http://localhost:8080/api/auth/login', {
        email: this.email,
        password: this.password,
      })
      .subscribe({
next: (res) => {
  // 🔐 SAVE JWT TOKEN (MOST IMPORTANT)
  localStorage.setItem('token', res.token);

  // existing data
  localStorage.setItem('userId', res.userId.toString());
  localStorage.setItem('email', res.email);

  console.log("TOKEN:", res.token); // optional debug

  this.router.navigate(['/home']);
},
        error: (err) => {
          this.errorMessage = typeof err.error === 'string' ? err.error : 'Login failed';
        },
      });
  }
}
