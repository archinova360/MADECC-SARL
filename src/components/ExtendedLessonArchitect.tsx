import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  Download, 
  Copy, 
  Printer, 
  Save, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Sliders, 
  Plus, 
  Send, 
  RefreshCw, 
  Undo, 
  History, 
  FileSpreadsheet,
  AlertTriangle,
  BookOpen,
  Layout,
  FileCode,
  ShieldAlert,
  HardHat,
  Bookmark,
  Share2,
  Trash2,
  Wrench
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getAuthToken } from '../lib/firebase.ts';

interface SyllabusDoc {
  id: number;
  filename: string;
  subject: string;
  gradeLevel: string;
  extractedText: string;
}

interface DraftVersion {
  version: string;
  timestamp: string;
  action: string;
  content: string;
  presentation?: string;
  worksheet?: string;
  quiz?: string;
}

export default function ExtendedLessonArchitect({ showToast }: { showToast: (msg: string, type: 'success' | 'error' | 'info') => void }) {
  // Navigation / Mode
  const [activeTab, setActiveTab] = useState<'content' | 'presentation' | 'worksheet' | 'quiz'>('content');
  const [activeTemplate, setActiveTemplate] = useState<'cba-lesson' | 'blueprint-spec' | 'site-safety' | 'pedagogy-guide'>('cba-lesson');

  // Syllabus documents
  const [syllabusDocs, setSyllabusDocs] = useState<SyllabusDoc[]>([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<string>('');

  // Form parameters
  const [topic, setTopic] = useState('Design of Reinforced Concrete Columns');
  const [subTopic, setSubTopic] = useState('Biaxial Bending & Axial Load Calculations');
  const [gradeLevel, setGradeLevel] = useState('Form Five Technical (F4BA)');
  const [subject, setSubject] = useState('Building Construction & Structural Design');
  const [duration, setDuration] = useState('100 Minutes (2 Periods)');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [term, setTerm] = useState('Term 1');
  const [sequence, setSequence] = useState('Sequence 1');
  const [week, setWeek] = useState('Week 3');
  const [period, setPeriod] = useState('Periods 3 & 4');
  const [teacherName, setTeacherName] = useState('Dr. Jean-Pierre Nguemo (Senior Technical Teacher)');
  const [department, setDepartment] = useState('Civil Engineering & Building Construction');
  const [learningDomain, setLearningDomain] = useState('Cognitive, Psychomotor & Safety');
  const [competency, setCompetency] = useState('Accurately size and detail square reinforced concrete columns subject to axial loads and biaxial bending under MINESEC CBA norms.');
  const [learningOutcomes, setLearningOutcomes] = useState('Calculate column axial capacity, determine reinforcement bar layouts (bar bending schedules), write down complete concrete mix designs for 350kg/m3, and implement site safety and formwork scaffolding.');
  const [curriculumReference, setCurriculumReference] = useState('MINESEC Civil Engineering & Building Construction Syllabus v2025');
  const [prerequisiteKnowledge, setPrerequisiteKnowledge] = useState('Students must understand concrete hydration, safety rules, and basic compression behavior of steel and masonry.');
  const [availableResources, setAvailableResources] = useState('Rebars (T10, T12, R6), binding wire, cement CPA-45, wood panels, structural drawings from Douala Grand Mall construction site, spirit levels.');
  const [studentPopulation, setStudentPopulation] = useState('45 students, mixed technical ability, billingual English/French environment.');
  const [customPrompt, setCustomPrompt] = useState('Ensure advanced stress-strain calculations for concrete fibers, explicit ASCII sketches of longitudinal column steel reinforcement cross-section, and a complete site safety inspection risk register.');

  // AI Generation States
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  
  // Lesson content drafts
  const [content, setContent] = useState<string>('');
  const [presentation, setPresentation] = useState<any[]>([]);
  const [worksheet, setWorksheet] = useState<string>('');
  const [quiz, setQuiz] = useState<string>('');
  
  // Version History list
  const [versionHistory, setVersionHistory] = useState<DraftVersion[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);

  // Edit states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableMarkdown, setEditableMarkdown] = useState('');

  // Slides State
  const [activeSlide, setActiveSlide] = useState(1);

  // Load syllabus documents
  useEffect(() => {
    async function fetchSyllabus() {
      try {
        const response = await fetch('/api/syllabus-documents');
        if (response.ok) {
          const data = await response.json();
          setSyllabusDocs(data);
        }
      } catch (err) {
        console.error('Failed to load syllabus documents', err);
      }
    }
    fetchSyllabus();
  }, []);

  // Update current markdown being viewed in edit mode
  useEffect(() => {
    if (activeTab === 'content') {
      setEditableMarkdown(content);
    } else if (activeTab === 'worksheet') {
      setEditableMarkdown(worksheet);
    } else if (activeTab === 'quiz') {
      setEditableMarkdown(quiz);
    }
  }, [activeTab, content, worksheet, quiz]);

  // Handle Initial Generation
  const handleGenerate = async () => {
    setGenerating(true);
    showToast('Starting Veteran-Level Lesson Structure Generation...', 'info');
    
    try {
      const selectedSyllabus = syllabusDocs.find(d => String(d.id) === selectedSyllabusId);
      const syllabusText = selectedSyllabus ? selectedSyllabus.extractedText : '';

      // Construct a highly detailed custom prompt tailored to the active template
      let compiledCustomPrompt = customPrompt;
      if (activeTemplate === 'blueprint-spec') {
        compiledCustomPrompt += `\n\n[TEMPLATE TARGET: TECHNICAL BLUEPRINT SPECIFICATION]: Focus heavily on professional building materials science, precise Eurocode 2 reinforcement detailing, complete load derivations, and detailed ASCII construction drawings (plan & cross-sections of columns, stirrups, spacing offsets). Provide detailed chemical formulations for concrete and soil compaction.`;
      } else if (activeTemplate === 'site-safety') {
        compiledCustomPrompt += `\n\n[TEMPLATE TARGET: SITE SAFETY & HSE INSPECTION REPORT]: Format with professional site hazard logs, PPE auditing checklists, severe risk matrixes (impact vs. likelihood), emergency scaffolding safety rules, and MINESEC professional vocational laboratory safety guidelines.`;
      } else if (activeTemplate === 'pedagogy-guide') {
        compiledCustomPrompt += `\n\n[TEMPLATE TARGET: VETERAN PEDAGOGY GUIDE]: Provide massive professional teacher-to-teacher coaching notes, deep technical breakdown of common student cognitive misconceptions, specific scaffolding techniques for struggling learners, and complete bilingual (French/English) curriculum definitions.`;
      }

      const response = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gradeLevel,
          subject,
          topic,
          subTopic,
          duration,
          academicYear,
          term,
          sequence,
          week,
          period,
          teacherName,
          department,
          learningDomain,
          competency,
          learningOutcomes,
          curriculumReference,
          prerequisiteKnowledge,
          availableResources,
          studentPopulation,
          customPrompt: compiledCustomPrompt,
          syllabusText,
          depthMode: 'veteran' // Forces the backend's ultra-long veteran system instructions
        })
      });

      if (!response.ok) {
        throw new Error('Server returned error during lesson generation');
      }

      const data = await response.json();
      
      const slides = typeof data.presentation === 'string' ? JSON.parse(data.presentation) : (data.presentation || []);
      
      setContent(data.content || '');
      setPresentation(slides);
      setWorksheet(data.worksheet || '');
      setQuiz(data.quiz || '');

      // Create initial history entry
      const initialVersion: DraftVersion = {
        version: '1.0.0',
        timestamp: new Date().toLocaleTimeString(),
        action: 'Initial Masterclass Generation',
        content: data.content || '',
        presentation: JSON.stringify(slides),
        worksheet: data.worksheet || '',
        quiz: data.quiz || ''
      };
      
      setVersionHistory([initialVersion]);
      setCurrentHistoryIndex(0);
      
      showToast('Successfully generated ultra-detailed veteran lesson plan package!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Generation failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Handle Iterative Prompt Refinement
  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementPrompt.trim()) return;
    if (!content) {
      showToast('Please generate an initial lesson plan first before refining.', 'info');
      return;
    }

    setGenerating(true);
    showToast(`Refining lesson plan using AI prompt...`, 'info');

    try {
      const selectedSyllabus = syllabusDocs.find(d => String(d.id) === selectedSyllabusId);
      const syllabusText = selectedSyllabus ? selectedSyllabus.extractedText : '';

      // We iteratively refine by passing the previous draft inside the customPrompt parameter as a context!
      const refinementInstructions = `
[ITERATIVE REFINEMENT INPUT]: The teacher requested the following specific modifications to the current draft:
"${refinementPrompt}"

[CURRENT DRAFT CONTENT FOR REFINEMENT]:
${content}

Please update the current draft lesson plan by incorporating the above refinements perfectly. Maintain the same rigorous 20-page long-form veteran-level structure, bilinguality, technical depth, and professional formatting. Do not shorten or simplify. Return the updated content.`;

      const response = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gradeLevel,
          subject,
          topic,
          subTopic,
          duration,
          academicYear,
          term,
          sequence,
          week,
          period,
          teacherName,
          department,
          learningDomain,
          competency,
          learningOutcomes,
          curriculumReference,
          prerequisiteKnowledge,
          availableResources,
          studentPopulation,
          customPrompt: refinementInstructions,
          syllabusText,
          depthMode: 'veteran'
        })
      });

      if (!response.ok) {
        throw new Error('Server returned error during lesson refinement');
      }

      const data = await response.json();
      
      const slides = typeof data.presentation === 'string' ? JSON.parse(data.presentation) : (data.presentation || []);
      
      const nextMajor = versionHistory.length + 1;
      const newVersion: DraftVersion = {
        version: `${nextMajor}.0.0`,
        timestamp: new Date().toLocaleTimeString(),
        action: `Refined: ${refinementPrompt.length > 30 ? refinementPrompt.substring(0, 30) + '...' : refinementPrompt}`,
        content: data.content || '',
        presentation: JSON.stringify(slides),
        worksheet: data.worksheet || '',
        quiz: data.quiz || ''
      };

      const updatedHistory = [...versionHistory.slice(0, currentHistoryIndex + 1), newVersion];
      setVersionHistory(updatedHistory);
      setCurrentHistoryIndex(updatedHistory.length - 1);

      setContent(data.content || '');
      setPresentation(slides);
      setWorksheet(data.worksheet || '');
      setQuiz(data.quiz || '');
      
      setRefinementPrompt('');
      showToast('Draft refined and new version stored successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Refinement failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Restore a specific version from history
  const handleRestoreVersion = (index: number) => {
    if (index < 0 || index >= versionHistory.length) return;
    
    const ver = versionHistory[index];
    setContent(ver.content);
    setWorksheet(ver.worksheet || '');
    setQuiz(ver.quiz || '');
    if (ver.presentation) {
      try {
        setPresentation(JSON.parse(ver.presentation));
      } catch (e) {
        setPresentation([]);
      }
    }
    setCurrentHistoryIndex(index);
    showToast(`Restored Draft Version ${ver.version}!`, 'info');
  };

  // Save changes from manual edit mode
  const handleSaveChanges = () => {
    if (activeTab === 'content') {
      setContent(editableMarkdown);
    } else if (activeTab === 'worksheet') {
      setWorksheet(editableMarkdown);
    } else if (activeTab === 'quiz') {
      setQuiz(editableMarkdown);
    }

    // Add edit entry to version history
    const nextMajor = versionHistory.length + 1;
    const newVersion: DraftVersion = {
      version: `${nextMajor}.0.0-edited`,
      timestamp: new Date().toLocaleTimeString(),
      action: `Manual Edit of ${activeTab}`,
      content: activeTab === 'content' ? editableMarkdown : content,
      presentation: JSON.stringify(presentation),
      worksheet: activeTab === 'worksheet' ? editableMarkdown : worksheet,
      quiz: activeTab === 'quiz' ? editableMarkdown : quiz
    };

    const updatedHistory = [...versionHistory.slice(0, currentHistoryIndex + 1), newVersion];
    setVersionHistory(updatedHistory);
    setCurrentHistoryIndex(updatedHistory.length - 1);

    setIsEditMode(false);
    showToast('Manual changes saved and tracked in version logs!', 'success');
  };

  // Save Lesson Plan permanently to Database
  const handleSaveToDatabase = async () => {
    if (!content) {
      showToast('No content available to save.', 'error');
      return;
    }
    setSaving(true);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic,
          gradeLevel,
          subject,
          duration,
          academicYear,
          term,
          sequence,
          week,
          lessonDuration: duration,
          keywords: subTopic,
          competency,
          learningOutcomes,
          status: 'Published',
          content,
          presentation: JSON.stringify(presentation),
          worksheet,
          versionNumber: versionHistory[currentHistoryIndex]?.version || '1.0.0'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save lesson');
      }

      showToast('Master technical lesson package successfully synchronized with Neon DB!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Database sync failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Render Inline Bold Styles
  const formatTextWithBold = (text: string) => {
    if (!text) return '';
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-slate-100">{part}</strong>;
      }
      return part;
    });
  };

  // Render Markdown Preview in High-Fidelity Professional Document Theme
  const renderDocumentPreview = (markdownText: string) => {
    if (!markdownText) {
      return (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
          <h3 className="font-bold text-slate-400 font-sans">Pedagogical Blueprint Preview</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Complete the generation parameters on the left and click "Generate Masterclass Package" to create A4 high-fidelity documents.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 p-8 space-y-4 font-sans text-xs leading-relaxed max-w-none text-left shadow-2xl overflow-y-auto max-h-[800px] select-text">
        {/* Document Frame Banner based on Active Template */}
        <div className="border-b-4 border-amber-500 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-amber-500 text-[10px] font-mono font-black uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded">
                REPUBLIC OF CAMEROON * PEACE - WORK - FATHERLAND
              </span>
              <h1 className="text-xl font-black text-white mt-1 uppercase tracking-tight">
                MINISTRY OF SECONDARY EDUCATION (MINESEC)
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">
                DEPT OF CIVIL ENGINEERING & BUILDING TECHNOLOGY | YEAR {academicYear}
              </p>
            </div>
            <div className="text-right">
              <span className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 px-3 py-1 rounded-md font-mono block">
                {activeTemplate === 'cba-lesson' && 'CBA LESSON PLAN'}
                {activeTemplate === 'blueprint-spec' && 'TECHNICAL SPECIFICATION'}
                {activeTemplate === 'site-safety' && 'SITE HSE SAFETY REPORT'}
                {activeTemplate === 'pedagogy-guide' && 'VETERAN COACHING GUIDE'}
              </span>
              <span className="text-[9px] text-emerald-400 font-mono mt-1 block">
                Draft v{versionHistory[currentHistoryIndex]?.version || '1.0.0'} (Active)
              </span>
            </div>
          </div>
        </div>

        {markdownText.split('\n').map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-2" />;

          // Main Header
          if (trimmed.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-lg font-black text-white border-b-2 border-slate-800 pb-1 mt-6 tracking-tight uppercase">
                {trimmed.replace('# ', '')}
              </h1>
            );
          }

          // Section Header
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-sm font-bold text-amber-500 mt-4 pb-0.5 uppercase tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                {trimmed.replace('## ', '')}
              </h2>
            );
          }

          // Sub-section Header
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-xs font-semibold text-white mt-3 italic underline">
                {trimmed.replace('### ', '')}
              </h3>
            );
          }

          // Lists
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-xs text-slate-300 pl-1">
                {formatTextWithBold(trimmed.substring(2))}
              </li>
            );
          }

          // Numbered lists
          const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <li key={idx} className="ml-4 list-decimal text-xs text-slate-300 pl-1">
                {formatTextWithBold(numMatch[2])}
              </li>
            );
          }

          // Blockquotes
          if (trimmed.startsWith('>')) {
            return (
              <blockquote key={idx} className="border-l-2 border-amber-500 pl-4 my-3 italic text-slate-400 bg-slate-900/60 p-3 rounded-r-xl">
                {formatTextWithBold(trimmed.substring(1).trim())}
              </blockquote>
            );
          }

          // ASCII codeblock drawings
          if (trimmed.startsWith('```') || trimmed.includes('|') || trimmed.includes('+--') || trimmed.includes('===') || trimmed.includes('___')) {
            if (trimmed.startsWith('```')) return null; // simplify
            return (
              <pre key={idx} className="bg-black text-amber-400 font-mono text-[10px] p-4 rounded-xl overflow-x-auto border border-slate-900 leading-tight my-3 whitespace-pre scrollbar-thin">
                {line}
              </pre>
            );
          }

          return (
            <p key={idx} className="text-slate-300 text-xs text-justify font-sans leading-relaxed">
              {formatTextWithBold(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  // Download high-fidelity A4 PDF using browser print standard stylesheets
  const handleDownloadPDF = () => {
    if (!content) return;
    showToast('Preparing professional document print mode...', 'info');

    // Create a temporary hidden iframe with styled printable markup
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    let textToPrint = '';
    if (activeTab === 'content') textToPrint = content;
    else if (activeTab === 'worksheet') textToPrint = worksheet;
    else if (activeTab === 'quiz') textToPrint = quiz;
    else {
      showToast('Cannot print presentation slides in A4 layout.', 'error');
      document.body.removeChild(iframe);
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>${topic} - Veteran Lesson Plan</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: 'Inter', system-ui, sans-serif;
              font-size: 10pt;
              line-height: 1.5;
              color: #000;
              margin: 0;
            }
            h1, h2, h3, h4 {
              color: #000;
              font-family: 'Inter', sans-serif;
              margin-top: 15pt;
              margin-bottom: 8pt;
              page-break-after: avoid;
            }
            h1 {
              font-size: 16pt;
              font-weight: 800;
              text-align: center;
              text-transform: uppercase;
              border-bottom: 2px solid #000;
              padding-bottom: 5pt;
            }
            h2 {
              font-size: 12pt;
              font-weight: 700;
              border-bottom: 1px solid #000;
              padding-bottom: 3pt;
              text-transform: uppercase;
            }
            h3 {
              font-size: 10.5pt;
              font-weight: 600;
              text-decoration: underline;
            }
            p {
              margin-top: 0;
              margin-bottom: 10pt;
              text-align: justify;
            }
            li {
              margin-bottom: 5pt;
            }
            pre {
              background: #f4f4f4;
              border: 1px solid #ddd;
              padding: 10pt;
              font-family: 'Courier New', Courier, monospace;
              font-size: 8.5pt;
              white-space: pre-wrap;
              page-break-inside: avoid;
              border-radius: 4px;
            }
            blockquote {
              border-left: 3px solid #000;
              padding-left: 10pt;
              margin: 10pt 0;
              font-style: italic;
              color: #333;
            }
            .header-banner {
              border-bottom: 4px double #000;
              padding-bottom: 10pt;
              margin-bottom: 20pt;
              text-align: center;
            }
            .header-banner h2 {
              border: none;
              font-size: 11pt;
              font-weight: 800;
              margin: 0;
              text-transform: uppercase;
            }
            .header-banner p {
              text-align: center;
              font-size: 8pt;
              margin: 2pt 0;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h2>REPUBLIC OF CAMEROON * PEACE - WORK - FATHERLAND</h2>
            <p>MINISTRY OF SECONDARY EDUCATION (MINESEC)</p>
            <p>DEPT OF CIVIL ENGINEERING & BUILDING TECHNOLOGY | ACADEMIC CO-PILOT</p>
          </div>
          ${textToPrint
            .split('\n')
            .map(line => {
              const trimmed = line.trim();
              if (!trimmed) return '';
              if (trimmed.startsWith('# ')) return `<h1>${trimmed.replace('# ', '')}</h1>`;
              if (trimmed.startsWith('## ')) return `<h2>${trimmed.replace('## ', '')}</h2>`;
              if (trimmed.startsWith('### ')) return `<h3>${trimmed.replace('### ', '')}</h3>`;
              if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) return `<li>${trimmed.substring(2)}</li>`;
              if (trimmed.startsWith('>')) return `<blockquote>${trimmed.substring(1).trim()}</blockquote>`;
              if (trimmed.includes('|') || trimmed.includes('+--') || trimmed.includes('===') || trimmed.includes('___')) {
                return `<pre>${line}</pre>`;
              }
              return `<p>${trimmed}</p>`;
            })
            .join('\n')}
        </body>
      </html>
    `;

    doc.write(htmlContent);
    doc.close();

    // Trigger standard print layout, rendering beautiful vector-based print options
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  // Download editable Word DOCX file using raw content type standard wrapper
  const handleDownloadWord = () => {
    let textToExport = '';
    if (activeTab === 'content') textToExport = content;
    else if (activeTab === 'worksheet') textToExport = worksheet;
    else if (activeTab === 'quiz') textToExport = quiz;

    if (!textToExport) return;

    const header = `REPUBLIC OF CAMEROON * PEACE - WORK - FATHERLAND\nMINISTRY OF SECONDARY EDUCATION\nCIVIL ENGINEERING & BUILDING DEPT\n\n`;
    const fullText = header + textToExport;

    const blob = new Blob([fullText], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_')}_veteran_${activeTab}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Successfully exported editable document for MS Word!', 'success');
  };

  // Copy Markdown to Clipboard
  const handleCopyClipboard = () => {
    let textToCopy = '';
    if (activeTab === 'content') textToCopy = content;
    else if (activeTab === 'worksheet') textToCopy = worksheet;
    else if (activeTab === 'quiz') textToCopy = quiz;

    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    showToast('Successfully copied professional Markdown to clipboard!', 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left" id="admin-extended-lesson-architect">
      
      {/* Header Banner */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-amber-500 text-xs font-mono font-black uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded">
            Advanced AI Pedagogical Module
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-amber-500 shrink-0" />
            Extended Lesson Architect
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Iterative co-pilot producing high-fidelity, 20-page long-form lesson structures, blueprints, safety inspection reports, and formal pedagogical lesson packages aligned with Cameroon MINESEC CBA curriculum standards.
          </p>
        </div>
        
        {/* Templates Selector */}
        <div className="flex flex-wrap gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTemplate('cba-lesson')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTemplate === 'cba-lesson' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            CBA Lesson Plan
          </button>
          <button
            onClick={() => setActiveTemplate('blueprint-spec')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTemplate === 'blueprint-spec' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Blueprint Specification
          </button>
          <button
            onClick={() => setActiveTemplate('site-safety')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTemplate === 'site-safety' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Safety Audit Report
          </button>
          <button
            onClick={() => setActiveTemplate('pedagogy-guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTemplate === 'pedagogy-guide' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            Masterclass Pedagogy
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Parameters Input and Refinement Controls */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Syllabus Context Selection Card */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4 shadow">
            <div className="flex items-center gap-2 text-amber-500">
              <FileSpreadsheet className="w-4.5 h-4.5" />
              <span className="text-xs font-bold uppercase tracking-wider">National Syllabus Alignment</span>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Select Processed Syllabus Context</label>
              <select
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white text-xs outline-none"
                value={selectedSyllabusId}
                onChange={(e) => setSelectedSyllabusId(e.target.value)}
              >
                <option value="">-- Generate without specific syllabus (General MINESEC alignment) --</option>
                {syllabusDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.filename} ({doc.subject} - {doc.gradeLevel})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                Aligning your lesson with a national syllabus processes direct vocabulary, sequence numbers, and strict learning indicators.
              </p>
            </div>
          </div>

          {/* Parameters Accordion Form */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4 shadow">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <div className="flex items-center gap-2 text-amber-500">
                <Sliders className="w-4.5 h-4.5" />
                <span className="text-xs font-bold uppercase tracking-wider">Lesson Package Metadata</span>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold">
                Veteran Mode
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Lesson Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white text-xs outline-none font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Sub-Topic Focus</label>
                <input
                  type="text"
                  value={subTopic}
                  onChange={(e) => setSubTopic(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Grade Level</label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Subject Area</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Duration & Academic Year</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Term / Sequence / Week</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-1/3 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-1.5 text-white text-xs outline-none"
                    placeholder="Term"
                  />
                  <input
                    type="text"
                    value={sequence}
                    onChange={(e) => setSequence(e.target.value)}
                    className="w-1/3 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-1.5 text-white text-xs outline-none"
                    placeholder="Seq"
                  />
                  <input
                    type="text"
                    value={week}
                    onChange={(e) => setWeek(e.target.value)}
                    className="w-1/3 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-1.5 text-white text-xs outline-none"
                    placeholder="Week"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">National Competency Mandate</label>
                <textarea
                  value={competency}
                  onChange={(e) => setCompetency(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white text-xs outline-none h-12"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Prerequisites & Site Materials</label>
                <textarea
                  value={prerequisiteKnowledge}
                  onChange={(e) => setPrerequisiteKnowledge(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white text-xs outline-none h-12"
                  placeholder="E.g. sand classifications, safety PPE..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Special Instructions / Custom Directives</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white text-xs outline-none h-16 text-amber-300"
                  placeholder="Specify advanced topics (soil compaction curves, Eurocodes, safety protocols, bilingual English/French terminology...)"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Weaving Long-Form Pedagogical Blueprint...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Masterclass Package (Veteran Ed.)
                </>
              )}
            </button>
          </div>

          {/* Iterative Co-Pilot Chat Refinement Loop */}
          {content && (
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4 shadow animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center gap-2 text-amber-500">
                <RefreshCw className="w-4.5 h-4.5" />
                <span className="text-xs font-bold uppercase tracking-wider">Iterative Refinement Loop</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Prompt the co-pilot to refine specific parts of the generated document. Every refinement is tracked as a new draft version.
              </p>

              <form onSubmit={handleRefine} className="flex gap-2">
                <input
                  type="text"
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  placeholder="E.g., 'Add structural drawing notes' or 'Expand worksheet Section 3'"
                  disabled={generating}
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white text-xs outline-none"
                />
                <button
                  type="submit"
                  disabled={generating || !refinementPrompt.trim()}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 p-2.5 rounded-xl transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Version Logs History */}
              <div className="pt-2 border-t border-slate-900 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <div className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Version Timeline
                  </div>
                  <span>{versionHistory.length} drafts logged</span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {versionHistory.map((ver, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRestoreVersion(idx)}
                      className={`w-full text-left p-2 rounded-lg text-xs font-mono transition-all border flex justify-between items-center ${
                        idx === currentHistoryIndex 
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold' 
                          : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="text-white font-bold mr-1.5">v{ver.version}</span>
                        <span className="text-[10px] text-slate-500">[{ver.action}]</span>
                      </div>
                      <span className="text-[9px] shrink-0 text-slate-500">{ver.timestamp}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: High-Fidelity Preview Document Canvas */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Preview Navigation Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow">
            
            {/* Tab Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setActiveTab('content'); setIsEditMode(false); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'content' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                1. CBA Plan
              </button>
              
              <button
                onClick={() => { setActiveTab('presentation'); setIsEditMode(false); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'presentation' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                2. Slides ({presentation.length || 0})
              </button>

              <button
                onClick={() => { setActiveTab('worksheet'); setIsEditMode(false); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'worksheet' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                3. Worksheet
              </button>

              <button
                onClick={() => { setActiveTab('quiz'); setIsEditMode(false); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'quiz' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                4. Quiz Rubrics
              </button>
            </div>

            {/* Document Action Controls */}
            {content && (
              <div className="flex gap-1.5 w-full sm:w-auto justify-end">
                {isEditMode ? (
                  <button
                    onClick={handleSaveChanges}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider shadow"
                  >
                    Save Edits
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditMode(true);
                    }}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase"
                  >
                    Manual Edit
                  </button>
                )}

                <button
                  onClick={handleCopyClipboard}
                  title="Copy Document as Markdown"
                  className="bg-slate-900 border border-slate-800 text-slate-300 p-1.5 rounded-lg hover:text-white transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={handleDownloadWord}
                  title="Export to Microsoft Word"
                  className="bg-slate-900 border border-slate-800 text-slate-300 p-1.5 rounded-lg hover:text-white transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleDownloadPDF}
                  title="Print Document or Export to A4 PDF"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-lg transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleSaveToDatabase}
                  disabled={saving}
                  title="Synchronize and Publish to Neon database"
                  className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-1.5 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-1 text-[10px]"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Sync DB
                </button>
              </div>
            )}

          </div>

          {/* Active Canvas Section */}
          <div className="min-h-96">
            
            {/* Edit Mode Textarea */}
            {isEditMode ? (
              <div className="space-y-2">
                <span className="text-[10px] text-amber-500 font-mono font-bold uppercase block">Manual Text Editor (Markdown Supported)</span>
                <textarea
                  value={editableMarkdown}
                  onChange={(e) => setEditableMarkdown(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-6 border border-slate-800 focus:border-amber-500 rounded-2xl h-[600px] outline-none"
                />
              </div>
            ) : (
              <>
                {/* Tab 1: CBA Plan Markdown Preview */}
                {activeTab === 'content' && renderDocumentPreview(content)}

                {/* Tab 2: Presentation Slide Deck Preview */}
                {activeTab === 'presentation' && (
                  presentation.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-500">
                      <Layout className="w-12 h-12 text-slate-600 mb-4 animate-pulse" />
                      <h3 className="font-bold text-slate-400">Presentation Deck Workspace</h3>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">Slides will be automatically synthesized when generating the masterclass package.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Interactive slide projector wrapper */}
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        
                        {/* Projector Header */}
                        <div className="bg-slate-900 border-b border-slate-850 px-5 py-3 flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-400">BOARDROOM PROJECTOR VIEW</span>
                          <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-bold uppercase text-[9px]">
                            Slide {activeSlide} of {presentation.length}
                          </span>
                        </div>

                        {/* Projector screen */}
                        <div className="p-8 md:p-12 min-h-80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between">
                          <div className="space-y-4 text-left">
                            <span className="text-amber-500 font-mono text-[10px] font-bold uppercase tracking-widest block">
                              SLIDE {presentation[activeSlide - 1]?.slideNumber || activeSlide}
                            </span>
                            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                              {presentation[activeSlide - 1]?.title || 'Untitled Slide'}
                            </h2>
                            <ul className="space-y-2 pt-2">
                              {(presentation[activeSlide - 1]?.bullets || []).map((bullet: string, bidx: number) => (
                                <li key={bidx} className="text-xs md:text-sm text-slate-300 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0" />
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Technical drawing illustration hint inside slide */}
                          {presentation[activeSlide - 1]?.diagram && (
                            <div className="mt-6 p-3 bg-black/60 rounded-xl border border-slate-900/80">
                              <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest block mb-1">Vector Illustration Blueprint Description:</span>
                              <p className="text-[10px] text-slate-400 font-mono">{presentation[activeSlide - 1]?.diagram}</p>
                            </div>
                          )}
                        </div>

                        {/* Projector controls */}
                        <div className="bg-slate-900 border-t border-slate-850 px-5 py-3 flex justify-between items-center">
                          <button
                            onClick={() => setActiveSlide(prev => Math.max(1, prev - 1))}
                            disabled={activeSlide === 1}
                            className="bg-slate-950 border border-slate-800 disabled:opacity-40 text-slate-300 hover:text-white p-1.5 rounded-lg transition-all"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          
                          <div className="text-xs text-slate-400 font-mono">
                            {presentation[activeSlide - 1]?.discussionQuestion && (
                              <p className="italic text-center text-[10px] text-amber-400">
                                Interactive Question: "{presentation[activeSlide - 1]?.discussionQuestion}"
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => setActiveSlide(prev => Math.min(presentation.length, prev + 1))}
                            disabled={activeSlide === presentation.length}
                            className="bg-slate-950 border border-slate-800 disabled:opacity-40 text-slate-300 hover:text-white p-1.5 rounded-lg transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                      </div>

                      {/* Instructor Speaker Notes */}
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-left space-y-2">
                        <div className="flex items-center gap-2 text-amber-500 border-b border-slate-900 pb-2">
                          <Bookmark className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Teacher Masterclass Lecture Scripts</span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed italic">
                          {presentation[activeSlide - 1]?.speakerNotes || 'No notes defined for this slide.'}
                        </p>
                      </div>

                    </div>
                  )
                )}

                {/* Tab 3: Worksheet Preview */}
                {activeTab === 'worksheet' && renderDocumentPreview(worksheet)}

                {/* Tab 4: Quiz & Rubrics Preview */}
                {activeTab === 'quiz' && renderDocumentPreview(quiz)}
              </>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
