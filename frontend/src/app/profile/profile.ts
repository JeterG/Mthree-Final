import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.services';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {

  firstName: string = '';
  lastName: string = '';
  email: string = '';
  successMessage: string = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.api.get<any>('/api/account/me').subscribe({
      next: (res) => {
        this.firstName = res.firstName;
        this.lastName = res.lastName;

        // 🔥 Force Angular to update immediately
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
      }
    });

    // get email from localStorage
    this.email = localStorage.getItem('email') || '';
  }

  updateName() {
    this.successMessage = '';

    this.api.put('/api/account/update-name', {
      firstName: this.firstName,
      lastName: this.lastName
    }).subscribe({
      next: () => {
        this.successMessage = 'Name updated successfully';

        // 🔥 Ensure UI updates instantly
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to update name:', err);
      }
    });
  }
}