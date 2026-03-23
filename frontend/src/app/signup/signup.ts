import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.services';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupComponent {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  errorMessage: string = '';
  successMessage: string = '';

  isSubmitting: boolean = false;
  hasSubmitted: boolean = false; // 🔥 NEW FLAG

  constructor(
    private api: ApiService,
    private cd: ChangeDetectorRef
  ) {}

  signup() {
    console.log('SIGNUP CALLED');

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.hasSubmitted = true; // 🔥 mark submission attempt

    this.errorMessage = '';
    this.successMessage = '';

    // ❌ do NOT show password mismatch message globally
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Signup failed, recheck your fields'; // 🔥 ALWAYS same message
      this.isSubmitting = false;
      this.cd.detectChanges();
      return;
    }

    this.api
      .post('/api/auth/signup', {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (res: any) => {
          console.log('SUCCESS HIT');
          console.log(res);

          this.successMessage =
            'Account created successfully! You can now log in.';

          this.cd.detectChanges();

          this.email = '';
          this.password = '';
          this.confirmPassword = '';

          this.isSubmitting = false;
        },

error: (err) => {
  console.log('FULL ERROR:', err);

  const msg =
    err?.error?.message ||
    err?.error?.error?.message ||
    '';

  if (msg.toLowerCase().includes('exist')) {
    this.errorMessage = 'User already exists';
  } else {
    this.errorMessage = 'Signup failed, recheck your fields';
  }

  this.isSubmitting = false;
  this.cd.detectChanges();
},
      });
  }
}