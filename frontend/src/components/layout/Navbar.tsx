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
  Heart,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';

/**
 * Main Navigation Bar - Exact Letterboxd style
 */
export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // TODO: Replace with real auth state
  const isAuthenticated = false;
  const user = { name: 'FilmFan', avatar: null };

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
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
    <header className="bg-bg-nav/95 backdrop-blur-strong sticky top-0 z-50">
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

            {/* Notifications (authenticated only) */}
            {isAuthenticated && (
              <button className="text-text-secondary hover:text-text-primary relative p-2 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="bg-letterboxd-orange absolute right-1 top-1 h-2 w-2 rounded-full" />
              </button>
            )}

            {/* Profile / Auth */}
            {isAuthenticated ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="hover:bg-bg-tertiary flex items-center gap-2 rounded-full p-1.5 transition-colors"
                >
                  <div className="bg-bg-tertiary border-border flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
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
                      <p className="text-text-primary font-medium">{user.name}</p>
                      <p className="text-text-tertiary text-xs">View profile</p>
                    </div>
                    <div className="py-1">
                      <DropdownLink to="/profil" icon={<User className="h-4 w-4" />}>
                        Profile
                      </DropdownLink>
                      <DropdownLink to="/films" icon={<Film className="h-4 w-4" />}>
                        Films
                      </DropdownLink>
                      <DropdownLink to="/likes" icon={<Heart className="h-4 w-4" />}>
                        Likes
                      </DropdownLink>
                      <DropdownLink to="/lists" icon={<List className="h-4 w-4" />}>
                        Lists
                      </DropdownLink>
                    </div>
                    <div className="border-border border-t py-1">
                      <DropdownLink to="/settings" icon={<Settings className="h-4 w-4" />}>
                        Settings
                      </DropdownLink>
                      <button className="hover:bg-bg-tertiary flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 transition-colors">
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
                  className="text-text-secondary hover:text-text-primary hidden px-3 py-2 text-sm font-medium transition-colors sm:block"
                >
                  Sign In
                </Link>
                <Link to="/profil" className="btn-primary py-1.5 text-sm">
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
