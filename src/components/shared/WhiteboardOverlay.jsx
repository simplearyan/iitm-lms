import React, { useRef, useState, useEffect } from 'react';
import rough from 'roughjs/bundled/rough.cjs.js';
import useStore from '../../store/useStore';
import { X, Pen, Eraser, RotateCcw } from 'lucide-react';

export default function WhiteboardOverlay({ 
  questionId, 
  onClose,
  isInline = false,
  toolProp = 'pen',
  colorProp = '#4f46e5',
  strokeWidthProp = 3
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Internal state for non-inline mode, overridden by props in inline mode
  const [internalTool, setInternalTool] = useState('pen');
  const tool = isInline ? toolProp : internalTool;
  
  const { whiteboardData, updateWhiteboardData } = useStore();
  let elements = whiteboardData[questionId] || [];

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    const resize = () => {
      // In inline mode, fill the parent container relative block.
      // In fixed mode, fill window.
      const parent = canvas.parentElement;
      canvas.width = isInline ? parent.clientWidth : window.innerWidth;
      canvas.height = isInline ? parent.clientHeight : window.innerHeight;
      requestAnimationFrame(redraw);
    };
    
    // Initial and window resize
    window.addEventListener('resize', resize);
    
    // Small delay to ensure parent handles layout shifts before drawing
    setTimeout(resize, 50); 
    
    return () => window.removeEventListener('resize', resize);
  }, [elements, isInline]); // Re-evaluate if inline switches

  const redraw = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add a faint dot grid if NOT inline
    if (!isInline) {
      ctx.fillStyle = '#cbd5e1';
      for (let x = 0; x < canvas.width; x += 40) {
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const rc = rough.canvas(canvas);
    
    elements.forEach(el => {
      const options = { 
          stroke: el.stroke, 
          strokeWidth: el.strokeWidth, 
          roughness: 1.5,
          seed: el.seed || 1,
          bowing: 1
      };
      
      if (el.type === 'pen' && el.points.length > 0) {
        rc.linearPath(el.points, options);
      } else if (el.type === 'line' && el.points.length === 2) {
        rc.line(el.points[0][0], el.points[0][1], el.points[1][0], el.points[1][1], options);
      } else if (el.type === 'arrow' && el.points.length === 2) {
        const [x1, y1] = el.points[0];
        const [x2, y2] = el.points[1];
        rc.line(x1, y1, x2, y2, options);
        // Draw arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 15;
        rc.line(x2, y2, x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6), options);
        rc.line(x2, y2, x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6), options);
      } else if (el.type === 'rectangle' && el.points.length === 2) {
        const [x1, y1] = el.points[0];
        const [x2, y2] = el.points[1];
        rc.rectangle(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1), options);
      } else if (el.type === 'ellipse' && el.points.length === 2) {
        const [x1, y1] = el.points[0];
        const [x2, y2] = el.points[1];
        rc.ellipse(x1 + (x2 - x1)/2, y1 + (y2 - y1)/2, Math.abs(x2 - x1), Math.abs(y2 - y1), options);
      } else if (el.type === 'triangle' && el.points.length === 2) {
        const [x1, y1] = el.points[0];
        const [x2, y2] = el.points[1];
        rc.polygon([[x1 + (x2 - x1) / 2, y1], [x1, y2], [x2, y2]], options);
      } else if (el.type === 'graph' && el.points.length === 2) {
        const [x1, y1] = el.points[0];
        const [x2, y2] = el.points[1];
        const xMid = x1 + (x2 - x1) / 2;
        const yMid = y1 + (y2 - y1) / 2;
        rc.line(xMid, Math.min(y1, y2), xMid, Math.max(y1, y2), options);
        rc.line(Math.min(x1, x2), yMid, Math.max(x1, x2), yMid, options);
      }
    });
  };

  const getPointerPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleDown = (e) => {
    if (tool === 'pointer') return; 

    setIsDrawing(true);
    const pos = getPointerPos(e);
    
    // Always get fresh element list from Zustand to bypass stale drag closures
    const currentElements = useStore.getState().whiteboardData[questionId] || [];

    if (['pen', 'line', 'arrow', 'rectangle', 'ellipse', 'triangle', 'graph'].includes(tool)) {
      const newElement = {
        type: tool,
        points: tool === 'pen' ? [[pos.x, pos.y]] : [[pos.x, pos.y], [pos.x, pos.y]], 
        stroke: colorProp,
        strokeWidth: strokeWidthProp,
        seed: Math.floor(Math.random() * 100000)
      };
      updateWhiteboardData(questionId, [...currentElements, newElement]);
    } else if (tool === 'eraser') {
      eraseAt(pos);
    }
  };

  const handleMove = (e) => {
    if (!isDrawing) return;
    const pos = getPointerPos(e);
    
    // Always get fresh element list from Zustand
    const currentElements = useStore.getState().whiteboardData[questionId] || [];
    
    if (tool === 'pen') {
      if (currentElements.length === 0) return;
      const lastElement = {...currentElements[currentElements.length - 1]};
      lastElement.points = [...lastElement.points, [pos.x, pos.y]];
      const newElements = [...currentElements.slice(0, -1), lastElement];
      updateWhiteboardData(questionId, newElements);
      redraw();
    } else if (['line', 'arrow', 'rectangle', 'ellipse', 'triangle', 'graph'].includes(tool)) {
      if (currentElements.length === 0) return;
      const lastElement = {...currentElements[currentElements.length - 1]};
      lastElement.points = [lastElement.points[0], [pos.x, pos.y]];
      const newElements = [...currentElements.slice(0, -1), lastElement];
      updateWhiteboardData(questionId, newElements);
      redraw();
    } else if (tool === 'eraser') {
      eraseAt(pos);
    }
  };

  const handleUp = () => setIsDrawing(false);

  const eraseAt = (pos) => {
     // Fetch fresh elements from zustand state to avoid holding a stale array slice while dragging
     const currentElements = useStore.getState().whiteboardData[questionId] || [];
     
     const newElements = currentElements.filter(el => {
       if (el.type === 'pen') {
           return !el.points.some(p => Math.hypot(p[0] - pos.x, p[1] - pos.y) < 30);
       } else {
           const [x1, y1] = el.points[0];
           const [x2, y2] = el.points[1];
           const minX = Math.min(x1, x2) - 30;
           const maxX = Math.max(x1, x2) + 30;
           const minY = Math.min(y1, y2) - 30;
           const maxY = Math.max(y1, y2) + 30;
           return !(pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY);
       }
     });
     
     if (newElements.length !== currentElements.length) {
       updateWhiteboardData(questionId, newElements);
       redraw();
     }
  };

  // If pointer mode, we should allow clicks to pass right through the canvas layer to the MCQ buttons underneath
  const canvasStyles = tool === 'pointer' ? { pointerEvents: 'none' } : { touchAction: 'none' };
  const containerClasses = isInline 
    ? "absolute inset-0 z-20" 
    : "fixed inset-0 z-[100] bg-white/95 backdrop-blur-md animate-in fade-in duration-200";

  return (
    <div className={containerClasses} style={tool === 'pointer' ? { pointerEvents: 'none'} : {}}>
      
      {/* Fallback Internal Toolbar when NOT inline */}
      {!isInline && (
        <div className="absolute top-6 mx-auto left-0 right-0 w-fit bg-white shadow-2xl rounded-full px-4 py-3 border border-slate-200 flex items-center gap-3 z-30" style={{pointerEvents: 'auto'}}>
          <button onClick={() => setInternalTool('pen')} className={`p-4 rounded-full transition-colors ${internalTool === 'pen' ? 'bg-indigo-600 text-white shadow-md scale-110' : 'text-slate-500 hover:bg-slate-100'} title="Pen"`}>
            <Pen className="w-5 h-5"/>
          </button>
          <button onClick={() => setInternalTool('eraser')} className={`p-4 rounded-full transition-colors ${internalTool === 'eraser' ? 'bg-indigo-600 text-white shadow-md scale-110' : 'text-slate-500 hover:bg-slate-100'} title="Eraser"`}>
            <Eraser className="w-5 h-5"/>
          </button>
          <div className="w-px h-10 bg-slate-200 mx-1"></div>
          <button onClick={() => { updateWhiteboardData(questionId, []); redraw(); }} className="p-3 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" title="Clear All">
            <RotateCcw className="w-5 h-5"/>
          </button>
          <div className="w-px h-10 bg-slate-200 mx-1"></div>
          <button onClick={onClose} className="p-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors" title="Close Canvas">
            <X className="w-6 h-6"/>
          </button>
        </div>
      )}

      <canvas 
        ref={canvasRef}
        className={`w-full h-full ${tool === 'pointer' ? '' : 'cursor-crosshair'}`}
        style={canvasStyles}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerOut={handleUp}
        onTouchStart={handleDown}
        onTouchMove={handleMove}
        onTouchEnd={handleUp}
      />
    </div>
  );
}
