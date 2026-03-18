import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

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

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.errorMessage = '';

    this.http.post(
      'http://localhost:8080/api/auth/login',
      {
        email: this.email,
        password: this.password
      },
      {
        responseType: 'text' // same fix as signup
      }
    ).subscribe({
      next: (res) => {
        console.log(res);

        // ✅ redirect AFTER backend success
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.log(err);
        this.errorMessage =
          typeof err.error === 'string'
            ? err.error
            : 'Login failed';
      }
    });
  }
}