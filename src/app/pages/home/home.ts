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

  ngOnInit() {
    this.movieService.getPopular().subscribe(r => this.popular.set(r.slice(0, 6)));
    this.movieService.getTopRated().subscribe(r => this.topRated.set(r.slice(0, 6)));
  }

  get wantCount() { return this.libraryService.getByStatus('want').length; }
  get watchingCount() { return this.libraryService.getByStatus('watching').length; }
  get finishedCount() { return this.libraryService.getByStatus('finished').length; }
}