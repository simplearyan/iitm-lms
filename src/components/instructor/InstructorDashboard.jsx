import React from 'react';
import useStore from '../../store/useStore';
import { Database, Plus, Edit2, Archive } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InstructorDashboard() {
  const { courses, exportData } = useStore();

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-orange-600 tracking-tight">Authoring Dashboard</h1>
          <p className="mt-2 text-slate-500 font-medium text-lg">Manage courses and deploy content</p>
        </div>
        
        <div className="flex gap-4">
          <button onClick={exportData} className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-3">
            <Database className="w-5 h-5"/>
            Export Database (data.json)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-extrabold text-xl text-slate-800 flex items-center gap-3">
            <Archive className="w-5 h-5 text-orange-500"/> Your Courses
          </h2>
          <button className="px-5 py-2.5 bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4"/> Create Course
          </button>
        </div>
        
        <div className="divide-y divide-slate-100">
          {courses.map(course => (
            <div key={course.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-6 group">
               <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-gradient-to-tr from-orange-100 to-amber-100 text-orange-600 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 shadow-inner">
                   {course.code.substring(0,2)}
                 </div>
                 <div>
                   <h3 className="font-extrabold text-slate-800 text-xl group-hover:text-orange-600 transition-colors">{course.title}</h3>
                   <div className="flex items-center gap-3 text-sm text-slate-500 mt-2 font-medium">
                     <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold tracking-widest">{course.code}</span>
                     <span>&bull;</span>
                     <span>{course.modules?.length || 0} Modules</span>
                     <span>&bull;</span>
                     <span>{course.program}</span>
                   </div>
                 </div>
               </div>
               
               <Link to={`/instructor/course/${course.id}`} className="flex items-center justify-center p-4 bg-slate-100 text-slate-500 hover:text-orange-600 hover:bg-orange-100 rounded-2xl transition-all self-end md:self-auto shrink-0">
                 <Edit2 className="w-6 h-6"/>
               </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
