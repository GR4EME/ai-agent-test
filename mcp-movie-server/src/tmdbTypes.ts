// TMDb API Types
export interface MovieSearchResult {
  page: number;
  results: Array<{
    id: number;
    title: string;
    release_date: string;
    overview: string;
    vote_average: number;
    genre_ids: number[];
  }>;
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieDetails {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  vote_average: number;
  genres: Genre[];
}

export interface PersonSearchResult {
  page: number;
  results: Array<{
    id: number;
    name: string;
    known_for_department: string;
  }>;
}

export interface PersonDetails {
  id: number;
  name: string;
  birthday: string;
  known_for_department: string;
  biography: string;
  deathday: string | null;
  place_of_birth: string | null;
  popularity: number;
}

export interface MovieCredit {
  cast: Array<{
    id: number;
    title: string;
    release_date: string;
  }>;
}

export interface TopRatedMovies {
  page: number;
  results: Array<{
    id: number;
    title: string;
    release_date: string;
    vote_average: number;
  }>;
} 