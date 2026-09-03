import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  return (
    <div
      className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50/80 border border-amber-200/80 text-amber-800 shadow-sm select-none ${className}`}
      title="Gurukul by Ruby — Classroom Mode"
    >
      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-sm">
        <BookOpen className="w-3 h-3" />
      </div>
      <span className="text-[11px] font-bold tracking-tight text-amber-900">
        Classroom
      </span>
      <Sparkles className="w-3 h-3 text-amber-500" />
    </div>
  );
}
