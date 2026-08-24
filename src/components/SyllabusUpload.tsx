import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Trash2, 
  Play, 
  Sparkles, 
  BookOpen, 
  Award, 
  FileCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface SyllabusDoc {
  id: number;
  filename: string;
  fileType: string;
  extractedText: string;
  learningObjectives: string | null;
  curriculumStandards: string | null;
  keyTopics: string | null;
  subject: string | null;
  gradeLevel: string | null;
  status: string;
  uploadedAt: string;
}

interface SyllabusUploadProps {
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  setActiveAdminTab: (tab: any) => void;
  setActiveSyllabus?: (syllabus: any | null) => void;
}

export default function SyllabusUpload({ showToast, setActiveAdminTab, setActiveSyllabus }: SyllabusUploadProps) {
  const [docs, setDocs] = useState<SyllabusDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [selectedDoc, setSelectedDoc] = useState<SyllabusDoc | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch syllabus documents
  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/syllabus-documents');
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      } else {
        showToast('Failed to fetch syllabus documents', 'error');
      }
    } catch (err: any) {
      showToast(`Error fetching documents: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // Handle Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc', 'txt'].includes(ext || '')) {
      showToast('Unsupported file format. Please upload PDF, Word (.doc/.docx), or TXT.', 'error');
      return;
    }

    setUploadStatus('uploading');
    showToast(`Uploading ${file.name}...`, 'info');

    const formData = new FormData();
    formData.append('syllabusFile', file);

    try {
      setUploadStatus('processing');
      const res = await fetch('/api/syllabus-documents/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const newDoc = await res.json();
        setUploadStatus('success');
        showToast('Syllabus uploaded and processed by Gemini successfully!', 'success');
        setDocs(prev => [newDoc, ...prev]);
        setSelectedDoc(newDoc);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const errorMsg = await res.text();
        setUploadStatus('error');
        showToast(`Failed to process syllabus: ${errorMsg || 'Server error'}`, 'error');
      }
    } catch (err: any) {
      setUploadStatus('error');
      showToast(`Error uploading syllabus: ${err.message}`, 'error');
    } finally {
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  // Delete syllabus document
  const handleDeleteDoc = async (id: number, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/syllabus-documents/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Syllabus deleted successfully', 'success');
        setDocs(prev => prev.filter(d => d.id !== id));
        if (selectedDoc?.id === id) {
          setSelectedDoc(null);
        }
      } else {
        showToast('Failed to delete document', 'error');
      }
    } catch (err: any) {
      showToast(`Error deleting document: ${err.message}`, 'error');
    }
  };

  // Initiate lesson generation with this syllabus
  const handleInitiateLessonPlan = (doc: SyllabusDoc) => {
    showToast(`Initializing Lesson Prep aligned with ${doc.filename}...`, 'success');
    
    if (setActiveSyllabus) {
      setActiveSyllabus(doc);
    }

    // Switch admin tab to MINESEC Lesson Prep
    setActiveAdminTab('lesson-studio');
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans" id="syllabus-manager-root-container">
      
      {/* Header Info */}
      <div className="border-b border-slate-800 pb-5" id="syllabus-manager-header">
        <span className="bg-amber-500 text-slate-950 font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded mr-2">MINESEC Curriculum Portal</span>
        <span className="text-slate-500 font-mono text-xs">Official Syllabus Repository</span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
          <BookOpen className="w-8 h-8 text-amber-500 shrink-0" />
          Technical Syllabus Manager
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Upload and store Cameroon technical school syllabus documents. Gemini automatically indexes key competencies, outcomes, and curriculum standards to feed our lesson generator co-pilot.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="syllabus-manager-grid">
        
        {/* Left Section: File Upload and List */}
        <div className="lg:col-span-2 space-y-6" id="syllabus-left-section">
          
          {/* Drag & Drop Upload Panel */}
          <div 
            id="syllabus-drag-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging 
                ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10 scale-[1.01]' 
                : 'border-slate-800 bg-slate-950/60 hover:bg-slate-950/80 hover:border-slate-700'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              id="syllabus-file-input-field"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-4 bg-slate-900 rounded-full border border-slate-800 text-slate-400 relative">
                {uploadStatus === 'processing' || uploadStatus === 'uploading' ? (
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                ) : (
                  <UploadCloud className="w-8 h-8 text-amber-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">
                  {uploadStatus === 'uploading' && 'Uploading document to server...'}
                  {uploadStatus === 'processing' && 'Gemini is reading & extracting syllabus metrics...'}
                  {uploadStatus === 'success' && 'Syllabus alignment complete!'}
                  {uploadStatus === 'idle' && 'Drag and drop your syllabus file here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports official MINESEC syllabus files in PDF, Word (.doc / .docx) or Text formats
                </p>
              </div>
              <button 
                id="select-file-button"
                type="button"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-800 transition-colors"
              >
                Browse Files
              </button>
            </div>
          </div>

          {/* Processed Files List */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl" id="syllabus-database-list-container">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-500" />
                Active Syllabus Database ({docs.length})
              </h2>
              <button 
                id="refresh-syllabus-list-btn"
                onClick={fetchDocs} 
                className="text-[10px] text-slate-400 hover:text-amber-500 underline uppercase tracking-wider font-mono font-bold"
              >
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading syllabus collection...</p>
              </div>
            ) : docs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-600" />
                <p className="text-sm font-bold text-slate-400">No syllabus documents found</p>
                <p className="text-xs text-slate-500">Upload a PDF or Word syllabus to populate this secure database.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="syllabus-docs-table">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="p-3.5 pl-4">Document / Subject</th>
                      <th className="p-3.5">Level</th>
                      <th className="p-3.5">Processed Indicators</th>
                      <th className="p-3.5 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((doc) => (
                      <tr 
                        key={doc.id}
                        className={`border-b border-slate-900 hover:bg-slate-900/30 transition-colors text-xs ${
                          selectedDoc?.id === doc.id ? 'bg-slate-900/40 border-l-2 border-l-amber-500' : ''
                        }`}
                      >
                        <td className="p-3.5 pl-4 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                          <div className="flex items-start gap-2.5">
                            <FileText className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <div className="max-w-[200px] md:max-w-[300px]">
                              <p className="font-bold text-slate-200 truncate">{doc.filename}</p>
                              <p className="text-[10px] text-amber-500 font-mono mt-0.5">{doc.subject || 'Extracting...'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 cursor-pointer text-slate-300 font-medium" onClick={() => setSelectedDoc(doc)}>
                          {doc.gradeLevel || 'Form Four / Five'}
                        </td>
                        <td className="p-3.5 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Indexed
                            </span>
                            {doc.learningObjectives && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                                Objectives
                              </span>
                            )}
                            {doc.curriculumStandards && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">
                                Standards
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`generate-lesson-btn-${doc.id}`}
                              onClick={() => handleInitiateLessonPlan(doc)}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                              title="Create aligned lesson plan"
                            >
                              <Play className="w-3 h-3 fill-slate-950" />
                              Prep Plan
                            </button>
                            <button
                              id={`delete-syllabus-btn-${doc.id}`}
                              onClick={() => handleDeleteDoc(doc.id, doc.filename)}
                              className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                              title="Remove syllabus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Section: Selected Document Metadata Insights */}
        <div className="lg:col-span-1" id="syllabus-right-section">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4 h-full flex flex-col">
            <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                Syllabus Insights
              </h2>
              {selectedDoc && (
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  ID: #{selectedDoc.id}
                </span>
              )}
            </div>

            {selectedDoc ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <h3 className="text-slate-400 text-[10px] uppercase font-mono font-bold">Document Name</h3>
                  <p className="text-sm font-extrabold text-white mt-0.5 truncate">{selectedDoc.filename}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900 text-xs">
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase font-mono block">Extracted Subject</span>
                    <span className="text-amber-500 font-bold">{selectedDoc.subject || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase font-mono block">Extracted Grade</span>
                    <span className="text-amber-500 font-bold">{selectedDoc.gradeLevel || 'Not specified'}</span>
                  </div>
                </div>

                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[350px] pr-1">
                  
                  <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-900">
                    <h4 className="text-[10px] text-emerald-400 uppercase font-mono font-bold flex items-center gap-1.5 mb-1">
                      <Award className="w-3.5 h-3.5 text-emerald-500" />
                      Learning Objectives
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{selectedDoc.learningObjectives || 'None extracted'}</p>
                  </div>

                  <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-900">
                    <h4 className="text-[10px] text-purple-400 uppercase font-mono font-bold flex items-center gap-1.5 mb-1">
                      <FileCheck className="w-3.5 h-3.5 text-purple-500" />
                      Curriculum Standards
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{selectedDoc.curriculumStandards || 'None extracted'}</p>
                  </div>

                  <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-900">
                    <h4 className="text-[10px] text-blue-400 uppercase font-mono font-bold flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      Key Covered Topics
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{selectedDoc.keyTopics || 'None extracted'}</p>
                  </div>

                </div>

                <button
                  id="prepare-lesson-from-insights-btn"
                  onClick={() => handleInitiateLessonPlan(selectedDoc)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 mt-auto"
                >
                  <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                  Generate Lesson Package
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-16 flex-1 flex flex-col items-center justify-center space-y-1.5">
                <FileText className="w-10 h-10 text-slate-700" />
                <p className="text-xs font-bold text-slate-400">Select a syllabus to view alignment metadata</p>
                <p className="text-[11px] text-slate-500">Insights include Cameroon-compliant technical learning objectives, MINESEC standards, and topics.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
