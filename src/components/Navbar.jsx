import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, BookOpen, GraduationCap } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isTeacher = profile?.role === 'teacher';

  return (
    <header className="glass-panel border-b border-brand-100/60 dark:border-slate-800/80 sticky top-0 z-40 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 group-hover:shadow-brand-500/40 transition-all duration-300">
            {isTeacher ? <GraduationCap className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-brand-700 dark:text-white tracking-tight leading-tight">
              Gurukul <span className="text-brand-500 font-bold text-sm">by Ruby</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5 tracking-wide">
              Interactive Learning Platform ✨
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Day / Night Toggle */}
          <ThemeToggle />

          {user && (
            <>
              {/* Profile Pill */}
              <div className="flex items-center gap-2.5 bg-brand-50 dark:bg-slate-800/90 border border-brand-100 dark:border-slate-700/80 pl-2 pr-3.5 py-1.5 rounded-full shadow-sm">
                <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {profile?.full_name ? profile.full_name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {profile?.full_name || 'User'}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isTeacher ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                      {profile?.role || 'student'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all duration-200 shadow-sm"
                title="Sign Out"
                aria-label="Sign Out"
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
