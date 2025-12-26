/**
 * Films API - Backend film endpoints
 */

import { api } from './client';

// Types
export interface BackendFilm {
  id: string;
  tmdbId: number;
  title: string;
  year: string | null;
  poster: string | null;
  plot: string | null;
  director: string | null;
  genre: string | null;
  runtime: string | null;
  tmdbRating: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterFilmInput {
  tmdbId: number;
  title: string;
  year?: string | null;
  poster?: string | null;
  plot?: string | null;
  director?: string | null;
  genre?: string | null;
  runtime?: string | null;
}

export interface RegisterFilmResponse {
  id: string;
  tmdbId: number;
  title: string;
  year: string | null;
  poster: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Register a film from TMDb in our backend (get or create)
 * Returns the internal film UUID for use with reviews
 */
export async function registerFilm(input: RegisterFilmInput): Promise<BackendFilm> {
  return api.post<BackendFilm>('/api/v1/films/tmdb', input);
}

/**
 * Get a film by TMDb ID from our backend
 */
export async function getFilmByTmdbId(tmdbId: number): Promise<BackendFilm | null> {
  try {
    return await api.get<BackendFilm>(`/api/v1/films/tmdb/${tmdbId}`);
  } catch {
    return null;
  }
}

/**
 * Get a film by internal UUID
 */
export async function getFilmById(id: string): Promise<BackendFilm> {
  return api.get<BackendFilm>(`/api/v1/films/${id}`);
}

export const filmsApi = {
  registerFilm,
  getFilmByTmdbId,
  getFilmById,
};

export default filmsApi;
