import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileService } from './core/services/profile.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  profileService = inject(ProfileService);
  private router = inject(Router);

  ngOnInit() {
    if (!this.profileService.hasProfile()) {
      this.router.navigate(['/profile']);
    }
  }

  get displayName(): string {
    return this.profileService.profile()?.displayName ?? '';
  }
}