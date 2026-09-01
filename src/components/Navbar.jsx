import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, Gem } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform">
            <Gem className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">Gurukul</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                by Ruby
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Live Interactive Learning</p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {/* Day / Night Toggle */}
          <ThemeToggle />

          {user && (
            <>
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-full">
                <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-semibold text-xs border border-rose-500/30">
                  {profile?.full_name ? profile.full_name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
                    {profile?.full_name || 'User'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Shield className="w-2.5 h-2.5 text-rose-500" />
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-medium tracking-wider">
                      {profile?.role || 'student'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-rose-500/10 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-500/30 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
