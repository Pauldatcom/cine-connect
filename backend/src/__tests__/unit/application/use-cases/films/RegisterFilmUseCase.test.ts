/**
 * RegisterFilmUseCase unit tests
 */

import 'reflect-metadata';

import { RegisterFilmUseCase } from '@/application/use-cases/films/RegisterFilmUseCase';
import { Film } from '@/domain/entities/Film';
import { IFilmRepository } from '@/domain/repositories/IFilmRepository';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const FILM_ID = '22222222-2222-2222-2222-222222222222';
const TMDB_ID = 12345;

const mockFilmData = {
  id: FILM_ID,
  tmdbId: TMDB_ID,
  title: 'Test Movie',
  year: '2024',
  poster: null,
  backdrop: null,
  plot: null,
  director: null,
  actors: null,
  genre: null,
  runtime: null,
  tmdbRating: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockFilm = new Film(mockFilmData);

const mockFilmRepository: IFilmRepository = {
  findById: vi.fn(),
  findByTmdbId: vi.fn(),
  create: vi.fn(),
  upsertByTmdbId: vi.fn(),
  searchByTitle: vi.fn(),
  findByGenre: vi.fn(),
  findAllPaginated: vi.fn(),
};

describe('RegisterFilmUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.clearInstances();
    container.registerInstance<IFilmRepository>(IFilmRepository as symbol, mockFilmRepository);
  });

  it('should return existing film and created: false when film already exists', async () => {
    vi.mocked(mockFilmRepository.findByTmdbId).mockResolvedValue(mockFilm);

    const useCase = container.resolve(RegisterFilmUseCase);
    const result = await useCase.execute({
      tmdbId: TMDB_ID,
      title: 'Test Movie',
      year: '2024',
    });

    expect(result.film).toEqual(mockFilm);
    expect(result.created).toBe(false);
    expect(mockFilmRepository.findByTmdbId).toHaveBeenCalledWith(TMDB_ID);
    expect(mockFilmRepository.upsertByTmdbId).not.toHaveBeenCalled();
  });

  it('should upsert and return film with created: true when film does not exist', async () => {
    vi.mocked(mockFilmRepository.findByTmdbId).mockResolvedValue(null);
    vi.mocked(mockFilmRepository.upsertByTmdbId).mockResolvedValue(mockFilm);

    const useCase = container.resolve(RegisterFilmUseCase);
    const result = await useCase.execute({
      tmdbId: TMDB_ID,
      title: 'New Movie',
      year: '2025',
      poster: '/poster.jpg',
    });

    expect(result.film).toEqual(mockFilm);
    expect(result.created).toBe(true);
    expect(mockFilmRepository.findByTmdbId).toHaveBeenCalledWith(TMDB_ID);
    expect(mockFilmRepository.upsertByTmdbId).toHaveBeenCalledWith({
      tmdbId: TMDB_ID,
      title: 'New Movie',
      year: '2025',
      poster: '/poster.jpg',
    });
  });

  it('should pass full CreateFilmProps to upsertByTmdbId', async () => {
    const fullProps = {
      tmdbId: 999,
      title: 'Full Film',
      year: '2023',
      poster: '/p.jpg',
      plot: 'Plot',
      director: 'Director',
      actors: 'Actors',
      genre: 'Drama',
      runtime: '120',
      tmdbRating: '8.5',
    };
    const createdFilm = new Film({
      ...mockFilmData,
      id: 'another-id',
      ...fullProps,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(mockFilmRepository.findByTmdbId).mockResolvedValue(null);
    vi.mocked(mockFilmRepository.upsertByTmdbId).mockResolvedValue(createdFilm);

    const useCase = container.resolve(RegisterFilmUseCase);
    const result = await useCase.execute(fullProps);

    expect(result.created).toBe(true);
    expect(mockFilmRepository.upsertByTmdbId).toHaveBeenCalledWith(fullProps);
  });
});
