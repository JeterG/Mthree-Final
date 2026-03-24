import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Navbar } from './navbar/navbar';
import { ToastComponent } from './toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, CommonModule, ToastComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  showNavbar = true;

  constructor(private router: Router) {
    this.updateNavbar(this.router.url);

    const theme = localStorage.getItem('theme') || 'light';
    this.applyTheme(theme);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateNavbar(event.urlAfterRedirects);
      });
  }

  ngOnInit() {
    const theme = localStorage.getItem('theme') || 'light';
    this.applyTheme(theme);
  }

  private applyTheme(theme: string) {
    const root = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      root.classList.add('dark-mode');
      body.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
      body.classList.remove('dark-mode');
    }
  }

  private updateNavbar(url: string) {
    const isAuthPage = url.includes('login') || url.includes('signup');
    this.showNavbar = !isAuthPage;

    if (isAuthPage) {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    } else {
      const theme = localStorage.getItem('theme') || 'light';
      this.applyTheme(theme);
    }
  }
}
