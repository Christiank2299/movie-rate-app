import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../core/services/profile.service';

const GENRES = [
  { id: 28, name: 'Action', emoji: '💥' },
  { id: 12, name: 'Adventure', emoji: '🗺️' },
  { id: 16, name: 'Animation', emoji: '🎨' },
  { id: 35, name: 'Comedy', emoji: '😂' },
  { id: 80, name: 'Crime', emoji: '🔪' },
  { id: 99, name: 'Documentary', emoji: '🎥' },
  { id: 18, name: 'Drama', emoji: '🎭' },
  { id: 10751, name: 'Family', emoji: '👨‍👩‍👧' },
  { id: 14, name: 'Fantasy', emoji: '🧙' },
  { id: 36, name: 'History', emoji: '📜' },
  { id: 27, name: 'Horror', emoji: '👻' },
  { id: 10402, name: 'Music', emoji: '🎵' },
  { id: 9648, name: 'Mystery', emoji: '🕵️' },
  { id: 10749, name: 'Romance', emoji: '❤️' },
  { id: 878, name: 'Sci-Fi', emoji: '🚀' },
  { id: 53, name: 'Thriller', emoji: '😰' },
  { id: 10752, name: 'War', emoji: '⚔️' },
  { id: 37, name: 'Western', emoji: '🤠' },
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private profileService = inject(ProfileService);
  private router = inject(Router);

  readonly genres = GENRES;
  readonly isNewUser = signal(false);

  displayName = signal('');
  selectedGenres = signal<number[]>([]);
  saveSuccess = signal(false);

  ngOnInit() {
    const existing = this.profileService.profile();
    if (existing) {
      this.displayName.set(existing.displayName);
      this.selectedGenres.set(existing.favoriteGenres);
    } else {
      this.isNewUser.set(true);
    }
  }

  toggleGenre(id: number) {
    const current = this.selectedGenres();
    this.selectedGenres.set(
      current.includes(id) ? current.filter(g => g !== id) : [...current, id]
    );
  }

  isSelected(id: number): boolean {
    return this.selectedGenres().includes(id);
  }

  save() {
    const name = this.displayName().trim();
    if (!name) return;

    this.profileService.save({
      displayName: name,
      favoriteGenres: this.selectedGenres(),
      createdAt: new Date().toISOString(),
    });

    if (this.isNewUser()) {
      this.router.navigate(['/']);
    } else {
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    }
  }
}