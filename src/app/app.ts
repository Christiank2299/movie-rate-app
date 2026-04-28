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

  ngOnInit() {
  // Handle OAuth redirect token in URL
  this.supabase.getClient().auth.getSession().then(({ data }) => {
    console.log('Session on init:', data.session?.user?.email);
  });

  this.supabase.user$.subscribe(async user => {
    console.log('User state changed:', user?.email);
    if (!user) {
      this.router.navigate(['/login']);
    } else {
      await this.profileService.loadProfile();
      await this.libraryService.loadUserData();
      
      if (!this.profileService.hasProfile()) {
        this.router.navigate(['/profile']);
      } else {
        this.router.navigate(['/']);
      }
    }
  });
}

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }

  get displayName(): string {
    return this.profileService.profile()?.displayName ?? '';
  }

  get isLoggedIn(): boolean {
    return !!this.supabase.getCurrentUser();
  }
}