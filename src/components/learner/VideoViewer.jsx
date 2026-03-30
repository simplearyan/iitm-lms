import React, { useState } from 'react';
import { FileText, PlayCircle } from 'lucide-react';
import { marked } from 'marked';
import katex from 'katex';
import WhiteboardOverlay from '../shared/WhiteboardOverlay';
import FloatingAnnotationToolbar from '../shared/FloatingAnnotationToolbar';
import useStore from '../../store/useStore';

// Pre-configure marked to not parse HTML if not needed, or just defaults
marked.setOptions({
  breaks: true,
  gfm: true
});

// Safely parse Markdown then render LaTeX
const renderFormattedNotes = (markdownText) => {
    if (!markdownText) return { __html: '' };
    
    // First let marked convert markdown to HTML
    let html = marked(markdownText);
    
    // Then replace $$...$$ and $...$ with Katex
    html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
        try { return katex.renderToString(math, { displayMode: true, throwOnError: false }) } catch(e) { return match }
    });
    html = html.replace(/\$([^$\n]+?)\$/g, (match, math) => {
        try { return katex.renderToString(math, { displayMode: false, throwOnError: false }) } catch(e) { return match }
    });
    
    return { __html: html };
};

export default function VideoViewer({ item, currentModule }) {
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen');
  const [currentColor, setCurrentColor] = useState('#2563eb'); // Classic blue pen
  const { updateWhiteboardData } = useStore();

  return (
    <div className="w-full h-full flex flex-col lg:flex-row animate-fade-in relative bg-slate-50">
      
      {/* Left Pane: Header and Video */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Integrated Context Header */}
        <div className="bg-white border-b border-slate-200 px-5 md:px-8 py-4 md:py-6 shrink-0 z-10 relative">
           <div className="text-[10px] md:text-xs font-black tracking-widest text-slate-400 uppercase mb-2 flex items-center gap-2">
             <span>{currentModule?.title}</span>
             <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
             <span className="text-blue-600 flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5 md:w-4 md:h-4"/> {item.type}</span>
           </div>
           
           <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">{item.title}</h1>
        </div>
        
        {/* Video Area (Theater Mode) - Brightened and Expanded */}
        <div className="flex-1 bg-white flex items-center justify-center p-0 lg:p-10 overflow-y-auto">
              <div className="w-full max-w-[1200px] mx-auto aspect-video bg-black lg:rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 lg:border border-slate-200 relative transition-all flex-shrink-0 group">
               {item.url ? (
                 <iframe className="absolute inset-0 w-full h-full" src={item.url} allowFullScreen title={item.title}></iframe>
               ) : (
                 <div className="text-slate-400 w-full h-full flex items-center justify-center font-mono">Video Error: No Source URL</div>
               )}

               {/* Video Bound Annotations Frame */}
               <WhiteboardOverlay 
                   questionId={`video-${item.id}`} 
                   isInline={true} 
                   toolProp={isAnnotationMode ? currentTool : 'pointer'} 
                   colorProp={currentColor} 
               />
               
               {/* Visual indicator when annotation mode is locked */}
               {isAnnotationMode && (
                   <div className="absolute top-4 right-4 bg-indigo-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-full z-30 shadow flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div> Drawing Mode Active
                   </div>
               )}
             </div>
        </div>
      </div>

      {/* Right Pane: Notes/Synopsis (Split pane on Desktop, Stacked on Mobile) */}
      {item.notes && (
          <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 shadow-sm min-h-[50vh] lg:min-h-0 lg:h-full overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2.5 shrink-0">
                  <FileText className="w-5 h-5 text-indigo-600"/>
                  <h3 className="font-black text-slate-800 tracking-tight text-sm uppercase">Video Synopsis</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-8 md:px-10 custom-scrollbar relative">
                  <div 
                     className="font-sans text-slate-700 prose prose-slate max-w-none text-[1.125rem] leading-[1.75] prose-headings:font-black prose-headings:text-slate-800 prose-headings:tracking-tight prose-a:text-indigo-600 prose-code:font-mono prose-code:text-[#475569] prose-code:bg-[#e2e8f0] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.85em] prose-code:before:content-none prose-code:after:content-none prose-p:mb-[1.25em]"
                     dangerouslySetInnerHTML={renderFormattedNotes(item.notes)}
                  />
              </div>
          </div>
      )}

      {/* Floating Annotation Toolkit */}
      <FloatingAnnotationToolbar 
          isAnnotationMode={isAnnotationMode}
          setIsAnnotationMode={setIsAnnotationMode}
          currentTool={currentTool}
          setCurrentTool={setCurrentTool}
          currentColor={currentColor}
          setCurrentColor={setCurrentColor}
          onClear={() => updateWhiteboardData(`video-${item.id}`, [])}
      />
    </div>
  );
}
