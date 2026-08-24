import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Undo, X, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel?: () => void;
  title?: string;
}

export default function SignaturePad({ onSave, onCancel, title = "Draw Your Signature" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Function to initialize or resize the canvas
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get display size of the canvas container
    const rect = canvas.parentElement?.getBoundingClientRect();
    const width = rect?.width || 400;
    const height = 180;

    // Set internal canvas dimensions scaled for high DPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#f8fafc'; // Default stroke color (white/slate-50 for dark mode)
      ctx.lineWidth = 2.5;
    }
    
    // Save initial blank state to history
    const initialBlank = canvas.toDataURL();
    setHistory([initialBlank]);
  };

  useEffect(() => {
    initCanvas();
    // Re-initialize on window resize
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      // Touch Event
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      // Mouse Event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setHasDrawn(true);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
      // Push state to undo history
      const currentState = canvas.toDataURL();
      setHistory(prev => [...prev, currentState]);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
      
      const blankState = canvas.toDataURL();
      setHistory([blankState]);
    }
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length <= 1) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    const prevImgDataUrl = newHistory[newHistory.length - 1];
    const img = new Image();
    img.src = prevImgDataUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rect = canvas.getBoundingClientRect();
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      
      if (newHistory.length === 1) {
        setHasDrawn(false);
      }
    };
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 max-w-full shadow-2xl">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-amber-500 animate-[bounce_2s_infinite]" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">{title}</h3>
        </div>
        {onCancel && (
          <button 
            type="button"
            onClick={onCancel}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
          Sign inside the frame with your touch screen, stylus, or mouse pointer:
        </p>
        <div className="relative border border-slate-800/60 rounded-xl bg-slate-950 overflow-hidden select-none touch-none aspect-[2/1] min-h-[150px] flex items-center justify-center">
          {/* Helper background watermark guide */}
          {!hasDrawn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-700/40 space-y-1">
              <span className="text-[10px] font-mono tracking-widest uppercase">WRITE YOUR SIGNATURE HERE</span>
              <div className="w-32 h-px bg-slate-900" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair relative z-10"
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-1.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearCanvas}
            disabled={!hasDrawn}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300 disabled:hover:bg-slate-800 rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer"
          >
            <Eraser className="w-3 h-3" /> Clear
          </button>
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300 disabled:hover:bg-slate-800 rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer"
          >
            <Undo className="w-3 h-3" /> Undo
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasDrawn}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 text-slate-950 disabled:hover:bg-emerald-500 rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer"
        >
          <Check className="w-3 h-3 font-black" /> Use Signature
        </button>
      </div>
    </div>
  );
}
