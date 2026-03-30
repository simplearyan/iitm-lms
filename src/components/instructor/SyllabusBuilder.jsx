import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, GripVertical, Video, FileText, CheckCircle2, Navigation, Trash2, Settings, Download, X, Edit3, Save } from 'lucide-react';
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

  return <div ref={contentRef} className="prose prose-sm max-w-none prose-slate prose-headings:font-bold prose-headings:m-0 prose-p:m-0 prose-a:text-blue-600 prose-code:font-mono prose-code:text-[0.85em] prose-pre:bg-slate-800 prose-pre:text-slate-50 prose-pre:my-2 prose-pre:p-3 prose-pre:rounded-md break-words"></div>;
};

export default function SyllabusBuilder() {
  const { courseId } = useParams();
  const { courses, setCourses, exportData } = useStore();
  const course = courses.find(c => c.id === courseId);
  const courseIndex = courses.findIndex(c => c.id === courseId);
  
  const [activeModuleId, setActiveModuleId] = useState(course?.modules?.[0]?.id);
  const [editingItemId, setEditingItemId] = useState(null);

  if (!course) return <div>Course not found</div>;

  const handleDeleteModule = (moduleId) => {
    if (!window.confirm("Are you sure you want to delete this module and all its contents?")) return;
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
    
    // Create new blank item template
    const newItem = {
      id: `i_${Date.now()}`,
      type,
      title: `New ${type} item...`,
      ...(type === 'video' ? { url: '', notes: '' } : {}),
      ...(type === 'note' ? { content: '# Start writing...' } : {}),
      ...(type === 'activity' ? { 
          questions: [{
              id: `q_${Date.now()}`,
              description: 'What is $x^2$?', 
              options: ['Option A', 'Option B', 'Option C', 'Option D'], 
              answer: 0, 
              solution: 'Explanation goes here.'
          }]
      } : {})
    };
    
    updatedCourses[courseIndex].modules[moduleIndex].items.push(newItem);
    setCourses(updatedCourses);
  };

  const handleAddModule = () => {
    const updatedCourses = [...courses];
    updatedCourses[courseIndex].modules = updatedCourses[courseIndex].modules || [];
    const newModuleId = `m_${Date.now()}`;
    updatedCourses[courseIndex].modules.push({
        id: newModuleId,
        title: `Week ${updatedCourses[courseIndex].modules.length + 1}: New Topic`,
        items: []
    });
    setCourses(updatedCourses);
    setActiveModuleId(newModuleId);
  };

  const activeModule = course.modules?.find(m => m.id === activeModuleId);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in flex flex-col h-full mb-10">
      <div className="mb-8 shrink-0 flex flex-col md:flex-row md:items-start justify-between gap-6">
         <div className="flex flex-col items-start">
             <Link to="/instructor" className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 mb-6 transition-colors shadow-sm">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back to Authoring
             </Link>
             <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-3">
               Syllabus Editor
               <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-sm font-bold tracking-widest">{course.code}</span>
             </h1>
             <p className="mt-4 text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">{course.title}</p>
         </div>
         
         <button onClick={exportData} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all shrink-0">
            <Download className="w-5 h-5"/>
            Publish & Export JSON
         </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
         {/* Modules List */}
         <div className="w-full lg:w-[350px] flex flex-col gap-3 bg-white p-4 py-6 rounded-[2rem] border border-slate-200 overflow-y-auto shadow-sm pb-10">
           <div className="flex justify-between items-center mb-6 px-4">
             <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">Modules</h3>
             <button onClick={handleAddModule} className="text-orange-600 bg-orange-50 hover:bg-orange-100 p-2 rounded-xl transition-colors shrink-0">
               <Plus className="w-5 h-5"/>
             </button>
           </div>
           
           <div className="space-y-3 px-2">
           {course.modules?.map(m => (
             <div key={m.id} className={`w-full flex items-center rounded-2xl border-2 transition-all ${activeModuleId === m.id ? 'border-orange-500 bg-orange-50/50 shadow-sm' : 'border-slate-100 bg-white'}`}>
               <button 
                 onClick={() => setActiveModuleId(m.id)}
                 className={`flex-1 text-left p-4 font-bold rounded-l-2xl hover:bg-slate-50/50 transition-colors ${activeModuleId === m.id ? 'text-orange-900' : 'text-slate-700'}`}
               >
                 {m.title}
               </button>
               <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(m.id); }} className="p-4 text-slate-300 hover:text-red-500 transition-colors shrink-0" title="Delete Week">
                 <Trash2 className="w-5 h-5"/>
               </button>
             </div>
           ))}
           </div>
           
           {(!course.modules || course.modules.length === 0) && (
               <div className="text-center p-6 text-slate-400 font-medium bg-slate-50 rounded-2xl mx-4 mt-4 border border-dashed border-slate-200">
                   Click + to add a week
               </div>
           )}
         </div>

         {/* Items Editor */}
         <div className="w-full lg:w-2/3 bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 overflow-y-auto relative shadow-sm">
           {activeModule ? (
             <>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b border-slate-100 pb-8">
                 <div className="flex-1 w-full">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Navigation className="w-4 h-4" /> Module Editor
                     </p>
                     <input 
                         className="w-full font-black text-2xl text-slate-800 bg-transparent focus:outline-none focus:bg-slate-50 hover:bg-slate-50 p-2 -ml-2 rounded-xl transition-colors border border-transparent focus:border-slate-200 leading-tight"
                         defaultValue={activeModule.title}
                         onBlur={(e) => {
                             const updated = [...courses];
                             const mIdx = course.modules.findIndex(m => m.id === activeModuleId);
                             updated[courseIndex].modules[mIdx].title = e.target.value;
                             setCourses(updated);
                         }}
                     />
                 </div>
                 <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 w-full md:w-auto shrink-0 justify-between md:justify-start overflow-x-auto">
                   <button onClick={() => handleAddItem('video')} className="px-4 py-2 bg-white flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl shrink-0 transition-all shadow-sm hover:shadow-md" title="Add Video"><Video className="w-4 h-4"/> Video</button>
                   <button onClick={() => handleAddItem('note')} className="px-4 py-2 bg-white flex items-center gap-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-xl shrink-0 transition-all shadow-sm hover:shadow-md" title="Add Note"><FileText className="w-4 h-4"/> Note</button>
                   <button onClick={() => handleAddItem('activity')} className="px-4 py-2 bg-white flex items-center gap-2 text-sm font-bold text-orange-600 hover:bg-orange-50 hover:text-orange-700 border border-slate-200 rounded-xl shrink-0 transition-all shadow-sm hover:shadow-md" title="Add Activity"><CheckCircle2 className="w-4 h-4"/> Activity</button>
                 </div>
               </div>

               <div className="space-y-4">
                 {activeModule.items?.map(item => (
                   <div key={item.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-2xl bg-white hover:shadow-md hover:-translate-y-0.5 transition-all group">
                     <div className="cursor-grab text-slate-300 hover:text-slate-500 p-2">
                       <GripVertical className="w-5 h-5" />
                     </div>
                     <div className={`p-3 rounded-xl shrink-0 ${item.type === 'video' ? 'bg-blue-100 text-blue-600' : (item.type === 'note' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600')}`}>
                       {item.type === 'video' ? <Video className="w-5 h-5"/> : (item.type === 'note' ? <FileText className="w-5 h-5"/> : <CheckCircle2 className="w-5 h-5"/>)}
                     </div>
                     <input 
                       className="flex-1 font-bold text-slate-800 text-lg focus:outline-none focus:ring-4 focus:ring-orange-500/10 px-4 py-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all"
                       defaultValue={item.title}
                       onBlur={(e) => {
                          const updated = [...courses];
                          const mIdx = course.modules.findIndex(m => m.id === activeModuleId);
                          const iIdx = course.modules[mIdx].items.findIndex(i => i.id === item.id);
                          updated[courseIndex].modules[mIdx].items[iIdx].title = e.target.value;
                          setCourses(updated);
                       }}
                     />
                     <div className="flex items-center gap-1 sm:ml-auto w-full sm:w-auto shrink-0 justify-end border-t sm:border-0 border-slate-100 pt-3 sm:pt-0 mt-1 sm:mt-0">
                        <button onClick={() => setEditingItemId(item.id)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold px-3">
                           <Settings className="w-4 h-4"/> Content
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors ml-1" title="Delete Item">
                           <Trash2 className="w-4 h-4"/>
                        </button>
                     </div>
                   </div>
                 ))}
                 
                 {(!activeModule.items || activeModule.items.length === 0) && (
                   <div className="text-center py-20 text-slate-400 font-semibold bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl mx-2">
                     No items in this module.<br/>Use the buttons above to inject content.
                   </div>
                 )}
               </div>
             </>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 font-medium py-32 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                <Navigation className="w-16 h-16 text-slate-300 mb-6"/>
                <p>Select a module from the left to edit its contents.</p>
             </div>
           )}
       </div>
      </div>

       {/* Content Inspector Slide-over */}
       {editingItemId && activeModule?.items?.find(i => i.id === editingItemId) && (() => {
         const editingItem = activeModule.items.find(i => i.id === editingItemId);
         return (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setEditingItemId(null)}></div>
            <div className="w-full max-w-4xl bg-white shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 rounded-xl border border-gray-200">
               
               <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                     <Edit3 className="w-5 h-5 text-blue-400"/> Content Editor
                  </h3>
                  <button onClick={() => setEditingItemId(null)} className="text-gray-300 hover:text-white transition-colors "><X className="w-6 h-6"/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-white">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Item Title</label>
                    <input 
                      className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900"
                      value={editingItem.title || ''}
                      onChange={(e) => updateEditingItem('title', e.target.value)}
                    />
                  </div>

                  {editingItem.type === 'video' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">YouTube Video URL</label>
                        <input 
                          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900"
                          placeholder="https://youtube.com/embed/..."
                          value={editingItem.url || ''}
                          onChange={(e) => updateEditingItem('url', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Video Synopsis (Markdown)</label>
                        <textarea 
                          className="w-full p-3 border border-gray-300 rounded h-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm leading-relaxed text-gray-800"
                          value={editingItem.notes || ''}
                          onChange={(e) => updateEditingItem('notes', e.target.value)}
                          placeholder="Write video synopsis here..."
                        />
                      </div>
                    </>
                  )}

                  {editingItem.type === 'note' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-[400px]">
                        <div className="flex-1 flex flex-col">
                            <label className="block text-sm font-bold text-gray-800 mb-2 flex justify-between items-center">
                               Document Body 
                               <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-mono">MD + LaTeX</span>
                            </label>
                            <textarea 
                              className="w-full p-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-relaxed text-gray-800 flex-1 resize-none shadow-inner"
                              value={editingItem.content || ''}
                              onChange={(e) => updateEditingItem('content', e.target.value)}
                              placeholder="# Welcome to Notes\n\nWrite your equations with $$..."
                            />
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                            <label className="block text-sm font-bold text-gray-800 mb-2 flex justify-between items-center">
                               Live Preview 
                               <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>Active</span>
                            </label>
                            <div className="w-full p-4 md:p-6 border border-gray-200 bg-white rounded flex-1 overflow-y-auto custom-scrollbar shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] min-w-0 overflow-x-hidden">
                               <MarkdownPreviewBlock content={editingItem.content || ''} />
                            </div>
                        </div>
                    </div>
                  )}

                  {editingItem.type === 'activity' && (() => {
                    const safeQuestions = editingItem.questions || [{
                         id: editingItem.id + "_tmp",
                         description: editingItem.description || '',
                         options: editingItem.options || ['Option A', 'Option B', 'Option C', 'Option D'],
                         answer: editingItem.answer || 0,
                         solution: editingItem.solution || ''
                    }];

                    const updateQuestion = (qIndex, field, value) => {
                        const newQs = [...safeQuestions];
                        newQs[qIndex] = { ...newQs[qIndex], [field]: value };
                        updateEditingItem('questions', newQs);
                    };

                    const addQuestion = () => {
                        const newQs = [...safeQuestions, {
                            id: `q_${Date.now()}`,
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
                      {safeQuestions.map((q, qIndex) => (
                        <div key={q.id} className="p-5 md:p-6 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden group">
                           {safeQuestions.length > 1 && (
                               <button onClick={() => removeQuestion(qIndex)} className="absolute top-4 right-4 text-red-400 hover:text-white hover:bg-red-500 bg-white p-1.5 rounded shadow-sm border border-red-100 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></button>
                           )}
                           <h4 className="font-black text-slate-800 mb-5 flex items-center text-lg">
                              <span className="bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm mr-3 shadow-sm">{qIndex + 1}</span> 
                              Question Builder
                           </h4>
                           
                           {/* Question Description */}
                           <div>
                               <label className="block text-sm font-bold text-gray-800 mb-2">Question Text (MD & KaTeX)</label>
                               <div className="flex flex-col md:flex-row gap-4 mb-6">
                                   <textarea rows="4" value={q.description || ''} onChange={e => updateQuestion(qIndex, 'description', e.target.value)} className="w-full md:w-1/2 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-800 resize-y shadow-inner" placeholder="E.g., What is $x^2$?" />
                                   <div className="w-full md:w-1/2 p-4 bg-white border border-gray-200 rounded shadow-sm overflow-y-auto max-h-40 min-w-0">
                                      <MarkdownPreviewBlock content={q.description || "Type above to preview text..."} />
                                   </div>
                               </div>
                           </div>

                           {/* Options */}
                           <div>
                               <label className="block text-sm font-bold text-gray-800 mb-3">Options & Correct Answer</label>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                   {(q.options || ['Option A', 'Option B', 'Option C', 'Option D']).map((opt, oIdx) => (
                                       <div key={oIdx} className={`flex items-start space-x-3 bg-white p-3 rounded-lg border transition-all relative overflow-hidden ${q.answer === oIdx ? 'border-green-400 ring-2 ring-green-500/10 shadow-md' : 'border-gray-200 shadow-sm'}`}>
                                           <div className={`absolute left-0 top-0 bottom-0 w-1 ${q.answer === oIdx ? 'bg-green-500' : 'bg-transparent'}`}></div>
                                           <input 
                                               type="radio" 
                                               name={`correct_answer_${q.id}`} 
                                               checked={q.answer === oIdx}
                                               onChange={() => updateQuestion(qIndex, 'answer', oIdx)}
                                               className="mt-2.5 w-4 h-4 accent-green-600 cursor-pointer ml-1.5 shrink-0"
                                           />
                                           <div className="flex-1 pr-2 min-w-0">
                                               <input 
                                                   type="text" 
                                                   value={opt} 
                                                   onChange={e => {
                                                       let newOpts = [...(q.options || ['','','',''])];
                                                       newOpts[oIdx] = e.target.value;
                                                       updateQuestion(qIndex, 'options', newOpts);
                                                   }} 
                                                   className="w-full border-b border-gray-200 focus:border-blue-500 pb-1 mb-2 bg-transparent focus:outline-none text-sm font-bold text-gray-900" 
                                                   placeholder={`Option ${String.fromCharCode(65+oIdx)}`}
                                               />
                                               <div className="text-xs text-slate-600 p-2 bg-slate-50/50 rounded border border-slate-100 min-h-[40px] flex items-center shadow-inner overflow-hidden">
                                                   <MarkdownPreviewBlock content={opt || "Preview inline math..."} />
                                               </div>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>

                           {/* Solution / Explanation */}
                           <div>
                               <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center">
                                   Solution / Explanation
                               </label>
                               <textarea rows="2" value={q.solution || ""} onChange={e => updateQuestion(qIndex, 'solution', e.target.value)} className="w-full p-3 border border-amber-200 bg-amber-50/30 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm text-amber-900" placeholder="Explain the underlying concepts..." />
                           </div>
                        </div>
                      ))}
                      
                      <button onClick={addQuestion} className="w-full py-4 border-2 border-dashed border-indigo-200 text-indigo-700 bg-indigo-50/50 font-bold rounded-xl hover:bg-indigo-100 hover:border-indigo-400 transition-all flex items-center justify-center group shadow-sm">
                         <Plus className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform"/> Add Another Question
                      </button>
                    </div>
                    );
                  })()}
               </div>
               
               <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0 flex justify-end gap-3">
                  <button onClick={() => setEditingItemId(null)} className="px-5 py-2 hover:bg-gray-200 text-gray-700 font-bold rounded transition-colors border border-gray-300 bg-white shadow-sm">
                     Close
                  </button>
                  <button onClick={() => setEditingItemId(null)} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-all shadow-sm flex items-center gap-2">
                     <Save className="w-4 h-4"/> Save Content
                  </button>
               </div>
            </div>
         </div>
         );
       })()}
    </div>
  );
}
