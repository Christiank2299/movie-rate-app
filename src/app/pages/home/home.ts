import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MovieService } from '../../core/services/movie.service';
import { LibraryService } from '../../core/services/library.service';
import { Movie } from '../../core/models/movie.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private movieService = inject(MovieService);
  libraryService = inject(LibraryService);

  popular = signal<Movie[]>([]);
  topRated = signal<Movie[]>([]);
  recommended = signal<Movie[]>([]);
  hasRecommendations = signal(false);

  ngOnInit() {
    this.movieService.getPopular().subscribe(r => this.popular.set(r.slice(0, 6)));
    this.movieService.getTopRated().subscribe(r => this.topRated.set(r.slice(0, 6)));
    this.loadRecommendations();
  }

  loadRecommendations() {
    const entries = this.libraryService.entries();
    if (entries.length === 0) return;

    // Tally genre counts across all library movies
    const genreCounts: Record<number, number> = {};
    for (const entry of entries) {
      for (const gId of entry.movie.genreIds ?? []) {
        genreCounts[gId] = (genreCounts[gId] ?? 0) + 1;
      }
    }

    // Pick top 3 genres by frequency
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => Number(id));

    if (topGenres.length === 0) return;

    const libraryIds = new Set(entries.map(e => e.movie.id));

    this.movieService.discoverMovies({
      genres: topGenres,
      sortBy: 'popularity.desc',
      page: 1,
    }).subscribe(({ movies }) => {
      const filtered = movies
        .filter(m => !libraryIds.has(m.id))
        .slice(0, 6);
      this.recommended.set(filtered);
      this.hasRecommendations.set(filtered.length > 0);
    });
  }

  get wantCount() { return this.libraryService.getByStatus('want').length; }
  get watchingCount() { return this.libraryService.getByStatus('watching').length; }
  get finishedCount() { return this.libraryService.getByStatus('finished').length; }
}