import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.services';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent implements OnInit {
  //  USER INFO
  firstName: string = '';
  lastName: string = '';
  email: string = '';

  //  SEPARATE SUCCESS MESSAGES
  nameSuccessMessage: string = '';
  onboardingSuccessMessage: string = '';

  //  MODAL STATE
  showOnboardingModal: boolean = false;
  currentStep: number = 0;
  showNameSuccess = false;
  nameSuccessTimeout: any;
  showOnboardingSuccess = false;
  onboardingSuccessTimeout: any;
  selectedEmoji = '🙂'; // saved (real)
  tempEmoji = '🙂'; // preview
  emojis = ['🙂', '😎', '', '🚀', '💰', '📈', '📊', '🐂', '🐻', '🧠', '💡'];

  showEmojiSuccess = false;
  emojiTimeout: any;

  //  OPTIONS
  experienceOptions: string[] = [
    'Beginner (just getting started)',
    'Intermediate (some experience)',
    'Advanced (active trader)',
  ];

  tradingStyleOptions: string[] = [
    'Long-term investor',
    'Swing trader',
    'Day trader',
    'Just exploring',
  ];

  marketPreferenceOptions: string[] = [
    'Real-time (fast refresh)',
    'Balanced',
    'Battery saver (slower updates)',
  ];

  goalOptions: string[] = [
    'Learn how to invest',
    'Practice trading strategies',
    'Track the market',
    'Explore and experiment',
  ];

  //  USER RESPONSES
  onboardingData = {
    experienceLevel: '',
    tradingStyle: '',
    marketPreference: '',
    goal: '',
  };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const savedEmoji = localStorage.getItem('userEmoji');
    if (savedEmoji) {
      this.selectedEmoji = savedEmoji;
      this.tempEmoji = savedEmoji;
    }

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
      },
    });

    this.email = localStorage.getItem('email') || '';
  }

  updateName() {
    this.showNameSuccess = false;

    this.api
      .put('/api/account/update-name', {
        firstName: this.firstName,
        lastName: this.lastName,
      })
      .subscribe({
        next: () => {
          this.showNameSuccess = true;

          if (this.nameSuccessTimeout) {
            clearTimeout(this.nameSuccessTimeout);
          }

          this.cdr.detectChanges();

          this.nameSuccessTimeout = setTimeout(() => {
            this.showNameSuccess = false;
            this.cdr.detectChanges();
          }, 1500);
        },
        error: (err) => {
          console.error('Failed to update name:', err);
        },
      });
  }

  //  OPEN MODAL
  openOnboarding() {
    this.onboardingSuccessMessage = ''; // clear old message
    this.showOnboardingModal = true;
    this.currentStep = 0;
  }

  //  CLOSE MODAL
  closeOnboarding() {
    this.showOnboardingModal = false;
  }

  //  NAVIGATION
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

  //  FINISH ONBOARDING
  finishOnboarding() {
    // whatever logic you already have (saving data, etc.)

    this.showOnboardingModal = false; //  CLOSE MODAL

    // success message logic
    this.showOnboardingSuccess = true;

    if (this.onboardingSuccessTimeout) {
      clearTimeout(this.onboardingSuccessTimeout);
    }

    this.cdr.detectChanges();

    this.onboardingSuccessTimeout = setTimeout(() => {
      this.showOnboardingSuccess = false;
      this.cdr.detectChanges();
    }, 1500);
  }

  clearMessages() {
    this.nameSuccessMessage = '';
    this.onboardingSuccessMessage = '';
  }

  selectEmoji(emoji: string) {
    this.tempEmoji = emoji; //  ONLY preview
  }

  saveEmoji() {
    this.selectedEmoji = this.tempEmoji; //  APPLY change

    localStorage.setItem('userEmoji', this.selectedEmoji);

    this.showEmojiSuccess = true;

    if (this.emojiTimeout) {
      clearTimeout(this.emojiTimeout);
    }

    this.cdr.detectChanges();

    this.emojiTimeout = setTimeout(() => {
      this.showEmojiSuccess = false;
      this.cdr.detectChanges();
    }, 1500);
  }
}
