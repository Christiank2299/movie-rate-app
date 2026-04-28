import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Discover } from './pages/discover/discover';
import { Library } from './pages/library/library';
import { Reviews } from './pages/reviews/reviews';
import { Profile } from './pages/profile/profile';
import { Login } from './pages/login/login';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', component: Home, canActivate: [authGuard] },
  { path: 'discover', component: Discover, canActivate: [authGuard] },
  { path: 'library', component: Library, canActivate: [authGuard] },
  { path: 'reviews', component: Reviews, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];