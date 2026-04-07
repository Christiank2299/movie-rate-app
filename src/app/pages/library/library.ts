import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Rating } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { LibraryService, WatchStatus } from '../../core/services/library.service';
import { MovieDetailComponent } from '../../shared/components/movie-detail/movie-detail';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, Rating, MovieDetailComponent],
  templateUrl: './library.html',
})
export class Library {
  libraryService = inject(LibraryService);
  private router = inject(Router);
  activeTab = signal<WatchStatus | 'all'>('all');
  selectedMovieId = signal<number | null>(null);
  openDetail(id: number) { this.selectedMovieId.set(id); }
  closeDetail() { this.selectedMovieId.set(null); }

  tabs: { label: string; value: WatchStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Want to Watch', value: 'want' },
    { label: 'Watching', value: 'watching' },
    { label: 'Finished', value: 'finished' },
  ];

  get filtered() {
    const tab = this.activeTab();
    if (tab === 'all') return this.libraryService.entries();
    return this.libraryService.getByStatus(tab);
  }

  remove(movieId: number) { this.libraryService.removeMovie(movieId); }

  updateStatus(movieId: number, status: WatchStatus) {
    this.libraryService.updateStatus(movieId, status);
  }

  goToReview(event: Event) {
    event.stopPropagation();
    this.router.navigate(['/reviews']);
  }

  getStarRating(movieId: number): number {
    const review = this.libraryService.getReview(movieId);
    return review ? Math.round(review.rating / 2) : 0;
  }

  saveStarRating(movieId: number, stars: number) {
    const entry = this.libraryService.getEntry(movieId);
    if (entry?.status !== 'finished') return;
    const existing = this.libraryService.getReview(movieId);
    this.libraryService.addReview({
      movieId,
      rating: stars * 2,
      reviewText: existing?.reviewText ?? '',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
  }

  statusColor(status: WatchStatus) {
    return {
      want: 'text-rose-400',
      watching: 'text-blue-400',
      finished: 'text-green-400',
    }[status];
  }
}