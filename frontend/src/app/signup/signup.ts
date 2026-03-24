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
  errorMessage = '';
  successMessage = '';
  hasSubmitted = false;

  // ✅ NEW
  emailExists = false;

  constructor(
    private api: ApiService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private toast: ToastService,
  ) {}

  // ✅ NEW FUNCTION
  checkEmailExists() {
    if (!this.email) return;

    this.api.get(`/api/auth/check-email?email=${this.email}`)
      .subscribe({
        next: (res: any) => {
          this.emailExists = res.exists;
        },
        error: () => {
          this.emailExists = false;
        }
      });
  }

  signup() {
    if (this.isSubmitting) return;

    this.hasSubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Signup failed, recheck your fields';
      return;
    }

    if (this.emailExists) {
      this.errorMessage = 'User already exists';
      return;
    }

    this.isSubmitting = true;

    this.api.postWithOptions('/api/auth/signup', {
      email: this.email,
      password: this.password,
    }, {
      responseType: 'text'
    }).subscribe({
      next: () => {
  this.toast.success('Signup was successful!'); // ✅ popup

  this.isSubmitting = false;
  this.cd.detectChanges();

  this.router.navigate(['/login']);
},
      error: () => {
        this.errorMessage = 'Signup failed, recheck your fields';

        this.isSubmitting = false;
        this.cd.detectChanges();
      }
    });
  }
}