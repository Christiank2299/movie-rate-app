import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Discover } from './pages/discover/discover';
import { Library } from './pages/library/library';
import { Reviews } from './pages/reviews/reviews';
import { Profile } from './pages/profile/profile';
import { About } from './pages/about/about';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'discover', component: Discover },
  { path: 'library', component: Library },
  { path: 'reviews', component: Reviews },
  { path: 'profile', component: Profile },
  { path: 'about', component: About },
  { path: '**', redirectTo: '' }
];