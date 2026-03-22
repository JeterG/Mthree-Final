import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TimezoneService } from '../home/timezone.service'; // 🔥 IMPORT

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'] // 🔥 ADD THIS
})
export class SettingsComponent implements OnInit {

  constructor(private timezoneService: TimezoneService) {} // 🔥 INJECT

  isDarkMode = false;

  // 🔥 Timezones
  timezones = [
    { label: 'Eastern (ET)', value: 'America/New_York' },
    { label: 'Central (CT)', value: 'America/Chicago' },
    { label: 'Mountain (MT)', value: 'America/Denver' },
    { label: 'Pacific (PT)', value: 'America/Los_Angeles' },
    { label: 'Alaska (AKT)', value: 'America/Anchorage' },
    { label: 'Hawaii (HST)', value: 'Pacific/Honolulu' }
  ];

  notifications = {
  priceAlerts: true,
  tradeConfirmations: true,
  dailySummary: false
};
  selectedTimezone = 'America/New_York';

  ngOnInit() {
    // Theme
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();

    // 🔥 Load timezone from service (not just localStorage)
    this.selectedTimezone = this.timezoneService.getTimezone();
    const savedNotifications = localStorage.getItem('notifications');
if (savedNotifications) {
  this.notifications = JSON.parse(savedNotifications);
}
  }
saveNotifications() {
  localStorage.setItem('notifications', JSON.stringify(this.notifications));

  // 🔥 Fake "real app" feedback
  console.log('Notification preferences updated');

  // optional:
  if (this.notifications.tradeConfirmations) {
    console.log('Trade confirmations enabled');
  }
}

  toggleTheme() {
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme() {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }

  // 🔥 FIXED: now uses service (reactive)
  onTimezoneChange() {
    this.timezoneService.setTimezone(this.selectedTimezone);
  }

  
}