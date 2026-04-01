import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MovieService } from '../../core/services/movie';
import { Movie } from '../../core/models/movie.model';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './discover.html',
  styleUrl: './discover.css'
})
export class Discover {
  private movieService = inject(MovieService);

  query = 'Inception';
  movies: Movie[] = [];
  loading = false;
  searched = false;
  errorMessage = '';

  searchMovies(): void {
    if (this.loading) return;

    const trimmedQuery = this.query.trim();
    if (!trimmedQuery) return;

    this.loading = true;
    this.searched = true;
    this.errorMessage = '';

    this.movieService
      .searchMovies(trimmedQuery)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (movies) => {
          this.movies = movies;
        },
        error: (error) => {
          console.error('TMDB request failed:', error);
          this.movies = [];
          this.errorMessage = 'Could not load movies.';
        }
      });
  }
}