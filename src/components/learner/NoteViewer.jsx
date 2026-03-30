import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function NoteViewer({ item }) {
  const contentRef = useRef(null);
  
  useEffect(() => {
    if (!contentRef.current || !item.content) return;
    
    // Step 1: Replace math blocks temporarily to prevent markdown from mutating it
    let text = item.content;
    const mathBlocks = [];
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
        mathBlocks.push({ type: 'block', math });
        return `%%%MATH_${mathBlocks.length - 1}%%%`;
    });
    text = text.replace(/\$([^$\n]+?)\$/g, (match, math) => {
        mathBlocks.push({ type: 'inline', math });
        return `%%%MATH_${mathBlocks.length - 1}%%%`;
    });

    // Step 2: Parse Markdown
    let html = marked.parse(text);
    html = DOMPurify.sanitize(html);

    // Step 3: Replace math placeholders with rendered KaTeX
    mathBlocks.forEach((block, index) => {
        try {
            const rendered = katex.renderToString(block.math, {
                displayMode: block.type === 'block',
                throwOnError: false
            });
            html = html.replace(`%%%MATH_${index}%%%`, rendered);
        } catch (e) {
            html = html.replace(`%%%MATH_${index}%%%`, block.math);
        }
    });

    contentRef.current.innerHTML = html;
  }, [item]);

  return (
    <div className="w-full bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-200/60 animate-fade-in relative">
      <div 
        ref={contentRef}
        className="prose prose-slate max-w-none 
                 prose-h1:text-3xl prose-h1:font-black prose-h1:tracking-tight prose-h1:mb-8
                 prose-h2:text-2xl prose-h2:font-bold prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-3 prose-h2:mt-10
                 prose-p:text-slate-700 prose-p:leading-relaxed prose-p:my-5
                 prose-a:text-indigo-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                 prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:rounded-xl prose-pre:shadow-sm
                 prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-semibold prose-code:before:content-none prose-code:after:content-none
                 prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:italic max-w-none"
      />
    </div>
  );
}
