import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { LoginComponent } from './login/login';
import { Portfolio } from './portfolio/portfolio';
import { MarketIndexComponent } from './search/market-index';
import { SignupComponent } from './signup/signup';
import { SwaggerComponent } from './swagger/swagger';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },
  { path: 'market', component: MarketIndexComponent },
  { path: 'portfolio', component: Portfolio },
  { path: 'docs', component: SwaggerComponent }, // ✅
];
