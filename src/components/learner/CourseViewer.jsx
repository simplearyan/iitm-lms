import React, { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import useStore from '../../store/useStore';
import { ChevronDown, ChevronRight, PlayCircle, FileText, CheckCircle2, ChevronLeft } from 'lucide-react';
import NoteViewer from './NoteViewer';
import ActivityEngine from './ActivityEngine';
import VideoViewer from './VideoViewer';

export default function CourseViewer() {
  const { courseId } = useParams();
  const { courses, isSidebarCollapsed } = useStore();
  const course = courses.find(c => c.id === courseId);
  
  const initialModule = course?.modules?.[0];
  const initialItem = initialModule?.items?.[0];
  
  const [activeItem, setActiveItem] = useState(initialItem || null);
  const [expandedModules, setExpandedModules] = useState([initialModule?.id]);

  if (!course) return <Navigate to="/" />;

  const currentModule = course.modules.find(m => m.items.some(i => i.id === activeItem?.id));

  const toggleModule = (mId) => {
    setExpandedModules(prev => 
      prev.includes(mId) ? prev.filter(id => id !== mId) : [...prev, mId]
    );
  };

  const getIcon = (type) => {
    if (type === 'video') return <PlayCircle className="w-4 h-4" />;
    if (type === 'note') return <FileText className="w-4 h-4" />;
    if (type === 'activity') return <CheckCircle2 className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-slate-50 overflow-hidden">
      {/* Course Sidebar */}
      <aside className={`flex flex-col border-slate-200 bg-white/50 shrink-0 h-[40vh] md:h-full z-10 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0 border-none' : 'border-r w-full md:w-80 opacity-100 flex-[0_0_auto]'}`}>
        <div className="w-full md:w-80 flex flex-col h-full min-w-full md:min-w-[320px]">
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
                          onClick={() => setActiveItem(item)}
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

      {/* Main Content Pane */}
      <section className="flex-1 flex flex-col h-[60vh] md:h-full relative bg-white">
        {!activeItem ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">
            Select a learning item to begin.
          </div>
        ) : (
          <div className={`flex-1 relative flex flex-col bg-slate-50 ${(activeItem.type === 'activity' || activeItem.type === 'video') ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            
            {/* Context Header (Hidden for all built-in types to maximize vertical screen space and use custom component headers) */}
            {activeItem.type !== 'activity' && activeItem.type !== 'video' && activeItem.type !== 'note' && (
              <div className={`m-14 mb-8 border-b pb-6 ${activeItem.type === 'note' ? 'border-transparent' : 'border-slate-100'}`}>
                 <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3 flex items-center gap-2">
                   <span>{currentModule?.title}</span>
                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                   <span className={activeItem.type === 'activity' ? 'text-orange-500' : (activeItem.type === 'video' ? 'text-blue-500' : 'text-emerald-500')}>{activeItem.type}</span>
                 </div>
                 
                 <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">{activeItem.title}</h1>
              </div>
            )}

            {/* Content Switcher */}
            <div className={`w-full ${(activeItem.type === 'activity' || activeItem.type === 'video') ? 'flex-1 overflow-hidden flex flex-col' : 'min-h-full pb-20'}`}>
              {activeItem.type === 'video' && <VideoViewer item={activeItem} currentModule={currentModule} />}
              {activeItem.type === 'note' && <NoteViewer item={activeItem} currentModule={currentModule} />}
              {activeItem.type === 'activity' && <ActivityEngine item={activeItem} course={course} />}
            </div>

          </div>
        )}
      </section>
    </div>
  );
}
