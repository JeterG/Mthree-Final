import { Component, signal, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  showNavbar = true;

constructor(private router: Router) {
  this.updateNavbar(this.router.url);

  // ✅ APPLY THEME IMMEDIATELY ON APP LOAD
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }

  this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((event: any) => {
      this.updateNavbar(event.urlAfterRedirects);
    });
}

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

private updateNavbar(url: string) {
  const isAuthPage = url.includes('login') || url.includes('signup');

  this.showNavbar = !isAuthPage;

  // 🔥 FORCE LIGHT MODE on auth pages
  if (isAuthPage) {
    document.documentElement.classList.remove('dark-mode');
  } else {
    // restore user's preference
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
    }
  }
}
}