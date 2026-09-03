import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full border transition-all duration-300 ${
        isDark 
          ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400' 
          : 'bg-brand-50 border-brand-200 hover:bg-brand-100 text-brand-600'
      } ${className}`}
      title={isDark ? '☀️ Switch to Day Mode' : '🌙 Switch to Night Mode'}
    >
      <div className={`transition-all duration-300 ${isDark ? 'rotate-0 scale-100' : 'rotate-90 scale-0 w-0 overflow-hidden'}`}>
        <Sun className="w-4 h-4" />
      </div>
      <div className={`transition-all duration-300 ${!isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0 w-0 overflow-hidden'}`}>
        <Moon className="w-4 h-4" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {isDark ? 'Night' : 'Day'}
      </span>
    </button>
  );
}
