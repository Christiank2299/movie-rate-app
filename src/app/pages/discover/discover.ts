import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../../core/services/movie.service';
import { LibraryService } from '../../core/services/library.service';
import { Movie } from '../../core/models/movie.model';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './discover.html',
})
export class Discover implements OnInit {
  private movieService = inject(MovieService);
  private libraryService = inject(LibraryService);

  searchQuery = signal('');
  movies = signal<Movie[]>([]);
  trending = signal<Movie[]>([]);
  isLoading = signal(false);
  hasSearched = signal(false);

  ngOnInit() {
    this.loadTrending();
  }

  loadTrending() {
    this.movieService.getTrending().subscribe({
      next: (results) => this.trending.set(results),
      error: (err) => console.error('Trending error', err),
    });
  }

  onSearch() {
    const q = this.searchQuery().trim();
    if (!q) return;
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.movieService.searchMovies(q).subscribe({
      next: (results) => {
        this.movies.set(results);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  clearSearch() {
    this.searchQuery.set('');
    this.movies.set([]);
    this.hasSearched.set(false);
  }

  addToLibrary(movie: Movie, status: 'want' | 'watching' | 'finished') {
    this.libraryService.addMovie(movie, status);
  }

  isInLibrary(id: number): boolean {
    return this.libraryService.isInLibrary(id);
  }

  getStatus(id: number) {
    return this.libraryService.getEntry(id)?.status;
  }

  get displayMovies(): Movie[] {
    return this.hasSearched() ? this.movies() : this.trending();
  }

  get sectionTitle(): string {
    return this.hasSearched() ? `Results for "${this.searchQuery()}"` : 'Trending This Week';
  }
}