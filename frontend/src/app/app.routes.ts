import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { LoginComponent } from './login/login';
import { Portfolio } from './portfolio/portfolio';
import { SignupComponent } from './signup/signup';
import { Search } from './search/search'; // ✅ ADD THIS

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },
  { path: 'search', component: Search }, // ✅ FIXED
  { path: 'portfolio', component: Portfolio },
];