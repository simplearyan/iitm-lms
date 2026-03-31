import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, GripVertical, Video, FileText, CheckCircle2, Navigation, Trash2, Settings, Download, X, Edit3, Save, ClipboardList, Clock } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark-reasonable.css';

const MarkdownPreviewBlock = ({ content }) => {
  const contentRef = React.useRef(null);
  
  React.useEffect(() => {
    if (!contentRef.current) return;
    if (!content) {
      contentRef.current.innerHTML = '<span class="text-slate-400 italic">Preview empty...</span>';
      return;
    }
    
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
                const mathString = block.math;
                const rendered = katex.renderToString(mathString, {
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
        contentRef.current.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    } catch (e) {
        contentRef.current.innerHTML = '<span class="text-red-500">Error parsing markdown.</span>';
    }
  }, [content]);

  return <div ref={contentRef} className="prose prose-sm max-w-none prose-slate prose-headings:font-bold prose-headings:m-0 prose-p:m-0 prose-a:text-blue-600 prose-code:font-mono prose-code:text-[0.85em] prose-pre:bg-slate-800 prose-pre:text-slate-50 prose-pre:my-2 prose-pre:p-3 prose-pre:rounded-md wrap-break-word"></div>;
};

export default function SyllabusBuilder() {
  const { courseId } = useParams();
  const { 
    courses, setCourses, exportData, 
    questions: globalQuestions, // Access Global Bank
    currentYear, setYear, 
    currentTerm, setTerm, 
    generateSemanticId 
  } = useStore();
  
  const course = courses.find(c => c.id === courseId);
  const courseIndex = courses.findIndex(c => c.id === courseId);
  
  const [activeModuleId, setActiveModuleId] = useState(course?.modules?.[0]?.id);
  const [editingItemId, setEditingItemId] = useState(null);
  const [selectedQIndex, setSelectedQIndex] = useState(0); // For V2 Navigator Sidebar

  if (!course) return <div className="p-10 text-center font-bold text-slate-500">Course not found</div>;

  const activeModule = course.modules?.find(m => m.id === activeModuleId);

  const handleDeleteModule = (moduleId) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;
    const updated = [...courses];
    updated[courseIndex].modules = updated[courseIndex].modules.filter(m => m.id !== moduleId);
    setCourses(updated);
    if (activeModuleId === moduleId) setActiveModuleId(updated[courseIndex].modules[0]?.id);
  };

  const handleDeleteItem = (itemId) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;
    const updated = [...courses];
    const mIdx = course.modules.findIndex(m => m.id === activeModuleId);
    updated[courseIndex].modules[mIdx].items = updated[courseIndex].modules[mIdx].items.filter(i => i.id !== itemId);
    setCourses(updated);
  };

  const updateEditingItem = (field, value) => {
    const updated = [...courses];
    const mIdx = course.modules.findIndex(m => m.id === activeModuleId);
    if (mIdx === -1) return;
    const iIdx = course.modules[mIdx].items.findIndex(i => i.id === editingItemId);
    if (iIdx === -1) return;
    
    updated[courseIndex].modules[mIdx].items[iIdx][field] = value;
    setCourses(updated);
  };

  const handleAddItem = (type) => {
    const updatedCourses = [...courses];
    const moduleIndex = course.modules.findIndex(m => m.id === activeModuleId);
    if (moduleIndex === -1) return;
    
    const typeMap = { 
        video: 'L', 
        note: 'R', 
        activity: 'A', 
        assignment: 'GA', 
        quiz: 'Q1' 
    };

    const weekMatch = activeModule.title.match(/Week\s+(\d+)/i);
    const weekNum = weekMatch ? weekMatch[1] : (moduleIndex + 1);

    const newItemId = generateSemanticId(course.code || course.id, typeMap[type], (activeModule.items?.length || 0) + 1, weekNum);
    
    const newItem = {
      id: newItemId,
      type,
      title: `New ${type} item...`,
      ...(type === 'video' ? { url: '', notes: '' } : {}),
      ...(type === 'note' ? { content: '# Start writing...' } : {}),
      ...(type === 'activity' ? { 
          questions: [{
              id: `${newItemId}_q1`,
              description: 'Sample Activity Question', 
              options: ['Option A', 'Option B', 'Option C', 'Option D'], 
              answer: 0, 
              solution: ''
          }]
      } : {}),
      ...(type === 'assignment' ? { 
          questions: [{
              id: `${newItemId}_q1`,
              description: 'Graded Assignment Task', 
              options: ['Option A', 'Option B', 'Option C', 'Option D'], 
              answer: 0, 
              solution: ''
          }]
      } : {}),
      ...(type === 'quiz' ? { 
          examType: 'Quiz 1',
          duration: 30,
          totalMarks: 10,
          submissionRule: 'anytime',
          questions: [{
              id: `${newItemId}_q1`,
              description: 'Quiz Question 1', 
              options: ['Option A', 'Option B', 'Option C', 'Option D'], 
              answer: 0, 
              solution: ''
          }]
      } : {})
    };
    
    if (!updatedCourses[courseIndex].modules[moduleIndex].items) {
        updatedCourses[courseIndex].modules[moduleIndex].items = [];
    }
    updatedCourses[courseIndex].modules[moduleIndex].items.push(newItem);
    setCourses(updatedCourses);
  };

  const handleAddModule = () => {
    const updatedCourses = [...courses];
    updatedCourses[courseIndex].modules = updatedCourses[courseIndex].modules || [];
    const newModuleId = `m_${Date.now()}`;
    updatedCourses[courseIndex].modules.push({
        id: newModuleId,
        title: `Week ${updatedCourses[courseIndex].modules.length + 1}`,
        items: []
    });
    setCourses(updatedCourses);
    setActiveModuleId(newModuleId);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in flex flex-col h-full mb-10">
      {/* Header Section */}
      <div className="mb-6 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div className="flex flex-col items-start w-full">
             <Link to="/instructor" className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
             </Link>
             <div className="flex items-center gap-4 flex-wrap w-full">
               <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 SYLLABUS EDITOR
                 <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[10px] font-black tracking-widest leading-none">{course.code}</span>
               </h1>
               
               <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 ml-auto group transition-all hover:border-slate-300">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Context:</span>
                 <select value={currentYear} onChange={e => setYear(e.target.value)} className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer">
                    <option>2023</option><option>2024</option><option>2025</option><option>2026</option>
                 </select>
                 <div className="w-px h-3 bg-slate-200 mx-1"></div>
                 <select value={currentTerm} onChange={e => setTerm(e.target.value)} className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer">
                    <option value="T1">Jan-Apr (T1)</option><option value="T2">May-Aug (T2)</option><option value="T3">Sep-Dec (T3)</option>
                 </select>
               </div>

               <button onClick={exportData} className="px-4 py-2 bg-slate-900 text-white text-[11px] font-black rounded-lg hover:bg-slate-800 shadow-sm flex items-center justify-center gap-2 transition-all uppercase tracking-widest shrink-0">
                  <Download className="w-3.5 h-3.5"/> Export Chunks
               </button>
             </div>
             <p className="mt-2 text-slate-400 font-bold text-sm tracking-tight">{course.title}</p>
         </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
         {/* Modules Sidebar */}
         <div className="w-full lg:w-[320px] flex flex-col gap-3 bg-white p-4 py-5 rounded-3xl border border-slate-200 overflow-y-auto shadow-sm">
           <div className="flex justify-between items-center mb-4 px-2">
             <h3 className="font-extrabold text-slate-800 text-lg tracking-tight uppercase text-[12px] opacity-50">Modules</h3>
             <button onClick={handleAddModule} className="text-orange-600 hover:bg-orange-50 p-1.5 rounded-lg transition-colors">
               <Plus className="w-5 h-5"/>
             </button>
           </div>
           
           <div className="space-y-2">
           {course.modules?.map(m => (
             <div key={m.id} className={`w-full flex items-center rounded-xl border transition-all ${activeModuleId === m.id ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100 bg-white'}`}>
               <button 
                 onClick={() => setActiveModuleId(m.id)}
                 className={`flex-1 text-left p-3 text-sm font-bold transition-colors ${activeModuleId === m.id ? 'text-orange-900' : 'text-slate-600'}`}
               >
                 {m.title}
               </button>
               <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(m.id); }} className="p-3 text-slate-300 hover:text-red-500 transition-colors" title="Delete Module">
                 <Trash2 className="w-4 h-4"/>
               </button>
             </div>
           ))}
           </div>
           
           {(!course.modules || course.modules.length === 0) && (
               <div className="text-center p-6 text-slate-400 text-xs font-bold leading-relaxed bg-slate-50 rounded-xl border border-dashed border-slate-200">
                   Click + to add a week
               </div>
           )}
         </div>

         {/* Items List Editor */}
         <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200 overflow-y-auto relative shadow-sm">
           {activeModule ? (
             <>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-50 pb-5">
                  <div className="flex-1 w-full">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                        <Navigation className="w-3 h-3 text-slate-300" /> ACTIVE MODULE
                      </p>
                      <input 
                          className="w-full font-black text-lg text-slate-900 bg-transparent focus:outline-none focus:bg-slate-50 hover:bg-slate-50 p-1 -ml-1 rounded transition-colors border border-transparent focus:border-slate-200"
                          defaultValue={activeModule.title}
                          onBlur={(e) => {
                              const updated = [...courses];
                              const mIdx = course.modules.findIndex(m => m.id === activeModuleId);
                              updated[courseIndex].modules[mIdx].title = e.target.value;
                              setCourses(updated);
                          }}
                      />
                  </div>
                  <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 w-full md:w-auto shrink-0 justify-between md:justify-start overflow-x-auto shadow-inner">
                     <button onClick={() => handleAddItem('video')} className="px-3 py-1.5 bg-white flex items-center gap-2 text-[10px] font-black text-blue-600 hover:bg-blue-50 border border-slate-100 rounded-lg shrink-0 transition-all uppercase shadow-sm active:scale-95"><Video className="w-3.5 h-3.5"/> Video</button>
                     <button onClick={() => handleAddItem('note')} className="px-3 py-1.5 bg-white flex items-center gap-2 text-[10px] font-black text-emerald-600 hover:bg-emerald-50 border border-slate-100 rounded-lg shrink-0 transition-all uppercase shadow-sm active:scale-95"><FileText className="w-3.5 h-3.5"/> Note</button>
                     <button onClick={() => handleAddItem('activity')} className="px-3 py-1.5 bg-white flex items-center gap-2 text-[10px] font-black text-orange-600 hover:bg-orange-50 border border-slate-100 rounded-lg shrink-0 transition-all uppercase shadow-sm active:scale-95"><CheckCircle2 className="w-3.5 h-3.5"/> Activity</button>
                     <button onClick={() => handleAddItem('assignment')} className="px-3 py-1.5 bg-white flex items-center gap-2 text-[10px] font-black text-pink-600 hover:bg-pink-50 border border-slate-100 rounded-lg shrink-0 transition-all uppercase shadow-sm active:scale-95"><ClipboardList className="w-3.5 h-3.5"/> Graded</button>
                     <button onClick={() => handleAddItem('quiz')} className="px-3 py-1.5 bg-white flex items-center gap-2 text-[10px] font-black text-purple-600 hover:bg-purple-50 border border-slate-100 rounded-lg shrink-0 transition-all uppercase shadow-sm active:scale-95"><Clock className="w-3.5 h-3.5"/> Quiz</button>
                  </div>
               </div>

               <div className="space-y-3">
                 {activeModule.items?.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-2xl bg-white hover:border-slate-300 hover:shadow-lg transition-all group">
                      <div className="cursor-grab text-slate-200 hover:text-slate-400 p-1">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className={`p-2 rounded-xl shrink-0 ${
                           item.type === 'video' ? 'bg-blue-50 text-blue-500' : 
                           (item.type === 'note' ? 'bg-emerald-50 text-emerald-500' : 
                           (item.type === 'activity' ? 'bg-orange-50 text-orange-500' : 
                           (item.type === 'assignment' ? 'bg-pink-50 text-pink-500' : 'bg-purple-50 text-purple-500')))}`}>
                        {
                            item.type === 'video' ? <Video className="w-4 h-4"/> : 
                            (item.type === 'note' ? <FileText className="w-4 h-4"/> : 
                            (item.type === 'activity' ? <CheckCircle2 className="w-4 h-4"/> : 
                            (item.type === 'assignment' ? <ClipboardList className="w-4 h-4"/> : <Clock className="w-4 h-4"/>)))
                        }
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[9px] font-black text-slate-300 tracking-[0.1em] leading-none mb-1 group-hover:text-slate-500 transition-colors uppercase">{item.id}</span>
                        <input 
                          className="w-full font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 px-2 py-0.5 rounded border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all"
                          defaultValue={item.title}
                          onBlur={(e) => {
                             const updated = [...courses];
                             const mIdx = course.modules.findIndex(m => m.id === activeModuleId);
                             const iIdx = course.modules[mIdx].items.findIndex(i => i.id === item.id);
                             updated[courseIndex].modules[mIdx].items[iIdx].title = e.target.value;
                             setCourses(updated);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingItemId(item.id)} className="p-1 px-3 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors text-[9px] font-black uppercase tracking-widest border border-slate-200">
                           Edit Content
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors" title="Delete Item">
                           <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                 ))}
                 
                 {(!activeModule.items || activeModule.items.length === 0) && (
                   <div className="text-center py-16 text-slate-300 text-sm font-bold bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl mx-2">
                     Module is currently empty
                   </div>
                 )}
               </div>
             </>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-300 font-bold py-32 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                <Navigation className="w-12 h-12 text-slate-200 mb-4"/>
                <p className="uppercase text-[10px] tracking-widest">Select a module to begin authoring</p>
             </div>
           )}
        </div>
      </div>

       {/* Content Inspector Slide-over */}
       {editingItemId && (() => {
         const editingItem = activeModule.items.find(i => i.id === editingItemId);
         if (!editingItem) return null;

         const updateEditingItem = (field, value) => {
            const updated = [...courses];
            const mIdx = course.modules.findIndex(m => m.id === activeModuleId);
            const iIdx = updated[courseIndex].modules[mIdx].items.findIndex(i => i.id === editingItemId);
            updated[courseIndex].modules[mIdx].items[iIdx][field] = value;
            setCourses(updated);
         };

         return (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-200">
               
               <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
                       <Edit3 className="text-white w-6 h-6"/>
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{editingItem.id}</div>
                        <h3 className="font-black text-xl tracking-tight leading-none">Content Editor</h3>
                    </div>
                  </div>
                  <button onClick={() => setEditingItemId(null)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl">
                     <X size={24}/>
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">
                  <div className="mb-8">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Internal Reference Title</label>
                     <input 
                        type="text" 
                        value={editingItem.title} 
                        onChange={(e) => updateEditingItem('title', e.target.value)}
                        className="w-full text-lg font-extrabold text-slate-800 bg-white border border-slate-200 rounded-xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                        placeholder="Item Title..."
                     />
                  </div>

                  {editingItem.type === 'video' && (
                    <>
                      <div className="mb-6">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Video Endpoint (Vimeo/YT ID)</label>
                        <input 
                          type="text"
                          className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono text-sm leading-relaxed text-slate-800 bg-slate-50/30"
                          value={editingItem.url || ''}
                          onChange={(e) => updateEditingItem('url', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Video Notes (Markdown)</label>
                        <textarea 
                          className="w-full p-4 border border-slate-200 rounded-xl h-64 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none font-mono text-xs leading-relaxed text-slate-800 bg-slate-50/30"
                          value={editingItem.notes || ''}
                          onChange={(e) => updateEditingItem('notes', e.target.value)}
                          placeholder="Summary or transcript..."
                        />
                      </div>
                    </>
                  )}

                  {editingItem.type === 'note' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-[400px]">
                        <div className="flex-1 flex flex-col">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between items-center">
                                Document Editor
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono lowercase">markdown + katex</span>
                            </label>
                            <textarea 
                              className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono text-xs leading-relaxed text-slate-800 flex-1 resize-none bg-slate-50/30 shadow-inner"
                              value={editingItem.content || ''}
                              onChange={(e) => updateEditingItem('content', e.target.value)}
                              placeholder="# Header..."
                            />
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Live Preview</label>
                            <div className="w-full p-4 border border-slate-100 bg-white rounded-xl flex-1 overflow-y-auto custom-scrollbar shadow-inner min-w-0">
                               <MarkdownPreviewBlock content={editingItem.content || ''} />
                            </div>
                        </div>
                    </div>
                  )}

                  {['activity', 'assignment', 'quiz'].includes(editingItem.type) && (() => {
                    let safeQuestions = editingItem.questions || [];
                    if (safeQuestions.length === 0 && editingItem.questionIds) {
                        safeQuestions = editingItem.questionIds.map(id => globalQuestions.find(q => q.id === id)).filter(Boolean);
                    }

                    const updateQuestion = (qIndex, field, value) => {
                        const newQs = [...safeQuestions];
                        newQs[qIndex] = { ...newQs[qIndex], [field]: value };
                        updateEditingItem('questions', newQs);
                    };

                    const addQuestion = () => {
                        const qIndex = safeQuestions.length + 1;
                        const newQs = [...safeQuestions, {
                            id: `${editingItem.id}_q${qIndex}`,
                            description: 'New Question...',
                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                            answer: 0,
                            solution: ''
                        }];
                        updateEditingItem('questions', newQs);
                        setSelectedQIndex(newQs.length - 1);
                    };

                    const removeQuestion = (qIndex) => {
                        if (safeQuestions.length <= 1) return;
                        const newQs = safeQuestions.filter((_, idx) => idx !== qIndex);
                        updateEditingItem('questions', newQs);
                        if (selectedQIndex >= newQs.length) setSelectedQIndex(newQs.length - 1);
                    }

                    const activeQ = safeQuestions[selectedQIndex] || safeQuestions[0] || {};

                    return (
                        <div className="flex flex-col h-[65vh] -mx-6 -mt-3">
                           <div className="flex-1 flex overflow-hidden">
                              {/* Pane 1: Question Navigator Sidebar */}
                              <div className="w-16 md:w-56 border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0">
                                 <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">Questions</span>
                                    <button onClick={addQuestion} className="p-1 hover:bg-slate-100 rounded text-slate-500"><Plus size={16}/></button>
                                 </div>
                                 <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                    {safeQuestions.map((q, idx) => (
                                        <button 
                                          key={q.id} 
                                          onClick={() => setSelectedQIndex(idx)}
                                          className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 relative group ${selectedQIndex === idx ? 'bg-white border border-slate-200 shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                                        >
                                           <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${selectedQIndex === idx ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</span>
                                           <span className="text-[11px] font-bold truncate hidden md:block">{q.id.split('_').pop()}</span>
                                           <button onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-300 hover:text-red-500 hidden md:block"><Trash2 size={12}/></button>
                                        </button>
                                    ))}
                                 </div>
                              </div>

                              <div className="flex-1 flex flex-col overflow-hidden">
                                 {safeQuestions.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                                       <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Plus size={24}/></div>
                                       <p className="font-bold">No questions added.</p>
                                       <button onClick={addQuestion} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase">Start Authoring</button>
                                    </div>
                                 ) : (
                                 <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
                                    {/* EDITOR COLUMN */}
                                    <div className="flex-1 flex flex-col border-r border-slate-100 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                       <div className="space-y-3">
                                          <div className="flex justify-between items-center">
                                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Problem Task (Markdown + KaTeX)</label>
                                             <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase">{activeQ.id}</span>
                                          </div>
                                          <textarea 
                                             rows="4" 
                                             value={activeQ.description || ''} 
                                             onChange={e => updateQuestion(selectedQIndex, 'description', e.target.value)} 
                                             className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono text-xs text-slate-800 bg-slate-50/10 placeholder:opacity-40" 
                                             placeholder="Enter problem statement with $math$ and **bold** labels..." 
                                          />
                                       </div>

                                       <div className="space-y-4">
                                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Assessment Options</label>
                                             <button onClick={() => updateQuestion(selectedQIndex, 'options', [...(activeQ.options || []), `New Option`])} className="px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-md text-[9px] font-black uppercase transition-colors border border-green-100 flex items-center gap-1"><Plus size={10}/> Add Option</button>
                                          </div>
                                          <div className="grid grid-cols-1 gap-2">
                                             {(activeQ.options || []).map((opt, oIdx) => (
                                                 <div key={oIdx} className={`flex items-center gap-3 p-2 bg-white rounded-xl border group transition-all ${activeQ.answer === oIdx ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                                                    <input type="radio" checked={activeQ.answer === oIdx} onChange={() => updateQuestion(selectedQIndex, 'answer', oIdx)} className="w-4 h-4 accent-emerald-500" />
                                                    <input type="text" value={opt} onChange={e => {
                                                       let nOpts = [...activeQ.options];
                                                       nOpts[oIdx] = e.target.value;
                                                       updateQuestion(selectedQIndex, 'options', nOpts);
                                                    }} className="flex-1 bg-transparent border-none focus:outline-none text-[11px] font-bold text-slate-800" placeholder={`Option ${oIdx + 1}...`} />
                                                    <button onClick={() => updateQuestion(selectedQIndex, 'options', activeQ.options.filter((_, idx)=>idx!==oIdx))} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={12}/></button>
                                                 </div>
                                             ))}
                                          </div>
                                       </div>

                                       <div className="space-y-3">
                                          <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest block">Solution Reasoning</label>
                                          <textarea rows="3" value={activeQ.solution || ''} onChange={e => updateQuestion(selectedQIndex, 'solution', e.target.value)} className="w-full p-4 border border-amber-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 font-mono text-xs text-amber-900 bg-amber-50/20" placeholder="Explain the logic..." />
                                       </div>
                                    </div>

                                    <div className="flex-1 flex flex-col bg-slate-50/50 p-6 space-y-4 overflow-y-auto custom-scrollbar">
                                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Live Learner Preview</label>
                                       <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grow flex flex-col min-h-0">
                                          <div className="mb-6 flex-1 min-h-0">
                                             <MarkdownPreviewBlock content={activeQ.description || ''} />
                                          </div>
                                          <div className="space-y-2">
                                             {(activeQ.options || []).map((opt, oIdx) => (
                                                <div key={oIdx} className={`p-4 rounded-xl border text-[13px] font-medium flex items-center gap-3 ${activeQ.answer === oIdx ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-100 bg-slate-50/30'}`}>
                                                   <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black uppercase ${activeQ.answer === oIdx ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>{String.fromCharCode(65 + oIdx)}</span>
                                                   <MarkdownPreviewBlock content={opt} />
                                                </div>
                                             ))}
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                                 )}
                              </div>
                           </div>
                        </div>
                    );
                  })()}
               </div>
               
               <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-end gap-3 rounded-b-2xl">
                  <button onClick={() => setEditingItemId(null)} className="px-5 py-2 text-[11px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white">
                     Close
                  </button>
                  <button onClick={() => setEditingItemId(null)} className="px-6 py-2 bg-slate-900 text-white text-[11px] font-black uppercase rounded-lg hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
                     <Save className="w-4 h-4"/> Commit Draft
                  </button>
               </div>
            </div>
         </div>
         );
       })()}
    </div>
  );
}
