import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Reports', path: '/reports' },
    { name: 'Dashboard', path: '/dashboard' },
    ...(!isGuest ? [{ name: 'Report Issue', path: '/report' }] : []),
  ];

  const handleLogout = async () => {
    if (user) await signOut(auth);
    localStorage.removeItem('civiclens_guest');
    navigate('/login');
  };

  const handleLogin = () => navigate('/login');

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="urban-gradient rounded-md p-1">
              <span className="block h-6 w-6 text-white font-bold flex items-center justify-center">CL</span>
            </span>
            <span className="font-bold text-lg hidden sm:inline-block">Civic Lens</span>
          </Link>
          {isGuest && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Guest
            </span>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-urban-primary ${isActive(item.path) ? 'text-urban-primary' : 'text-muted-foreground'}`}
            >
              {item.name}
            </Link>
          ))}

          {user || isGuest ? (
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              {user ? 'Logout' : 'Exit Guest'}
            </Button>
          ) : (
            <Button size="sm" onClick={handleLogin}>
              Sign In
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-b border-border animate-fade-in">
          <div className="container px-4 py-4">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium p-2 rounded-md transition-colors ${isActive(item.path) ? 'bg-urban-primary/10 text-urban-primary' : 'hover:bg-muted'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {user || isGuest ? (
                <Button variant="destructive" size="sm" onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}>
                  {user ? 'Logout' : 'Exit Guest'}
                </Button>
              ) : (
                <Button size="sm" onClick={() => {
                  setIsMenuOpen(false);
                  handleLogin();
                }}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
