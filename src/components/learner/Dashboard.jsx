import React from 'react';
import useStore from '../../store/useStore';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LearnerDashboard() {
  const { courses } = useStore();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in pb-20">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">My Current Courses</h1>
          <p className="text-sm md:text-lg text-slate-600 font-medium">Cumulative Grade Point Average (CGPA) till this term - <span className="font-extrabold text-slate-900">7.0</span></p>
        </div>
        <div className="text-left md:text-right bg-white px-6 py-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col md:items-end w-full md:w-auto">
          <div className="text-sm md:text-lg font-black text-slate-900">28 March, 2026</div>
          <div className="text-xs md:text-sm text-slate-500 uppercase font-black tracking-widest mt-1 text-[#7A1B1E]">JANUARY 2026 TERM</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-[2rem] shadow-sm flex flex-col border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all hover:-translate-y-1 group overflow-hidden">
            
            {/* The Maroon Radial Header Banner */}
            <div className="bg-gradient-to-br from-[#5c1316] to-[#7A1B1E] text-white p-8 relative overflow-hidden h-56 flex flex-col shadow-inner">
              {/* Halftone / Radial Mask Overlay */}
              <div 
                  className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(circle at 3px 3px, white 1.5px, transparent 0)', backgroundSize: '24px 24px' }}
              ></div>
              
              <h2 className="text-2xl md:text-3xl font-black mb-1 relative z-10 leading-tight tracking-tight drop-shadow-md pr-4">{course.title}</h2>
              <p className="text-xs text-red-200 font-bold uppercase tracking-widest mb-6 relative z-10 bg-black/20 w-fit px-3 py-1 rounded-full">{course.type || 'FULL COURSE'}</p>
              
              <div className="mt-auto relative z-10 text-white/90">
                <span className="bg-white/10 text-white font-bold px-3 py-1.5 rounded-lg text-sm backdrop-blur-md shadow-sm inline-block">
                  {course.program || 'BS in Data Science'}
                </span>
              </div>
            </div>
            
            {/* Fake Grade Progress Table - Adapted from styling */}
            <div className="bg-slate-50/70 p-8 flex-1 border-b border-slate-100">
              <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                    <span className="text-sm font-semibold text-slate-600">Week 1 Assignment</span>
                    <span className="font-extrabold text-slate-900 text-base">92</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                    <span className="text-sm font-semibold text-slate-600">Week 2 Assignment</span>
                    <span className="font-extrabold text-slate-900 text-base">89</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-sm font-semibold text-slate-600">Quiz 1</span>
                    <span className="font-extrabold text-slate-900 text-base bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">100</span>
                  </div>
              </div>
            </div>

            <div className="bg-white p-5">
              <Link 
                to={`/course/${course.id}`}
                className="w-full justify-center text-[#7A1B1E] bg-red-50 hover:bg-red-100 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-colors border border-red-100"
              >
                Enter Portal <ChevronRight size={18} strokeWidth={2.5}/>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
