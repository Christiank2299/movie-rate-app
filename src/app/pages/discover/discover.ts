import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MovieService } from '../../core/services/movie.service';
import { LibraryService } from '../../core/services/library.service';
import { Movie } from '../../core/models/movie.model';
import { MovieDetailComponent } from '../../shared/components/movie-detail/movie-detail';

export const GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' }, { id: 36, name: 'History' },
  { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' }, { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' }, { id: 37, name: 'Western' },
];

export const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Newest First' },
  { value: 'release_date.asc', label: 'Oldest First' },
  { value: 'revenue.desc', label: 'Highest Grossing' },
];

export const LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' }, { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' }, { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' }, { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' }, { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' }, { code: 'ar', name: 'Arabic' },
];

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, FormsModule, MovieDetailComponent],
  templateUrl: './discover.html',
})
export class Discover implements OnInit {
  private movieService = inject(MovieService);
  private libraryService = inject(LibraryService);
  private route = inject(ActivatedRoute);

  activeTab = signal<'title' | 'person' | 'collaborators'>('title');
  searchQuery = signal('');
  personQuery = signal('');
  collaboratorInputs = signal<string[]>(['', '']);

  selectedGenres = signal<number[]>([]);
  selectedYear = signal('');
  minRating = signal(0);
  sortBy = signal('popularity.desc');
  selectedLanguage = signal('');
  minRuntime = signal(0);
  maxRuntime = signal(0);
  colorType = signal<'color' | 'black_and_white' | ''>('');
  inTheaters = signal(false);
  showFilters = signal(false);

  movies = signal<Movie[]>([]);
  trending = signal<Movie[]>([]);
  isLoading = signal(false);
  hasSearched = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  currentMode = signal<string | null>(null);
  trendingPage = signal(1);
  trendingTotalPages = signal(1);

  selectedMovieId = signal<number | null>(null);
  openDetail(id: number) { this.selectedMovieId.set(id); }
  closeDetail() { this.selectedMovieId.set(null); }

  readonly genres = GENRES;
  readonly sortOptions = SORT_OPTIONS;
  readonly languages = LANGUAGES;
  readonly years = this.buildYears();

  ngOnInit() {
    this.loadTrending();
    this.route.queryParams.subscribe(params => {
      const mode = params['mode'];
      this.currentMode.set(mode ?? null);

      if (mode === 'popular') {
        this.isLoading.set(true);
        this.hasSearched.set(true);
        this.currentPage.set(1);
        this.movieService.discoverMovies({ sortBy: 'popularity.desc', page: 1 })
          .subscribe(({ movies, totalPages }) => {
            this.movies.set(movies);
            this.totalPages.set(Math.min(totalPages, 5));
            this.isLoading.set(false);
          });

      } else if (mode === 'toprated') {
        this.isLoading.set(true);
        this.hasSearched.set(true);
        this.currentPage.set(1);
        this.movieService.discoverMovies({ sortBy: 'vote_average.desc', minRating: 7, page: 1 })
          .subscribe(({ movies, totalPages }) => {
            this.movies.set(movies);
            this.totalPages.set(Math.min(totalPages, 5));
            this.isLoading.set(false);
          });

      } else if (mode === 'recommended') {
        this.loadRecommended(1);
      }
    });
  }

