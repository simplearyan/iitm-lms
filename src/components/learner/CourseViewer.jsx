import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import { ChevronDown, ChevronRight, PlayCircle, FileText, CheckCircle2, ChevronLeft, Share2, X, Menu } from 'lucide-react';
import NoteViewer from './NoteViewer';
import ActivityEngine from './ActivityEngine';
import VideoViewer from './VideoViewer';

export default function CourseViewer() {
  const { courseId, itemId } = useParams();
  const navigate = useNavigate();
  const { courses, isSidebarCollapsed, isEmbed } = useStore();
  const course = courses.find(c => c.id === courseId);
  
  const [expandedModules, setExpandedModules] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [isMobileSyllabusOpen, setIsMobileSyllabusOpen] = useState(false);

  // Sync activeItem and expandedModules with URL params
  useEffect(() => {
    if (!course) return;

    let targetItem = null;
    let targetModuleId = null;

    if (itemId) {
      // Find item in all modules
      course.modules.forEach(m => {
        const item = m.items.find(i => i.id === itemId);
        if (item) {
          targetItem = item;
          targetModuleId = m.id;
        }
      });
    }

    if (!targetItem) {
      // Fallback to first item if no itemId or item not found
      const firstModule = course.modules?.[0];
      targetItem = firstModule?.items?.[0];
      targetModuleId = firstModule?.id;
    }

    if (targetItem) {
      setActiveItem(targetItem);
      setIsMobileSyllabusOpen(false); // Auto-close on selection
      if (targetModuleId && !expandedModules.includes(targetModuleId)) {
        setExpandedModules(prev => [...new Set([...prev, targetModuleId])]);
      }
    }
  }, [course, itemId]);

  // Dynamic Browser Tab Title for SEO/UX
  useEffect(() => {
    if (activeItem) {
      const typeLabel = 
        activeItem.type === 'note' ? 'Reading' :
        activeItem.type === 'video' ? 'Video' :
        activeItem.type === 'activity' ? 'Assessment' : 'Course';
      document.title = `${typeLabel}: ${activeItem.title} | IITM Unified LMS`;
    } else if (course) {
      document.title = `${course.title} | IITM Unified LMS`;
    }
  }, [activeItem, course]);

  if (!course) return <Navigate to="/" />;

  const currentModule = course.modules.find(m => m.items.some(i => i.id === activeItem?.id));

  const toggleModule = (mId) => {
    setExpandedModules(prev => 
      prev.includes(mId) ? prev.filter(id => id !== mId) : [...prev, mId]
    );
  };

  const getIcon = (type) => {
    if (type === 'video') return <PlayCircle className="w-4 h-4 text-indigo-500" />;
    if (type === 'note') return <FileText className="w-4 h-4 text-emerald-500" />;
    if (type === 'activity') return <CheckCircle2 className="w-4 h-4 text-orange-500" />;
    if (type === 'assignment') return <CheckCircle2 className="w-4 h-4 text-pink-500" />;
    if (type === 'quiz') return <CheckCircle2 className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-72px)] w-full bg-slate-50 overflow-hidden relative">
      {/* Course Sidebar (Desktop) / Drawer (Mobile) */}
      {!isEmbed && (
        <aside className={`
          fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm md:relative md:bg-transparent md:backdrop-blur-none
          transition-all duration-300 ease-in-out
          ${isMobileSyllabusOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}
          ${isSidebarCollapsed ? 'md:w-0' : 'md:w-80'}
        `} onClick={() => setIsMobileSyllabusOpen(false)}>
          <div className={`
            flex flex-col border-r border-slate-200 bg-white shrink-0 h-full w-[85%] max-w-[320px] 
            transition-all duration-300 ease-in-out transform
            ${isMobileSyllabusOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isSidebarCollapsed ? 'md:w-0 md:opacity-0 md:pointer-events-none' : 'md:w-80 md:opacity-100'}
          `} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-slate-200 shrink-0 bg-white">
            <Link to="/" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-indigo-600 mb-3 uppercase tracking-wider transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h2 className="font-extrabold text-lg md:text-xl text-slate-800 leading-tight line-clamp-2">{course.title}</h2>
          </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto hide-scroll p-3 space-y-3 relative bg-[#f8fafc]">
          {course.modules?.map((module, idx) => {
            const isExpanded = expandedModules.includes(module.id);
            return (
              <div key={module.id} className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden transition-all">
                <button 
                  onClick={() => toggleModule(module.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-slate-800 text-sm tracking-tight">{module.title}</span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>
                
                {isExpanded && (
                  <div className="px-2 pb-2 space-y-1 bg-slate-50/50 pt-1">
                    {module.items.map(item => {
                      const isActive = activeItem?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigate(`/course/${courseId}/${item.id}`)}
                          className={`w-full flex items-start text-left p-2.5 rounded-lg text-sm font-medium transition-all ${
                            isActive 
                              ? 'bg-indigo-100/50 text-indigo-700 shadow-sm border border-indigo-200/50 pointer-events-none' 
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <span className={`mt-0.5 shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {getIcon(item.type)}
                          </span>
                          <span className="ml-3 leading-snug">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </aside>
      )}

      {/* Main Content Pane */}
      <section className="flex-1 flex flex-col h-full relative bg-white min-w-0">
        
        {/* Mobile Toolbar (Visible only on small screens) */}
        {!isEmbed && (
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shrink-0 z-[70]">
            <button 
              onClick={() => setIsMobileSyllabusOpen(true)}
              className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              <Menu size={16} />
              Syllabus
            </button>
            
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">
              {activeItem?.title}
            </div>
          </div>
        )}
        {!activeItem ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">
            Select a learning item to begin.
          </div>
        ) : (
          <div key={activeItem.id} className={`flex-1 relative flex flex-col bg-slate-50 ${(activeItem.type === 'activity' || activeItem.type === 'video') ? 'overflow-hidden' : 'overflow-y-auto'}`}>
             
            {/* Context Header (Title Strip - Hidden on Mobile per user request) */}
            {activeItem.type !== 'activity' && activeItem.type !== 'video' && activeItem.type !== 'note' && (
              <div className="hidden md:flex px-4 py-2 md:px-8 md:py-2.5 bg-slate-50/50 border-b border-slate-200 flex-col md:flex-row md:items-center gap-1 md:gap-4 shrink-0 transition-all">
                 <div className="flex items-center gap-2 text-[9px] font-bold tracking-widest text-slate-400 uppercase shrink-0">
                   <span>{currentModule?.title}</span>
                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                   <span className={activeItem.type === 'activity' ? 'text-orange-500' : (activeItem.type === 'video' ? 'text-blue-500' : 'text-emerald-500')}>{activeItem.type}</span>
                 </div>
                 <div className="h-3 w-px bg-slate-200 hidden md:block shrink-0"></div>
                 <h1 className="text-sm md:text-base font-bold text-slate-800 tracking-tight leading-tight truncate">{activeItem.title}</h1>
              </div>
            )}

            {/* Content Switcher */}
            <div className={`w-full ${(activeItem.type === 'activity' || activeItem.type === 'video') ? 'flex-1 overflow-hidden flex flex-col' : 'min-h-full pb-20'}`}>
              {activeItem.type === 'video' && <VideoViewer item={activeItem} currentModule={currentModule} />}
              {activeItem.type === 'note' && <NoteViewer item={activeItem} currentModule={currentModule} />}
              {(activeItem.type === 'activity' || activeItem.type === 'assignment' || activeItem.type === 'quiz') && (
                <ActivityEngine item={activeItem} course={course} />
              )}
            </div>

            {/* Embed Mode Watermark */}
            {isEmbed && (
              <div className="fixed bottom-4 right-4 z-50 pointer-events-auto">
                <a 
                  href="https://simplearyan.github.io/iitm-lms/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white/80 backdrop-blur border border-slate-200 rounded-full text-[10px] font-black text-slate-400 tracking-widest hover:text-indigo-600 transition-colors shadow-sm uppercase"
                >
                  Powered by IITM Unified LMS
                </a>
              </div>
            )}

          </div>
        )}
      </section>

    </div>
  );
}
