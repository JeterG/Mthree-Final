import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements OnInit {
  email: string | null = null;
  isDropdownOpen = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.email = localStorage.getItem('email');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // 🔥 NEW: Navigate to profile properly
  goToProfile(): void {
    this.isDropdownOpen = false; // close dropdown FIRST

    // small delay ensures UI updates before routing
    setTimeout(() => {
      this.router.navigate(['/profile']);
    }, 0);
  }

logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  localStorage.removeItem('userId');

  this.isDropdownOpen = false;

  // 🔥 CRITICAL: replace history so back button can't return
  this.router.navigateByUrl('/login', { replaceUrl: true });
}

  @HostListener('document:click', ['$event'])
  handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-wrapper')) {
      this.isDropdownOpen = false;
    }
  }
}