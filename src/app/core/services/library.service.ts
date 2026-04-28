import { Injectable, inject, signal } from '@angular/core';
import { Movie } from '../models/movie.model';
import { Review } from '../models/review.model';
import { SupabaseService } from './supabase.service';

export type WatchStatus = 'want' | 'watching' | 'finished';

export interface LibraryEntry {
  movie: Movie;
  status: WatchStatus;
  addedAt: string;
}

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private supabase = inject(SupabaseService);

  private _entries = signal<LibraryEntry[]>([]);
  private _reviews = signal<Review[]>([]);

  get entries() { return this._entries; }
  get reviews() { return this._reviews; }

  async loadUserData() {
    const user = this.supabase.getCurrentUser();
    if (!user) return;

    const client = this.supabase.getClient();

    const { data: libraryData } = await client
      .from('library_entries')
      .select('*')
      .eq('user_id', user.id);

    if (libraryData) {
      this._entries.set(libraryData.map((row: any) => ({
        movie: row.movie,
        status: row.status,
        addedAt: row.added_at,
      })));
    }

    const { data: reviewData } = await client
      .from('reviews')
      .select('*')
      .eq('user_id', user.id);

    if (reviewData) {
      this._reviews.set(reviewData.map((row: any) => ({
        movieId: row.movie_id,
        rating: row.rating,
        reviewText: row.review_text,
        createdAt: row.created_at,
      })));
    }
  }

  async addMovie(movie: Movie, status: WatchStatus) {
    if (this.isInLibrary(movie.id)) return;
    const user = this.supabase.getCurrentUser();
    if (!user) return;

    const entry = { movie, status, addedAt: new Date().toISOString() };
    this._entries.set([...this._entries(), entry]);

    await this.supabase.getClient()
      .from('library_entries')
      .insert({
        user_id: user.id,
        movie,
        status,
      });
  }

  async updateStatus(movieId: number, status: WatchStatus) {
    const user = this.supabase.getCurrentUser();
    if (!user) return;

    this._entries.set(this._entries().map(e =>
      e.movie.id === movieId ? { ...e, status } : e
    ));

    await this.supabase.getClient()
      .from('library_entries')
      .update({ status })
      .eq('user_id', user.id)
      .eq('movie->id', movieId);
  }

  async removeMovie(movieId: number) {
    const user = this.supabase.getCurrentUser();
    if (!user) return;

    this._entries.set(this._entries().filter(e => e.movie.id !== movieId));

    await this.supabase.getClient()
      .from('library_entries')
      .delete()
      .eq('user_id', user.id)
      .eq('movie->id', movieId);
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

  async addReview(review: Review) {
    const user = this.supabase.getCurrentUser();
    if (!user) return;

    const existing = this._reviews().filter(r => r.movieId !== review.movieId);
    this._reviews.set([...existing, review]);

    await this.supabase.getClient()
      .from('reviews')
      .upsert({
        user_id: user.id,
        movie_id: review.movieId,
        rating: review.rating,
        review_text: review.reviewText,
        created_at: review.createdAt,
      }, { onConflict: 'user_id,movie_id' });
  }

  getReview(movieId: number): Review | undefined {
    return this._reviews().find(r => r.movieId === movieId);
  }
}