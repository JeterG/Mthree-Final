import { Routes } from '@angular/router';
import { authGuard } from './auth-guard/auth.guard'; // 🔥 ADD THIS

import { DiagramsComponent } from './assets/diagrams/diagrams';
import { HomeComponent } from './home/home';
import { LoginComponent } from './login/login';
import { Portfolio } from './portfolio/portfolio';
import { Search } from './search/search';
import { SettingsComponent } from './settings/settings';
import { SignupComponent } from './signup/signup';
import { SwaggerComponent } from './swagger/swagger';
import { ProfileComponent } from './profile/profile';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // PUBLIC
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // 🔒 PROTECTED ROUTES
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'search', component: Search, canActivate: [authGuard] },
  { path: 'portfolio', component: Portfolio, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  { path: 'docs', component: SwaggerComponent, canActivate: [authGuard] },
  { path: 'diagrams', component: DiagramsComponent, canActivate: [authGuard] },

  {
    path: 'stock/:symbol',
    loadComponent: () => import('./stock-page/stock-page').then(m => m.StockPageComponent),
    canActivate: [authGuard]
  },
];