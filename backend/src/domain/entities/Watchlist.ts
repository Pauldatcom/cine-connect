/**
 * Watchlist Domain Entity
 * Pure domain model - no framework dependencies
 */

export interface WatchlistItemProps {
  id: string;
  userId: string;
  filmId: string;
  addedAt: Date;
}

export interface CreateWatchlistItemProps {
  userId: string;
  filmId: string;
}

export interface WatchlistItemWithFilm extends WatchlistItemProps {
  film: {
    id: string;
    tmdbId: number;
    title: string;
    year: string | null;
    poster: string | null;
    genre?: string | null;
  };
}

export class WatchlistItem {
  readonly id: string;
  readonly userId: string;
  readonly filmId: string;
  readonly addedAt: Date;

  constructor(props: WatchlistItemProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.filmId = props.filmId;
    this.addedAt = props.addedAt;
  }

  toJSON(): WatchlistItemProps {
    return {
      id: this.id,
      userId: this.userId,
      filmId: this.filmId,
      addedAt: this.addedAt,
    };
  }
}
