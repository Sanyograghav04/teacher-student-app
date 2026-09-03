import React from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  BookOpen, 
  Clock, 
  Atom, 
  Compass, 
  Smile, 
  Heart, 
  MessageCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';

export default function ClassroomBlackboard({ 
  teacherName = "Ruby Ma'am", 
  userName = "Student",
  role = "student",
  activeClassCount = 1,
  onJoinClass = null 
}) {
  const isTeacher = role === 'teacher';

  return (
    <div className="w-full relative select-none">
      {/* Wooden Hanging Ceiling Lamp (from the image) */}
      <div className="flex justify-center -mb-2 relative z-20">
        <div className="flex flex-col items-center">
          <div className="w-1 h-5 bg-slate-400 dark:bg-slate-600"></div>
          <div className="w-16 h-7 bg-sky-600 rounded-t-full shadow-md relative flex items-center justify-center">
            <div className="absolute -bottom-2 w-10 h-3 bg-amber-200/90 rounded-full blur-[2px]"></div>
          </div>
          {/* Subtle warm cone light glow */}
          <div className="w-64 h-24 bg-amber-300/10 rounded-full blur-2xl pointer-events-none -mt-2"></div>
        </div>
      </div>

      {/* Main Blackboard Container with Real Wooden Border */}
      <div className="relative rounded-3xl bg-[#8c5324] p-3 sm:p-4 shadow-2xl shadow-amber-950/20 border-2 border-[#6d3e17]">
        {/* Inner Wood Trim */}
        <div className="relative rounded-2xl bg-[#1d3d2c] text-white p-5 sm:p-8 overflow-hidden border border-[#2d5940] shadow-inner">
          
          {/* Subtle Chalkboard Slate Texture Lines */}
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

          {/* Background Hand-Drawn Chalk Doodles (just like the chalkboard in user's image) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
            {/* Lightbulb in top center */}
            <g transform="translate(180, 20) scale(0.7)" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round">
              <path d="M40 50 A20 20 0 1 1 60 50 L58 65 L42 65 Z" />
              <line x1="45" y1="70" x2="55" y2="70" />
              <line x1="47" y1="75" x2="53" y2="75" />
              {/* Radiance rays */}
              <line x1="50" y1="20" x2="50" y2="10" />
              <line x1="25" y1="30" x2="18" y2="23" />
              <line x1="75" y1="30" x2="82" y2="23" />
              <line x1="15" y1="50" x2="5" y2="50" />
              <line x1="85" y1="50" x2="95" y2="50" />
            </g>

            {/* Geometry Triangle & Math Symbols */}
            <g transform="translate(20, 110) scale(0.6)" stroke="#ffffff" strokeWidth="2" fill="none">
              <polygon points="10,60 70,60 40,10" />
              <circle cx="40" cy="40" r="10" />
              <text x="85" y="45" fontSize="20" fill="#ffffff" fontFamily="sans-serif">a² + b² = c²</text>
            </g>

            {/* Chemistry Flask & Atom */}
            <g transform="translate(680, 30) scale(0.7)" stroke="#ffffff" strokeWidth="2" fill="none">
              <ellipse cx="40" cy="40" rx="35" ry="12" transform="rotate(30 40 40)" />
              <ellipse cx="40" cy="40" rx="35" ry="12" transform="rotate(-30 40 40)" />
              <circle cx="40" cy="40" r="5" fill="#ffffff" />
            </g>

            {/* Gears / Sun */}
            <g transform="translate(740, 120) scale(0.5)" stroke="#ffffff" strokeWidth="2" fill="none">
              <circle cx="40" cy="40" r="20" />
              <line x1="40" y1="10" x2="40" y2="70" />
              <line x1="10" y1="40" x2="70" y2="40" />
            </g>
          </svg>

          {/* Blackboard Content Header */}
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left Column: Hand-written Chalk Title & Greeting */}
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Gurukul Live Classroom Board</span>
                <span className="text-white/40">•</span>
                <span>Ruby Ma'am's Mentorship</span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight font-serif">
                  {isTeacher ? (
                    <span>Namaste, {teacherName}! Ready to inspire?</span>
                  ) : (
                    <span>Welcome to Class, {userName}!</span>
                  )}
                </h2>
                <p className="text-sm sm:text-base text-emerald-100/90 mt-1 font-sans leading-relaxed">
                  "Every question is a step toward understanding. Ask fearlessly and learn with joy."
                </p>
              </div>

              {/* Classroom Badges (Chalkboard style) */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#264e39] border border-emerald-500/30 text-xs font-medium text-emerald-200">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                  <span>Concept Learning</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#264e39] border border-emerald-500/30 text-xs font-medium text-emerald-200">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Daily DPP & Notes</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#264e39] border border-emerald-500/30 text-xs font-medium text-emerald-200">
                  <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
                  <span>Personal Attention</span>
                </div>
              </div>
            </div>

            {/* Right Column: Handcrafted Sticky Notes Pinned to the Board */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3.5 shrink-0">
              {/* Yellow Sticky Note (Teacher Notice) */}
              <div className="relative bg-[#fef3c7] text-[#78350f] p-4 rounded-xl shadow-lg border border-amber-300/80 transform rotate-1 hover:rotate-0 transition-transform duration-200 max-w-xs sm:w-64">
                {/* Red Pushpin */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-sm"></div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800/80 mb-1 flex items-center justify-between">
                  <span>Ruby Ma'am's Notice</span>
                  <span className="text-[10px] bg-amber-200/80 px-1.5 py-0.5 rounded font-mono">Today</span>
                </div>
                <p className="text-xs font-semibold leading-snug">
                  Keep your notebook & formula sheets open. Live doubt-solving starts with the class!
                </p>
              </div>

              {/* Active Classroom Status Card */}
              <div className="bg-[#14291e] border border-emerald-600/40 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-white shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div>
                    <div className="font-bold text-emerald-200">
                      {activeClassCount > 0 ? `${activeClassCount} Live Class Active` : 'No Class in Session'}
                    </div>
                    <div className="text-[10px] text-slate-300">
                      {activeClassCount > 0 ? 'Click to join your batch' : 'Check batch schedule'}
                    </div>
                  </div>
                </div>

                {onJoinClass && (
                  <button
                    type="button"
                    onClick={onJoinClass}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                  >
                    Enter Class
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Chalk Tray / Wooden Shelf with Chalk Sticks & Eraser */}
          <div className="mt-6 pt-3 border-t border-emerald-800/50 flex items-center justify-between text-[11px] text-emerald-200/70">
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-2 bg-white rounded-sm shadow-sm" title="White Chalk"></span>
              <span className="inline-block w-6 h-2 bg-amber-200 rounded-sm shadow-sm" title="Yellow Chalk"></span>
              <span className="inline-block w-6 h-2 bg-sky-200 rounded-sm shadow-sm" title="Blue Chalk"></span>
              <span className="inline-block w-12 h-3.5 bg-[#4a2e16] border border-[#6b4421] rounded shadow-inner ml-2" title="Chalkboard Duster"></span>
            </div>
            <div className="italic font-serif text-emerald-100/60 hidden sm:block">
              Gurukul by Ruby — Live Virtual Classroom & Tuition
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
