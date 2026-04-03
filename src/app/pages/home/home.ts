import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MovieService } from '../../core/services/movie.service';
import { LibraryService } from '../../core/services/library.service';
import { ProfileService } from '../../core/services/profile.service';
import { Movie } from '../../core/models/movie.model';
// 1. Add to imports at top:
import { MovieDetailComponent } from '../../shared/movie-detail/movie-detail';



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MovieDetailComponent],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private movieService = inject(MovieService);
  private profileService = inject(ProfileService);
  libraryService = inject(LibraryService);

  popular = signal<Movie[]>([]);
  topRated = signal<Movie[]>([]);
  recommended = signal<Movie[]>([]);
  hasRecommendations = signal(false);
  recommendationSource = signal<'library' | 'profile' | null>(null);
  selectedMovieId = signal<number | null>(null);
  openDetail(id: number) { this.selectedMovieId.set(id); }
  closeDetail() { this.selectedMovieId.set(null); }
  ngOnInit() {
    this.movieService.getPopular().subscribe(r => this.popular.set(r.slice(0, 6)));
    this.movieService.getTopRated().subscribe(r => this.topRated.set(r.slice(0, 6)));
    this.loadRecommendations();
  }

  loadRecommendations() {
    const entries = this.libraryService.entries();
    const libraryIds = new Set(entries.map(e => e.movie.id));
    let topGenres: number[] = [];

    if (entries.length > 0) {
      // Use library genre frequency
      const genreCounts: Record<number, number> = {};
      for (const entry of entries) {
        for (const gId of entry.movie.genreIds ?? []) {
          genreCounts[gId] = (genreCounts[gId] ?? 0) + 1;
        }
      }
      topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => Number(id));
      this.recommendationSource.set('library');
    } else {
      // Fall back to profile genres
      const profile = this.profileService.profile();
      topGenres = profile?.favoriteGenres?.slice(0, 3) ?? [];
      if (topGenres.length > 0) this.recommendationSource.set('profile');
    }

    if (topGenres.length === 0) return;

    this.movieService.discoverMovies({
      genres: topGenres,
      sortBy: 'popularity.desc',
      page: 1,
    }).subscribe(({ movies }) => {
      const filtered = movies.filter(m => !libraryIds.has(m.id)).slice(0, 6);
      this.recommended.set(filtered);
      this.hasRecommendations.set(filtered.length > 0);
    });
  }

  get profile() { return this.profileService.profile(); }
  get wantCount() { return this.libraryService.getByStatus('want').length; }
  get watchingCount() { return this.libraryService.getByStatus('watching').length; }
  get finishedCount() { return this.libraryService.getByStatus('finished').length; }
}