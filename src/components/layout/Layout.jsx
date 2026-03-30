import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';
import { 
  Book, Clock, Calendar, FileText, Award, HelpCircle, 
  User, Menu, LogOut 
} from 'lucide-react';

export default function Layout() {
  const { role, setRole, loading, isSidebarCollapsed, toggleSidebar, isEmbed } = useStore();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Global Minimal Sidebar (Desktop) */}
      {!isEmbed && (
        <aside className="hidden md:flex w-[72px] bg-[#1a1b1e] flex-col items-center py-6 gap-8 shrink-0 z-40 shadow-xl border-r border-[#2c2e33]">
          <button onClick={toggleSidebar} className={`p-2 hover:bg-white/10 rounded-xl transition-all ${isSidebarCollapsed ? 'text-white bg-white/10' : 'text-slate-400'}`} title={isSidebarCollapsed ? 'Expand Syllabus' : 'Collapse Syllabus'}>
            <Menu size={28} strokeWidth={2.5} />
          </button>
          <div className="w-8 h-px bg-[#2c2e33] shrink-0 -my-2" />
          <Link to="/" className={`p-3 rounded-2xl transition-all ${location.pathname === '/' || location.pathname === '/instructor' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-500 hover:text-white hover:bg-white/10'}`} title="Dashboard">
            <Book size={26} strokeWidth={2.5} />
          </Link>
          <button className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Schedule"><Clock size={26} strokeWidth={2.5}/></button>
          <button className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Calendar"><Calendar size={26} strokeWidth={2.5}/></button>
          <button className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Files"><FileText size={26} strokeWidth={2.5}/></button>
          <button className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Grades"><Award size={26} strokeWidth={2.5}/></button>
          
          <div className="mt-auto flex flex-col gap-4">
            <button className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Help"><HelpCircle size={26} strokeWidth={2.5}/></button>
          </div>
        </aside>
      )}

      {/* Mobile Navigation Overlay */}
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setIsMobileNavOpen(false)}>
          <div className="w-[80px] bg-[#1a1b1e] h-full flex flex-col items-center py-8 gap-8 shadow-2xl border-r border-[#2c2e33] animate-in slide-in-from-left-full" onClick={e => e.stopPropagation()}>
            <Link to="/" onClick={() => setIsMobileNavOpen(false)} className={`p-3.5 rounded-2xl transition-all ${location.pathname === '/' || location.pathname === '/instructor' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-500 hover:text-white hover:bg-white/10'}`} title="Dashboard">
              <Book size={28} strokeWidth={2.5} />
            </Link>
            <button className="p-3.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><Clock size={28} strokeWidth={2.5}/></button>
            <button className="p-3.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><Calendar size={28} strokeWidth={2.5}/></button>
            <button className="p-3.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><FileText size={28} strokeWidth={2.5}/></button>
            <button className="p-3.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><Award size={28} strokeWidth={2.5}/></button>
            <div className="mt-auto flex flex-col gap-4">
              <button className="p-3.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><HelpCircle size={28} strokeWidth={2.5}/></button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
        
        {/* Top Navbar */}
        {!isEmbed && (
          <nav className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-30 shadow-[0_1px_4px_rgba(0,0,0,0.02)] relative">
            
            <div className="flex items-center gap-4">
              <button className="md:hidden text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsMobileNavOpen(true)}>
                <Menu size={24} strokeWidth={2.5} />
              </button>
              
              <Link to="/" className="flex items-center gap-3 md:gap-4 group">
                <div className="w-10 h-10 bg-[#7A1B1E] rounded-full flex items-center justify-center text-white font-black text-lg shadow-inner group-hover:scale-105 transition-transform">
                  I
                </div>
                <span className="font-extrabold text-xl md:text-2xl text-slate-900 tracking-tight hidden sm:block">IIT Madras</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4 md:gap-8">
              {/* View Switcher toggle */}
              <div className="flex items-center bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setRole('learner')}
                  className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${role === 'learner' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800 border border-transparent'}`}
                >
                  Learner
                </button>
                <button 
                  onClick={() => setRole('instructor')}
                  className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${role === 'instructor' ? 'bg-white text-orange-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800 border border-transparent'}`}
                >
                  Instructor
                </button>
              </div>
  
              {/* Profile Tools */}
              <div className="hidden lg:flex items-center gap-3 text-slate-700 font-bold text-sm bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                <span className="uppercase tracking-widest text-[#7A1B1E]">Student Demo</span>
                <User size={18} className="text-slate-400" />
              </div>
              
              <button className="hidden md:flex text-slate-600 hover:text-slate-900 font-bold items-center gap-1.5 text-sm uppercase tracking-wider">
                Updates <div className="w-2 h-2 bg-indigo-500 rounded-full mb-3 ml-0.5"></div>
              </button>
              
              <button className="p-2 md:px-5 md:py-2.5 border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-sm font-bold transition-all shadow-sm">
                <span className="hidden md:block">SIGN OUT</span>
                <LogOut size={18} className="md:hidden text-slate-600" strokeWidth={2.5} />
              </button>
            </div>
          </nav>
        )}

        {/* View Content (Dashboard, Syllabus, etc) */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 relative">
           <Outlet />
        </div>
      </main>
    </div>
  );
}
