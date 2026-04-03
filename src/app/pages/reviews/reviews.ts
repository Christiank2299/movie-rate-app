import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Rating} from 'primeng/rating';
import { LibraryService, LibraryEntry } from '../../core/services/library.service';
import { MovieDetailComponent } from '../../shared/movie-detail/movie-detail';
import { Review } from '../../core/models/review.model';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, Rating, MovieDetailComponent],
  templateUrl: './reviews.html',
})
export class Reviews {
  libraryService = inject(LibraryService);

  editingId = signal<number | null>(null);
  draftRating = signal(3);
  draftText = signal('');
  selectedMovieId = signal<number | null>(null);

  get finished(): LibraryEntry[] {
    return this.libraryService.getByStatus('finished');
  }

  getReview(movieId: number): Review | undefined {
    return this.libraryService.getReview(movieId);
  }

  startEdit(movieId: number) {
    const existing = this.getReview(movieId);
    // convert stored /10 to /5 for display
    this.draftRating.set(existing ? Math.round(existing.rating / 2) : 3);
    this.draftText.set(existing?.reviewText ?? '');
    this.editingId.set(movieId);
  }

  saveReview(movieId: number) {
    this.libraryService.addReview({
      movieId,
      rating: this.draftRating() * 2, // store as /10 internally
      reviewText: this.draftText(),
      createdAt: new Date().toISOString(),
    });
    this.editingId.set(null);
  }

  cancelEdit() { this.editingId.set(null); }

  openDetail(id: number) { this.selectedMovieId.set(id); }
  closeDetail() { this.selectedMovieId.set(null); }

  // Convert stored /10 rating to /5 for display
  displayStars(rating: number): number {
    return Math.round(rating / 2);
  }
}