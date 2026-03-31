import React, { useState, useEffect, useMemo } from 'react';
import useStore from '../../store/useStore';
import WhiteboardOverlay from '../shared/WhiteboardOverlay';
import katex from 'katex';
import { 
  PenTool, CheckCircle2, ChevronRight, ChevronLeft, Bookmark, 
  Trash, MousePointer2, Minus, Circle, Square, MoveRight, Eraser, Triangle, Activity, X 
} from 'lucide-react';

const renderMathText = (text) => {
    let t = text;
    t = t.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
        try { return katex.renderToString(math, { displayMode: true, throwOnError: false }) } catch(e) { return math }
    });
    t = t.replace(/\$([^$\n]+?)\$/g, (match, math) => {
        try { return katex.renderToString(math, { displayMode: false, throwOnError: false }) } catch(e) { return math }
    });
    return <span dangerouslySetInnerHTML={{ __html: t }} />;
};

export default function ActivityEngine({ item, course }) {
  const { activityProgress, setActivityProgress, updateWhiteboardData } = useStore();
  
  // Use useMemo to ensure questions are consistent and reset correctly when item changes
  const questions = useMemo(() => {
    return item.questions || item.questionIds?.map(id => course.questions?.find(q => q.id === id)).filter(Boolean) || [];
  }, [item, course]);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // New states for the activity (like marked for review, tracking visits)
  const [visited, setVisited] = useState({});
  const [review, setReview] = useState({});
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Toolbar state (replicated directly from Classroom Preview)
  const [wbTool, setWbTool] = useState('pointer');
  const [wbColor, setWbColor] = useState('#0f172a');
  const [wbStrokeWidth, setWbStrokeWidth] = useState(2);

  // Mark first question as visited on mount
  useEffect(() => {
    if (questions.length > 0) {
      setVisited(prev => ({...prev, [questions[0].id]: true}));
    }
  }, [questions]);

  if (!questions || questions.length === 0) return <div className="p-8 text-center text-slate-500">No questions found.</div>;

  const question = questions[currentQIndex];

  const navigateQuestion = (idx) => {
     setVisited(prev => ({...prev, [questions[idx].id]: true}));
     setCurrentQIndex(idx);
     setIsPaletteOpen(false); // Auto-close on mobile
  };

  const getStatus = (qId) => {
     const hasAnswered = activityProgress[qId] !== undefined && 
        (Array.isArray(activityProgress[qId]) ? activityProgress[qId].length > 0 : true);
     const isReview = review[qId];
     
     if (hasAnswered && isReview) return 'answered-review';
     if (hasAnswered) return 'answered';
     if (isReview) return 'review';
     if (visited[qId]) return 'unanswered';
     return 'not-visited';
  };

  // Safe fetch function for answers
  const handleOptionSelect = (oIdx) => {
    if (question.type === 'checkbox') {
        const current = Array.isArray(activityProgress[question.id]) ? activityProgress[question.id] : [];
        if (current.includes(oIdx)) setActivityProgress(question.id, current.filter(i => i !== oIdx));
        else setActivityProgress(question.id, [...current, oIdx]);
    } else {
        setActivityProgress(question.id, oIdx);
    }
  };

  // Derive stats for palette
  const answeredCount = questions.filter(q => {
     const st = getStatus(q.id);
     return st === 'answered' || st === 'answered-review';
  }).length;
  const reviewCount = Object.values(review).filter(Boolean).length;
  const answeredReviewCount = questions.filter(q => getStatus(q.id) === 'answered-review').length;
  const visitedCount = Object.keys(visited).length;
  const trueUnanswered = visitedCount - answeredCount - (reviewCount - answeredReviewCount);
  const notVisitedCount = questions.length - visitedCount;

  return (
    <div key={item.id} className="w-full h-full flex flex-col animate-fade-in relative bg-slate-50 overflow-hidden">
      
      {/* Mobile Floating Palette Trigger */}
      <button 
        onClick={() => setIsPaletteOpen(true)}
        className="md:hidden fixed bottom-24 right-5 z-40 bg-slate-900 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center border-4 border-slate-50 transition-transform active:scale-95"
      >
        <Activity size={24} />
      </button>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 h-full p-2 md:p-4 lg:p-6 overflow-hidden">
          
          {/* Main Question Column */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden shadow-sm border border-slate-200 rounded-2xl relative min-h-[400px]">
             
             {/* Header */}
             <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
               <span className="font-extrabold text-lg text-slate-800">Question {currentQIndex + 1}</span>
               <div className="flex items-center space-x-3 text-sm">
                   <span className="text-slate-500 font-bold uppercase tracking-widest text-xs bg-slate-200/50 px-2 py-1 rounded">
                     {item.examType || (item.type === 'assignment' ? 'Graded Assignment' : 'Mock Exam Format')}
                   </span>
               </div>
             </div>

             {/* Dynamic Question Canvas Layer */}
             <div className="flex-1 relative overflow-y-auto p-6 md:p-8">
                
                {/* The Inline Whiteboard completely overlaps this container */}
                <WhiteboardOverlay 
                    questionId={`${item.id}-${question.id}-inline`} 
                    isInline={true}
                    toolProp={wbTool}
                    colorProp={wbColor}
                    strokeWidthProp={wbStrokeWidth}
                />

                {/* The text/options sit beneath it. If wbTool=pointer, clicks pass-through */}
                <div className="select-none h-full w-full">
                  <h3 className="text-lg md:text-xl text-slate-900 font-semibold mb-8 leading-relaxed selection:bg-red-100 relative z-0">
                     <LatexRenderer text={question.description || question.text} />
                  </h3>
                  
                  {/* Responsive Question Image */}
                  {question.image && (
                    <div className="mb-10 max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative z-0">
                      <img src={question.image} alt="Question Visual" className="w-full h-auto object-contain bg-slate-50 p-4" />
                    </div>
                  )}
                  
                  <div className="space-y-4 max-w-3xl relative z-0">
                  {question.options?.map((opt, oIdx) => {
                    const ans = activityProgress[question.id];
                    const isChecked = ans === oIdx || (Array.isArray(ans) && ans.includes(oIdx));
                    const alphaLabel = String.fromCharCode(65 + oIdx);

                    const labelClass = isChecked 
                       ? 'border-2 border-[#7A1B1E] bg-red-50 text-[#7A1B1E]' 
                       : 'border border-slate-300 hover:bg-slate-50 text-slate-800';
                    
                    const circleClass = isChecked 
                       ? 'border-[#7A1B1E] bg-[#7A1B1E]' 
                       : 'border-slate-300 bg-white';

                    return (
                      <label 
                        key={oIdx} 
                        className={`flex items-start p-4 md:p-5 rounded-2xl cursor-pointer transition-all ${labelClass}`}
                      >
                        <input 
                          type="radio" 
                          className="hidden" 
                          checked={isChecked}
                          onChange={() => handleOptionSelect(oIdx)}
                        />
                        <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mr-4 shadow-sm transition-colors ${circleClass}`}>
                             {isChecked ? (
                                 <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                             ) : (
                                 <span className="text-[10px] font-black text-slate-400">{alphaLabel}</span>
                             )}
                        </div>
                        <div className={`text-base font-semibold pt-[1px] ${isChecked ? 'text-[#7A1B1E]' : 'text-slate-700'}`}>
                          <LatexRenderer text={opt} />
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

             {/* Integrated Drawing Toolbar matching the Mock */}
             <div className="border-t border-slate-200 shrink-0 bg-slate-50 p-3 md:px-6 md:py-4 flex flex-col lg:flex-row justify-between items-center gap-3 md:gap-4 z-30">
                 
                 <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                     <div className="flex flex-wrap items-center justify-center gap-1 bg-white p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                         <button onClick={() => setWbTool('pointer')} className={`p-1.5 md:p-2 rounded-md transition-colors border ${wbTool==='pointer'?'bg-indigo-100 border-indigo-300 text-indigo-700':'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`} title="Pointer (Interact)"><MousePointer2 className="w-4 h-4 md:w-5 md:h-5"/></button>
                         <button onClick={() => setWbTool('pen')} className={`p-1.5 md:p-2 rounded-md transition-colors border ${wbTool==='pen'?'bg-indigo-100 border-indigo-300 text-indigo-700':'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`} title="Pen"><PenTool className="w-4 h-4 md:w-5 md:h-5"/></button>
                         <button onClick={() => setWbTool('eraser')} className={`p-1.5 md:p-2 rounded-md transition-colors border ${wbTool==='eraser'?'bg-indigo-100 border-indigo-300 text-indigo-700':'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`} title="Eraser"><Eraser className="w-4 h-4 md:w-5 md:h-5"/></button>
                         <button onClick={() => setWbTool('line')} className={`p-1.5 md:p-2 rounded-md transition-colors border ${wbTool==='line'?'bg-indigo-100 border-indigo-300 text-indigo-700':'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`} title="Line"><Minus className="w-4 h-4 md:w-5 md:h-5"/></button>
                         <button onClick={() => setWbTool('arrow')} className={`p-1.5 md:p-2 rounded-md transition-colors border ${wbTool==='arrow'?'bg-indigo-100 border-indigo-300 text-indigo-700':'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`} title="Arrow"><MoveRight className="w-4 h-4 md:w-5 md:h-5"/></button>
                         <button onClick={() => setWbTool('rectangle')} className={`p-1.5 md:p-2 rounded-md transition-colors border ${wbTool==='rectangle'?'bg-indigo-100 border-indigo-300 text-indigo-700':'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`} title="Rectangle"><Square className="w-4 h-4 md:w-5 md:h-5"/></button>
                         <button onClick={() => setWbTool('ellipse')} className={`p-1.5 md:p-2 rounded-md transition-colors border ${wbTool==='ellipse'?'bg-indigo-100 border-indigo-300 text-indigo-700':'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`} title="Ellipse"><Circle className="w-4 h-4 md:w-5 md:h-5"/></button>
                         <button onClick={() => setWbTool('triangle')} className={`p-1.5 md:p-2 rounded-md transition-colors border ${wbTool==='triangle'?'bg-indigo-100 border-indigo-300 text-indigo-700':'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`} title="Triangle"><Triangle className="w-4 h-4 md:w-5 md:h-5"/></button>
                         <button onClick={() => setWbTool('graph')} className={`p-1.5 md:p-2 rounded-md transition-colors border ${wbTool==='graph'?'bg-indigo-100 border-indigo-300 text-indigo-700':'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`} title="Graph Axis"><Activity className="w-4 h-4 md:w-5 md:h-5"/></button>
                     </div>

                     {wbTool !== 'pointer' && wbTool !== 'eraser' && (
                         <div className="flex justify-between items-center bg-white p-1.5 rounded-lg border border-slate-200 space-x-2">
                             {/* Colors */}
                             <div className="flex space-x-1 pl-1">
                                 {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#0f172a'].map(c => (
                                     <button key={c} onClick={()=>setWbColor(c)} className={`w-5 h-5 rounded-full transition-transform ${wbColor===c?'ring-2 ring-offset-1 ring-indigo-500 scale-110':''}`} style={{backgroundColor: c}}></button>
                                 ))}
                             </div>
                             
                             <div className="w-px h-5 bg-slate-200 mx-1"></div>

                             {/* Thickness */}
                             <div className="flex space-x-1.5">
                                 {[2, 4, 8].map(w => (
                                     <button key={w} onClick={()=>setWbStrokeWidth(w)} className={`w-7 h-7 flex items-center justify-center rounded transition-colors border ${wbStrokeWidth===w?'bg-slate-100 border-slate-300':'hover:bg-slate-100 border-transparent'}`}>
                                         <div className="bg-slate-700 rounded-full" style={{width: w*1.5, height: w*1.5}}></div>
                                     </button>
                                 ))}
                             </div>
                         </div>
                     )}
                 </div>

                 <button onClick={() => updateWhiteboardData(`${item.id}-${question.id}-inline`, [])} className="text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center">
                     <Trash className="w-4 h-4 mr-1.5" /> Clear Board
                 </button>
             </div>

             {/* Exam Controls Footer - Optimized for Thumb Reach */}
             <div className="bg-white border-t border-slate-200 p-3 md:p-4 flex flex-col-reverse md:flex-row justify-between items-stretch md:items-center gap-3 shrink-0 z-30 relative">
                 <div className="flex space-x-2 w-full md:w-auto">
                     <button 
                         onClick={() => setReview(p => ({...p, [question.id]: !review[question.id]}))}
                         className={`flex-1 md:flex-none px-4 py-3 md:py-2.5 border rounded-xl font-bold text-[10px] md:text-sm transition-colors flex items-center justify-center ${
                             review[question.id] 
                             ? 'bg-amber-400 border-amber-500 text-amber-900 shadow-inner' 
                             : 'bg-white border-amber-400 text-amber-600 hover:bg-amber-50'
                         }`}
                     >
                         <Bookmark className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" /> 
                         <span>{review[question.id] ? 'REMARK' : 'REVIEW'}</span>
                     </button>
                     <button 
                         onClick={() => setActivityProgress(question.id, undefined)}
                         className="flex-1 md:flex-none px-4 py-3 md:py-2.5 bg-white border border-slate-300 rounded-xl text-slate-600 text-[10px] md:text-sm font-bold hover:bg-slate-50 transition-colors"
                     >
                         CLEAR
                     </button>
                 </div>
                 
                 <div className="flex space-x-2 w-full md:w-auto">
                     <button 
                         onClick={() => navigateQuestion(currentQIndex - 1)}
                         disabled={currentQIndex === 0}
                         className="flex-1 md:flex-none px-4 py-3 md:py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 text-[10px] md:text-sm flex items-center justify-center bg-white transition-colors"
                     >
                         <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-1.5" /> PREV
                     </button>
                     
                     {currentQIndex === questions.length - 1 ? (
                        <button className="flex-1 md:flex-none px-6 py-3 md:py-2.5 bg-[#7A1B1E] hover:bg-red-900 text-white rounded-xl font-black text-[10px] md:text-sm flex items-center justify-center shadow-md shadow-red-900/20 transition-all uppercase tracking-widest">
                            SUBMIT
                        </button>
                     ) : (
                        <button 
                            onClick={() => navigateQuestion(currentQIndex + 1)}
                            className="flex-2 md:flex-none px-6 py-3 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] md:text-sm flex items-center justify-center shadow-md shadow-emerald-600/20 transition-all uppercase tracking-widest grow"
                        >
                            NEXT <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 ml-1 md:mr-1.5" />
                        </button>
                     )}
                 </div>
             </div>
          </div>

          {/* Right Palette Column (Desktop) / Drawer (Mobile) */}
          <aside className={`
            fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:relative md:bg-transparent md:backdrop-blur-none
            transition-all duration-300 ease-in-out
            ${isPaletteOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}
          `} onClick={() => setIsPaletteOpen(false)}>
            <div className={`
              w-[85%] max-w-[320px] md:w-80 flex flex-col shrink-0 space-y-4 rounded-l-2xl md:rounded-2xl h-full bg-slate-50 p-4 md:p-0 ml-auto md:ml-0
              transition-transform duration-300 ease-in-out transform
              ${isPaletteOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
            `} onClick={e => e.stopPropagation()}>
               
               {/* Mobile Header for Drawer */}
               <div className="md:hidden flex items-center justify-between mb-2">
                  <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Question Palette</h4>
                  <button onClick={() => setIsPaletteOpen(false)} className="p-2 text-slate-400"><X size={20}/></button>
               </div>

               {/* Info Panel */}
               <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm shrink-0">
                   <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest text-center">Status Legend</h4>
                   <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[9px] md:text-[10px] font-black text-slate-500">
                       <div className="flex items-center"><span className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-500 text-white flex justify-center items-center mr-2 text-[10px] shadow-sm">{answeredCount - answeredReviewCount}</span> Answered</div>
                       <div className="flex items-center"><span className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-red-500 text-white flex justify-center items-center mr-2 text-[10px] shadow-sm">{trueUnanswered}</span> Not Ans</div>
                       <div className="flex items-center"><span className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-500 flex justify-center items-center mr-2 text-[10px]">{notVisitedCount}</span> Not Visit</div>
                       <div className="flex items-center"><span className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-amber-400 text-amber-900 flex justify-center items-center mr-2 text-[10px] shadow-sm">{reviewCount}</span> Review</div>
                       <div className="flex items-center col-span-2"><span className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-500 border-2 border-amber-400 text-white flex justify-center items-center mr-2 text-[10px] shadow-sm">{answeredReviewCount}</span> Ans & Review</div>
                   </div>
               </div>
  
               {/* Question Grid */}
               <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex-1 shadow-sm overflow-y-auto">
                 <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">Palette</h4>
                 <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 justify-items-center">
                   {questions.map((q, idx) => {
                     const status = getStatus(q.id);
                     let btnClass = "w-10 h-10 rounded-full flex items-center justify-center text-[12px] md:text-[13px] font-black cursor-pointer transition-all border-2 ";
                     
                     if (status === 'answered') btnClass += "bg-emerald-500 text-white border-emerald-600 shadow-sm";
                     else if (status === 'unanswered') btnClass += "bg-red-500 text-white border-red-600 shadow-sm";
                     else if (status === 'review') btnClass += "bg-amber-400 text-amber-900 border-amber-500 shadow-sm";
                     else if (status === 'answered-review') btnClass += "bg-emerald-500 text-white border-2 border-amber-400 ring-2 ring-amber-400 shadow-sm";
                     else btnClass += "bg-white text-slate-600 border-slate-300 hover:bg-slate-100";
  
                     if (currentQIndex === idx) btnClass += " ring-2 ring-offset-2 ring-slate-800 scale-110";
  
                     return (
                       <button 
                         key={q.id}
                         onClick={() => navigateQuestion(idx)}
                         className={btnClass}
                       >
                         {idx + 1}
                       </button>
                     );
                   })}
                 </div>
               </div>
            </div>
          </aside>
      </div>
    </div>
  );
}

// Wrapper to prevent LateX crashing React Router directly.
const LatexRenderer = ({text}) => {
    return renderMathText(text);
};
