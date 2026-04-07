import { Component, inject, signal, Input, OnChanges, SimpleChanges, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieService } from '../../../core/services/movie.service';
import { LibraryService, WatchStatus } from '../../../core/services/library.service';
import { MovieDetails } from '../../../core/models/movie.model';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movie-detail.html',
})
export class MovieDetailComponent implements OnChanges {
  private movieService = inject(MovieService);
  private libraryService = inject(LibraryService);

  @Input() movieId: number | null = null;
  closed = output<void>();

  details = signal<MovieDetails | null>(null);
  isLoading = signal(false);

  @HostListener('document:keydown.escape')
  onEscape() { this.close(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['movieId'] && this.movieId !== null) {
      this.load(this.movieId);
    }
  }

  load(id: number) {
    this.isLoading.set(true);
    this.details.set(null);
    this.movieService.getMovieDetails(id).subscribe({
      next: (d) => { this.details.set(d); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  close() { this.closed.emit(); }

  addToLibrary(status: WatchStatus) {
    const d = this.details();
    if (!d) return;
    this.libraryService.addMovie(d, status);
  }

  updateStatus(status: WatchStatus) {
    const d = this.details();
    if (!d) return;
    this.libraryService.updateStatus(d.id, status);
  }

  isInLibrary(): boolean {
    return !!this.details() && this.libraryService.isInLibrary(this.details()!.id);
  }

  getStatus(): WatchStatus | undefined {
    const d = this.details();
    return d ? this.libraryService.getEntry(d.id)?.status : undefined;
  }

  get runtime(): string {
    const r = this.details()?.runtime ?? 0;
    if (!r) return '—';
    const h = Math.floor(r / 60);
    const m = r % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  get year(): string { return this.details()?.releaseDate?.slice(0, 4) ?? '—'; }

  get formattedBudget(): string {
    const b = this.details()?.budget ?? 0;
    return b ? '$' + (b / 1_000_000).toFixed(1) + 'M' : '—';
  }

  get formattedRevenue(): string {
    const r = this.details()?.revenue ?? 0;
    return r ? '$' + (r / 1_000_000).toFixed(1) + 'M' : '—';
  }

  profileUrl(path: string | null): string {
    return path ? `https://image.tmdb.org/t/p/w185${path}` : '';
  }

  filledStars(rating: number): number { return Math.round(rating / 2); }
  emptyStars(rating: number): number { return 5 - this.filledStars(rating); }
}