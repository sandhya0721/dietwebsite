import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardHref =
    user?.role === 'admin' ? '/admin' : user ? '/dashboard' : '/login';

  const navLinks = [
    { to: '/menu', label: 'Menu' },
    { to: '/plans', label: 'Plans' },
    { to: '/builder', label: 'Salad Builder' },
    ...(user
      ? [
          {
            to: dashboardHref,
            label: user.role === 'admin' ? 'Admin' : 'Dashboard',
          },
        ]
      : []),
    {
      to: '/cart',
      label: itemCount > 0 ? `Cart (${itemCount})` : 'Cart',
    },
  ];

  const handleSignOut = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F7F8F5]/95 backdrop-blur-sm border-b border-[#DCE3D8]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Wordmark */}
        <Link
          to="/"
          className="font-display text-xl font-semibold tracking-tight text-[#16221A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1B5E37] rounded"
        >
          Verdant Bowl
        </Link>

        {/* Zone 2: 4-5 Concise Single-Line Text Nav Links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4D5E53]"
        >
          {navLinks.map((link) => {
            const active =
              location.pathname === link.to ||
              (link.to !== '/' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 ${
                  active
                    ? 'text-[#16221A] border-[#1B5E37]'
                    : 'border-transparent hover:text-[#16221A] hover:border-[#DCE3D8]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="hidden md:flex items-center shrink-0">
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-[#16221A] bg-white border border-[#DCE3D8] rounded-lg hover:bg-[#EEF2EC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-[#1B5E37] rounded-lg hover:bg-[#154A2B] transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="md:hidden p-2.5 text-[#16221A] rounded-lg hover:bg-[#EEF2EC] cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#DCE3D8] bg-white px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 px-3 text-sm font-medium text-[#16221A] rounded-lg hover:bg-[#EEF2EC]"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-[#DCE3D8]">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 text-sm font-medium text-[#16221A] border border-[#DCE3D8] rounded-lg hover:bg-[#EEF2EC] cursor-pointer"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center py-2.5 px-4 text-sm font-medium text-white bg-[#1B5E37] rounded-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
