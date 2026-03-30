import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { FileText, CalendarDays } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark-reasonable.css';
import WhiteboardOverlay from '../shared/WhiteboardOverlay';
import FloatingAnnotationToolbar from '../shared/FloatingAnnotationToolbar';
import useStore from '../../store/useStore';

export default function NoteViewer({ item, currentModule }) {
  const contentRef = useRef(null);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen');
  const [currentColor, setCurrentColor] = useState('#dc2626'); // Classic red pen
  const { updateWhiteboardData } = useStore();
  
  useEffect(() => {
    if (!contentRef.current || !item.content) return;
    
    // Step 1: Replace math blocks temporarily to prevent markdown from mutating it
    let text = item.content;
    const mathBlocks = [];
    text = text.replace(/\$\$(!?)([\s\S]+?)\$\$/g, (match, isImportant, math) => {
        mathBlocks.push({ type: 'block', math, isImportant: !!isImportant });
        return `%%%MATH_${mathBlocks.length - 1}%%%`;
    });
    text = text.replace(/\$([^$\n]+?)\$/g, (match, math) => {
        mathBlocks.push({ type: 'inline', math, isImportant: false });
        return `%%%MATH_${mathBlocks.length - 1}%%%`;
    });

    // Step 2: Parse Markdown
    let html = marked.parse(text);
    html = DOMPurify.sanitize(html);

    // Step 3: Replace math placeholders with rendered KaTeX
    mathBlocks.forEach((block, index) => {
        try {
            const mathString = block.math;
            
            const rendered = katex.renderToString(mathString, {
                displayMode: block.type === 'block',
                throwOnError: false
            });
            
            let finalHtml = rendered;
            
            // Custom Markdown Extension: Important Formula Callout (Minimal Contrast Style)
            if (block.isImportant) {
                finalHtml = `<div class="scale-[1.04] origin-center my-6 text-black drop-shadow-sm">${rendered}</div>`;
            }
            
            html = html.replace(`%%%MATH_${index}%%%`, finalHtml);
        } catch (e) {
            html = html.replace(`%%%MATH_${index}%%%`, block.math);
        }
    });

    contentRef.current.innerHTML = html;
    
    // Step 4: Apply Syntax Highlighting to parsed code blocks
    contentRef.current.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
  }, [item]);

  return (
    <div className="w-full flex justify-center p-0 md:p-8 lg:p-12 min-h-full bg-slate-50 md:bg-transparent">
        {/* Floating Paper Document - Scaled down borders for professional vibe */}
        <div className="w-full max-w-[850px] bg-white md:rounded-md shadow-none md:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-0 md:border md:border-slate-200/60 overflow-hidden animate-fade-in relative flex flex-col">
            
            {/* STICKY CANVAS: Implicitly binds directly to the height of the dynamic document */}
            <WhiteboardOverlay 
                questionId={item.id} 
                isInline={true} 
                toolProp={isAnnotationMode ? currentTool : 'pointer'} 
                colorProp={currentColor} 
            />
            
            {/* Document Header (Lato injected) */}
            <div className="px-6 md:px-14 lg:px-20 pt-12 md:pt-16 pb-8 border-b border-slate-100 relative bg-white" style={{ fontFamily: "'Lato', sans-serif" }}>
                
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                    <span className="flex items-center gap-1.5 text-indigo-600"><FileText className="w-4 h-4"/> {item.type}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span>{currentModule?.title}</span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-8">
                    {item.title}
                </h1>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <span className="font-bold text-slate-400 text-sm">IN</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">Course Instructor</p>
                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                                <CalendarDays className="w-3 h-3"/> Updated Recently
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Body */}
            <div className="px-6 md:px-14 lg:px-20 py-8 md:py-16 bg-white flex-1 overflow-x-hidden" style={{ fontFamily: "'Lato', sans-serif" }}>
              <div 
                ref={contentRef}
                className="text-slate-700 prose prose-slate max-w-none text-[1.125rem] leading-[1.8] 
                         prose-headings:font-black prose-headings:text-slate-800 tracking-normal prose-h1:tracking-tight prose-h2:tracking-tight prose-h3:tracking-tight
                         prose-h1:font-black prose-h1:text-4xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-slate-100
                         prose-h2:font-black prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-[1.75rem]
                         prose-h3:font-black prose-h3:text-[1.35rem]
                         prose-strong:font-bold prose-strong:text-slate-900
                         prose-a:text-indigo-600 prose-a:font-semibold
                         prose-ul:marker:text-slate-300 prose-ol:marker:text-slate-400 prose-ol:marker:font-semibold
                         prose-table:w-full prose-table:my-10 prose-table:border-collapse prose-table:text-sm md:prose-table:text-base
                         prose-th:bg-slate-50 prose-th:px-4 prose-th:py-3 prose-th:border prose-th:border-slate-200 prose-th:text-slate-800 prose-th:font-bold prose-th:text-left
                         prose-td:px-4 prose-td:py-3 prose-td:border prose-td:border-slate-200 prose-td:text-slate-600
                         prose-code:font-mono prose-code:text-[#475569] prose-code:bg-[#e2e8f0] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.85em] prose-code:before:content-none prose-code:after:content-none 
                         prose-pre:bg-[#1d1e22] prose-pre:border prose-pre:border-slate-800 prose-pre:text-slate-50 prose-pre:rounded-md prose-pre:shadow-sm prose-pre:overflow-x-auto
                         prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:italic
                         prose-p:mb-[1.5em] focus:outline-none prose-hr:my-10 prose-hr:border-slate-200"
              />
            </div>
        </div>
        
        {/* Floating Annotation Toolkit */}
        <FloatingAnnotationToolbar 
            isAnnotationMode={isAnnotationMode}
            setIsAnnotationMode={setIsAnnotationMode}
            currentTool={currentTool}
            setCurrentTool={setCurrentTool}
            currentColor={currentColor}
            setCurrentColor={setCurrentColor}
            onClear={() => updateWhiteboardData(item.id, [])}
        />
    </div>
  );
}
