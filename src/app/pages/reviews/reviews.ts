import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryService } from '../../core/services/library.service';
import { Review } from '../../core/models/review.model';
import { LibraryEntry } from '../../core/services/library.service';
import { MovieDetailComponent } from '../../shared/movie-detail/movie-detail';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, MovieDetailComponent],
  templateUrl: './reviews.html',
})
export class Reviews {
  libraryService = inject(LibraryService);

  editingId = signal<number | null>(null);
  draftRating = signal(5);
  draftText = signal('');
  selectedMovieId = signal<number | null>(null);
  openDetail(id: number) { this.selectedMovieId.set(id); }
  closeDetail() { this.selectedMovieId.set(null); }

  get finished(): LibraryEntry[] {
    return this.libraryService.getByStatus('finished');
  }

  getReview(movieId: number): Review | undefined {
    return this.libraryService.getReview(movieId);
  }

  startEdit(movieId: number) {
    const existing = this.getReview(movieId);
    this.draftRating.set(existing?.rating ?? 5);
    this.draftText.set(existing?.reviewText ?? '');
    this.editingId.set(movieId);
  }

  saveReview(movieId: number) {
    this.libraryService.addReview({
      movieId,
      rating: this.draftRating(),
      reviewText: this.draftText(),
      createdAt: new Date().toISOString(),
    });
    this.editingId.set(null);
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  stars(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }
}