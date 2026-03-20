import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule], // 👈 ADD CommonModule
  templateUrl: './settings.html',
})
export class SettingsComponent implements OnInit {

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

  selectedTimezone = 'America/New_York';

  ngOnInit() {
    // Theme
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();

    // 🔥 Load timezone
    const savedTz = localStorage.getItem('timezone');
    if (savedTz) {
      this.selectedTimezone = savedTz;
    }
  }

  toggleTheme() {
    // ❌ REMOVE manual toggle (ngModel already handles it)
    // this.isDarkMode = !this.isDarkMode;

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

  // 🔥 Save timezone
  onTimezoneChange() {
    localStorage.setItem('timezone', this.selectedTimezone);
  }
}