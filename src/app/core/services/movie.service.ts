import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of } from 'rxjs';
import { Movie } from '../models/movie.model';

export interface DiscoverParams {
  query?: string;
  genres?: number[];
  year?: string;
  minRating?: number;
  sortBy?: string;
  page?: number;
}

export interface MoviePage {
  movies: Movie[];
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class MovieService {
  private http = inject(HttpClient);

  private readonly apiKey = 'eb1fd7c49e38a9a0634c0f3f06724a6b';
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

  private mapMovie(item: any): Movie {
    return {
      id: item.id ?? 0,
      title: item.title ?? 'Untitled',
      overview: item.overview ?? '',
      posterPath: item.poster_path ?? '',
      posterUrl: item.poster_path ? `${this.imageBaseUrl}${item.poster_path}` : '',
      backdropPath: item.backdrop_path ?? '',
      releaseDate: item.release_date ?? '',
      voteAverage: item.vote_average ?? 0,
      voteCount: item.vote_count ?? 0,
      popularity: item.popularity ?? 0,
      language: item.original_language ?? '',
      genreIds: item.genre_ids ?? [],
    };
  }

  private mapPage(res: any): MoviePage {
    return {
      movies: (res?.results ?? []).map((item: any) => this.mapMovie(item)),
      totalPages: Math.min(res?.total_pages ?? 1, 500),
    };
  }

  // Simple title search
  searchMovies(query: string, page = 1): Observable<MoviePage> {
    const url = `${this.baseUrl}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=${page}&api_key=${this.apiKey}`;
    return this.http.get<any>(url).pipe(map(res => this.mapPage(res)));
  }

  // Discover with filters (genre, year, rating, sort)
  discoverMovies(params: DiscoverParams): Observable<MoviePage> {
    const p = params.page ?? 1;
    let url = `${this.baseUrl}/discover/movie?include_adult=false&language=en-US&page=${p}&api_key=${this.apiKey}`;

    if (params.sortBy) url += `&sort_by=${params.sortBy}`;
    if (params.genres?.length) url += `&with_genres=${params.genres.join(',')}`;
    if (params.year) url += `&primary_release_year=${params.year}`;
    if (params.minRating && params.minRating > 0) url += `&vote_average.gte=${params.minRating}&vote_count.gte=50`;

    return this.http.get<any>(url).pipe(map(res => this.mapPage(res)));
  }

  // Search by actor or director name
  searchByPerson(name: string, page = 1): Observable<MoviePage> {
    const searchUrl = `${this.baseUrl}/search/person?query=${encodeURIComponent(name)}&include_adult=false&language=en-US&page=1&api_key=${this.apiKey}`;

    return this.http.get<any>(searchUrl).pipe(
      switchMap(res => {
        const person = res?.results?.[0];
        if (!person) return of({ movies: [], totalPages: 1 });

        const discoverUrl = `${this.baseUrl}/discover/movie?with_cast=${person.id}&sort_by=popularity.desc&page=${page}&api_key=${this.apiKey}`;
        return this.http.get<any>(discoverUrl).pipe(map(r => this.mapPage(r)));
      })
    );
  }

  getTrending(): Observable<Movie[]> {
    const url = `${this.baseUrl}/trending/movie/week?api_key=${this.apiKey}`;
    return this.http.get<any>(url).pipe(
      map(res => (res?.results ?? []).map((item: any) => this.mapMovie(item)))
    );
  }

  getPopular(): Observable<Movie[]> {
    const url = `${this.baseUrl}/movie/popular?language=en-US&page=1&api_key=${this.apiKey}`;
    return this.http.get<any>(url).pipe(
      map(res => (res?.results ?? []).map((item: any) => this.mapMovie(item)))
    );
  }

  getTopRated(): Observable<Movie[]> {
    const url = `${this.baseUrl}/movie/top_rated?language=en-US&page=1&api_key=${this.apiKey}`;
    return this.http.get<any>(url).pipe(
      map(res => (res?.results ?? []).map((item: any) => this.mapMovie(item)))
    );
  }
}