import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from './core/services/supabase.service';
import { ProfileService } from './core/services/profile.service';
import { LibraryService } from './core/services/library.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private supabase = inject(SupabaseService);
  private profileService = inject(ProfileService);
  private libraryService = inject(LibraryService);
  private router = inject(Router);

  isLoggedIn = false;

  ngOnInit() {
  this.supabase.user$.subscribe(async user => {
    this.isLoggedIn = !!user;

    if (!user) {
      this.router.navigate(['/login']);
    } else {
      await this.profileService.loadProfile();
      await this.libraryService.loadUserData();

      if (!this.profileService.hasProfile()) {
        this.router.navigate(['/profile']);
      } else {
        // Only redirect if currently on login page
        const currentUrl = this.router.url;
        if (currentUrl === '/login' || currentUrl.includes('code=')) {
          this.router.navigate(['/']);
        }
      }
    }
  });
}

  async signOut() {
    await this.supabase.signOut();
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  get displayName(): string {
    return this.profileService.profile()?.displayName ?? '';
  }
}