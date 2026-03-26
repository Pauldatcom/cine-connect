import { Link } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import {
  Film,
  Search,
  User,
  Bell,
  Menu,
  X,
  Home,
  Clapperboard,
  Users,
  MessageCircle,
  List,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePendingFriendRequests, useRespondToFriendRequest } from '@/hooks/useFriends';

/**
 * Main Navigation Bar - Exact Letterboxd style
 */
export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: pendingRequests = [], isLoading: pendingLoading } =
    usePendingFriendRequests(isAuthenticated);
  const respondToRequest = useRespondToFriendRequest();

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close profile and notification menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/films?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="bg-bg-nav sticky top-0 z-50">
      {/* Main navbar */}
      <nav className="border-border border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Left section: Logo + Nav links */}
          <div className="flex items-center gap-1 lg:gap-6">
            {/* Logo */}
            <Link to="/" className="group flex shrink-0 items-center gap-2">
              <div className="bg-letterboxd-green group-hover:bg-letterboxd-green-dark flex h-8 w-8 items-center justify-center rounded transition-colors">
                <Film className="text-bg-primary h-4 w-4" />
              </div>
              <span className="font-display text-text-primary hidden text-lg font-bold md:block">
                CinéConnect
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden items-center lg:flex">
              <NavLink to="/" exact>
                <Home className="h-4 w-4 lg:hidden" />
                <span className="hidden lg:inline">Home</span>
              </NavLink>
              <NavLink to="/films">
                <Clapperboard className="h-4 w-4 lg:hidden" />
                <span className="hidden lg:inline">Films</span>
              </NavLink>
              <NavLink to="/discussion">
                <MessageCircle className="h-4 w-4 lg:hidden" />
                <span className="hidden lg:inline">Discussion</span>
              </NavLink>
              {isAuthenticated && (
                <>
                  <NavLink to="/lists">
                    <List className="h-4 w-4 lg:hidden" />
                    <span className="hidden lg:inline">Lists</span>
                  </NavLink>
                  <NavLink to="/members">
                    <Users className="h-4 w-4 lg:hidden" />
                    <span className="hidden lg:inline">Members</span>
                  </NavLink>
                </>
              )}
            </div>
          </div>

          {/* Right section: Search + Profile */}
          <div className="flex items-center gap-2">
            {/* Search button/input */}
            <div className="relative">
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search films..."
                    className="bg-bg-secondary border-border text-text-primary placeholder:text-text-tertiary focus:border-letterboxd-green h-9 w-48 rounded-l border px-3 text-sm focus:outline-none md:w-64"
                  />
                  <button
                    type="submit"
                    className="bg-letterboxd-green hover:bg-letterboxd-green-dark h-9 rounded-r px-3 transition-colors"
                  >
                    <Search className="text-bg-primary h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="text-text-tertiary hover:text-text-primary ml-2 p-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="text-text-secondary hover:text-text-primary p-2 transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-text-secondary hover:text-text-primary focus:ring-letterboxd-green focus:ring-offset-bg-nav rounded p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" aria-hidden />
              ) : (
                <Moon className="h-5 w-5" aria-hidden />
              )}
            </button>

            {/* Notifications: pending friend requests (authenticated only) */}
            {isAuthenticated && (
              <div ref={notificationRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="text-text-secondary hover:text-text-primary focus:ring-letterboxd-green focus:ring-offset-bg-nav relative rounded p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  aria-label={
                    pendingRequests.length > 0
                      ? `${pendingRequests.length} friend request(s)`
                      : 'Notifications'
                  }
                >
                  <Bell className="h-5 w-5" />
                  {pendingRequests.length > 0 && (
                    <span className="bg-letterboxd-orange absolute right-1 top-1 h-2 w-2 rounded-full" />
                  )}
                </button>
                {notificationOpen && (
                  <div className="bg-bg-secondary border-border absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border shadow-xl">
                    <div className="border-border border-b p-3">
                      <h3 className="text-text-primary flex items-center gap-2 font-medium">
                        <UserPlus className="h-4 w-4" />
                        Friend requests
                      </h3>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {pendingLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="text-letterboxd-green h-6 w-6 animate-spin" />
                        </div>
                      ) : pendingRequests.length === 0 ? (
                        <p className="text-text-tertiary p-4 text-center text-sm">
                          No pending requests
                        </p>
                      ) : (
                        <ul className="py-1">
                          {pendingRequests.map((req) => (
                            <li
                              key={req.id}
                              className="border-border hover:bg-bg-tertiary flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
                            >
                              <Link
                                to="/user/$id"
                                params={{ id: req.user.id }}
                                onClick={() => setNotificationOpen(false)}
                                className="min-w-0 flex-1"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="bg-bg-tertiary flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
                                    {req.user.avatarUrl ? (
                                      <img
                                        src={req.user.avatarUrl}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <User className="text-text-tertiary h-4 w-4" />
                                    )}
                                  </div>
                                  <span className="text-text-primary truncate text-sm font-medium">
                                    {req.user.username}
                                  </span>
                                </div>
                              </Link>
                              <div className="flex shrink-0 gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    respondToRequest.mutate(
                                      { requestId: req.id, accept: true },
                                      { onSettled: () => setNotificationOpen(false) }
                                    )
                                  }
                                  disabled={respondToRequest.isPending}
                                  className="bg-letterboxd-green hover:bg-letterboxd-green-dark text-bg-primary rounded px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  {respondToRequest.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    'Accept'
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    respondToRequest.mutate(
                                      { requestId: req.id, accept: false },
                                      { onSettled: () => setNotificationOpen(false) }
                                    )
                                  }
                                  disabled={respondToRequest.isPending}
                                  className="text-text-tertiary rounded px-2 py-1.5 text-xs transition-colors hover:text-red-400 disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {pendingRequests.length > 0 && (
                      <div className="border-border border-t p-2">
                        <Link
                          to="/members"
                          onClick={() => setNotificationOpen(false)}
                          className="text-letterboxd-green hover:text-letterboxd-green-dark block text-center text-sm font-medium"
                        >
                          View all in Members →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile / Auth */}
            {isAuthenticated ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="hover:bg-bg-tertiary flex items-center gap-2 rounded-full p-1.5 transition-colors"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  data-testid="profile-menu-trigger"
                >
                  <div className="bg-bg-tertiary border-border flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="text-text-secondary h-4 w-4" />
                    )}
                  </div>
                  <ChevronDown className="text-text-tertiary hidden h-3 w-3 md:block" />
                </button>

                {/* Profile Dropdown */}
                {profileMenuOpen && (
                  <div className="bg-bg-secondary border-border animate-fade-in absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-lg border shadow-xl">
                    <div className="border-border border-b p-3">
                      <p className="text-text-primary font-medium">{user?.username}</p>
                      <p className="text-text-tertiary text-xs">View profile</p>
                    </div>
                    <div className="py-1">
                      <DropdownLink to="/profil" icon={<User className="h-4 w-4" />}>
                        Profile
                      </DropdownLink>
                      <DropdownLink to="/films" icon={<Film className="h-4 w-4" />}>
                        Films
                      </DropdownLink>
                      <DropdownLink to="/members" icon={<Users className="h-4 w-4" />}>
                        Members
                      </DropdownLink>
                      <DropdownLink to="/lists" icon={<List className="h-4 w-4" />}>
                        Lists
                      </DropdownLink>
                    </div>
                    <div className="border-border border-t py-1">
                      <DropdownLink to="/settings" icon={<Settings className="h-4 w-4" />}>
                        Settings
                      </DropdownLink>
                      <button
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                        }}
                        className="hover:bg-bg-tertiary flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/profil"
                  search={{ mode: 'login' }}
                  className="text-text-secondary hover:text-text-primary hidden px-3 py-2 text-sm font-medium transition-colors sm:block"
                >
                  Sign In
                </Link>
                <Link
                  to="/profil"
                  search={{ mode: 'register' }}
                  className="btn-primary py-1.5 text-sm"
                >
                  Create Account
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-text-secondary hover:text-text-primary p-2 lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-border bg-bg-secondary animate-fade-in border-b lg:hidden">
          <div className="space-y-1 px-4 py-3">
            <MobileNavLink to="/" onClick={() => setMobileMenuOpen(false)}>
              <Home className="h-5 w-5" />
              Home
            </MobileNavLink>
            <MobileNavLink to="/films" onClick={() => setMobileMenuOpen(false)}>
              <Clapperboard className="h-5 w-5" />
              Films
            </MobileNavLink>
            <MobileNavLink to="/discussion" onClick={() => setMobileMenuOpen(false)}>
              <MessageCircle className="h-5 w-5" />
              Discussion
            </MobileNavLink>
            {isAuthenticated && (
              <>
                <MobileNavLink to="/lists" onClick={() => setMobileMenuOpen(false)}>
                  <List className="h-5 w-5" />
                  Lists
                </MobileNavLink>
                <MobileNavLink to="/members" onClick={() => setMobileMenuOpen(false)}>
                  <Users className="h-5 w-5" />
                  Members
                </MobileNavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * Desktop navigation link
 */
function NavLink({
  to,
  children,
  exact = false,
}: {
  to: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={exact ? { exact: true } : undefined}
      className="text-text-secondary hover:text-text-primary [&.active]:text-letterboxd-green flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  );
}

/**
 * Mobile navigation link
 */
function MobileNavLink({
  to,
  children,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="text-text-secondary hover:text-text-primary hover:bg-bg-tertiary [&.active]:text-letterboxd-green [&.active]:bg-letterboxd-green/10 flex items-center gap-3 rounded-lg px-3 py-3 transition-colors"
    >
      {children}
    </Link>
  );
}

/**
 * Dropdown menu link
 */
function DropdownLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="text-text-secondary hover:text-text-primary hover:bg-bg-tertiary flex items-center gap-3 px-4 py-2 text-sm transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
