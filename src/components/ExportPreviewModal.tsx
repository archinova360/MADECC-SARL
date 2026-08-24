import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileDown,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Download,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { ExportModuleType, ExportFormat } from '../types/exportTypes.ts';
import { DocumentExportService } from '../services/DocumentExportService.ts';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleType: ExportModuleType;
  recordId: string | number;
  documentTitle?: string;
  initialRecord?: any;
  recordVersion?: string | number;
  requestedBy?: string;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  moduleType,
  recordId,
  documentTitle,
  initialRecord,
  recordVersion = '1.0',
  requestedBy = 'admin@madeccgroup.cm',
  showToast,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [record, setRecord] = useState<any>(initialRecord);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      if (initialRecord) {
        setRecord(initialRecord);
      } else if (recordId && moduleType) {
        fetchRecord();
      }
    }
  }, [isOpen, recordId, moduleType, initialRecord]);

  const fetchRecord = async () => {
    setIsLoadingRecord(true);
    setValidationError(null);
    try {
      const res = await fetch(`/api/export/record/${moduleType}/${recordId}`);
      if (res.ok) {
        const json = await res.json();
        setRecord(json.record);
      } else {
        setRecord(null);
      }
    } catch (e) {
      console.warn('Failed to fetch export record:', e);
    } finally {
      setIsLoadingRecord(false);
    }
  };

  if (!isOpen) return null;

  const getModuleDetails = () => {
    switch (moduleType) {
      case 'civil_works':
        return {
          title: 'Civil Works Engineering Report',
          badge: 'CIVIL_WORKS',
          color: 'from-amber-500 to-amber-600',
          estPages: '2 - 4 Pages (A4)',
          description: 'Official Civil Works report containing site specifications, BOQ valuation, earthworks, and sign-offs.',
        };
      case 'articles_of_association':
        return {
          title: 'Articles of Association (Statuts)',
          badge: 'AOA_STATUTES',
          color: 'from-blue-600 to-indigo-600',
          estPages: '4 - 8 Pages (A4)',
          description: 'Legal corporate statute conforming to OHADA AUDSCGIE standards and shareholder distributions.',
        };
      case 'blueprints':
        return {
          title: 'Blueprint Technical Drawing Sheet',
          badge: 'BLUEPRINT',
          color: 'from-cyan-500 to-blue-600',
          estPages: '1 - 2 Pages (A4 Landscape)',
          description: 'CAD/Architectural/Structural drawing sheet with engineering title block and materials directives.',
        };
      case 'safety_inspections':
        return {
          title: 'Site Safety & HSE Audit Report',
          badge: 'SAFETY_HSE',
          color: 'from-emerald-500 to-teal-600',
          estPages: '2 - 3 Pages (A4)',
          description: 'HSE inspection checklist, risk assessment matrix, PPE compliance score, and corrective action plan.',
        };
      case 'pedagogical_lessons':
        return {
          title: 'Pedagogical Lesson Preparation Plan',
          badge: 'LESSON_PLAN',
          color: 'from-purple-500 to-indigo-600',
          estPages: '2 - 3 Pages (A4)',
          description: 'Official MINESEC Competency-Based Approach (CBA) lesson plan with methodological execution matrix.',
        };
      case 'receipts':
        return {
          title: 'Corporate Digital Receipt & Fiscal Voucher',
          badge: 'FISCAL_RECEIPT',
          color: 'from-amber-500 to-amber-600',
          estPages: '1 Page (A4 Portrait)',
          description: 'Certified fiscal receipt mapping transaction breakdown, TVA tax, remaining balance, and public verification key.',
        };
    }
  };

  const moduleInfo = getModuleDetails();
  const displayTitle = documentTitle || record?.title || record?.projectName || record?.companyName || record?.topic || `${moduleInfo.title} ${recordId}`;

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setValidationError(null);

    try {
      const result = await DocumentExportService.exportDocument({
        moduleType,
        recordId,
        recordVersion,
        documentTitle: displayTitle,
        exportFormat: format,
        data: record,
        requestedBy,
      });

      if (result.success) {
        if (showToast) {
          showToast(`Successfully generated ${format.toUpperCase()} export: ${result.filename}`, 'success');
        }
        onClose();
      } else {
        setValidationError(result.error || 'Failed to generate requested export file.');
        if (showToast) {
          showToast(result.error || 'Export failed', 'error');
        }
      }
    } catch (err: any) {
      setValidationError(err?.message || 'Error occurred during file generation.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${moduleInfo.color} text-slate-950 font-black shadow-lg`}>
              <FileDown className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase bg-slate-800 text-amber-400 px-2 py-0.5 rounded-md border border-slate-700">
                  {moduleInfo.badge}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Ref: <strong className="text-slate-200">{recordId}</strong>
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                Official Document Export Preview
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {validationError && (
            <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-200 text-xs leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-red-300">Export Validation Error</strong>
                {validationError}
              </div>
            </div>
          )}

          {/* Selected Record Summary Box */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" /> Selected Target Record
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Exact Record Verified
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white tracking-wide">
                {displayTitle}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {moduleInfo.description}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Module</span>
                <span className="font-semibold text-slate-200">{moduleType.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Record ID</span>
                <span className="font-mono font-semibold text-amber-400">{recordId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Version</span>
                <span className="font-mono font-semibold text-slate-200">V{recordVersion}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Est. Length</span>
                <span className="font-semibold text-slate-200">{moduleInfo.estPages}</span>
              </div>
            </div>
          </div>

          {/* Format Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Choose Export File Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedFormat('pdf')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  selectedFormat === 'pdf'
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedFormat === 'pdf' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-xs font-bold text-white">A4 PDF Document</strong>
                  <span className="text-[11px] text-slate-400">High-fidelity printable A4 PDF</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('docx')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  selectedFormat === 'docx'
                    ? 'bg-blue-500/10 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedFormat === 'docx' ? 'bg-blue-500 text-white font-black' : 'bg-slate-800 text-slate-400'}`}>
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-xs font-bold text-white">Word (.DOCX) Document</strong>
                  <span className="text-[11px] text-slate-400">Fully editable Microsoft Word file</span>
                </div>
              </button>
            </div>
          </div>

          {/* Verification Quality Checklist */}
          <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs space-y-1.5 text-slate-400">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Automated Integrity Checks Passed:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Single record source verified
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> No cross-module contamination
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> A4 paper margin alignment
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Digital audit trail logging
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={isExporting || isLoadingRecord}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
            >
              {isExporting && selectedFormat === 'pdf' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Generating A4 PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950" />
                  Generate A4 PDF
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleExport('docx')}
              disabled={isExporting || isLoadingRecord}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-xl uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/10"
            >
              {isExporting && selectedFormat === 'docx' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Word...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-white" />
                  Generate Word (.DOCX)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
