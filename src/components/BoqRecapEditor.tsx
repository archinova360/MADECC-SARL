import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Percent,
  Coins,
  FileText,
  Download,
  Save,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Building2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Sliders,
  X,
  AlertCircle
} from 'lucide-react';
import { BoqData } from './BoqStudio';
import { numberToWords } from '../utils/numberToWords';

interface BoqRecapEditorProps {
  boq: BoqData;
  onUpdateBoq: (updated: BoqData) => void;
  onSave?: () => Promise<void>;
  onExportPdf?: () => void;
  onExportDocx?: () => void;
  isSaving?: boolean;
  generatingPdf?: boolean;
  exportingDocx?: boolean;
  isModal?: boolean;
  onClose?: () => void;
}

export const BoqRecapEditor: React.FC<BoqRecapEditorProps> = ({
  boq,
  onUpdateBoq,
  onSave,
  onExportPdf,
  onExportDocx,
  isSaving = false,
  generatingPdf = false,
  exportingDocx = false,
  isModal = false,
  onClose
}) => {
  // Calculated sum of all items in sections
  const calculatedItemsSubtotal = (boq.sections || []).reduce((sum, sec) => {
    const secSum = (sec.items || []).reduce((s, it) => {
      if (it.isArchived || it.status === 'ARCHIVED') return s;
      return s + (Number(it.amount) || 0);
    }, 0);
    return sum + secSum;
  }, 0);

  // Default values initialization
  const initialSubtotal = boq.subtotal !== undefined && boq.subtotal !== null && Number(boq.subtotal) > 0
    ? Number(boq.subtotal)
    : (calculatedItemsSubtotal > 0 ? calculatedItemsSubtotal : 57993500);

  const [subtotal, setSubtotal] = useState<number>(initialSubtotal);
  const [overheadPercent, setOverheadPercent] = useState<number>(
    boq.overheadPercent !== undefined ? Number(boq.overheadPercent) : 5
  );
  const [overheadAmount, setOverheadAmount] = useState<number>(
    boq.overheadAmount !== undefined && Number(boq.overheadAmount) > 0
      ? Number(boq.overheadAmount)
      : Math.round(initialSubtotal * 0.05)
  );

  const [contingencyPercent, setContingencyPercent] = useState<number>(
    boq.contingencyPercent !== undefined ? Number(boq.contingencyPercent) : 5
  );
  const [contingencyAmount, setContingencyAmount] = useState<number>(
    boq.contingencyAmount !== undefined && Number(boq.contingencyAmount) > 0
      ? Number(boq.contingencyAmount)
      : Math.round(initialSubtotal * 0.05)
  );

  const [profitPercent, setProfitPercent] = useState<number>(
    boq.profitPercent !== undefined ? Number(boq.profitPercent) : 10
  );
  const [profitAmount, setProfitAmount] = useState<number>(
    boq.profitAmount !== undefined && Number(boq.profitAmount) > 0
      ? Number(boq.profitAmount)
      : Math.round(initialSubtotal * 0.10)
  );

  const [taxPercent, setTaxPercent] = useState<number>(
    boq.taxPercent !== undefined ? Number(boq.taxPercent) : 0
  );
  const [taxAmount, setTaxAmount] = useState<number>(
    boq.taxAmount !== undefined ? Number(boq.taxAmount) : 0
  );

  const [autoCalculateGrandTotal, setAutoCalculateGrandTotal] = useState<boolean>(true);
  const [grandTotalOverride, setGrandTotalOverride] = useState<number>(
    Number(boq.grandTotal) || (initialSubtotal + overheadAmount + contingencyAmount + profitAmount + taxAmount)
  );

  // Amount In Words
  const computedGrandTotal = autoCalculateGrandTotal
    ? subtotal + overheadAmount + contingencyAmount + profitAmount + taxAmount
    : grandTotalOverride;

  const defaultWords = boq.amountInWords || boq.metadata?.amountInWords || numberToWords(computedGrandTotal, boq.currency || 'XAF');
  const [amountInWords, setAmountInWords] = useState<string>(defaultWords);

  // Revision & Audit History
  const [revisionNumber, setRevisionNumber] = useState<string>(boq.revisionNumber || 'REV-00');
  const [revisionDate, setRevisionDate] = useState<string>(
    boq.revisionDate || boq.metadata?.revisionDate || (boq.datePrepared ? new Date(boq.datePrepared).toLocaleDateString('en-GB') : '31/07/2026')
  );
  const [revisionDescription, setRevisionDescription] = useState<string>(
    boq.revisionDescription || boq.metadata?.revisionDescription || 'Certified Engineering Cost Plan'
  );

  // Statutory Sign-Off Block
  const [preparedBy, setPreparedBy] = useState<string>(
    boq.preparedBy || 'Lead Quantity Surveyor & Workshop Engineer'
  );
  const [qsVerification, setQsVerification] = useState<string>(
    boq.qsVerification || boq.metadata?.qsVerification || 'MADECC Directorate of Cost Engineering'
  );
  const [chiefEngineer, setChiefEngineer] = useState<string>(
    boq.approvedBy || boq.chiefEngineer || boq.metadata?.chiefEngineer || 'Ing. Marcel Mbida, PE (ONIGC 4092)'
  );
  const [sealText, setSealText] = useState<string>(
    boq.sealText || boq.metadata?.sealText || 'MADECC GROUP'
  );
  const [sealSubtext, setSealSubtext] = useState<string>(
    boq.sealSubtext || boq.metadata?.sealSubtext || 'SARL'
  );

  // Keep state synchronized with parent boq updates
  const propagateUpdates = (newProps: Partial<BoqData>) => {
    const currentGT = newProps.grandTotal !== undefined
      ? Number(newProps.grandTotal)
      : (autoCalculateGrandTotal
          ? (Number(newProps.subtotal ?? subtotal) || 0) +
            (Number(newProps.overheadAmount ?? overheadAmount) || 0) +
            (Number(newProps.contingencyAmount ?? contingencyAmount) || 0) +
            (Number(newProps.profitAmount ?? profitAmount) || 0) +
            (Number(newProps.taxAmount ?? taxAmount) || 0)
          : grandTotalOverride);

    const updatedBoq: BoqData = {
      ...boq,
      subtotal: newProps.subtotal ?? subtotal,
      overheadPercent: newProps.overheadPercent ?? overheadPercent,
      overheadAmount: newProps.overheadAmount ?? overheadAmount,
      contingencyPercent: newProps.contingencyPercent ?? contingencyPercent,
      contingencyAmount: newProps.contingencyAmount ?? contingencyAmount,
      profitPercent: newProps.profitPercent ?? profitPercent,
      profitAmount: newProps.profitAmount ?? profitAmount,
      taxPercent: newProps.taxPercent ?? taxPercent,
      taxAmount: newProps.taxAmount ?? taxAmount,
      grandTotal: currentGT,
      amountInWords: newProps.amountInWords ?? amountInWords,
      revisionNumber: newProps.revisionNumber ?? revisionNumber,
      revisionDate: newProps.revisionDate ?? revisionDate,
      revisionDescription: newProps.revisionDescription ?? revisionDescription,
      preparedBy: newProps.preparedBy ?? preparedBy,
      qsVerification: newProps.qsVerification ?? qsVerification,
      chiefEngineer: newProps.chiefEngineer ?? chiefEngineer,
      approvedBy: newProps.chiefEngineer ?? chiefEngineer,
      sealText: newProps.sealText ?? sealText,
      sealSubtext: newProps.sealSubtext ?? sealSubtext,
      metadata: {
        ...(boq.metadata || {}),
        amountInWords: newProps.amountInWords ?? amountInWords,
        revisionDate: newProps.revisionDate ?? revisionDate,
        revisionDescription: newProps.revisionDescription ?? revisionDescription,
        qsVerification: newProps.qsVerification ?? qsVerification,
        chiefEngineer: newProps.chiefEngineer ?? chiefEngineer,
        sealText: newProps.sealText ?? sealText,
        sealSubtext: newProps.sealSubtext ?? sealSubtext,
        companyName: 'MADECC Group SARL'
      }
    };
    onUpdateBoq(updatedBoq);
  };

  // Handlers for Recalculating Markups
  const handleSubtotalChange = (val: number) => {
    setSubtotal(val);
    const newOvhAmt = Math.round(val * (overheadPercent / 100));
    const newCntAmt = Math.round(val * (contingencyPercent / 100));
    const newPrfAmt = Math.round(val * (profitPercent / 100));
    const newTaxAmt = Math.round(val * (taxPercent / 100));

    setOverheadAmount(newOvhAmt);
    setContingencyAmount(newCntAmt);
    setProfitAmount(newPrfAmt);
    setTaxAmount(newTaxAmt);

    const newGT = val + newOvhAmt + newCntAmt + newPrfAmt + newTaxAmt;
    if (autoCalculateGrandTotal) {
      setGrandTotalOverride(newGT);
    }
    const newWords = numberToWords(newGT, boq.currency || 'XAF');
    setAmountInWords(newWords);

    propagateUpdates({
      subtotal: val,
      overheadAmount: newOvhAmt,
      contingencyAmount: newCntAmt,
      profitAmount: newPrfAmt,
      taxAmount: newTaxAmt,
      grandTotal: newGT,
      amountInWords: newWords
    });
  };

  const handleOverheadPercentChange = (pct: number) => {
    setOverheadPercent(pct);
    const amt = Math.round(subtotal * (pct / 100));
    setOverheadAmount(amt);
    const newGT = autoCalculateGrandTotal
      ? subtotal + amt + contingencyAmount + profitAmount + taxAmount
      : grandTotalOverride;
    if (autoCalculateGrandTotal) setGrandTotalOverride(newGT);
    propagateUpdates({ overheadPercent: pct, overheadAmount: amt, grandTotal: newGT });
  };

  const handleOverheadAmountChange = (amt: number) => {
    setOverheadAmount(amt);
    const pct = subtotal > 0 ? Number(((amt / subtotal) * 100).toFixed(2)) : 0;
    setOverheadPercent(pct);
    const newGT = autoCalculateGrandTotal
      ? subtotal + amt + contingencyAmount + profitAmount + taxAmount
      : grandTotalOverride;
    if (autoCalculateGrandTotal) setGrandTotalOverride(newGT);
    propagateUpdates({ overheadPercent: pct, overheadAmount: amt, grandTotal: newGT });
  };

  const handleContingencyPercentChange = (pct: number) => {
    setContingencyPercent(pct);
    const amt = Math.round(subtotal * (pct / 100));
    setContingencyAmount(amt);
    const newGT = autoCalculateGrandTotal
      ? subtotal + overheadAmount + amt + profitAmount + taxAmount
      : grandTotalOverride;
    if (autoCalculateGrandTotal) setGrandTotalOverride(newGT);
    propagateUpdates({ contingencyPercent: pct, contingencyAmount: amt, grandTotal: newGT });
  };

  const handleContingencyAmountChange = (amt: number) => {
    setContingencyAmount(amt);
    const pct = subtotal > 0 ? Number(((amt / subtotal) * 100).toFixed(2)) : 0;
    setContingencyPercent(pct);
    const newGT = autoCalculateGrandTotal
      ? subtotal + overheadAmount + amt + profitAmount + taxAmount
      : grandTotalOverride;
    if (autoCalculateGrandTotal) setGrandTotalOverride(newGT);
    propagateUpdates({ contingencyPercent: pct, contingencyAmount: amt, grandTotal: newGT });
  };

  const handleProfitPercentChange = (pct: number) => {
    setProfitPercent(pct);
    const amt = Math.round(subtotal * (pct / 100));
    setProfitAmount(amt);
    const newGT = autoCalculateGrandTotal
      ? subtotal + overheadAmount + contingencyAmount + amt + taxAmount
      : grandTotalOverride;
    if (autoCalculateGrandTotal) setGrandTotalOverride(newGT);
    propagateUpdates({ profitPercent: pct, profitAmount: amt, grandTotal: newGT });
  };

  const handleProfitAmountChange = (amt: number) => {
    setProfitAmount(amt);
    const pct = subtotal > 0 ? Number(((amt / subtotal) * 100).toFixed(2)) : 0;
    setProfitPercent(pct);
    const newGT = autoCalculateGrandTotal
      ? subtotal + overheadAmount + contingencyAmount + amt + taxAmount
      : grandTotalOverride;
    if (autoCalculateGrandTotal) setGrandTotalOverride(newGT);
    propagateUpdates({ profitPercent: pct, profitAmount: amt, grandTotal: newGT });
  };

  const handleTaxPercentChange = (pct: number) => {
    setTaxPercent(pct);
    const amt = Math.round(subtotal * (pct / 100));
    setTaxAmount(amt);
    const newGT = autoCalculateGrandTotal
      ? subtotal + overheadAmount + contingencyAmount + profitAmount + amt
      : grandTotalOverride;
    if (autoCalculateGrandTotal) setGrandTotalOverride(newGT);
    propagateUpdates({ taxPercent: pct, taxAmount: amt, grandTotal: newGT });
  };

  const handleTaxAmountChange = (amt: number) => {
    setTaxAmount(amt);
    const pct = subtotal > 0 ? Number(((amt / subtotal) * 100).toFixed(2)) : 0;
    setTaxPercent(pct);
    const newGT = autoCalculateGrandTotal
      ? subtotal + overheadAmount + contingencyAmount + profitAmount + amt
      : grandTotalOverride;
    if (autoCalculateGrandTotal) setGrandTotalOverride(newGT);
    propagateUpdates({ taxPercent: pct, taxAmount: amt, grandTotal: newGT });
  };

  const handleGrandTotalOverrideChange = (val: number) => {
    setGrandTotalOverride(val);
    setAutoCalculateGrandTotal(false);
    propagateUpdates({ grandTotal: val });
  };

  const handleAutoGenerateWords = () => {
    const targetVal = autoCalculateGrandTotal
      ? subtotal + overheadAmount + contingencyAmount + profitAmount + taxAmount
      : grandTotalOverride;
    const generated = numberToWords(targetVal, boq.currency || 'XAF');
    setAmountInWords(generated);
    propagateUpdates({ amountInWords: generated });
  };

  const handleResetToCalculated = () => {
    const baseSub = calculatedItemsSubtotal > 0 ? calculatedItemsSubtotal : 57993500;
    setSubtotal(baseSub);
    setOverheadPercent(5);
    const ovh = Math.round(baseSub * 0.05);
    setOverheadAmount(ovh);
    setContingencyPercent(5);
    const cnt = Math.round(baseSub * 0.05);
    setContingencyAmount(cnt);
    setProfitPercent(10);
    const prf = Math.round(baseSub * 0.10);
    setProfitAmount(prf);
    setTaxPercent(0);
    setTaxAmount(0);
    const gt = baseSub + ovh + cnt + prf;
    setGrandTotalOverride(gt);
    setAutoCalculateGrandTotal(true);
    const words = numberToWords(gt, boq.currency || 'XAF');
    setAmountInWords(words);
    setRevisionNumber('REV-00');
    setRevisionDate('31/07/2026');
    setRevisionDescription('Certified Engineering Cost Plan');
    setPreparedBy('Lead Quantity Surveyor & Workshop Engineer');
    setQsVerification('MADECC Directorate of Cost Engineering');
    setChiefEngineer('Ing. Marcel Mbida, PE (ONIGC 4092)');
    setSealText('MADECC GROUP');
    setSealSubtext('SARL');

    propagateUpdates({
      subtotal: baseSub,
      overheadPercent: 5,
      overheadAmount: ovh,
      contingencyPercent: 5,
      contingencyAmount: cnt,
      profitPercent: 10,
      profitAmount: prf,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: gt,
      amountInWords: words,
      revisionNumber: 'REV-00',
      revisionDate: '31/07/2026',
      revisionDescription: 'Certified Engineering Cost Plan',
      preparedBy: 'Lead Quantity Surveyor & Workshop Engineer',
      qsVerification: 'MADECC Directorate of Cost Engineering',
      chiefEngineer: 'Ing. Marcel Mbida, PE (ONIGC 4092)',
      sealText: 'MADECC GROUP',
      sealSubtext: 'SARL'
    });
  };

  const finalGrandTotal = autoCalculateGrandTotal
    ? subtotal + overheadAmount + contingencyAmount + profitAmount + taxAmount
    : grandTotalOverride;

  const currency = boq.currency || 'XAF';

  return (
    <div className={`space-y-6 ${isModal ? 'p-1' : ''}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-500/10 via-slate-800 to-blue-500/10 border border-amber-500/30 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Commercial Recap & Statutory Sign-Off Editor
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                ADMIN WORKSPACE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Edit the financial markups, grand total, written words, revision audit table, and statutory engineering sign-offs before downloading or exporting.
            </p>
          </div>
        </div>

        {/* Quick Actions in Header */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetToCalculated}
            title="Reset markups to standard MADECC defaults"
            className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition flex items-center space-x-1.5 shadow disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save to BOQ'}</span>
            </button>
          )}

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Form Inputs on Left, Real-Time Official Document Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: EDIT CONTROLS (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. FINANCIAL MARKUPS & COMMERCIAL TOTALS */}
          <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-700 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  1. Commercial & Financial Recap Controls
                </h3>
              </div>
              <span className="text-xs text-amber-400 font-mono font-bold">
                Currency: {currency}
              </span>
            </div>

            {/* Measured Works Subtotal */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <span>MEASURED WORKS SUBTOTAL</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Direct Bills Sum)</span>
                </label>
                {calculatedItemsSubtotal > 0 && calculatedItemsSubtotal !== subtotal && (
                  <button
                    type="button"
                    onClick={() => handleSubtotalChange(calculatedItemsSubtotal)}
                    className="text-[10px] text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Sync with Line Items ({calculatedItemsSubtotal.toLocaleString()} {currency})</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={subtotal}
                  onChange={(e) => handleSubtotalChange(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                  {currency}
                </span>
              </div>
            </div>

            {/* Markups Row: Overhead & Contingency & Profit */}
            <div className="space-y-3">
              
              {/* Site Overhead & Logistics */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-1/3">
                  <p className="text-xs font-bold text-slate-300">Site Overhead & Logistics</p>
                  <p className="text-[10px] text-slate-400">Site supervision, transport & setup</p>
                </div>
                <div className="flex items-center space-x-2 sm:w-2/3">
                  <div className="w-24 relative">
                    <input
                      type="number"
                      step="0.5"
                      value={overheadPercent}
                      onChange={(e) => handleOverheadPercentChange(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold text-right pr-6 focus:border-amber-400 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                  </div>
                  <span className="text-slate-500 text-xs">+</span>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={overheadAmount}
                      onChange={(e) => handleOverheadAmountChange(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold pr-12 focus:border-amber-400 focus:outline-none text-right"
                    />
                    <span className="absolute right-2 top-1.5 text-[11px] text-slate-400 font-mono">{currency}</span>
                  </div>
                </div>
              </div>

              {/* Unforeseen Contingencies */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-1/3">
                  <p className="text-xs font-bold text-slate-300">Unforeseen Contingencies</p>
                  <p className="text-[10px] text-slate-400">Price escalation & ground variances</p>
                </div>
                <div className="flex items-center space-x-2 sm:w-2/3">
                  <div className="w-24 relative">
                    <input
                      type="number"
                      step="0.5"
                      value={contingencyPercent}
                      onChange={(e) => handleContingencyPercentChange(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold text-right pr-6 focus:border-amber-400 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                  </div>
                  <span className="text-slate-500 text-xs">+</span>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={contingencyAmount}
                      onChange={(e) => handleContingencyAmountChange(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold pr-12 focus:border-amber-400 focus:outline-none text-right"
                    />
                    <span className="absolute right-2 top-1.5 text-[11px] text-slate-400 font-mono">{currency}</span>
                  </div>
                </div>
              </div>

              {/* Contractor Profit Margin */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-1/3">
                  <p className="text-xs font-bold text-slate-300">Contractor Profit Margin</p>
                  <p className="text-[10px] text-slate-400">Commercial margin & head-office yield</p>
                </div>
                <div className="flex items-center space-x-2 sm:w-2/3">
                  <div className="w-24 relative">
                    <input
                      type="number"
                      step="0.5"
                      value={profitPercent}
                      onChange={(e) => handleProfitPercentChange(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold text-right pr-6 focus:border-amber-400 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                  </div>
                  <span className="text-slate-500 text-xs">+</span>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={profitAmount}
                      onChange={(e) => handleProfitAmountChange(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold pr-12 focus:border-amber-400 focus:outline-none text-right"
                    />
                    <span className="absolute right-2 top-1.5 text-[11px] text-slate-400 font-mono">{currency}</span>
                  </div>
                </div>
              </div>

              {/* Value Added Tax (TVA - Optional) */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-1/3">
                  <p className="text-xs font-bold text-slate-300">Value Added Tax (TVA)</p>
                  <p className="text-[10px] text-slate-400">Standard statutory VAT (0% if exempt)</p>
                </div>
                <div className="flex items-center space-x-2 sm:w-2/3">
                  <div className="w-24 relative">
                    <input
                      type="number"
                      step="0.25"
                      value={taxPercent}
                      onChange={(e) => handleTaxPercentChange(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold text-right pr-6 focus:border-amber-400 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                  </div>
                  <span className="text-slate-500 text-xs">+</span>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={taxAmount}
                      onChange={(e) => handleTaxAmountChange(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold pr-12 focus:border-amber-400 focus:outline-none text-right"
                    />
                    <span className="absolute right-2 top-1.5 text-[11px] text-slate-400 font-mono">{currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GRAND TOTAL ROW */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-amber-300 uppercase tracking-wide">
                  GRAND TOTAL ESTIMATE
                </label>
                <label className="flex items-center space-x-1.5 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCalculateGrandTotal}
                    onChange={(e) => {
                      setAutoCalculateGrandTotal(e.target.checked);
                      if (e.target.checked) {
                        const calculated = subtotal + overheadAmount + contingencyAmount + profitAmount + taxAmount;
                        setGrandTotalOverride(calculated);
                        propagateUpdates({ grandTotal: calculated });
                      }
                    }}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Auto-calculate sum</span>
                </label>
              </div>

              <div className="relative">
                <input
                  type="number"
                  disabled={autoCalculateGrandTotal}
                  value={finalGrandTotal}
                  onChange={(e) => handleGrandTotalOverrideChange(Number(e.target.value) || 0)}
                  className={`w-full rounded-lg px-3 py-2 text-base font-mono font-black ${
                    autoCalculateGrandTotal
                      ? 'bg-slate-950/80 text-amber-400 border border-amber-500/40 cursor-not-allowed'
                      : 'bg-slate-900 text-white border border-amber-400 focus:outline-none'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-amber-300 font-mono font-bold">
                  {currency}
                </span>
              </div>
            </div>

            {/* AMOUNT IN WORDS */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">
                  AMOUNT IN WORDS
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerateWords}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center space-x-1 font-semibold"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Auto-Spell from Total</span>
                </button>
              </div>

              <textarea
                rows={2}
                value={amountInWords}
                onChange={(e) => {
                  setAmountInWords(e.target.value);
                  propagateUpdates({ amountInWords: e.target.value });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-serif italic focus:border-amber-400 focus:outline-none"
                placeholder="Sixty-Nine Million Five Hundred and Ninety-Two Thousand Two Hundred XAF Only"
              />
            </div>
          </div>

          {/* 2. REVISION & AUDIT HISTORY EDITING */}
          <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-700 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  2. Revision & Audit History Controls
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                Table Header in PDF/Word
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300">REV Code</label>
                <input
                  type="text"
                  value={revisionNumber}
                  onChange={(e) => {
                    setRevisionNumber(e.target.value);
                    propagateUpdates({ revisionNumber: e.target.value });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg mt-1 px-3 py-1.5 text-xs text-amber-400 font-mono font-bold focus:border-amber-400 focus:outline-none"
                  placeholder="REV-00"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300">Revision Date</label>
                <input
                  type="text"
                  value={revisionDate}
                  onChange={(e) => {
                    setRevisionDate(e.target.value);
                    propagateUpdates({ revisionDate: e.target.value });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg mt-1 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  placeholder="31/07/2026"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300">Description / Remarks</label>
                <input
                  type="text"
                  value={revisionDescription}
                  onChange={(e) => {
                    setRevisionDescription(e.target.value);
                    propagateUpdates({ revisionDescription: e.target.value });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg mt-1 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  placeholder="Certified Engineering Cost Plan"
                />
              </div>
            </div>
          </div>

          {/* 3. ENGINEER OF RECORD & STATUTORY SIGN-OFF EDITING */}
          <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-700 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  3. Engineer of Record & Statutory Sign-Off
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Certified Directorate
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300">Prepared by:</label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => {
                    setPreparedBy(e.target.value);
                    propagateUpdates({ preparedBy: e.target.value });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg mt-1 px-3 py-1.5 text-xs text-white font-medium focus:border-amber-400 focus:outline-none"
                  placeholder="Lead Quantity Surveyor & Workshop Engineer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300">QS Verification:</label>
                <input
                  type="text"
                  value={qsVerification}
                  onChange={(e) => {
                    setQsVerification(e.target.value);
                    propagateUpdates({ qsVerification: e.target.value });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg mt-1 px-3 py-1.5 text-xs text-white font-medium focus:border-amber-400 focus:outline-none"
                  placeholder="MADECC Directorate of Cost Engineering"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300">Chief Engineer (Approved by):</label>
                <input
                  type="text"
                  value={chiefEngineer}
                  onChange={(e) => {
                    setChiefEngineer(e.target.value);
                    propagateUpdates({ chiefEngineer: e.target.value });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg mt-1 px-3 py-1.5 text-xs text-white font-medium focus:border-amber-400 focus:outline-none"
                  placeholder="Ing. Marcel Mbida, PE (ONIGC 4092)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Seal Brand Name</label>
                  <input
                    type="text"
                    value={sealText}
                    onChange={(e) => {
                      setSealText(e.target.value);
                      propagateUpdates({ sealText: e.target.value });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg mt-1 px-3 py-1.5 text-xs text-amber-400 font-bold focus:border-amber-400 focus:outline-none"
                    placeholder="MADECC GROUP"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Company Subtitle / Form</label>
                  <input
                    type="text"
                    value={sealSubtext}
                    onChange={(e) => {
                      setSealSubtext(e.target.value);
                      propagateUpdates({ sealSubtext: e.target.value });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg mt-1 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                    placeholder="SARL"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: EXACT OFFICIAL DOCUMENT PREVIEW CARD (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-20">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Export Document Preview</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Exact Output</span>
            </span>
          </div>

          {/* THE PREVIEW CARD (Matches User Text Specification Perfectly) */}
          <div className="bg-white text-slate-900 rounded-xl p-5 shadow-2xl border border-slate-200 font-sans space-y-5">
            
            {/* Top Brand Header in Document */}
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold tracking-widest text-slate-800">
                  MADECC GROUP SARL
                </span>
                <p className="text-[9px] text-slate-500">Directorate of Cost Engineering & QS</p>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                OFFICIAL A4 / WORD SPEC
              </span>
            </div>

            {/* COMMERCIAL & FINANCIAL SUMMARY RECAP BOX */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 text-center font-bold text-xs text-slate-800 tracking-wider">
                COMMERCIAL & FINANCIAL SUMMARY RECAP
              </div>

              <div className="p-3.5 space-y-2 text-xs">
                {/* Measured Works Subtotal */}
                <div className="flex justify-between items-center font-bold text-slate-900">
                  <span>MEASURED WORKS SUBTOTAL:</span>
                  <span className="font-mono">{subtotal.toLocaleString()} {currency}</span>
                </div>

                {/* Site Overhead */}
                {overheadAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Site Overhead & Logistics ({overheadPercent}%):</span>
                    <span className="font-mono font-medium">+{overheadAmount.toLocaleString()} {currency}</span>
                  </div>
                )}

                {/* Unforeseen Contingencies */}
                {contingencyAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Unforeseen Contingencies ({contingencyPercent}%):</span>
                    <span className="font-mono font-medium">+{contingencyAmount.toLocaleString()} {currency}</span>
                  </div>
                )}

                {/* Contractor Profit Margin */}
                {profitAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Contractor Profit Margin ({profitPercent}%):</span>
                    <span className="font-mono font-medium">+{profitAmount.toLocaleString()} {currency}</span>
                  </div>
                )}

                {/* VAT if any */}
                {taxAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Value Added Tax / TVA ({taxPercent}%):</span>
                    <span className="font-mono font-medium">+{taxAmount.toLocaleString()} {currency}</span>
                  </div>
                )}

                <div className="border-t-2 border-amber-500 pt-2 flex justify-between items-center font-black text-sm text-slate-900">
                  <span className="text-amber-800 font-bold">GRAND TOTAL ESTIMATE:</span>
                  <span className="font-mono text-amber-700">{finalGrandTotal.toLocaleString()} {currency}</span>
                </div>

                {/* Amount in Words */}
                <div className="border-t border-slate-200 pt-2 space-y-1">
                  <div className="font-bold text-[10px] text-slate-700 tracking-wide">
                    AMOUNT IN WORDS:
                  </div>
                  <div className="text-[11px] font-serif italic text-slate-700 leading-snug">
                    {amountInWords}
                  </div>
                </div>
              </div>
            </div>

            {/* REVISION & AUDIT HISTORY BOX */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-bold text-[11px] text-slate-800 tracking-wide">
                REVISION & AUDIT HISTORY
              </div>
              <div className="overflow-x-auto min-w-0">
                <table className="w-full text-[10px] min-w-[300px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="px-3 py-1 text-left w-1/4">REV</th>
                      <th className="px-2 py-1 text-left w-1/4">DATE</th>
                      <th className="px-3 py-1 text-left w-1/2">DESCRIPTION / REMARKS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-3 py-1.5 font-bold font-mono text-slate-900">{revisionNumber}</td>
                      <td className="px-2 py-1.5 font-mono text-slate-700">{revisionDate}</td>
                      <td className="px-3 py-1.5 text-slate-800">{revisionDescription}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ENGINEER OF RECORD & STATUTORY SIGN-OFF BOX */}
            <div className="border border-slate-300 rounded-lg p-3.5 space-y-2 text-[11px] relative">
              <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1">
                ENGINEER OF RECORD & STATUTORY SIGN-OFF
              </div>

              <div className="space-y-1 text-slate-700">
                <div>
                  <span className="font-normal text-slate-500">Prepared by: </span>
                  <span className="font-bold text-slate-900">{preparedBy}</span>
                </div>
                <div>
                  <span className="font-normal text-slate-500">QS Verification: </span>
                  <span className="font-bold text-slate-900">{qsVerification}</span>
                </div>
                <div>
                  <span className="font-normal text-slate-500">Chief Engineer: </span>
                  <span className="font-bold text-slate-900">{chiefEngineer}</span>
                </div>
              </div>

              {/* Certified Official Seal */}
              <div className="pt-2 flex justify-end">
                <div className="w-24 h-24 rounded-full border-2 border-amber-600 border-dashed p-1 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-full h-full rounded-full border border-amber-600 flex flex-col items-center justify-center p-1 bg-amber-50/50">
                    <span className="text-[8px] font-extrabold text-amber-900 tracking-wider">
                      {sealText}
                    </span>
                    <span className="text-[7px] font-bold text-amber-800">{sealSubtext}</span>
                    <div className="w-8 border-t border-amber-600 my-0.5" />
                    <span className="text-[6px] font-bold text-amber-700 tracking-widest">
                      CERTIFIED SEAL
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Export Action Buttons Under the Preview */}
          <div className="space-y-2 pt-2">
            {onExportPdf && (
              <button
                type="button"
                onClick={onExportPdf}
                disabled={generatingPdf}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{generatingPdf ? 'Generating A4 PDF...' : 'Download A4 PDF (With Edited Recap)'}</span>
              </button>
            )}

            {onExportDocx && (
              <button
                type="button"
                onClick={onExportDocx}
                disabled={exportingDocx}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>{exportingDocx ? 'Exporting Word...' : 'Export Word (.docx) (With Edited Recap)'}</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
