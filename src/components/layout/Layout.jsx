import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';
import {
  Book, Clock, Calendar, FileText, Award, HelpCircle,
  User, Menu, LogOut, Database, Share2, X
} from 'lucide-react';

export default function Layout() {
  const { 
    user, role, setRole, loading, isSidebarCollapsed, toggleSidebar, 
    isEmbed, isLocalDraft, fetchData, showEmbedModal, setShowEmbedModal 
  } = useStore();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  // Cross-Tab Sync Logic
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'lms_local_draft') {
        console.log("🔄 Local draft sync triggered from another tab.");
        fetchData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchData]);

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-auto md:overflow-hidden">

      {/* Global Minimal Sidebar (Desktop) */}
      {!isEmbed && (
        <aside className="hidden md:flex w-[72px] bg-[#1a1b1e] flex-col items-center py-6 gap-8 shrink-0 z-50 shadow-xl border-r border-[#2c2e33]">
          <button onClick={toggleSidebar} className={`p-2 hover:bg-white/10 rounded-xl transition-all ${isSidebarCollapsed ? 'text-white bg-white/10' : 'text-slate-400'}`} title={isSidebarCollapsed ? 'Expand Syllabus' : 'Collapse Syllabus'}>
            <Menu size={28} strokeWidth={2.5} />
          </button>
          <div className="w-8 h-px bg-[#2c2e33] shrink-0 -my-2" />
          <Link to="/" className={`p-3 rounded-2xl transition-all ${location.pathname === '/' || location.pathname === '/instructor' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-500 hover:text-white hover:bg-white/10'}`} title="Dashboard">
            <Book size={26} strokeWidth={2.5} />
          </Link>
          <button className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Schedule"><Clock size={26} strokeWidth={2.5} /></button>
          <button className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Calendar"><Calendar size={26} strokeWidth={2.5} /></button>
          <button className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Files"><FileText size={26} strokeWidth={2.5} /></button>
          <button className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Grades"><Award size={26} strokeWidth={2.5} /></button>

          <div className="mt-auto flex flex-col gap-4">
            <button className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Help"><HelpCircle size={26} strokeWidth={2.5} /></button>
          </div>
        </aside>
      )}

      {/* Mobile Navigation Overlay */}
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" onClick={() => setIsMobileNavOpen(false)}>
          <div className="w-[80px] bg-[#1a1b1e] h-full flex flex-col items-center py-8 gap-8 shadow-2xl border-r border-[#2c2e33] animate-in slide-in-from-left-full" onClick={e => e.stopPropagation()}>
            <Link to="/" onClick={() => setIsMobileNavOpen(false)} className={`p-3.5 rounded-2xl transition-all ${location.pathname === '/' || location.pathname === '/instructor' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-500 hover:text-white hover:bg-white/10'}`} title="Dashboard">
              <Book size={28} strokeWidth={2.5} />
            </Link>
            <button className="p-3.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><Clock size={28} strokeWidth={2.5} /></button>
            <button className="p-3.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><Calendar size={28} strokeWidth={2.5} /></button>
            <button className="p-3.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><FileText size={28} strokeWidth={2.5} /></button>
            <button className="p-3.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><Award size={28} strokeWidth={2.5} /></button>
            <div className="mt-auto flex flex-col gap-4">
              <button className="p-3.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><HelpCircle size={28} strokeWidth={2.5} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 h-auto md:h-screen relative z-10">

        {/* Top Navbar */}
        {!isEmbed && (
          <nav className={`h-[72px] bg-white border-b border-slate-200 items-center justify-between px-4 md:px-8 shrink-0 z-40 shadow-[0_1px_4px_rgba(0,0,0,0.02)] relative ${location.pathname !== '/' ? 'hidden md:flex' : 'flex'}`}>

            <div className="flex items-center gap-4">
              {/* Universal Hamburger: Toggles Mobile Nav on Mobile, Toggles Syllabus on Desktop */}
              {/* Hamburger menu removed per user request for de-cluttering */}

              <Link to="/" className="flex items-center gap-3 md:gap-4 group shrink-0">
                <div className="w-10 h-10 bg-[#7A1B1E] rounded-full flex items-center justify-center text-white font-black text-lg shadow-inner group-hover:rotate-12 transition-transform shrink-0">
                  I
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl md:text-2xl text-slate-900 tracking-tight hidden lg:block uppercase">IIT Madras</span>
                  <span className="font-extrabold text-xl text-slate-900 tracking-tight lg:hidden uppercase">IITM</span>
                  {isLocalDraft && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-tighter w-fit animate-pulse">
                      <Database className="w-3 h-3" /> LOCAL DRAFT
                    </div>
                  )}
                </div>
              </Link>
            </div>

            {!isEmbed && (
              <div className="flex items-center gap-2 md:gap-8 ml-auto">
                {/* Global Embed Tool (Desktop - Content Pages Only) */}
                {location.pathname !== '/' && (
                  <button 
                    onClick={() => setShowEmbedModal(true)}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all uppercase tracking-widest shadow-sm"
                    title="Embed this session"
                  >
                    <Share2 size={14} />
                    <span className="hidden xl:inline">Embed Note</span>
                  </button>
                )}

                {/* Dashboard-Only Tools (Profile, Sign Out, View Switcher) */}
                {location.pathname === '/' && (
                  <div className="flex items-center gap-4 md:gap-8">
                    {/* View Switcher toggle */}
                    <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setRole('learner')}
                        className={`px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-sm font-bold rounded-lg transition-all ${role === 'learner' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800 border border-transparent'}`}
                      >
                        <span className="md:hidden">L</span>
                        <span className="hidden md:inline">Learner</span>
                      </button>
                      <button
                        onClick={() => setRole('instructor')}
                        className={`px-4 py-2 md:px-4 md:py-2 text-[10px] md:text-sm font-bold rounded-lg transition-all ${role === 'instructor' ? 'bg-white text-orange-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800 border border-transparent'}`}
                      >
                        <span className="md:hidden">I</span>
                        <span className="hidden md:inline">Instructor</span>
                      </button>
                    </div>

                    {/* Profile Tools (Desktop/Large Only) */}
                    <div className="hidden xl:flex items-center gap-3 text-slate-700 font-bold text-sm bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                      <span className="uppercase tracking-widest text-[#7A1B1E]">{user?.name || 'Student Demo'}</span>
                      <User size={18} className="text-slate-400" />
                    </div>

                    <button className="hidden lg:flex text-slate-600 hover:text-slate-900 font-bold items-center gap-1.5 text-sm uppercase tracking-wider">
                      Updates <div className="w-2 h-2 bg-indigo-500 rounded-full mb-3 ml-0.5"></div>
                    </button>

                    <button className="p-2 md:px-5 md:py-2.5 border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-sm font-bold transition-all shadow-sm">
                      <span className="hidden md:block">SIGN OUT</span>
                      <LogOut size={18} className="md:hidden text-slate-600" strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        )}

        {/* View Content (Dashboard, Syllabus, etc) */}
        <div className="flex-1 overflow-y-auto md:h-[calc(100vh-72px)] md:overflow-hidden bg-slate-50/50 relative">
          <Outlet />
        </div>
      </main>

      {/* Global Embed Code Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Share2 size={18} />
                </div>
                <h3 className="font-black text-slate-900 tracking-tight">Embed Content</h3>
              </div>
              <button 
                onClick={() => setShowEmbedModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Copy the code below to integrate this modular session into your own LMS, website, or blog.</p>
              
              <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-indigo-300 leading-relaxed overflow-x-auto relative group border border-slate-700">
                <code>
                  {`<iframe \n  src="${window.location.origin}${window.location.pathname}?embed=true${window.location.hash}" \n  width="100%" \n  height="600px" \n  style="border: 0; border-radius: 12px; overflow: hidden;"\n></iframe>`}
                </code>
                <button 
                  onClick={() => {
                    const code = `<iframe src="${window.location.origin}${window.location.pathname}?embed=true${window.location.hash}" width="100%" height="600px" style="border: 0; border-radius: 12px; overflow: hidden;"></iframe>`;
                    navigator.clipboard.writeText(code);
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-white/10 hover:bg-indigo-500 hover:text-white rounded-md text-[10px] font-black transition-all uppercase opacity-0 group-hover:opacity-100 border border-white/20"
                >
                  Copy Snippet
                </button>
              </div>

              <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-[10px] sm:text-xs text-indigo-700 font-medium leading-normal">
                <HelpCircle size={14} className="shrink-0" />
                This iframe will dynamically load the current activity or video in a distraction-free student view.
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowEmbedModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
