import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar implements OnInit {
  email: string | null = null;
  isDropdownOpen = false;
  isMobileMenuOpen = false;

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

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  goToProfile(): void {
    this.isDropdownOpen = false;
    this.isMobileMenuOpen = false;
    setTimeout(() => this.router.navigate(['/profile']), 0);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    this.isDropdownOpen = false;
    this.isMobileMenuOpen = false;
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-wrapper')) {
      this.isDropdownOpen = false;
    }
    if (!target.closest('.navbar')) {
      this.isMobileMenuOpen = false;
    }
  }
}
