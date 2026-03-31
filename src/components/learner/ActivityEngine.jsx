import React, { useState, useEffect, useMemo, useRef } from 'react';
import useStore from '../../store/useStore';
import WhiteboardOverlay from '../shared/WhiteboardOverlay';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark-reasonable.css';
import { 
  PenTool, CheckCircle2, ChevronRight, ChevronLeft, Bookmark, 
  Trash, MousePointer2, Minus, Circle, Square, MoveRight, Eraser, Triangle, Activity, X 
} from 'lucide-react';

const MarkdownRenderer = ({ content, className = "" }) => {
  const contentRef = useRef(null);
  
  useEffect(() => {
    if (!contentRef.current || !content) return;
    
    let text = content;
    const mathBlocks = [];
    text = text.replace(/\$\$(!?)([\s\S]+?)\$\$/g, (match, isImportant, math) => {
        mathBlocks.push({ type: 'block', math, isImportant: !!isImportant });
        return `%%%MATH_${mathBlocks.length - 1}%%%`;
    });
    text = text.replace(/\$([^$\n]+?)\$/g, (match, math) => {
        mathBlocks.push({ type: 'inline', math, isImportant: false });
        return `%%%MATH_${mathBlocks.length - 1}%%%`;
    });

    try {
        let html = marked.parse(text);
        html = DOMPurify.sanitize(html);

        mathBlocks.forEach((block, index) => {
            try {
                const rendered = katex.renderToString(block.math, {
                    displayMode: block.type === 'block',
                    throwOnError: false
                });
                let finalHtml = rendered;
                if (block.isImportant) {
                    finalHtml = `<div class="scale-[1.04] origin-center my-6 text-black drop-shadow-sm">${rendered}</div>`;
                }
                html = html.replace(`%%%MATH_${index}%%%`, finalHtml);
            } catch (e) {
                html = html.replace(`%%%MATH_${index}%%%`, block.math);
            }
        });

        contentRef.current.innerHTML = html;
        contentRef.current.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
    } catch (e) {
        contentRef.current.innerHTML = '<span class="text-red-500">Error rendering content.</span>';
    }
  }, [content]);

  return <div ref={contentRef} className={`prose prose-sm max-w-none prose-slate prose-headings:font-bold prose-headings:m-0 prose-p:m-0 prose-a:text-blue-600 prose-code:font-mono prose-code:text-[0.85em] prose-pre:bg-slate-800 prose-pre:text-slate-50 prose-pre:my-2 prose-pre:p-3 prose-pre:rounded-md wrap-break-word ${className}`}></div>;
};

