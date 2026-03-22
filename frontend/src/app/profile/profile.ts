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

  // 🔥 USER INFO
  firstName: string = '';
  lastName: string = '';
  email: string = '';

  // 🔥 SEPARATE SUCCESS MESSAGES
  nameSuccessMessage: string = '';
  onboardingSuccessMessage: string = '';

  // 🔥 MODAL STATE
  showOnboardingModal: boolean = false;
  currentStep: number = 0;

  // 🔥 OPTIONS
  experienceOptions: string[] = [
    'Beginner (just getting started)',
    'Intermediate (some experience)',
    'Advanced (active trader)'
  ];

  tradingStyleOptions: string[] = [
    'Long-term investor',
    'Swing trader',
    'Day trader',
    'Just exploring'
  ];

  marketPreferenceOptions: string[] = [
    'Real-time (fast refresh)',
    'Balanced',
    'Battery saver (slower updates)'
  ];

  goalOptions: string[] = [
    'Learn how to invest',
    'Practice trading strategies',
    'Track the market',
    'Explore and experiment'
  ];

  // 🔥 USER RESPONSES
  onboardingData = {
    experienceLevel: '',
    tradingStyle: '',
    marketPreference: '',
    goal: ''
  };

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

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
      }
    });

    this.email = localStorage.getItem('email') || '';
  }

  // 🔥 UPDATE NAME
  updateName() {
    this.nameSuccessMessage = '';

    this.api.put('/api/account/update-name', {
      firstName: this.firstName,
      lastName: this.lastName
    }).subscribe({
      next: () => {
        this.nameSuccessMessage = 'Name updated successfully';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to update name:', err);
      }
    });
  }

  // 🔥 OPEN MODAL
  openOnboarding() {
    this.onboardingSuccessMessage = ''; // clear old message
    this.showOnboardingModal = true;
    this.currentStep = 0;
  }

  // 🔥 CLOSE MODAL
  closeOnboarding() {
    this.showOnboardingModal = false;
  }

  // 🔥 NAVIGATION
  nextStep() {
    if (this.currentStep < 5) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  // 🔥 FINISH ONBOARDING
  finishOnboarding() {
    console.log('Onboarding answers:', this.onboardingData);

    this.showOnboardingModal = false;

    this.onboardingSuccessMessage = 'Trading preferences saved successfully';
    this.cdr.detectChanges();
  }
  clearMessages() {
  this.nameSuccessMessage = '';
  this.onboardingSuccessMessage = '';
}
}