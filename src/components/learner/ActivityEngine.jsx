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

  return <div ref={contentRef} className={`prose prose-sm md:prose-base max-w-none prose-slate prose-headings:font-bold prose-headings:m-0 prose-p:m-0 prose-a:text-blue-600 prose-code:font-mono prose-code:text-[0.85em] prose-pre:bg-slate-800 prose-pre:text-slate-50 prose-pre:my-2 prose-pre:p-3 prose-pre:rounded-md wrap-break-word ${className}`}></div>;
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
             
              {/* SLIM MOBILE HEADER: Context-First Focus */}
              <div className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 px-4 py-2 md:px-6 md:py-4 flex flex-row justify-between items-center gap-4 shrink-0 transition-all">
                <div className="flex items-center gap-3">
                  <h4 className="text-base md:text-lg font-black text-slate-800 tracking-tight leading-none">Question &nbsp; {currentQIndex + 1}</h4>
                  <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                  {question?.ai_metadata?.topic && (
                    <span className="hidden sm:inline-flex px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-black rounded border border-slate-300 uppercase tracking-widest whitespace-nowrap">
                      {question.ai_metadata.topic}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-slate-100 text-slate-800 text-[9px] md:text-[10px] font-black rounded border border-slate-300 uppercase tracking-widest leading-none">
                    {item.examType || 'MOCK PRACTICE'}
                  </span>
                </div>
              </div>

              {/* COMPACT HIGH-FOCUS CONTENT: Question Accent #7A1B1E */}
              <div className="flex-1 relative overflow-y-auto w-full custom-scrollbar bg-white">
                 <div className="max-w-4xl px-3 py-4 md:px-6 md:py-10">
                    <WhiteboardOverlay 
                        questionId={`${item.id}-${question.id}-inline`} 
                        isInline={true}
                        toolProp={wbTool}
                        colorProp={wbColor}
                        strokeWidthProp={wbStrokeWidth}
                    />

                 {/* Question Canvas: Academic Stylization per Reference Image */}
                 <div className="select-none h-full w-full">
                   <div className="mb-4 md:mb-8">
                     <h3 className="text-[1.3rem] [&_p]:text-[1.3rem] [&_li]:text-[1.3rem] [&_p]:text-slate-900 [&_li]:text-slate-900 text-slate-900 font-bold leading-relaxed selection:bg-[#7A1B1E]/10 relative z-0">
                        <MarkdownRenderer content={question.description || question.text} />
                     </h3>
                   </div>
                   
                   {question.image && (
                     <div className="mb-6 md:mb-12 max-w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative z-0">
                       <img src={(import.meta.env.BASE_URL || '/') + (question.image ? question.image.replace(/^\//, '') : '')} alt="Context" className="w-full h-auto object-contain bg-slate-50 p-6 mx-auto max-h-[500px]" />
                     </div>
                   )}
                   
                   <div className="space-y-6 max-w-4xl relative z-0">
                   {question.options?.map((opt, oIdx) => {
                     const ans = activityProgress[question.id];
                     const isChecked = ans === oIdx || (Array.isArray(ans) && ans.includes(oIdx));
                     const alphaLabel = String.fromCharCode(65 + oIdx);
 
                     const labelClass = isChecked 
                        ? 'border-2 border-[#7A1B1E] bg-[#7A1B1E]/5' 
                        : 'border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50';
 
                     return (
                       <label 
                         key={oIdx} 
                         className={`flex items-start p-2.5 md:p-5 rounded-xl cursor-pointer transition-all ${labelClass}`}
                       >
                         <input type="radio" className="hidden" checked={isChecked} onChange={() => handleOptionSelect(oIdx)} />
                         <div className={`
                           w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-black transition-all mr-5
                           ${isChecked ? 'bg-[#7A1B1E] border-[#7A1B1E] text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}
                         `}>
                              {alphaLabel}
                         </div>
                         <div className={`text-base md:text-lg font-medium pt-0.5 leading-relaxed ${isChecked ? 'text-slate-900 font-bold underline decoration-[#7A1B1E]/20 underline-offset-4' : 'text-slate-800'}`}>
                           <MarkdownRenderer content={opt}/>
                         </div>
                       </label>
                     )
                   })}
                  </div>
                  {/* INTEGRATED QUESTION PALETTE: Mobile-Only (Scroll-to-Navigation) */}
                  <div className="mt-12 mb-8 xl:hidden border-t border-slate-100 pt-8">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full mb-4"></div>
                        <span className="text-[10px] font-bold text-[#7A1B1E] uppercase tracking-[0.25em]">Question Hub</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Navigation Grid</span>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-3 max-w-sm mx-auto px-4">
                       {questions.map((q, idx) => {
                         const status = getStatus(q.id);
                         let btnClass = "w-11 h-11 rounded-2xl flex items-center justify-center text-[13px] font-black cursor-pointer transition-all border-2 ";
                         if (status === 'answered') btnClass += "bg-emerald-500 text-white border-emerald-600 shadow-sm";
                         else if (status === 'unanswered') btnClass += "bg-red-500 text-white border-red-600 shadow-sm";
                         else if (status === 'review') btnClass += "bg-amber-400 text-amber-900 border-amber-500 shadow-sm";
                         else if (status === 'answered-review') btnClass += "bg-emerald-500 text-white border-2 border-amber-400 ring-2 ring-amber-400 shadow-sm";
                         else btnClass += "bg-white text-slate-500 border-slate-200 hover:bg-slate-50";
                         if (currentQIndex === idx) btnClass += " ring-2 ring-offset-2 ring-[#7A1B1E] scale-110 shadow-lg shadow-[#7A1B1E]/10";
                         return (
                           <button key={idx} onClick={() => navigateQuestion(idx)} className={btnClass}>
                             {idx + 1}
                           </button>
                         );
                       })}
                    </div>
                    <div className="mt-8 text-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">— END OF ASSESSMENT —</div>
                  </div>
               </div>
              </div>
             </div>

              {/* UNIFIED CONTROL BAR: Tools + Navigation (v2 Focus) */}
              <div className="border-t border-slate-200 bg-white/95 backdrop-blur-md z-30 shrink-0">
                  {/* Drawing Tools: Single Row Focus */}
                  <div className="px-4 py-2 flex items-center justify-between gap-4 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar-hide bg-slate-50 p-1 rounded-xl">
                          <button onClick={() => setWbTool('pointer')} className={`p-1.5 rounded-lg transition-all ${wbTool==='pointer'?'bg-indigo-600 text-white shadow-sm':'text-slate-500 hover:bg-white'}`}><MousePointer2 size={16}/></button>
                          <button onClick={() => setWbTool('pen')} className={`p-1.5 rounded-lg transition-all ${wbTool==='pen'?'bg-indigo-600 text-white shadow-sm':'text-slate-500 hover:bg-white'}`}><PenTool size={16}/></button>
                          <button onClick={() => setWbTool('eraser')} className={`p-1.5 rounded-lg transition-all ${wbTool==='eraser'?'bg-indigo-600 text-white shadow-sm':'text-slate-500 hover:bg-white'}`}><Eraser size={16}/></button>
                          <div className="w-px h-5 bg-slate-200 mx-1"></div>
                          {['#ef4444', '#3b82f6', '#10b981', '#0f172a'].map(c => (
                              <button key={c} onClick={()=>setWbColor(c)} className={`w-3.5 h-3.5 rounded-full ring-offset-2 transition-all ${wbColor===c?'ring-2 ring-blue-500 scale-110 shadow-sm':''}`} style={{backgroundColor: c}}></button>
                          ))}
                          <div className="w-px h-5 bg-slate-200 mx-1"></div>
                          <button onClick={() => setWbTool('line')} className={`p-1.5 rounded-md ${wbTool==='line'?'bg-indigo-100 text-indigo-700':'text-slate-500'}`}><Minus size={16}/></button>
                          <button onClick={() => setWbTool('rectangle')} className={`p-1.5 rounded-md ${wbTool==='rectangle'?'bg-indigo-100 text-indigo-700':'text-slate-500'}`}><Square size={16}/></button>
                      </div>
                      <button onClick={() => updateWhiteboardData(`${item.id}-${question.id}-inline`, [])} className="text-[10px] font-black text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all uppercase flex items-center">
                          <Trash size={12} className="mr-1.5" /> Clear Board
                      </button>
                  </div>

                  {/* High-Efficiency Navigation Footer */}
                  <div className="px-4 py-2 md:px-6 flex flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setReview(p => ({...p, [question.id]: !review[question.id]}))}
                          className={`px-4 py-2.5 rounded-xl font-black text-[11px] md:text-sm uppercase tracking-widest border transition-all flex items-center gap-2 ${review[question.id] ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        >
                          <Bookmark size={14} className={review[question.id] ? 'fill-amber-500 transition-all' : ''} /> 
                          <span>Review</span>
                        </button>
                        <button onClick={() => setActivityProgress(question.id, undefined)} className="hidden sm:block px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 text-[11px] md:text-sm font-black uppercase tracking-widest hover:text-red-500 transition-all">
                          Clear
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigateQuestion(currentQIndex - 1)}
                            disabled={currentQIndex === 0}
                            className="h-10 px-5 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 text-[11px] md:text-sm flex items-center justify-center transition-all shadow-sm active:scale-95"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1.5" /> Prev
                        </button>
                        
                        {currentQIndex === questions.length - 1 ? (
                           <button className="h-10 px-8 bg-[#7A1B1E] hover:bg-red-900 text-white rounded-xl font-black text-[11px] md:text-sm flex items-center justify-center shadow-lg shadow-red-900/20 active:scale-95 uppercase tracking-[0.2em] transition-all">
                               Submit
                           </button>
                        ) : (
                           <button 
                               onClick={() => navigateQuestion(currentQIndex + 1)}
                               className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[11px] md:text-sm flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 uppercase tracking-[0.2em] transition-all"
                           >
                               Next <ChevronRight className="w-4 h-4 ml-2" />
                           </button>
                        )}
                      </div>
                  </div>
              </div>

             {/* STATIC BOTTOM PALETTE: Mobile-Only (Mock-Compatible) */}
              {/* Fixed mobile footer removed for vertical space optimization */}
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
