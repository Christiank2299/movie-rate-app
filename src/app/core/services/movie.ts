import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Movie } from '../models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private http = inject(HttpClient);

  // Replace with your real TMDB v3 API key
  private readonly apiKey = 'eb1fd7c49e38a9a0634c0f3f06724a6b';
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

  searchMovies(query: string): Observable<Movie[]> {
    const url =
      `${this.baseUrl}/search/movie?query=${encodeURIComponent(query)}` +
      `&include_adult=false&language=en-US&page=1&api_key=${this.apiKey}`;

    return this.http.get<any>(url).pipe(
      map((response) => {
        const results = response?.results ?? [];

        return results.map((item: any): Movie => ({
          id: item.id ?? 0,
          title: item.title ?? 'Untitled',
          overview: item.overview ?? '',
          posterPath: item.poster_path ?? '',
          posterUrl: item.poster_path
            ? `${this.imageBaseUrl}${item.poster_path}`
            : '',
          backdropPath: item.backdrop_path ?? '',
          releaseDate: item.release_date ?? '',
          voteAverage: item.vote_average ?? 0,
          voteCount: item.vote_count ?? 0,
          popularity: item.popularity ?? 0,
          language: item.original_language ?? ''
        }));
      })
    );
  }
}