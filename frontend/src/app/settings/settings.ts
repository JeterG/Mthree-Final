import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TimezoneService } from '../home/timezone.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {
  constructor(
    private timezoneService: TimezoneService,
    private cd: ChangeDetectorRef
  ) {}

  isDarkMode = false;
  showResetModal = false;
  showSuccessMessage = false;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';

  successTimeout: any;

  timezones = [
    { label: 'Eastern (ET)', value: 'America/New_York' },
    { label: 'Central (CT)', value: 'America/Chicago' },
    { label: 'Mountain (MT)', value: 'America/Denver' },
    { label: 'Pacific (PT)', value: 'America/Los_Angeles' },
    { label: 'Alaska (AKT)', value: 'America/Anchorage' },
    { label: 'Hawaii (HST)', value: 'Pacific/Honolulu' }
  ];
trading = {
  confirmTrade: true,
  autoRefresh: true,
  refreshSpeed: 'medium' // 🔥 add this
};
  notifications = {
    priceAlerts: true,
    tradeConfirmations: true,
    dailySummary: false
  };

  selectedTimezone = 'America/New_York';

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();

    this.selectedTimezone = this.timezoneService.getTimezone();

    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      this.notifications = JSON.parse(savedNotifications);
    }
    const savedTrading = localStorage.getItem('tradingPreferences');
if (savedTrading) {
  this.trading = JSON.parse(savedTrading);
}
  }

  saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
    console.log('Notification preferences updated');

    if (this.notifications.tradeConfirmations) {
      console.log('Trade confirmations enabled');
    }
  }

  applyChanges() {
    this.saveNotifications();
    this.showSuccessMessage = true;

    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }

    this.cd.detectChanges();

    this.successTimeout = setTimeout(() => {
      this.showSuccessMessage = false;
      this.cd.detectChanges();
    }, 1500);
  }

  toggleTheme() {
    const theme = this.isDarkMode ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    this.applyTheme();
  }

  saveTradingPreferences() {
  localStorage.setItem('tradingPreferences', JSON.stringify(this.trading));
  console.log('Trading preferences updated');
}

  applyTheme() {
    const root = document.documentElement;
    const body = document.body;

    if (this.isDarkMode) {
      root.classList.add('dark-mode');
      body.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
      body.classList.remove('dark-mode');
    }
  }

  onTimezoneChange() {
    this.timezoneService.setTimezone(this.selectedTimezone);
  }

  closeModal() {
    this.showResetModal = false;
    this.passwordError = '';
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  submitPasswordChange() {
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match';
      return;
    }

    const token = localStorage.getItem('token');

    fetch('http://localhost:8080/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword
      })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed');
        }
        return res.text();
      })
      .then(() => {
        alert('Password updated successfully');
        this.closeModal();
      })
      .catch(() => {
        this.passwordError = 'Current password is incorrect';
      });
  }
}