/**
 * Film Domain Entity
 * Pure domain model - no framework dependencies
 */

export interface FilmProps {
  id: string;
  tmdbId: number;
  title: string;
  year: string | null;
  poster: string | null;
  plot: string | null;
  director: string | null;
  actors: string | null;
  genre: string | null;
  runtime: string | null;
  tmdbRating: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFilmProps {
  tmdbId: number;
  title: string;
  year?: string | null;
  poster?: string | null;
  plot?: string | null;
  director?: string | null;
  actors?: string | null;
  genre?: string | null;
  runtime?: string | null;
  tmdbRating?: string | null;
}

export class Film {
  readonly id: string;
  readonly tmdbId: number;
  readonly title: string;
  readonly year: string | null;
  readonly poster: string | null;
  readonly plot: string | null;
  readonly director: string | null;
  readonly actors: string | null;
  readonly genre: string | null;
  readonly runtime: string | null;
  readonly tmdbRating: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: FilmProps) {
    this.id = props.id;
    this.tmdbId = props.tmdbId;
    this.title = props.title;
    this.year = props.year;
    this.poster = props.poster;
    this.plot = props.plot;
    this.director = props.director;
    this.actors = props.actors;
    this.genre = props.genre;
    this.runtime = props.runtime;
    this.tmdbRating = props.tmdbRating;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Returns summary for lists/cards
   */
  toSummary(): { id: string; title: string; year: string | null; poster: string | null } {
    return {
      id: this.id,
      title: this.title,
      year: this.year,
      poster: this.poster,
    };
  }
}
