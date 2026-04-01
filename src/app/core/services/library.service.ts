import { Injectable, signal } from '@angular/core';
import { Movie } from '../models/movie.model';
import { Review } from '../models/review.model';

export type WatchStatus = 'want' | 'watching' | 'finished';

export interface LibraryEntry {
  movie: Movie;
  status: WatchStatus;
  addedAt: string;
}

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly STORAGE_KEY = 'movierate_library';
  private readonly REVIEWS_KEY = 'movierate_reviews';

  private _entries = signal<LibraryEntry[]>(this.loadFromStorage());
  private _reviews = signal<Review[]>(this.loadReviews());

  get entries() { return this._entries; }
  get reviews() { return this._reviews; }

  addMovie(movie: Movie, status: WatchStatus) {
    if (this.isInLibrary(movie.id)) return;
    const updated = [...this._entries(), { movie, status, addedAt: new Date().toISOString() }];
    this._entries.set(updated);
    this.save();
  }

  updateStatus(movieId: number, status: WatchStatus) {
    const updated = this._entries().map(e =>
      e.movie.id === movieId ? { ...e, status } : e
    );
    this._entries.set(updated);
    this.save();
  }

  removeMovie(movieId: number) {
    this._entries.set(this._entries().filter(e => e.movie.id !== movieId));
    this.save();
  }

  isInLibrary(movieId: number): boolean {
    return this._entries().some(e => e.movie.id === movieId);
  }

  getEntry(movieId: number): LibraryEntry | undefined {
    return this._entries().find(e => e.movie.id === movieId);
  }

  getByStatus(status: WatchStatus): LibraryEntry[] {
    return this._entries().filter(e => e.status === status);
  }

  addReview(review: Review) {
    const existing = this._reviews().filter(r => r.movieId !== review.movieId);
    const updated = [...existing, review];
    this._reviews.set(updated);
    localStorage.setItem(this.REVIEWS_KEY, JSON.stringify(updated));
  }

  getReview(movieId: number): Review | undefined {
    return this._reviews().find(r => r.movieId === movieId);
  }

  private save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._entries()));
  }

  private loadFromStorage(): LibraryEntry[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private loadReviews(): Review[] {
    try {
      const raw = localStorage.getItem(this.REVIEWS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
}