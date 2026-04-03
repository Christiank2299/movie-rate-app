import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, forkJoin, of } from 'rxjs';
// TO:
import { Movie, MovieDetails } from '../models/movie.model';

export interface DiscoverParams {
  query?: string;
  genres?: number[];
  year?: string;
  minRating?: number;
  sortBy?: string;
  page?: number;
  language?: string;
  minRuntime?: number;
  maxRuntime?: number;
  colorType?: 'color' | 'black_and_white' | '';
  inTheaters?: boolean;
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
    if (params.language) url += `&with_original_language=${params.language}`;
    if (params.minRuntime) url += `&with_runtime.gte=${params.minRuntime}`;
    if (params.maxRuntime) url += `&with_runtime.lte=${params.maxRuntime}`;
    if (params.colorType === 'black_and_white') url += `&with_keywords=12999`;
    if (params.colorType === 'color') url += `&without_keywords=12999`;
    if (params.inTheaters) {
      const today = new Date().toISOString().split('T')[0];
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      url += `&with_release_type=3|2&release_date.gte=${twoWeeksAgo}&release_date.lte=${today}&region=US`;
    }


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



searchByCollaborators(names: string[], page = 1): Observable<MoviePage> {
  if (names.length === 0) return of({ movies: [], totalPages: 1 });

  // Look up each person one at a time, then combine
  const personLookups$ = names.map(name => {
    const url = `${this.baseUrl}/search/person?query=${encodeURIComponent(name)}&include_adult=false&language=en-US&api_key=${this.apiKey}`;
    return this.http.get<any>(url).pipe(
      map(res => {
        const person = res?.results?.[0];
        return person ? { id: person.id, name: person.name } : null;
      })
    );
  });

  return forkJoin(personLookups$).pipe(
    switchMap(people => {
      const found = people.filter(p => p !== null) as { id: number; name: string }[];

      if (found.length === 0) return of({ movies: [], totalPages: 1 });

      // TMDB uses | for OR and , for AND between person IDs
      const castIds = found.map(p => p.id).join(',');

      const url = `${this.baseUrl}/discover/movie?with_cast=${castIds}&sort_by=popularity.desc&page=${page}&language=en-US&api_key=${this.apiKey}`;

      return this.http.get<any>(url).pipe(
        map(res => this.mapPage(res))
      );
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
  getMovieDetails(movieId: number): Observable<MovieDetails> {
    const url = `${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}&language=en-US&append_to_response=credits,videos`;
    return this.http.get<any>(url).pipe(
      map(details => {
        const director = details.credits?.crew?.find((c: any) => c.job === 'Director');
        const cast = details.credits?.cast?.slice(0, 10) ?? [];
        const trailer = details.videos?.results?.find(
          (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
        );
        return {
          id: details.id,
          title: details.title ?? 'Untitled',
          overview: details.overview ?? '',
          posterPath: details.poster_path ?? '',
          posterUrl: details.poster_path ? `${this.imageBaseUrl}${details.poster_path}` : '',
          backdropPath: details.backdrop_path ?? '',
          backdropUrl: details.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : '',
          releaseDate: details.release_date ?? '',
          runtime: details.runtime ?? 0,
          voteAverage: details.vote_average ?? 0,
          voteCount: details.vote_count ?? 0,
          popularity: details.popularity ?? 0,
          language: details.original_language ?? '',
          genreIds: details.genres?.map((g: any) => g.id) ?? [],
          genres: details.genres ?? [],
          languages: details.spoken_languages ?? [],
          status: details.status ?? '',
          tagline: details.tagline ?? '',
          budget: details.budget ?? 0,
          revenue: details.revenue ?? 0,
          director: director
            ? { name: director.name, profileUrl: director.profile_path
                ? `https://image.tmdb.org/t/p/w185${director.profile_path}` : '' }
            : null,
          cast,
          trailerKey: trailer?.key ?? null,
        };
      })
    );
  }
}

  