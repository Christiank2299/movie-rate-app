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
}