import React from 'react';
import { Printer, X, Eye, HelpCircle } from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function PrintPreviewModal({
  isOpen,
  onClose,
  title,
  children
}: PrintPreviewModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto font-sans">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md no-print transition-opacity"
        onClick={onClose}
      />

      {/* Modal content container */}
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        <div 
          id="print-modal-wrapper"
          className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col no-print animate-in zoom-in-95 duration-150"
        >
          {/* Header Panel (Hidden during Print) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 no-print">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Printer className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">{title}</h3>
                <p className="text-[10px] text-slate-400">Pristine vectors styled for high-contrast letterheads & paper weights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Native Print Trigger */}
              <button
                onClick={handlePrint}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-black px-4 py-2 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10 transition-all"
              >
                <Printer className="w-4 h-4" />
                Trigger Print
              </button>
              
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="bg-slate-950/60 border-b border-slate-800/50 px-6 py-2.5 flex items-center gap-2 text-[10px] text-slate-400 no-print">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              <strong>Print Tips:</strong> For exact fit, enable <strong>"Background graphics"</strong> and set margins to <strong>"None"</strong> in the browser print settings dialogue.
            </span>
          </div>

          {/* Realistic Paper Desk (Interactive Scrollable Container) */}
          <div className="p-6 sm:p-8 bg-slate-950/80 overflow-y-auto max-h-[70vh] flex justify-center no-print scrollbar-thin scrollbar-thumb-slate-800">
            <div className="bg-white text-slate-800 shadow-2xl p-8 sm:p-12 rounded-xl max-w-[210mm] w-full border border-slate-300 font-serif leading-relaxed text-xs relative aspect-[1/1.414]">
              {children}
            </div>
          </div>

          {/* Bottom Controls (Hidden during Print) */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 rounded-b-2xl flex justify-between items-center no-print">
            <span className="text-[10px] text-slate-500 font-mono">OHADA/Cameroon Compliance Verification Seal v3.2</span>
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white border border-slate-850 hover:bg-slate-800 font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>

      {/* Raw Print CSS Rules */}
      <style>{`
        @media print {
          /* Hide entire React App Root */
          #root {
            display: none !important;
          }
          /* Hide all overlays, backdrops, modal container, headers and close buttons */
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          /* Force body to be white and have standard layout */
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Display ONLY the children content in a standard, unstyled printable paper */
          #print-preview-target-parent {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          /* Ensure text colors are high-contrast black/grey for office printers */
          #print-preview-target-parent * {
            color: black !important;
            border-color: #cbd5e1 !important;
          }
        }
      `}</style>

      {/* Hidden printable target strictly for browser print engine (Always visible to print context) */}
      <div 
        id="print-preview-target-parent" 
        className="hidden bg-white text-slate-900 p-12 font-serif leading-relaxed text-xs"
      >
        {children}
      </div>
    </div>
  );
}
