import React from 'react';
import { Pen, Eraser, Square, Circle, Triangle, MoveRight, Baseline, RotateCcw, X, Edit3 } from 'lucide-react';

export default function FloatingAnnotationToolbar({
  isAnnotationMode,
  setIsAnnotationMode,
  currentTool,
  setCurrentTool,
  currentColor,
  setCurrentColor,
  onClear
}) {
  const tools = [
    { id: 'pen', icon: <Pen className="w-4 h-4"/>, label: 'Pen' },
    { id: 'line', icon: <MoveRight className="w-4 h-4"/>, label: 'Line' },
    { id: 'arrow', icon: <MoveRight className="w-4 h-4"/>, label: 'Arrow' },
    { id: 'rectangle', icon: <Square className="w-4 h-4"/>, label: 'Rectangle' },
    { id: 'ellipse', icon: <Circle className="w-4 h-4"/>, label: 'Ellipse' },
    { id: 'triangle', icon: <Triangle className="w-4 h-4"/>, label: 'Triangle' },
    { id: 'graph', icon: <Baseline className="w-4 h-4"/>, label: 'Graph Axes' },
    { id: 'eraser', icon: <Eraser className="w-4 h-4"/>, label: 'Eraser' }
  ];

  const colors = ['#dc2626', '#16a34a', '#2563eb', '#4f46e5', '#9333ea', '#eab308', '#0f172a'];

  // Not drawing? Just show the FAB
  if (!isAnnotationMode) {
    return (
      <button 
        onClick={() => setIsAnnotationMode(true)}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-12 h-12 md:w-14 md:h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all z-50 group border-2 border-white"
        title="Annotate Document"
      >
        <Edit3 className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  // Active Drawing Mode
  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 flex flex-col gap-3 items-end z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
      
      {/* Tool Palette Mobile Responsive Wrap */}
      <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-3 border border-slate-200/80 w-[calc(100vw-32px)] md:w-auto max-w-sm flex flex-col gap-3 relative origin-bottom-right">
        
        {/* Color Palette Row */}
        <div className="flex justify-between md:justify-center items-center gap-1 md:gap-3 bg-slate-50/80 rounded-xl border border-slate-100 p-2 overflow-x-auto hide-scroll">
           {colors.map(c => (
             <button
                key={c}
                onClick={() => setCurrentColor(c)}
                className={`w-6 h-6 md:w-6 md:h-6 rounded-full transition-all shrink-0 ${currentColor === c ? 'scale-[1.25] shadow-md ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110 opacity-80 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
             />
           ))}
        </div>

        {/* Tools Scrollable Row */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto hide-scroll custom-scrollbar pb-1">
          <div className="flex items-center gap-1 shrink-0">
            {tools.map(t => (
              <button
                 key={t.id}
                 onClick={() => setCurrentTool(t.id)}
                 className={`p-2.5 rounded-xl transition-all shrink-0 flex items-center justify-center ${currentTool === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                 title={t.label}
              >
                 {t.icon}
              </button>
            ))}
          </div>
          
          <div className="flex items-center shrink-0 border-l border-slate-200 ml-1 pl-2">
            <button onClick={onClear} className="p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors shrink-0 flex items-center justify-center" title="Clear All Drawings">
               <RotateCcw className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Close Button */}
      <button 
        onClick={() => setIsAnnotationMode(false)}
        className="w-12 h-12 md:w-14 md:h-14 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-900 transition-colors border-2 border-white shrink-0"
        title="Close Annotation Mode"
      >
        <X className="w-5 h-5 md:w-6 md:h-6" />
      </button>
    </div>
  );
}
