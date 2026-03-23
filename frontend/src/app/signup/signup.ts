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

  constructor(
    private api: ApiService,
    private cd: ChangeDetectorRef // 🔥 added
  ) {}

  signup() {
    console.log('SIGNUP CALLED');

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.errorMessage = '';
    this.successMessage = '';

    // password check
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      this.isSubmitting = false;
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
          responseType: 'text',
        }
      )
      .subscribe({
        next: (res: any) => {
          console.log('SUCCESS HIT');
          console.log(res);

          // ✅ set message
          this.successMessage = 'Account created successfully! You can now log in.';

          // 🔥 FORCE Angular to update UI immediately
          this.cd.detectChanges();

          // reset fields
          this.email = '';
          this.password = '';
          this.confirmPassword = '';

          this.isSubmitting = false;
        },

        error: (err) => {
          console.log(err);

          this.errorMessage =
            typeof err.error === 'string'
              ? err.error
              : 'Signup failed (maybe email already exists)';

          this.isSubmitting = false;

          // 🔥 also update UI on error
          this.cd.detectChanges();
        },
      });
  }
}