  private getRecommendedGenres(): number[] {
    const entries = this.libraryService.entries();
    const genreCounts: Record<number, number> = {};
    for (const entry of entries) {
      for (const gId of entry.movie.genreIds ?? []) {
        genreCounts[gId] = (genreCounts[gId] ?? 0) + 1;
      }
    }
    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => Number(id));
  }

  private loadRecommended(page: number) {
    const topGenres = this.getRecommendedGenres();
    if (topGenres.length === 0) return;

    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.currentPage.set(page);

    this.movieService.discoverMovies({ genres: topGenres, sortBy: 'popularity.desc', page })
      .subscribe(({ movies, totalPages }) => {
        this.movies.set(movies);
        this.totalPages.set(Math.min(totalPages, 5));
        this.isLoading.set(false);
      });
  }

  private loadPageForMode(page: number) {
    const mode = this.currentMode();
    if (mode === 'recommended') {
      this.loadRecommended(page);
    } else if (mode === 'popular') {
      this.isLoading.set(true);
      this.currentPage.set(page);
      this.movieService.discoverMovies({ sortBy: 'popularity.desc', page })
        .subscribe(({ movies }) => {
          this.movies.set(movies);
          this.isLoading.set(false);
        });
    } else if (mode === 'toprated') {
      this.isLoading.set(true);
      this.currentPage.set(page);
      this.movieService.discoverMovies({ sortBy: 'vote_average.desc', minRating: 7, page })
        .subscribe(({ movies }) => {
          this.movies.set(movies);
          this.isLoading.set(false);
        });
    } else {
      this.onSearch(page);
    }
  }

  loadTrending(page = 1) {
    this.isLoading.set(true);
    this.trendingPage.set(page);
    this.movieService.discoverMovies({ sortBy: 'popularity.desc', page })
      .subscribe(({ movies, totalPages }) => {
        this.trending.set(movies);
        this.trendingTotalPages.set(Math.min(totalPages, 5));
        this.isLoading.set(false);
      });
  }

  nextTrendingPage() {
    if (this.trendingPage() < this.trendingTotalPages())
      this.loadTrending(this.trendingPage() + 1);
  }

  prevTrendingPage() {
    if (this.trendingPage() > 1)
      this.loadTrending(this.trendingPage() - 1);
  }

  onSearch(page = 1) {
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.currentPage.set(page);

    const tab = this.activeTab();

    if (tab === 'person') {
      const q = this.personQuery().trim();
      if (!q) { this.isLoading.set(false); return; }
      this.movieService.searchByPerson(q, page).subscribe({
        next: ({ movies, totalPages }) => {
          this.movies.set(movies);
          this.totalPages.set(totalPages);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
      return;
    }

    if (tab === 'collaborators') {
      const names = this.collaboratorInputs().map(n => n.trim()).filter(n => n.length > 0);
      if (names.length === 0) { this.isLoading.set(false); return; }
      this.movieService.searchByCollaborators(names, page).subscribe({
        next: ({ movies, totalPages }) => {
          this.movies.set(movies);
          this.totalPages.set(totalPages);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
      return;
    }

    const q = this.searchQuery().trim();
    const hasFilters =
      this.selectedGenres().length > 0 ||
      !!this.selectedYear() ||
      this.minRating() > 0 ||
      !!this.selectedLanguage() ||
      this.minRuntime() > 0 ||
      this.maxRuntime() > 0 ||
      !!this.colorType() ||
      this.inTheaters() ||
      this.sortBy() !== 'popularity.desc';

    if (!q && !hasFilters) {
      this.isLoading.set(false);
      this.hasSearched.set(false);
      return;
    }

    if (q && !hasFilters) {
      this.movieService.searchMovies(q, page).subscribe({
        next: ({ movies, totalPages }) => {
          this.movies.set(movies);
          this.totalPages.set(totalPages);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    } else {
      this.movieService.discoverMovies({
        query: q || undefined,
        genres: this.selectedGenres(),
        year: this.selectedYear(),
        minRating: this.minRating(),
        sortBy: this.sortBy(),
        language: this.selectedLanguage(),
        minRuntime: this.minRuntime() || undefined,
        maxRuntime: this.maxRuntime() || undefined,
        colorType: this.colorType(),
        inTheaters: this.inTheaters(),
        page,
      }).subscribe({
        next: ({ movies, totalPages }) => {
          this.movies.set(movies);
          this.totalPages.set(totalPages);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  clearSearch() {
    this.searchQuery.set('');
    this.personQuery.set('');
    this.collaboratorInputs.set(['', '']);
    this.selectedGenres.set([]);
    this.selectedYear.set('');
    this.minRating.set(0);
    this.sortBy.set('popularity.desc');
    this.selectedLanguage.set('');
    this.minRuntime.set(0);
    this.maxRuntime.set(0);
    this.colorType.set('');
    this.inTheaters.set(false);
    this.movies.set([]);
    this.hasSearched.set(false);
    this.currentPage.set(1);
    this.currentMode.set(null);
  }

  toggleGenre(id: number) {
    const current = this.selectedGenres();
    this.selectedGenres.set(
      current.includes(id) ? current.filter(g => g !== id) : [...current, id]
    );
  }

  isGenreSelected(id: number): boolean {
    return this.selectedGenres().includes(id);
  }

  updateCollaborator(index: number, value: string) {
    const updated = [...this.collaboratorInputs()];
    updated[index] = value;
    this.collaboratorInputs.set(updated);
  }

  addCollaborator() {
    if (this.collaboratorInputs().length < 5)
      this.collaboratorInputs.set([...this.collaboratorInputs(), '']);
  }

  removeCollaborator(index: number) {
    const updated = this.collaboratorInputs().filter((_, i) => i !== index);
    this.collaboratorInputs.set(updated.length >= 2 ? updated : [...updated, '']);
  }

  nextPage() {
    const next = this.currentPage() + 1;
    if (next > this.totalPages()) return;
    this.loadPageForMode(next);
  }

  prevPage() {
    const prev = this.currentPage() - 1;
    if (prev < 1) return;
    this.loadPageForMode(prev);
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
    if (!this.hasSearched()) return 'Trending This Week';
    const mode = this.currentMode();
    if (mode === 'popular') return 'Popular Now';
    if (mode === 'toprated') return 'Top Rated of All Time';
    if (mode === 'recommended') return 'Recommended For You';
    const tab = this.activeTab();
    if (tab === 'person') return `Movies featuring "${this.personQuery()}"`;
    if (tab === 'collaborators') {
      const names = this.collaboratorInputs().filter(n => n.trim());
      return `Movies with ${names.join(' & ')}`;
    }
    const q = this.searchQuery().trim();
    return q ? `Results for "${q}"` : 'Filtered Results';
  }

  get activeFilterCount(): number {
    return this.selectedGenres().length +
      (this.selectedYear() ? 1 : 0) +
      (this.minRating() > 0 ? 1 : 0) +
      (this.selectedLanguage() ? 1 : 0) +
      (this.minRuntime() > 0 ? 1 : 0) +
      (this.maxRuntime() > 0 ? 1 : 0) +
      (this.colorType() ? 1 : 0) +
      (this.inTheaters() ? 1 : 0) +
      (this.sortBy() !== 'popularity.desc' ? 1 : 0);
  }

  private buildYears(): string[] {
    const current = new Date().getFullYear();
    return Array.from({ length: current - 1899 }, (_, i) => String(current - i));
  }
}