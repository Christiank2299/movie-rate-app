import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../../core/services/movie.service';
import { LibraryService } from '../../core/services/library.service';
import { Movie } from '../../core/models/movie.model';

export const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

export const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Newest First' },
  { value: 'release_date.asc', label: 'Oldest First' },
  { value: 'revenue.desc', label: 'Highest Grossing' },
];

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './discover.html',
})
export class Discover implements OnInit {
  private movieService = inject(MovieService);
  private libraryService = inject(LibraryService);

  // Search
  searchQuery = signal('');
  searchType = signal<'title' | 'person'>('title');

  // Filters
  selectedGenres = signal<number[]>([]);
  selectedYear = signal('');
  minRating = signal(0);
  sortBy = signal('popularity.desc');
  showFilters = signal(false);

  // Results
  movies = signal<Movie[]>([]);
  trending = signal<Movie[]>([]);
  isLoading = signal(false);
  hasSearched = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);

  readonly genres = GENRES;
  readonly sortOptions = SORT_OPTIONS;
  readonly years = this.buildYears();

  ngOnInit() {
    this.loadTrending();
  }

  loadTrending() {
    this.movieService.getTrending().subscribe({
      next: (results) => this.trending.set(results),
    });
  }

  onSearch(page = 1) {
  const q = this.searchQuery().trim();
  const hasQuery = q.length > 0;

  // sortBy !== default also counts as a filter
  const hasFilters =
    this.selectedGenres().length > 0 ||
    !!this.selectedYear() ||
    this.minRating() > 0 ||
    this.sortBy() !== 'popularity.desc';

  if (!hasQuery && !hasFilters) return;

  this.isLoading.set(true);
  this.hasSearched.set(true);
  this.currentPage.set(page);

  if (hasQuery && this.searchType() === 'person') {
    this.movieService.searchByPerson(q, page).subscribe({
      next: ({ movies, totalPages }) => {
        this.movies.set(movies);
        this.totalPages.set(totalPages);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  } else {
    // Always use discoverMovies when any filter or sort is active,
    // or when there's no query (pure filter/sort browse)
    const useDiscover = hasFilters || !hasQuery;

    if (!useDiscover) {
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
        query: hasQuery ? q : undefined,
        genres: this.selectedGenres(),
        year: this.selectedYear(),
        minRating: this.minRating(),
        sortBy: this.sortBy(),
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
}

  clearSearch() {
  this.searchQuery.set('');
  this.selectedGenres.set([]);
  this.selectedYear.set('');
  this.minRating.set(0);
  this.sortBy.set('popularity.desc');  // make sure this line stays
  this.movies.set([]);
  this.hasSearched.set(false);
  this.currentPage.set(1);
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

  nextPage() {
    if (this.currentPage() < this.totalPages()) this.onSearch(this.currentPage() + 1);
  }

  prevPage() {
    if (this.currentPage() > 1) this.onSearch(this.currentPage() - 1);
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
    const q = this.searchQuery().trim();
    if (q && this.searchType() === 'person') return `Movies featuring "${q}"`;
    if (q) return `Results for "${q}"`;
    return 'Filtered Results';
  }

  get activeFilterCount(): number {
    return this.selectedGenres().length +
      (this.selectedYear() ? 1 : 0) +
      (this.minRating() > 0 ? 1 : 0) +
      (this.sortBy() !== 'popularity.desc' ? 1 : 0);
  }

  private buildYears(): string[] {
    const current = new Date().getFullYear();
    return Array.from({ length: current - 1899 }, (_, i) => String(current - i));
  }
}