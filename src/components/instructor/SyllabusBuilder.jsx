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
    currentYear, setYear, 
    currentTerm, setTerm, 
    generateSemanticId 
  } = useStore();
  
  const course = courses.find(c => c.id === courseId);
  const courseIndex = courses.findIndex(c => c.id === courseId);
  
  const [activeModuleId, setActiveModuleId] = useState(course?.modules?.[0]?.id);
  const [editingItemId, setEditingItemId] = useState(null);

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
       {editingItemId && activeModule?.items?.find(i => i.id === editingItemId) && (() => {
         const editingItem = activeModule.items.find(i => i.id === editingItemId);
         return (
         <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in" onClick={() => setEditingItemId(null)}></div>
            <div className="w-full max-w-4xl bg-white shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 rounded-2xl border border-slate-200">
               
               <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-0.5 leading-none">{editingItem.id}</span>
                    <h3 className="font-black text-sm tracking-tight flex items-center gap-2">
                       <Edit3 className="w-4 h-4 text-blue-400 uppercase"/> CONTENT EDITOR
                    </h3>
                  </div>
                  <button onClick={() => setEditingItemId(null)} className="text-slate-500 hover:text-white transition-colors "><X className="w-6 h-6"/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-white">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Internal Reference Title</label>
                    <input 
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-800 transition-all"
                      value={editingItem.title || ''}
                      onChange={(e) => updateEditingItem('title', e.target.value)}
                    />
                  </div>

                  {editingItem.type === 'video' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">YouTube URL</label>
                        <input 
                          className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-800 transition-all placeholder:text-slate-300"
                          placeholder="https://youtube.com/embed/..."
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
                    const safeQuestions = editingItem.questions || [];

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
                    };

                    const removeQuestion = (qIndex) => {
                        if (safeQuestions.length <= 1) return;
                        const newQs = safeQuestions.filter((_, idx) => idx !== qIndex);
                        updateEditingItem('questions', newQs);
                    }

                    return (
                    <div className="space-y-8">
                       {editingItem.type === 'quiz' && (
                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shadow-inner relative overflow-hidden">
                             <div>
                               <label className="block text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Type</label>
                               <select 
                                 className="w-full p-2 bg-white border border-purple-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 text-xs font-bold text-slate-800"
                                 value={editingItem.examType || 'Quiz 1'}
                                 onChange={(e) => updateEditingItem('examType', e.target.value)}
                               >
                                 <option>Mock Practice</option>
                                 <option>Graded Assignment</option>
                                 <option>Quiz 1</option>
                                 <option>Quiz 2</option>
                                 <option>End Term</option>
                               </select>
                             </div>
                            <div>
                              <label className="block text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Duration (Min)</label>
                              <input 
                                type="number"
                                className="w-full p-2 bg-white border border-purple-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 text-xs font-bold text-slate-800"
                                value={editingItem.duration || 30}
                                onChange={(e) => updateEditingItem('duration', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Marks</label>
                              <input 
                                type="number"
                                className="w-full p-2 bg-white border border-purple-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 text-xs font-bold text-slate-800"
                                value={editingItem.totalMarks || 10}
                                onChange={(e) => updateEditingItem('totalMarks', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Release Policy</label>
                              <select 
                                className="w-full p-2 bg-white border border-purple-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 text-xs font-bold text-slate-800"
                                value={editingItem.submissionRule || 'anytime'}
                                onChange={(e) => updateEditingItem('submissionRule', e.target.value)}
                              >
                                <option value="anytime">Open Access</option>
                                <option value="last_10_mins">Final 10 Mins</option>
                                <option value="auto_only">Strict Auto</option>
                              </select>
                            </div>
                        </div>
                       )}

                       {safeQuestions.map((q, qIndex) => (
                        <div key={q.id} className="p-4 bg-slate-100/50 border border-slate-200 rounded-xl relative group transition-all hover:bg-slate-100/80">
                           <button onClick={() => removeQuestion(qIndex)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Trash2 className="w-4 h-4"/>
                           </button>
                           
                           <h4 className="font-black text-slate-800 mb-4 flex items-center text-xs tracking-tight">
                              <span className="bg-slate-900 text-white w-5 h-5 rounded flex items-center justify-center text-[10px] mr-2 shadow-sm">{qIndex + 1}</span> 
                              {q.id}
                           </h4>
                           
                           {/* Question Task */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                               <div className="flex flex-col">
                                   <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Question Body</label>
                                   <textarea rows="4" value={q.description || ''} onChange={e => updateQuestion(qIndex, 'description', e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono text-xs text-slate-800 bg-white" placeholder="Problem statement..." />
                               </div>
                               <div className="flex flex-col min-w-0">
                                   <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Preview</label>
                                   <div className="p-3 bg-white border border-slate-200 rounded-lg overflow-y-auto max-h-[120px] shadow-inner text-sm min-w-0">
                                      <MarkdownPreviewBlock content={q.description || ""} />
                                   </div>
                               </div>
                           </div>

                           {/* Options Grid */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                               {(q.options || []).map((opt, oIdx) => (
                                   <div key={oIdx} className={`flex items-start gap-2 bg-white p-2 rounded-lg border transition-all ${q.answer === oIdx ? 'border-green-300 bg-green-50/10' : 'border-slate-200'}`}>
                                       <input 
                                           type="radio" 
                                           name={`ans_${q.id}`} 
                                           checked={q.answer === oIdx}
                                           onChange={() => updateQuestion(qIndex, 'answer', oIdx)}
                                           className="mt-1.5 w-3.5 h-3.5 accent-green-600 shrink-0"
                                       />
                                       <div className="flex-1 min-w-0">
                                           <input 
                                               type="text" 
                                               value={opt} 
                                               onChange={e => {
                                                   let nOpts = [...(q.options || [])];
                                                   nOpts[oIdx] = e.target.value;
                                                   updateQuestion(qIndex, 'options', nOpts);
                                               }} 
                                               className="w-full border-b border-slate-100 focus:border-blue-300 pb-0.5 mb-1 bg-transparent focus:outline-none text-xs font-bold text-slate-800" 
                                               placeholder="Option text..."
                                           />
                                           <div className="text-[10px] text-slate-400 py-1 bg-slate-50/50 rounded px-1 opacity-60">
                                               <MarkdownPreviewBlock content={opt || ""} />
                                           </div>
                                       </div>
                                   </div>
                               ))}
                           </div>

                           {/* Solution */}
                           <div>
                               <label className="block text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1 ml-1">Solution Reasoning</label>
                               <textarea rows="2" value={q.solution || ""} onChange={e => updateQuestion(qIndex, 'solution', e.target.value)} className="w-full p-2.5 border border-amber-100 bg-amber-50/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200 font-mono text-xs text-amber-900" placeholder="Step-by-step logic..." />
                           </div>
                        </div>
                       ))}
                       
                       <button onClick={addQuestion} className="w-full py-3 border border-dashed border-slate-300 text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 hover:border-slate-400 hover:text-slate-600 transition-all flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4"/> Append Question
                       </button>
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
