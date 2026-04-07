export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string;
  posterUrl: string;
  backdropPath?: string;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  language: string;
  genreIds?: number[];
}


export interface MovieDetails extends Movie {
  backdropUrl: string;
  runtime: number;
  genres: { id: number; name: string }[];
  languages: { english_name: string; iso_639_1: string }[];
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  director: { name: string; profileUrl: string } | null;
  cast: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
  }[];
  trailerKey: string | null;
}