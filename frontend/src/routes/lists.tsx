import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { List, Plus, Heart, MessageSquare, User, Clock, TrendingUp, Search } from 'lucide-react';
import { getPopular, getImageUrl, type TMDbMovie } from '@/lib/api/tmdb';
import { FilmStrip } from '@/components/ui/FilmStrip';

/**
 * Lists page - Browse and create film lists (Letterboxd style)
 */
export const Route = createFileRoute('/lists')({
  component: ListsPage,
});

// Mock data for lists (will be replaced with real API data)
const MOCK_LISTS = [
  {
    id: '1',
    title: 'Best Films of 2024',
    description: 'My top picks from this year so far. Updated monthly.',
    user: { id: '1', name: 'FilmBuff42', avatar: null },
    filmCount: 25,
    likes: 142,
    comments: 18,
    updatedAt: '2 days ago',
    films: [] as TMDbMovie[],
  },
  {
    id: '2',
    title: 'Essential Sci-Fi Classics',
    description: 'The most influential science fiction films that shaped the genre.',
    user: { id: '2', name: 'CinemaLover', avatar: null },
    filmCount: 50,
    likes: 324,
    comments: 45,
    updatedAt: '1 week ago',
    films: [] as TMDbMovie[],
  },
  {
    id: '3',
    title: 'Hidden Gems You Missed',
    description: 'Underrated films that deserve more attention.',
    user: { id: '3', name: 'MovieNerd', avatar: null },
    filmCount: 30,
    likes: 89,
    comments: 12,
    updatedAt: '3 days ago',
    films: [] as TMDbMovie[],
  },
  {
    id: '4',
    title: 'Perfect Date Night Movies',
    description: 'Romantic films that are actually good.',
    user: { id: '4', name: 'DateNightPicks', avatar: null },
    filmCount: 40,
    likes: 256,
    comments: 33,
    updatedAt: '5 days ago',
    films: [] as TMDbMovie[],
  },
];

function ListsPage() {
  const [view, setView] = useState<'popular' | 'recent' | 'friends'>('popular');
  const [searchQuery, setSearchQuery] = useState('');

  // Get films to populate list previews
  const { data: popularFilms } = useQuery({
    queryKey: ['movies', 'popular'],
    queryFn: () => getPopular(),
  });

  // Enrich mock lists with actual film posters
  const lists = MOCK_LISTS.map((list, index) => ({
    ...list,
    films: popularFilms?.results.slice(index * 5, index * 5 + 5) || [],
  }));

  return (
    <div className="animate-fade-in">
      {/* Film Strip Header */}
      <FilmStrip height="md" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-text-primary flex items-center gap-3 text-3xl font-bold">
              <List className="text-letterboxd-green h-8 w-8" />
              Lists
            </h1>
            <p className="text-text-secondary mt-1">Curated collections from the community</p>
          </div>
          <button className="btn-primary w-full md:w-auto">
            <Plus className="h-4 w-4" />
            New List
          </button>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="text-text-tertiary absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lists..."
              className="input pl-10"
            />
          </div>

          {/* View Toggle */}
          <div className="bg-bg-secondary flex gap-1 rounded p-1">
            <button
              onClick={() => setView('popular')}
              className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
                view === 'popular'
                  ? 'bg-letterboxd-green text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Popular
            </button>
            <button
              onClick={() => setView('recent')}
              className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
                view === 'recent'
                  ? 'bg-letterboxd-green text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Clock className="h-4 w-4" />
              Recent
            </button>
          </div>
        </div>

        {/* Lists Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>

        {/* Load More */}
        <div className="mt-8 text-center">
          <button className="btn-secondary">Load More Lists</button>
        </div>
      </div>
    </div>
  );
}

interface ListCardProps {
  list: {
    id: string;
    title: string;
    description: string;
    user: { id: string; name: string; avatar: string | null };
    filmCount: number;
    likes: number;
    comments: number;
    updatedAt: string;
    films: TMDbMovie[];
  };
}

function ListCard({ list }: ListCardProps) {
  return (
    <div className="card hover:bg-bg-tertiary/30 overflow-hidden p-0 transition-colors">
      {/* Film Preview Row */}
      <div className="bg-bg-tertiary relative h-24 overflow-hidden">
        <div className="absolute inset-0 flex">
          {list.films.slice(0, 5).map((film) => (
            <div key={film.id} className="h-full shrink-0" style={{ width: '20%' }}>
              <img
                src={getImageUrl(film.poster_path, 'poster', 'small')}
                alt=""
                className="h-full w-full object-cover object-top"
              />
            </div>
          ))}
        </div>
        <div className="from-bg-secondary absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />

        {/* Film count badge */}
        <div className="bg-bg-primary/80 text-text-primary absolute bottom-2 right-2 rounded px-2 py-1 text-xs font-medium">
          {list.filmCount} films
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* User */}
        <div className="mb-2 flex items-center gap-2">
          <div className="bg-bg-tertiary flex h-6 w-6 items-center justify-center rounded-full">
            {list.user.avatar ? (
              <img
                src={list.user.avatar}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="text-text-tertiary h-3 w-3" />
            )}
          </div>
          <span className="text-text-secondary text-sm">{list.user.name}</span>
        </div>

        {/* Title */}
        <Link to="/lists/$id" params={{ id: list.id }} className="group">
          <h3 className="font-display text-text-primary group-hover:text-letterboxd-green text-lg font-semibold transition-colors">
            {list.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-text-tertiary mt-1 line-clamp-2 text-sm">{list.description}</p>

        {/* Stats */}
        <div className="text-text-tertiary mt-4 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {list.likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {list.comments}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {list.updatedAt}
          </span>
        </div>
      </div>
    </div>
  );
}
