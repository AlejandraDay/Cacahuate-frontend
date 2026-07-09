import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const roleHome: Record<string, string> = {
  Parent: '/parent',
  Therapist: '/therapist',
  Admin: '/admin',
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const goHome = () => navigate(user ? roleHome[user.role] ?? '/dashboard' : '/dashboard');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black text-white border-b border-slate-800">
      <div className="max-w-full mx-auto px-4 sm:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            onClick={goHome}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-900 group-hover:from-blue-500 group-hover:to-blue-800 transition-all rounded-lg flex items-center justify-center text-lg leading-none">
              🥜
            </div>
            <span className="hidden sm:inline font-black text-lg tracking-tight text-white group-hover:text-blue-300 transition-colors">
              Cacahuate
            </span>
          </div>

          {/* Desktop Menu */}
          {user && (
            <div className="hidden sm:flex items-center gap-6">
              <NotificationBell />
              <div className="flex items-center gap-4 pl-6 border-l border-slate-700">
                <div className="text-right">
                  <p className="text-sm font-bold text-white leading-tight">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-slate-300 leading-tight capitalize">{user.role}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-black rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-5 py-2 text-slate-300 hover:text-white font-semibold text-sm transition-colors hover:bg-slate-800/50 rounded-lg"
              >
                Salir
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          {user && (
            <div className="sm:hidden flex items-center gap-3">
              <NotificationBell />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {user && isMenuOpen && (
          <div className="sm:hidden pb-4 pt-3 border-t border-slate-800 space-y-3">
            <div className="px-1 py-2">
              <p className="font-bold text-white text-sm">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-300 mt-1 capitalize">{user.role}</p>
            </div>
            <button
              onClick={() => { handleLogout(); setIsMenuOpen(false); }}
              className="w-full px-4 py-2.5 text-slate-300 hover:text-white font-semibold text-sm transition-colors hover:bg-slate-800/50 rounded-lg text-left"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