export default function ActivityEngine({ item, course }) {
  const { questions: globalQuestions, activityProgress, setActivityProgress, updateWhiteboardData } = useStore();
  
  // Use useMemo to ensure questions are consistent and reset correctly when item changes
  const questions = useMemo(() => {
    // Priority: 1. Inline questions (legacy/specific) 2. Global library lookup
    if (item.questions && item.questions.length > 0) return item.questions;
    if (item.questionIds) {
      return item.questionIds.map(id => globalQuestions.find(q => q.id === id)).filter(Boolean);
    }
    return [];
  }, [item, globalQuestions]);
  
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
      
      {/* Mobile Floating Palette Trigger - REMOVED for static bottom approach */}

      <div className="flex flex-col xl:flex-row gap-4 md:gap-6 flex-1 h-full p-2 md:p-4 lg:p-6 overflow-hidden">
          
          {/* Main Question Column - Flex-grow to fill space */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden shadow-sm border border-slate-200 rounded-2xl relative min-w-0 min-h-[400px]">
             
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Question {currentQIndex + 1}</h4>
                    {question?.ai_metadata?.topic && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full border border-indigo-100 uppercase tracking-widest">
                        {question.ai_metadata.topic}
                      </span>
                    )}
                  </div>
                  {question?.ai_metadata?.concept && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Concept: {question.ai_metadata.concept}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">{item.examType || 'Practice Mode'}</span>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">LIVE CANVAS</span>
                  </div>
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
                  <h3 className="text-lg md:text-xl text-slate-900 font-semibold mb-5 leading-relaxed selection:bg-red-100 relative z-0">
                     <MarkdownRenderer content={question.description || question.text} />
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
                        <div className={`
                          w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 text-xs font-bold transition-all pt-px mr-4
                          ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'}
                        `}>
                             {isChecked ? (
                                 <CheckCircle2 className="w-4 h-4" />
                             ) : (
                                 <span className="text-[10px] font-black text-slate-400">{alphaLabel}</span>
                             )}
                        </div>
                        <div className={`text-base font-semibold pt-px ${isChecked ? 'text-[#7A1B1E]' : 'text-slate-700'}`}>
                          <MarkdownRenderer content={opt} />
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

              {/* Integrated Drawing Toolbar - Compact & Responsive */}
              <div className="border-t border-slate-200 shrink-0 bg-slate-50 p-2 md:p-3 lg:px-6 lg:py-4 flex flex-col lg:flex-row justify-between items-center gap-3 z-30">
                  
                  <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto custom-scrollbar-hide pb-1 lg:pb-0">
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                          <button onClick={() => setWbTool('pointer')} className={`p-1.5 md:p-2 rounded-md transition-colors border ${wbTool==='pointer'?'bg-indigo-100 border-indigo-300 text-indigo-700':'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`} title="Pointer"><MousePointer2 size={16}/></button>
                          <button onClick={() => setWbTool('pen')} className={`p-1.5 md:p-2 rounded-md transition-colors border ${wbTool==='pen'?'bg-indigo-100 border-indigo-300 text-indigo-700':'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`} title="Pen"><PenTool size={16}/></button>
                          <button onClick={() => setWbTool('eraser')} className={`p-1.5 md:p-2 rounded-md transition-colors border ${wbTool==='eraser'?'bg-indigo-100 border-indigo-300 text-indigo-700':'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`} title="Eraser"><Eraser size={16}/></button>
                      </div>

                      {wbTool !== 'pointer' && wbTool !== 'eraser' && (
                          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 gap-1 shrink-0">
                              <div className="flex gap-1 px-1">
                                  {['#ef4444', '#3b82f6', '#10b981', '#0f172a'].map(c => (
                                      <button key={c} onClick={()=>setWbColor(c)} className={`w-4 h-4 rounded-full ${wbColor===c?'ring-2 ring-offset-1 ring-blue-500':''}`} style={{backgroundColor: c}}></button>
                                  ))}
                              </div>
                          </div>
                      )}

                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                          <button onClick={() => setWbTool('line')} className={`p-1.5 rounded-md ${wbTool==='line'?'bg-indigo-50 text-indigo-600':'text-slate-500'}`}><Minus size={16}/></button>
                          <button onClick={() => setWbTool('rectangle')} className={`p-1.5 rounded-md ${wbTool==='rectangle'?'bg-indigo-50 text-indigo-600':'text-slate-500'}`}><Square size={16}/></button>
                          <button onClick={() => setWbTool('ellipse')} className={`p-1.5 rounded-md ${wbTool==='ellipse'?'bg-indigo-50 text-indigo-600':'text-slate-500'}`}><Circle size={16}/></button>
                      </div>
                  </div>

                  <button onClick={() => updateWhiteboardData(`${item.id}-${question.id}-inline`, [])} className="text-[10px] font-black text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center shrink-0 uppercase tracking-tighter">
                      <Trash size={12} className="mr-1" /> Clear Board
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

             {/* STATIC BOTTOM PALETTE: Mobile-Only (Mock-Compatible) */}
             <div className="xl:hidden bg-slate-50 border-t border-slate-200 py-6 flex flex-col items-center gap-4 shrink-0 transition-all">
                <div className="flex flex-col items-center text-center px-4">
                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.2em] mb-1">QUIZ 1 - 2024</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{course?.code || 'CS101'} • {item.title?.toUpperCase() || 'MOCK PRACTICE'}</span>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2.5 max-w-full px-6">
                   {questions.map((q, idx) => {
                     const status = getStatus(q.id);
                     let btnClass = "w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black cursor-pointer transition-all border-2 ";
                     
                     if (status === 'answered') btnClass += "bg-emerald-500 text-white border-emerald-600 shadow-sm";
                     else if (status === 'unanswered') btnClass += "bg-red-500 text-white border-red-600 shadow-sm";
                     else if (status === 'review') btnClass += "bg-amber-400 text-amber-900 border-amber-500 shadow-sm";
                     else if (status === 'answered-review') btnClass += "bg-emerald-500 text-white border-2 border-amber-400 ring-2 ring-amber-400 shadow-sm";
                     else btnClass += "bg-white text-slate-400 border-slate-200 hover:bg-slate-50";

                     if (currentQIndex === idx) btnClass += " ring-2 ring-offset-2 ring-slate-800 scale-105 z-10";

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

          {/* SIDE PALETTE: Desktop (xl+) Only */}
          <aside className="hidden xl:flex w-80 flex-col shrink-0 space-y-4 h-full bg-slate-50">
            <div className="flex flex-col shrink-0 space-y-4 h-full"> 

               {/* Info Panel */}
               <div className="bg-white border border-slate-200 rounded-2xl p-4 xl:p-5 shadow-sm shrink-0">
                   <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest text-center">Status Legend</h4>
                   <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[9px] xl:text-[10px] font-black text-slate-500">
                       <div className="flex items-center"><span className="w-4 h-4 xl:w-5 xl:h-5 rounded-full bg-emerald-500 text-white flex justify-center items-center mr-2 text-[10px] shadow-sm">{answeredCount - answeredReviewCount}</span> Answered</div>
                       <div className="flex items-center"><span className="w-4 h-4 xl:w-5 xl:h-5 rounded-full bg-red-500 text-white flex justify-center items-center mr-2 text-[10px] shadow-sm">{trueUnanswered}</span> Not Ans</div>
                       <div className="flex items-center"><span className="w-4 h-4 xl:w-5 xl:h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-500 flex justify-center items-center mr-2 text-[10px]">{notVisitedCount}</span> Not Visit</div>
                       <div className="flex items-center"><span className="w-4 h-4 xl:w-5 xl:h-5 rounded-full bg-amber-400 text-amber-900 flex justify-center items-center mr-2 text-[10px] shadow-sm">{reviewCount}</span> Review</div>
                       <div className="flex items-center col-span-2"><span className="w-4 h-4 xl:w-5 xl:h-5 rounded-full bg-emerald-500 border-2 border-amber-400 text-white flex justify-center items-center mr-2 text-[10px] shadow-sm">{answeredReviewCount}</span> Ans & Review</div>
                   </div>
               </div>
  
               {/* Question Grid */}
               <div className="bg-white border border-slate-200 rounded-2xl p-4 xl:p-5 flex-1 shadow-sm overflow-y-auto">
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
