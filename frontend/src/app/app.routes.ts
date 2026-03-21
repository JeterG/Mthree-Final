import { Routes } from '@angular/router';
import { DiagramsComponent } from './assets/diagrams/diagrams';
import { HomeComponent } from './home/home';
import { LoginComponent } from './login/login';
import { Portfolio } from './portfolio/portfolio';
import { Search } from './search/search';
import { SettingsComponent } from './settings/settings';
import { SignupComponent } from './signup/signup';
import { SwaggerComponent } from './swagger/swagger';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },
  { path: 'search', component: Search },
  { path: 'portfolio', component: Portfolio },
  { path: 'docs', component: SwaggerComponent },
  { path: 'diagrams', component: DiagramsComponent },
  {
    path: 'stock/:symbol',
    loadComponent: () => import('./stock-page/stock-page').then((m) => m.StockPageComponent),
  },
  { path: 'settings', component: SettingsComponent },
];
