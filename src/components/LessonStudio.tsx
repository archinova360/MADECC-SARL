import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  Download, 
  Copy, 
  Printer, 
  Trash2, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Layers, 
  FileText, 
  Sliders, 
  Plus, 
  Calendar, 
  CheckSquare, 
  AlertTriangle, 
  BookOpen, 
  FileSpreadsheet, 
  Eye, 
  EyeOff, 
  Share2,
  Clock,
  User,
  School,
  ArrowRight,
  Undo,
  Redo,
  Archive,
  CopyPlus,
  Upload,
  Image,
  Video,
  Link
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getAuthToken } from '../lib/firebase.ts';

interface Slide {
  slideNumber: number;
  title: string;
  bullets: string[];
  speakerNotes: string;
  diagram: string;
  discussionQuestion: string;
}

interface LessonPlan {
  id?: number;
  lessonId: string;
  subjectId?: string | null;
  teacherId?: string | null;
  departmentId?: string | null;
  academicYear?: string | null;
  term?: string | null;
  sequence?: string | null;
  week?: string | null;
  lessonDuration?: string | null;
  gradeLevel?: string | null;
  topic: string;
  keywords?: string | null;
  competency?: string | null;
  learningOutcomes?: string | null;
  versionNumber: string;
  status: string;
  content: string; // Markdown of Parts 1-13
  presentation: string; // JSON string of 10 slides
  worksheet: string; // Markdown of Student Worksheet
  createdAt?: string;
  updatedAt?: string;
}

function renderInlineStyles(text: string) {
  if (!text) return '';
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-bold text-black">{part}</strong>;
    }
    return part;
  });
}

function renderMarkdownForPrint(markdownText: string) {
  if (!markdownText) return null;
  return (
    <div className="space-y-2 text-black text-left">
      {markdownText.split('\n').map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;
        
        // Headers
        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-base font-extrabold text-black uppercase border-b border-black pb-1 mt-4 text-center">{trimmed.replace('# ', '')}</h1>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-sm font-bold text-black border-b border-black pb-0.5 mt-3">{trimmed.replace('## ', '')}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-xs font-bold text-black mt-2 underline">{trimmed.replace('### ', '')}</h3>;
        }
        
        // Bullet points
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = trimmed.substring(2);
          return (
            <li key={idx} className="ml-4 list-disc text-xs text-black pl-1">
              {renderInlineStyles(content)}
            </li>
          );
        }
        
        // Ordered lists
        const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <li key={idx} className="ml-4 list-decimal text-xs text-black pl-1">
              {renderInlineStyles(numMatch[2])}
            </li>
          );
        }

        // Horizontal lines
        if (trimmed === '---') {
          return <hr key={idx} className="border-t border-black my-2" />;
        }

        // Blockquotes
        if (trimmed.startsWith('>')) {
          return (
            <blockquote key={idx} className="border-l-2 border-black pl-3 my-2 italic text-xs text-black bg-slate-50 p-1">
              {renderInlineStyles(trimmed.substring(1).trim())}
            </blockquote>
          );
        }

        // Tables
        if (trimmed.startsWith('|')) {
          const cells = trimmed.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
          if (cells.length === 0 || trimmed.includes('---')) return null;
          return (
            <div key={idx} className="grid text-[8.5pt] border-b border-black py-1" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
              {cells.map((cell, cidx) => (
                <div key={cidx} className="font-semibold px-2">{renderInlineStyles(cell)}</div>
              ))}
            </div>
          );
        }

        // Image markdown check: ![alt](url)
        if (trimmed.startsWith('![') && trimmed.includes('](')) {
          const imgMatch = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/);
          if (imgMatch) {
            return (
              <div key={idx} className="my-2 p-1.5 border border-black rounded text-center break-inside-avoid">
                <img src={imgMatch[2]} alt={imgMatch[1]} className="max-h-48 mx-auto rounded" referrerPolicy="no-referrer" />
                {imgMatch[1] && <p className="text-[7pt] italic text-slate-700 mt-1">Figure: {imgMatch[1]}</p>}
              </div>
            );
          }
        }

        // Video tag check: <video src="url" ... />
        if (trimmed.includes('<video') && trimmed.includes('src=')) {
          const vidMatch = trimmed.match(/src="([^"]+)"/);
          if (vidMatch) {
            return (
              <div key={idx} className="my-2 p-1.5 border border-black rounded bg-slate-50 text-center text-[7pt] break-inside-avoid">
                <div className="font-bold uppercase">Video Reference Link:</div>
                <div className="text-blue-700 underline truncate">{vidMatch[1]}</div>
              </div>
            );
          }
        }

        return <p key={idx} className="text-xs leading-relaxed text-black my-1">{renderInlineStyles(trimmed)}</p>;
      })}
    </div>
  );
}

const MinesecPrintHeader = ({ title, code }: { title: string; code: string }) => (
  <div className="minesec-header">
    <div className="minesec-header-columns">
      <div className="text-center">
        REPUBLIC OF CAMEROON<br />
        Peace – Work – Fatherland<br />
        MINISTRY OF SECONDARY EDUCATION
      </div>
      <div className="text-center shrink-0 px-4">
        <div className="w-10 h-10 border border-black rounded-full flex items-center justify-center font-bold text-[9px] mx-auto mb-1">
          MINESEC
        </div>
        <span className="text-[7.5pt] font-bold">{code}</span>
      </div>
      <div className="text-center">
        REPUBLIQUE DU CAMEROUN<br />
        Paix – Travail – Patrie<br />
        MINISTERE DES ENSEIGNEMENTS SECONDAIRES
      </div>
    </div>
    <div className="minesec-subinfo mt-2">
      {title}
    </div>
  </div>
);

const StudentAssessmentMeta = ({ subject, topic, gradeLevel }: { subject: string; topic: string; gradeLevel: string }) => (
  <table className="assessment-meta-table">
    <tbody>
      <tr>
        <td className="font-bold" style={{ width: '60%' }}>
          STUDENT FULL NAME: <span className="print-underline w-[60%] ml-2 h-4 inline-block border-b border-dotted border-black"></span>
        </td>
        <td className="font-bold" style={{ width: '40%' }}>
          CLASSROOM SECTION: <span className="print-underline w-[40%] ml-2 h-4 inline-block border-b border-dotted border-black"></span>
        </td>
      </tr>
      <tr>
        <td className="font-bold">
          SUBJECT: <span className="text-slate-800 font-medium ml-2">{subject}</span>
        </td>
        <td className="font-bold">
          ACADEMIC DATE: <span className="print-underline w-[55%] ml-2 h-4 inline-block border-b border-dotted border-black"></span>
        </td>
      </tr>
      <tr>
        <td className="font-bold">
          TOPIC: <span className="text-slate-800 font-medium ml-2">{topic}</span>
        </td>
        <td className="font-bold">
          GRADE / LEVEL: <span className="text-slate-800 font-medium ml-2">{gradeLevel}</span>
        </td>
      </tr>
    </tbody>
  </table>
);

interface LessonStudioProps {
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  activeSyllabus?: any | null;
  setActiveSyllabus?: (syllabus: any | null) => void;
}

export default function LessonStudio({ showToast, activeSyllabus, setActiveSyllabus }: LessonStudioProps) {
  // DB list & selection state
  const [lessonsHistory, setLessonsHistory] = useState<LessonPlan[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'plan' | 'lecture' | 'slides' | 'worksheet' | 'quiz' | 'metadata' | 'media'>('plan');

  // Media Cloud Upload states
  const [uploadedMediaFiles, setUploadedMediaFiles] = useState<any[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState<string>('');
  const [dragOverActive, setDragOverActive] = useState<boolean>(false);

  const handleMediaUpload = async (file: File) => {
    setIsUploadingMedia(true);
    setMediaUploadProgress('Preparing upload...');

    const applyUploadedMedia = (finalUrl: string) => {
      setIsUploadingMedia(false);
      setMediaUploadProgress('');
      const newFile = {
        id: `MED-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        name: file.name,
        url: finalUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };
      setUploadedMediaFiles(prev => [newFile, ...prev]);
      showToast(`Media file "${file.name}" uploaded successfully!`, 'success');
    };

    const uploadViaServerProxy = async (): Promise<string> => {
      setMediaUploadProgress('Uploading to secure server...');
      const proxyFormData = new FormData();
      proxyFormData.append('file', file);
      const token = await getAuthToken() || '';
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: proxyFormData
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        if (!res.ok) throw new Error(`Server upload failed (${res.status})`);
      }
      if (!res.ok && data.error) {
        throw new Error(data.error);
      }
      const finalUrl = data.url || data.secure_url;
      if (!finalUrl) throw new Error('No URL returned from server upload');
      return finalUrl;
    };

    try {
      const token = await getAuthToken() || '';
      
      // Step A: Try to get a signed direct upload ticket for Cloudinary
      let signedTicket: any = null;
      try {
        const sigRes = await fetch('/api/cloudinary-signature', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (sigRes.ok) {
          signedTicket = await sigRes.json();
        }
      } catch (err) {
        console.warn('Could not fetch Cloudinary upload ticket, falling back to proxy upload:', err);
      }

      if (signedTicket && signedTicket.signature && signedTicket.cloudName) {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        // Direct Signed Cloudinary Upload
        formData.append('file', file);
        formData.append('api_key', signedTicket.apiKey);
        formData.append('timestamp', signedTicket.timestamp.toString());
        formData.append('signature', signedTicket.signature);
        formData.append('folder', signedTicket.folder || 'minesec_media');

        const uploadUrl = `https://api.cloudinary.com/v1_1/${signedTicket.cloudName}/auto/upload`;
        xhr.open('POST', uploadUrl, true);
        setMediaUploadProgress('Uploading directly to Cloudinary (0%)...');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setMediaUploadProgress(`Uploading: ${percentComplete}% (${(event.loaded / (1024 * 1024)).toFixed(1)}MB / ${(event.total / (1024 * 1024)).toFixed(1)}MB)`);
          }
        };

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              const finalUrl = data.secure_url || data.url;
              if (finalUrl) {
                applyUploadedMedia(finalUrl);
                return;
              }
            } catch (err) {
              console.warn('[LESSON_UPLOAD_PARSE_WARN] Direct upload response parse error, falling back:', err);
            }
          }

          // Direct upload failed (e.g. 403 Forbidden). Fall back to server storage
          console.warn(`[LESSON_DIRECT_UPLOAD_FAILED] HTTP ${xhr.status}. Running server fallback...`);
          try {
            const serverUrl = await uploadViaServerProxy();
            applyUploadedMedia(serverUrl);
          } catch (fbErr: any) {
            setIsUploadingMedia(false);
            setMediaUploadProgress('');
            showToast(`Upload failed: ${fbErr.message}`, 'error');
          }
        };

        xhr.onerror = async () => {
          console.warn('[LESSON_DIRECT_UPLOAD_XHR_ERROR] Network issue. Running server fallback...');
          try {
            const serverUrl = await uploadViaServerProxy();
            applyUploadedMedia(serverUrl);
          } catch (fbErr: any) {
            setIsUploadingMedia(false);
            setMediaUploadProgress('');
            showToast(`Upload failed: ${fbErr.message}`, 'error');
          }
        };

        xhr.send(formData);
      } else {
        // Direct ticket not available - use server proxy immediately
        try {
          const serverUrl = await uploadViaServerProxy();
          applyUploadedMedia(serverUrl);
        } catch (serverErr: any) {
          setIsUploadingMedia(false);
          setMediaUploadProgress('');
          showToast(`Upload failed: ${serverErr.message}`, 'error');
        }
      }
    } catch (err: any) {
      setIsUploadingMedia(false);
      setMediaUploadProgress('');
      showToast(`Upload failed: ${err.message || err}`, 'error');
    }
  };

  const handleDeleteMedia = (id: string) => {
    if (window.confirm('Remove this media file from your gallery?')) {
      setUploadedMediaFiles(prev => prev.filter(f => f.id !== id));
      showToast('Media removed from gallery.', 'success');
    }
  };

  const handleEmbedMedia = (targetTab: 'plan' | 'lecture' | 'worksheet' | 'quiz', fileUrl: string, fileType: string, fileName: string) => {
    let embedCode = '';
    const cleanName = fileName.replace(/[^\w\s-]/g, '').trim() || 'illustration';
    if (fileType.startsWith('image/')) {
      embedCode = `\n\n![${cleanName}](${fileUrl})\n*Figure: Illustration of ${cleanName}*\n\n`;
    } else if (fileType.startsWith('video/')) {
      embedCode = `\n\n<video src="${fileUrl}" controls className="w-full max-w-2xl rounded-xl my-4 mx-auto border border-slate-800 shadow-xl" />\n*Video: Demonstration of ${cleanName}*\n\n`;
    } else {
      embedCode = `\n\n[Attachment Link: ${cleanName}](${fileUrl})\n\n`;
    }

    if (targetTab === 'plan') {
      const updated = generatedContent + embedCode;
      updateContentWithHistory(updated);
      showToast(`Embedded "${fileName}" into Lesson Plan!`, 'success');
    } else if (targetTab === 'lecture') {
      const updated = generatedLecture + embedCode;
      updateLectureWithHistory(updated);
      showToast(`Embedded "${fileName}" into Lecture Script!`, 'success');
    } else if (targetTab === 'worksheet') {
      const updated = generatedWorksheet + embedCode;
      updateWorksheetWithHistory(updated);
      showToast(`Embedded "${fileName}" into Student Worksheet!`, 'success');
    } else if (targetTab === 'quiz') {
      const updated = generatedQuiz + embedCode;
      updateQuizWithHistory(updated);
      showToast(`Embedded "${fileName}" into Assessment Quiz!`, 'success');
    }
  };

  // Input states
  const [formData, setFormData] = useState({
    gradeLevel: 'Form Four Building Construction (F4BA)',
    subject: 'Building Construction',
    topic: 'Introduction to Foundations & Excavation Safety',
    subTopic: 'Pad and Strip Footing Design & Trench Shoring',
    duration: '100 Minutes (2 Periods)',
    academicYear: '2026/2027',
    term: 'Term 1',
    sequence: 'Sequence 1',
    week: 'Week 2',
    period: 'Periods 1 & 2',
    teacherName: 'Senior Construction Lecturer',
    department: 'Civil Engineering & Building Construction',
    learningDomain: 'Cognitive and Psychomotor',
    competency: 'Understand, lay out, and safely implement concrete building foundations',
    learningOutcomes: 'Students can define types of foundations, calculate soil excavation volume, lay out trenches using 3:4:5 rule, and list 5 site safety PPE items.',
    curriculumReference: 'MINESEC Syllabus Sec 4.1.2 - Construction Site Practice',
    prerequisiteKnowledge: 'Basic masonry tools, safety principles, and geometric squaring.',
    availableResources: 'Workshop sand pit, measuring tapes, string lines, timber planks, spirit levels, hard hats.',
    studentPopulation: '36 pupils, mixed-ability classroom, bilingual instruction context (English/French).',
    customPrompt: '',
    depthMode: 'standard'
  });

  // Generator states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  // Active loaded states
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [generatedSlides, setGeneratedSlides] = useState<Slide[]>([]);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<string>('');
  const [generatedQuiz, setGeneratedQuiz] = useState<string>('');
  const [generatedMetadata, setGeneratedMetadata] = useState<any | null>(null);

  // UI state
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [showForm, setShowForm] = useState(true);

  // Syllabus upload states
  const [syllabusText, setSyllabusText] = useState<string>('');
  const [syllabusFilename, setSyllabusFilename] = useState<string>('');
  const [uploadingSyllabus, setUploadingSyllabus] = useState<boolean>(false);

  // Undo / Redo history stacks
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Worksheet undo / redo history
  const [worksheetHistoryStack, setWorksheetHistoryStack] = useState<string[]>([]);
  const [worksheetHistoryIndex, setWorksheetHistoryIndex] = useState<number>(-1);

  // Quiz undo / redo history
  const [quizHistoryStack, setQuizHistoryStack] = useState<string[]>([]);
  const [quizHistoryIndex, setQuizHistoryIndex] = useState<number>(-1);

  // Lecture undo / redo history
  const [generatedLecture, setGeneratedLecture] = useState<string>('');
  const [lectureHistoryStack, setLectureHistoryStack] = useState<string[]>([]);
  const [lectureHistoryIndex, setLectureHistoryIndex] = useState<number>(-1);
  const [isGeneratingLecture, setIsGeneratingLecture] = useState<boolean>(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);

  // Editing mode states
  const [isEditingContent, setIsEditingContent] = useState<boolean>(false);
  const [isEditingWorksheet, setIsEditingWorksheet] = useState<boolean>(false);
  const [isEditingQuiz, setIsEditingQuiz] = useState<boolean>(false);
  const [isEditingLecture, setIsEditingLecture] = useState<boolean>(false);

  // Sidebar tab filter
  const [selectedArchiveTab, setSelectedArchiveTab] = useState<'active' | 'archived'>('active');

  // History Helper Functions
  const initializeContentHistory = (content: string) => {
    const rawContent = content || '';
    const parts = rawContent.split('<!-- LECTURE_SECTION_START -->');
    const mainContent = parts[0]?.trim() || '';
    const lectureContent = parts[1]?.trim() || '';

    setHistoryStack([mainContent]);
    setHistoryIndex(0);
    setGeneratedContent(mainContent);

    setLectureHistoryStack([lectureContent]);
    setLectureHistoryIndex(0);
    setGeneratedLecture(lectureContent);
  };

  const updateContentWithHistory = (newContent: string) => {
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(newContent);
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
    setGeneratedContent(newContent);
  };

  const updateLectureWithHistory = (newLecture: string) => {
    const newStack = lectureHistoryStack.slice(0, lectureHistoryIndex + 1);
    newStack.push(newLecture);
    setLectureHistoryStack(newStack);
    setLectureHistoryIndex(newStack.length - 1);
    setGeneratedLecture(newLecture);
  };

  const initializeWorksheetHistory = (worksheet: string, quiz?: string) => {
    const rawWorksheet = worksheet || '';
    const parts = rawWorksheet.split('<!-- QUIZ_SECTION_START -->');
    const mainWorksheet = parts[0]?.trim() || '';
    const quizContent = quiz ? quiz.trim() : (parts[1]?.trim() || '');

    setWorksheetHistoryStack([mainWorksheet]);
    setWorksheetHistoryIndex(0);
    setGeneratedWorksheet(mainWorksheet);

    setQuizHistoryStack([quizContent]);
    setQuizHistoryIndex(0);
    setGeneratedQuiz(quizContent);
  };

  const updateWorksheetWithHistory = (newWorksheet: string) => {
    const newStack = worksheetHistoryStack.slice(0, worksheetHistoryIndex + 1);
    newStack.push(newWorksheet);
    setWorksheetHistoryStack(newStack);
    setWorksheetHistoryIndex(newStack.length - 1);
    setGeneratedWorksheet(newWorksheet);
  };

  const updateQuizWithHistory = (newQuiz: string) => {
    const newStack = quizHistoryStack.slice(0, quizHistoryIndex + 1);
    newStack.push(newQuiz);
    setQuizHistoryStack(newStack);
    setQuizHistoryIndex(newStack.length - 1);
    setGeneratedQuiz(newQuiz);
  };

  const handleUndo = () => {
    if (activeSubTab === 'plan' && historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setGeneratedContent(historyStack[prevIndex]);
      showToast('Undo applied', 'info');
    } else if (activeSubTab === 'lecture' && lectureHistoryIndex > 0) {
      const prevIndex = lectureHistoryIndex - 1;
      setLectureHistoryIndex(prevIndex);
      setGeneratedLecture(lectureHistoryStack[prevIndex]);
      showToast('Undo applied', 'info');
    } else if (activeSubTab === 'worksheet' && worksheetHistoryIndex > 0) {
      const prevIndex = worksheetHistoryIndex - 1;
      setWorksheetHistoryIndex(prevIndex);
      setGeneratedWorksheet(worksheetHistoryStack[prevIndex]);
      showToast('Undo applied', 'info');
    } else if (activeSubTab === 'quiz' && quizHistoryIndex > 0) {
      const prevIndex = quizHistoryIndex - 1;
      setQuizHistoryIndex(prevIndex);
      setGeneratedQuiz(quizHistoryStack[prevIndex]);
      showToast('Undo applied', 'info');
    }
  };

  const handleRedo = () => {
    if (activeSubTab === 'plan' && historyIndex < historyStack.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setGeneratedContent(historyStack[nextIndex]);
      showToast('Redo applied', 'info');
    } else if (activeSubTab === 'lecture' && lectureHistoryIndex < lectureHistoryStack.length - 1) {
      const nextIndex = lectureHistoryIndex + 1;
      setLectureHistoryIndex(nextIndex);
      setGeneratedLecture(lectureHistoryStack[nextIndex]);
      showToast('Redo applied', 'info');
    } else if (activeSubTab === 'worksheet' && worksheetHistoryIndex < worksheetHistoryStack.length - 1) {
      const nextIndex = worksheetHistoryIndex + 1;
      setWorksheetHistoryIndex(nextIndex);
      setGeneratedWorksheet(worksheetHistoryStack[nextIndex]);
      showToast('Redo applied', 'info');
    } else if (activeSubTab === 'quiz' && quizHistoryIndex < quizHistoryStack.length - 1) {
      const nextIndex = quizHistoryIndex + 1;
      setQuizHistoryIndex(nextIndex);
      setGeneratedQuiz(quizHistoryStack[nextIndex]);
      showToast('Redo applied', 'info');
    }
  };

  // References
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Fetch history on mount
  useEffect(() => {
    fetchLessonsHistory();
  }, []);

  // Load pre-filled syllabus from activeSyllabus prop if redirected from Syllabus Manager
  useEffect(() => {
    if (activeSyllabus) {
      const sText = activeSyllabus.extractedText || '';
      const sName = activeSyllabus.filename || '';
      const sSubject = activeSyllabus.subject || 'Building Construction';
      const sGrade = activeSyllabus.gradeLevel || 'Form Four Building Construction (F4BA)';
      const sObjectives = activeSyllabus.learningObjectives || '';
      const sStandards = activeSyllabus.curriculumStandards || '';
      const sTopics = activeSyllabus.keyTopics || '';

      // Set syllabus states
      setSyllabusText(sText);
      setSyllabusFilename(sName);

      // Pre-fill form fields
      setFormData(prev => {
        // Extract a friendly topic from keyTopics or use a default one
        const firstTopic = sTopics.split(',')[0]?.trim() || sTopics.split('\n')[0]?.trim() || '';
        const topicCleaned = firstTopic.length > 5 ? firstTopic : 'Syllabus Lesson';
        
        return {
          ...prev,
          subject: sSubject,
          gradeLevel: sGrade,
          topic: topicCleaned.substring(0, 100),
          competency: sObjectives.substring(0, 200) || prev.competency,
          learningOutcomes: sObjectives.substring(0, 300) || prev.learningOutcomes,
          curriculumReference: sStandards.substring(0, 200) || prev.curriculumReference,
          prerequisiteKnowledge: sObjectives.length > 300 ? sObjectives.substring(300, 500) : prev.prerequisiteKnowledge,
        };
      });

      // Clear the active syllabus state in parent to avoid re-triggering
      if (setActiveSyllabus) {
        setActiveSyllabus(null);
      }

      // Make sure the parameters form is showing
      setShowForm(true);

      showToast(`Loaded details from syllabus: ${sName}`, 'success');
    }
  }, [activeSyllabus, setActiveSyllabus]);

  const fetchLessonsHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = await getAuthToken() || '';
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/lessons', { headers });
      if (res.ok) {
        const data = await res.json();
        setLessonsHistory(data);
      } else {
        console.warn('Failed to fetch lessons history');
      }
    } catch (err) {
      console.error('Error fetching lessons history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationStep('Analyzing Cameroon MINESEC curriculum guidelines...');
    
    // Simulate nice progress updates
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        let stepMsg = '';
        const nextVal = prev + 15;
        if (nextVal > 70) {
          stepMsg = 'Assembling 10 high-quality instructional slides with presenter notes...';
        } else if (nextVal > 45) {
          stepMsg = 'Creating three-page interactive student worksheets and calculations answer keys...';
        } else if (nextVal > 25) {
          stepMsg = 'Aligning Competency-Based Approach (CBA) objectives with Bloom\'s Taxonomy...';
        }
        if (stepMsg) setGenerationStep(stepMsg);
        return nextVal;
      });
    }, 1500);

    try {
      const token = await getAuthToken() || '';
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...formData, syllabusText })
      });

      clearInterval(progressInterval);
      setGenerationProgress(95);
      setGenerationStep('Finalizing lesson package schemas...');

      if (res.ok) {
        const data = await res.json();
        initializeContentHistory(data.content || '');
        
        let slidesList: Slide[] = [];
        if (Array.isArray(data.presentation)) {
          slidesList = data.presentation;
        } else if (typeof data.presentation === 'string') {
          try {
            slidesList = JSON.parse(data.presentation);
          } catch {
            slidesList = [];
          }
        }
        setGeneratedSlides(slidesList);
        initializeWorksheetHistory(data.worksheet || '', data.quiz || '');
        setGeneratedMetadata(data.metadata || null);
        
        setSelectedLesson(null); // This is a new unsaved generation
        setActiveSlideIndex(0);
        showToast('Lesson package generated successfully using Gemini!', 'success');
        setShowForm(false);
      } else {
        const errorText = await res.text();
        showToast(`Generation failed: ${errorText || 'Server Error'}`, 'error');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      showToast(`Error during generation: ${err.message || err}`, 'error');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStep('');
    }
  };

  const handleGenerateLecture = async () => {
    if (!generatedContent) {
      showToast('Please generate a main lesson plan first before generating a lecture.', 'warning');
      return;
    }
    setIsGeneratingLecture(true);
    try {
      const token = await getAuthToken() || '';
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/lessons/generate-lecture', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: formData.topic,
          gradeLevel: formData.gradeLevel,
          subject: formData.subject,
          lessonPlan: generatedContent,
          depthMode: formData.depthMode
        })
      });

      if (res.ok) {
        const data = await res.json();
        updateLectureWithHistory(data.lecture || '');
        showToast('Ready-to-Teach Lecture generated successfully!', 'success');
      } else {
        const errorText = await res.text();
        showToast(`Failed to generate lecture: ${errorText || 'Server Error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error during lecture generation: ${err.message || err}`, 'error');
    } finally {
      setIsGeneratingLecture(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!generatedContent) {
      showToast('Please generate a main lesson plan first before generating a quiz.', 'warning');
      return;
    }
    setIsGeneratingQuiz(true);
    try {
      const token = await getAuthToken() || '';
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/lessons/generate-quiz', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: formData.topic,
          gradeLevel: formData.gradeLevel,
          subject: formData.subject,
          lessonPlan: generatedContent,
          depthMode: formData.depthMode
        })
      });

      if (res.ok) {
        const data = await res.json();
        updateQuizWithHistory(data.quiz || '');
        showToast('CBA Assessment Quiz generated successfully!', 'success');
      } else {
        const errorText = await res.text();
        showToast(`Failed to generate quiz: ${errorText || 'Server Error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error during quiz generation: ${err.message || err}`, 'error');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSaveToDatabase = async (statusOverride?: 'Draft' | 'Review' | 'Published') => {
    if (!generatedContent) {
      showToast('No generated lesson available to save.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const token = await getAuthToken() || '';
      const headers: any = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const status = statusOverride || (selectedLesson ? selectedLesson.status : 'Draft');
      
      const payload: LessonPlan = {
        lessonId: selectedLesson?.lessonId || generatedMetadata?.lessonId || `LES-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        subjectId: 'SUB-CIVIL',
        teacherId: 'TCH-001',
        departmentId: 'DEPT-CONSTR',
        academicYear: formData.academicYear,
        term: formData.term,
        sequence: formData.sequence,
        week: formData.week,
        lessonDuration: formData.duration,
        gradeLevel: formData.gradeLevel,
        topic: formData.topic,
        keywords: generatedMetadata?.keywords || 'foundation, strip, pad, safety',
        competency: formData.competency,
        learningOutcomes: formData.learningOutcomes,
        versionNumber: selectedLesson?.versionNumber || '1.0.0',
        status,
        content: generatedLecture 
          ? `${generatedContent}\n\n<!-- LECTURE_SECTION_START -->\n\n${generatedLecture}`
          : generatedContent,
        presentation: JSON.stringify(generatedSlides),
        worksheet: generatedQuiz 
          ? `${generatedWorksheet}\n\n<!-- QUIZ_SECTION_START -->\n\n${generatedQuiz}` 
          : generatedWorksheet
      };

      let res;
      if (selectedLesson && selectedLesson.lessonId) {
        // Update existing
        res = await fetch(`/api/lessons/${selectedLesson.lessonId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        // Insert new
        res = await fetch('/api/lessons', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const saved = await res.json();
        showToast(`Lesson plan saved successfully as ${status}!`, 'success');
        setSelectedLesson(saved);
        fetchLessonsHistory();
      } else {
        const err = await res.json();
        showToast(`Save failed: ${err.error || 'Server error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this lesson package from the database?')) {
      return;
    }

    try {
      const token = await getAuthToken() || '';
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        showToast('Lesson deleted from database successfully.', 'success');
        if (selectedLesson?.lessonId === lessonId) {
          setSelectedLesson(null);
          setGeneratedContent('');
          setGeneratedSlides([]);
          setGeneratedWorksheet('');
          setGeneratedQuiz('');
          setGeneratedMetadata(null);
        }
        fetchLessonsHistory();
      } else {
        showToast('Failed to delete lesson.', 'error');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleSelectHistory = (lesson: LessonPlan) => {
    setSelectedLesson(lesson);
    initializeContentHistory(lesson.content);
    initializeWorksheetHistory(lesson.worksheet);
    
    // Parse slides
    let slidesList: Slide[] = [];
    if (lesson.presentation) {
      try {
        slidesList = typeof lesson.presentation === 'string' ? JSON.parse(lesson.presentation) : lesson.presentation;
      } catch {
        slidesList = [];
      }
    }
    setGeneratedSlides(slidesList);
    
    setGeneratedMetadata({
      lessonId: lesson.lessonId,
      subjectId: lesson.subjectId,
      teacherId: lesson.teacherId,
      departmentId: lesson.departmentId,
      academicYear: lesson.academicYear,
      term: lesson.term,
      sequence: lesson.sequence,
      week: lesson.week,
      lessonDuration: lesson.lessonDuration,
      gradeLevel: lesson.gradeLevel,
      topic: lesson.topic,
      keywords: lesson.keywords,
      competency: lesson.competency,
      learningOutcomes: lesson.learningOutcomes
    });

    // Populate form data so they can re-generate if needed
    setFormData({
      gradeLevel: lesson.gradeLevel || 'Form Four Building Construction (F4BA)',
      subject: lesson.subjectId || 'Building Construction',
      topic: lesson.topic || '',
      subTopic: '',
      duration: lesson.lessonDuration || '100 Minutes',
      academicYear: lesson.academicYear || '2026/2027',
      term: lesson.term || 'Term 1',
      sequence: lesson.sequence || 'Sequence 1',
      week: lesson.week || 'Week 1',
      period: '',
      teacherName: lesson.teacherId || 'Curriculum Specialist',
      department: lesson.departmentId || 'Civil Engineering & Building Construction',
      learningDomain: 'Cognitive and Psychomotor',
      competency: lesson.competency || '',
      learningOutcomes: lesson.learningOutcomes || '',
      curriculumReference: '',
      prerequisiteKnowledge: '',
      availableResources: '',
      studentPopulation: '',
      customPrompt: '',
      depthMode: 'standard'
    });

    setActiveSlideIndex(0);
    setShowForm(false);
    showToast(`Loaded lesson: ${lesson.topic}`, 'info');
  };

  const handleSyllabusUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSyllabus(true);
    const fd = new FormData();
    fd.append('syllabusFile', file);

    try {
      const token = await getAuthToken() || '';
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/lessons/upload-syllabus', {
        method: 'POST',
        headers,
        body: fd
      });

      if (res.ok) {
        const data = await res.json();
        setSyllabusText(data.text);
        setSyllabusFilename(file.name);
        showToast(`Syllabus extracted: ${file.name}`, 'success');
        
        // Populate inputs with suggested content
        const lines = data.text.trim().split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        if (lines.length > 0) {
          const suggestedTopic = lines[0].substring(0, 80);
          const suggestedCompetency = lines.slice(1, 4).join(' ').substring(0, 150);
          setFormData(prev => ({
            ...prev,
            topic: suggestedTopic || prev.topic,
            competency: suggestedCompetency || prev.competency
          }));
        }
      } else {
        const errText = await res.text();
        showToast(`Upload failed: ${errText}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setUploadingSyllabus(false);
    }
  };

  const handleDuplicateActiveLesson = async () => {
    let targetLesson: any = selectedLesson;
    if (!targetLesson) {
      if (!generatedContent) {
        showToast('No active lesson plan to duplicate.', 'error');
        return;
      }
      targetLesson = {
        lessonId: `LES-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        subjectId: formData.subject,
        teacherId: formData.teacherName,
        departmentId: formData.department,
        academicYear: formData.academicYear,
        term: formData.term,
        sequence: formData.sequence,
        week: formData.week,
        lessonDuration: formData.duration,
        gradeLevel: formData.gradeLevel,
        topic: formData.topic || 'Untitled Technical Lesson',
        keywords: '',
        competency: formData.competency,
        learningOutcomes: formData.learningOutcomes,
        content: generatedContent,
        presentation: JSON.stringify(generatedSlides),
        worksheet: generatedWorksheet,
        status: 'Draft'
      };
    }

    setIsSaving(true);
    try {
      const token = await getAuthToken() || '';
      const headers: any = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const newId = `LES-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const payload = {
        ...targetLesson,
        lessonId: newId,
        topic: `${targetLesson.topic} (Copy)`,
        status: 'Draft'
      };

      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
        setSelectedLesson(saved);
        initializeContentHistory(saved.content);
        initializeWorksheetHistory(saved.worksheet);
        showToast(`Duplicated lesson plan successfully: ${saved.topic}`, 'success');
        fetchLessonsHistory();
      } else {
        const err = await res.json();
        showToast(`Failed to duplicate: ${err.error || 'Server error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveActiveLesson = async () => {
    if (!selectedLesson) {
      showToast('Please save the lesson plan to database first before archiving.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const token = await getAuthToken() || '';
      const headers: any = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const newStatus = selectedLesson.status === 'Archived' ? 'Draft' : 'Archived';
      const payload = {
        ...selectedLesson,
        status: newStatus
      };

      const res = await fetch(`/api/lessons/${selectedLesson.lessonId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
        setSelectedLesson(saved);
        showToast(newStatus === 'Archived' ? 'Lesson plan archived successfully.' : 'Lesson plan restored to Draft.', 'success');
        fetchLessonsHistory();
      } else {
        const err = await res.json();
        showToast(`Failed to update status: ${err.error || 'Server error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveLesson = async (lesson: any) => {
    setIsSaving(true);
    try {
      const token = await getAuthToken() || '';
      const headers: any = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const newStatus = lesson.status === 'Archived' ? 'Draft' : 'Archived';
      const payload = {
        ...lesson,
        status: newStatus
      };

      const res = await fetch(`/api/lessons/${lesson.lessonId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
        if (selectedLesson?.lessonId === lesson.lessonId) {
          setSelectedLesson(saved);
        }
        showToast(newStatus === 'Archived' ? 'Lesson plan archived successfully.' : 'Lesson plan restored to Draft.', 'success');
        fetchLessonsHistory();
      } else {
        const err = await res.json();
        showToast(`Failed to update status: ${err.error || 'Server error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Export handlers (Part 17)
  const handleCopyClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard successfully!', 'success');
  };

  const handleDownloadFile = (filename: string, text: string, mimeType: string) => {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded ${filename} successfully.`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTextBlock = (block: string, idx: number) => {
    const trimmed = block.trim();

    // Image markdown check: ![alt](url)
    if (trimmed.startsWith('![') && trimmed.includes('](')) {
      const imgMatch = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/);
      if (imgMatch) {
        return (
          <div key={idx} className="my-4 p-3.5 bg-slate-950/50 rounded-2xl border border-slate-850 text-center animate-in fade-in duration-300">
            <img src={imgMatch[2]} alt={imgMatch[1]} className="max-h-80 mx-auto rounded-xl shadow-lg border border-slate-800 hover:border-slate-700 transition-all" referrerPolicy="no-referrer" />
            {imgMatch[1] && <p className="text-[10px] text-slate-400 mt-2.5 italic">Figure: {imgMatch[1]}</p>}
          </div>
        );
      }
    }

    // Video tag check: <video src="url" ... />
    if (trimmed.includes('<video') && trimmed.includes('src=')) {
      const vidMatch = trimmed.match(/src="([^"]+)"/);
      if (vidMatch) {
        return (
          <div key={idx} className="my-4 p-3.5 bg-slate-950/50 rounded-2xl border border-slate-850 text-center animate-in fade-in duration-300">
            <video src={vidMatch[1]} controls className="max-h-80 w-full rounded-xl shadow-lg border border-slate-800" />
            <p className="text-[10px] text-slate-400 mt-2.5 italic font-mono">Video Illustration</p>
          </div>
        );
      }
    }

    return <p key={idx} className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">{block}</p>;
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 18;
      const contentWidth = pageWidth - (2 * margin);
      let y = margin;

      // Header drawing helper
      const drawHeader = (pageNum: number) => {
        // Slate top banner
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 14, 'F');
        
        // Amber decorative strip
        doc.setFillColor(245, 158, 11); // amber-500
        doc.rect(0, 14, pageWidth, 1.5, 'F');

        // Header text in white
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text('REPUBLIC OF CAMEROON * PEACE - WORK - FATHERLAND * MINISTRY OF SECONDARY EDUCATION', margin, 8.5);

        // Footer decorative background
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);

        // Footer content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('MINESEC CBA Academic Co-Pilot (Senior Technical Teacher Edition)', margin, pageHeight - 5);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(`Page ${pageNum}`, pageWidth - margin - 10, pageHeight - 5);
      };

      // Helper to dynamically render a text line with safety check and automatic page splits
      const addText = (text: string, fontSize = 9.5, style: 'normal' | 'bold' | 'italic' = 'normal', spacing = 5.2, color = [30, 41, 59]) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);

        const lines = doc.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          if (y > pageHeight - 22) {
            doc.addPage();
            y = margin + 12; // padding for next page top margin
            drawHeader(doc.getNumberOfPages());
          }
          doc.text(line, margin, y);
          y += spacing;
        }
      };

      let currentPage = 1;
      drawHeader(currentPage);
      y = 26;

      // Title & Secondary school headers
      addText('REPUBLIQUE DU CAMEROUN - REPUBLIC OF CAMEROON', 9, 'bold', 5.5, [15, 23, 42]);
      addText('MINISTERE DES ENSEIGNEMENTS SECONDAIRES - MINISTRY OF SECONDARY EDUCATION', 8, 'bold', 5, [71, 85, 105]);
      addText('DEPARTEMENT DE GENIE CIVIL & BATIMENT - CIVIL ENGINEERING & BUILDING DEPT', 8, 'bold', 5.5, [71, 85, 105]);
      y += 2;

      addText(`CBA LESSON PLAN: ${formData.topic || 'TECHNICAL LESSON'}`, 12, 'bold', 8, [245, 158, 11]);
      
      // Metadata box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(margin, y, contentWidth, 18, 'F');
      doc.rect(margin, y, contentWidth, 18, 'D');
      
      const metaY = y + 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`Subject: ${formData.subject || 'N/A'}`, margin + 3, metaY);
      doc.text(`Level: ${formData.gradeLevel || 'N/A'}`, margin + 3, metaY + 4);
      doc.text(`Duration: ${formData.duration || 'N/A'}`, margin + 3, metaY + 8);

      doc.text(`Year: ${formData.academicYear || '2026/2027'}`, margin + (contentWidth / 2), metaY);
      doc.text(`Term: ${formData.term || 'N/A'}`, margin + (contentWidth / 2), metaY + 4);
      doc.text(`Week: Week ${formData.week || 'N/A'} - Seq ${formData.sequence || 'N/A'}`, margin + (contentWidth / 2), metaY + 8);
      
      y += 23;

      // Content parser - processes full formatted markdown beautifully
      const content = `${generatedContent}\n\n${generatedLecture ? `# Ready-to-Teach Lecture\n\n${generatedLecture}` : ''}\n\n${generatedWorksheet || ''}\n\n${generatedQuiz || ''}`;
      const paragraphs = content.split('\n');

      for (const paragraph of paragraphs) {
        const trimmed = paragraph.trim();
        if (!trimmed) {
          y += 2.5; // space between paragraphs
          continue;
        }

        if (trimmed.startsWith('# ')) {
          y += 3.5;
          addText(trimmed.replace('# ', '').toUpperCase(), 11, 'bold', 6, [15, 23, 42]);
          // Horizontal line accent under headings
          doc.setDrawColor(245, 158, 11);
          doc.setLineWidth(0.4);
          doc.line(margin, y - 1, margin + 40, y - 1);
          y += 1.5;
        } else if (trimmed.startsWith('## ')) {
          y += 2.5;
          addText(trimmed.replace('## ', ''), 10, 'bold', 5.5, [30, 41, 59]);
          y += 1;
        } else if (trimmed.startsWith('### ')) {
          y += 1.5;
          addText(trimmed.replace('### ', ''), 9.5, 'bold', 5, [71, 85, 105]);
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          addText('  •  ' + trimmed.substring(2), 9, 'normal', 5, [30, 41, 59]);
        } else {
          addText(trimmed, 9, 'normal', 5, [51, 65, 85]);
        }
      }

      doc.save(`MINESEC-CBA-${(formData.topic || 'Lesson').replace(/\s+/g, '-')}.pdf`);
      showToast('Cameroon CBA A4 PDF document exported successfully!', 'success');
    } catch (err: any) {
      console.error('[EXPORT_PDF_ERROR]', err);
      showToast('Failed to export A4 PDF document.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans" id="minesec-lesson-specialist-root">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="bg-amber-500 text-slate-950 font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded mr-2">MINESEC ACADEMIC CO-PILOT</span>
          <span className="text-slate-500 font-mono text-xs">CBA Syllabus Alignment Suite</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            <GraduationCap className="w-8 h-8 text-amber-500 shrink-0" />
            Technical School Lesson Prep Studio
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Formulate detailed lesson documents, custom presentation slide decks, student worksheets, and syllabus metadata in deep compliance with the Cameroon Competency-Based Approach.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button 
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) {
                // reset generated content
              }
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs uppercase font-bold tracking-wider border border-slate-800 transition-colors"
          >
            {showForm ? 'View Active Lesson' : 'Config Syllabus Parameters'}
          </button>
          
          {generatedContent && (
            <div className="flex gap-2">
              <button 
                onClick={() => handleSaveToDatabase(selectedLesson?.status as any || 'Draft')}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs uppercase font-bold tracking-wider transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Progress'}
              </button>
              
              {selectedLesson && (
                <select 
                  value={selectedLesson.status}
                  onChange={(e) => handleSaveToDatabase(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-amber-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Review">In Review</option>
                  <option value="Published">Published</option>
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left column: Parameters Form OR History Panel */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Config Parameters Panel */}
          {showForm ? (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-amber-500 border-b border-slate-800 pb-2 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                Syllabus Settings
              </h2>
              
              {/* Dynamic Syllabus Upload Panel */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold flex items-center gap-1">
                    <Upload className="w-3 h-3 text-amber-500 animate-pulse" />
                    Syllabus Integration
                  </span>
                  {syllabusFilename && (
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Linked
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Upload official MINESEC technical syllabus (PDF, DOCX, TXT) to auto-align generated lessons.
                </p>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="sidebar-syllabus-file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleSyllabusUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="sidebar-syllabus-file"
                    className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-bold text-center text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {uploadingSyllabus ? 'Parsing File...' : 'Upload Syllabus'}
                  </label>
                </div>
                {syllabusFilename && (
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-900 text-[11px]">
                    <span className="text-slate-300 font-medium truncate max-w-[130px]">{syllabusFilename}</span>
                    <button
                      onClick={() => {
                        setSyllabusText('');
                        setSyllabusFilename('');
                        showToast('Syllabus cleared', 'info');
                      }}
                      className="text-rose-400 hover:text-rose-500 font-bold font-mono px-1 hover:bg-rose-500/10 rounded transition-all"
                      title="Clear syllabus filter"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Subject Area</label>
                  <select 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 px-3 py-2 rounded-xl text-white font-medium"
                  >
                    <option value="Building Construction">Building Construction</option>
                    <option value="Building Materials">Building Materials (Material Science)</option>
                    <option value="Technical Drawing">Technical / Engineering Drawing</option>
                    <option value="Soils Mechanics & Surveys">Soils Mechanics & Surveying</option>
                    <option value="Quantity Surveying & Estimating">Quantity Surveying & Estimating</option>
                    <option value="Building Construction Technology">Building Construction Technology</option>
                    <option value="Site Management & Practicals">Site Management & Practicals</option>
                    <option value="Reinforced Concrete Design">Reinforced Concrete Design</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Grade Level</label>
                  <select 
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 px-3 py-2 rounded-xl text-white font-medium"
                  >
                    <option value="Form One Technical">Form One Technical</option>
                    <option value="Form Two Technical">Form Two Technical</option>
                    <option value="Form Three Technical">Form Three Technical</option>
                    <option value="Form Four Building Construction (F4BA)">Form Four Building Construction (F4BA)</option>
                    <option value="Form Five Building Construction">Form Five Building Construction</option>
                    <option value="Lower Sixth Civil Engineering">Lower Sixth Civil Engineering</option>
                    <option value="Upper Sixth Civil Engineering">Upper Sixth Civil Engineering</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Academic Year</label>
                    <input 
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 px-3 py-1.5 rounded-xl text-white font-medium font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Term</label>
                    <select 
                      value={formData.term}
                      onChange={(e) => setFormData({...formData, term: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 px-3 py-1.5 rounded-xl text-white font-medium"
                    >
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Sequence</label>
                    <input 
                      type="text"
                      value={formData.sequence}
                      onChange={(e) => setFormData({...formData, sequence: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 px-3 py-1.5 rounded-xl text-white font-medium font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Week No.</label>
                    <input 
                      type="text"
                      value={formData.week}
                      onChange={(e) => setFormData({...formData, week: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 px-3 py-1.5 rounded-xl text-white font-medium font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Lesson Topic</label>
                  <input 
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    placeholder="e.g. Concrete mix ratios and curing"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 px-3 py-2 rounded-xl text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Sub-topic / focus</label>
                  <input 
                    type="text"
                    value={formData.subTopic}
                    onChange={(e) => setFormData({...formData, subTopic: e.target.value})}
                    placeholder="e.g. Mixing calculations, hydration curing times"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 px-3 py-2 rounded-xl text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">CBA Competency Statement</label>
                  <textarea 
                    value={formData.competency}
                    onChange={(e) => setFormData({...formData, competency: e.target.value})}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 p-2.5 rounded-xl text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Expected Learning Outcomes</label>
                  <textarea 
                    value={formData.learningOutcomes}
                    onChange={(e) => setFormData({...formData, learningOutcomes: e.target.value})}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 p-2.5 rounded-xl text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Pedagogical Scaffolding & Depth Mode</label>
                  <select 
                    value={formData.depthMode}
                    onChange={(e) => setFormData({...formData, depthMode: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 px-3 py-2 rounded-xl text-white font-medium"
                  >
                    <option value="standard">Standard CBA Curriculum Plan</option>
                    <option value="veteran">Veteran Master Teacher (20-Page Long-Form Edition)</option>
                  </select>
                  <p className="text-[9px] text-slate-500 mt-1 leading-snug">
                    {formData.depthMode === 'veteran' 
                      ? '⚡ 20-Page Long-Form: Injects textbook-level depth, exhaustive mechanics (Eurocode/OHADA structural science, mixing math, curing formulas) and comprehensive bilingual teacher guidelines.' 
                      : '⚡ Standard: Mandated Ministry (MINESEC) Competency-Based lesson structure with complete slides.'}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Additional Custom Directives</label>
                  <textarea 
                    value={formData.customPrompt}
                    onChange={(e) => setFormData({...formData, customPrompt: e.target.value})}
                    placeholder="e.g. Focus on hand sketches of foundation types. Reference local clay soil behavior in Douala or dry soils in Maroua."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 p-2.5 rounded-xl text-white placeholder-slate-600 font-medium"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !formData.topic}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all text-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGenerating ? 'AI Specialist Working...' : 'Generate AI Lesson Plan'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-xl text-xs space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-amber-500 border-b border-slate-800 pb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Lesson Outline
              </h2>
              <div className="space-y-2 font-medium">
                <p className="text-[10px] text-slate-500 uppercase font-mono font-bold">Active Syllabus Parameters</p>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <p className="text-white font-bold">{formData.topic}</p>
                  <p className="text-slate-400 text-[10px] font-mono">{formData.gradeLevel}</p>
                  <p className="text-amber-500 text-[10px] font-mono uppercase font-bold">{formData.subject}</p>
                  <p className="text-slate-400 text-[10px] font-mono">{formData.academicYear} • {formData.term}</p>
                </div>

                <div className="border-t border-slate-900 pt-3">
                  <p className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-1.5">Quick Actions</p>
                  <div className="space-y-1">
                    <button 
                      onClick={() => {
                        setShowForm(true);
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-500" />
                      Create New Lesson
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History / Archive Section */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3 max-h-[420px] overflow-y-auto text-xs">
            <div className="flex flex-col gap-2 border-b border-slate-800 pb-2">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  Lesson Database
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-850">
                <button
                  onClick={() => setSelectedArchiveTab('active')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all text-center ${
                    selectedArchiveTab === 'active' 
                      ? 'bg-amber-500 text-slate-950 shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  Active Plans
                </button>
                <button
                  onClick={() => setSelectedArchiveTab('archived')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all text-center ${
                    selectedArchiveTab === 'archived' 
                      ? 'bg-amber-500 text-slate-950 shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  Archived
                </button>
              </div>
            </div>

            {loadingHistory ? (
              <div className="text-center py-6 text-slate-500 text-xs animate-pulse">
                Fetching secure school server archive...
              </div>
            ) : lessonsHistory.filter(l => selectedArchiveTab === 'archived' ? l.status === 'Archived' : l.status !== 'Archived').length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-xs font-mono">
                No {selectedArchiveTab} lessons in database.
              </div>
            ) : (
              <div className="space-y-2">
                {lessonsHistory
                  .filter(l => selectedArchiveTab === 'archived' ? l.status === 'Archived' : l.status !== 'Archived')
                  .map((lesson) => (
                    <div 
                      key={lesson.id}
                      className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                        selectedLesson?.lessonId === lesson.lessonId 
                          ? 'bg-amber-500/10 border-amber-500/60' 
                          : 'bg-slate-900/60 border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div 
                        className="cursor-pointer space-y-1 flex-1"
                        onClick={() => handleSelectHistory(lesson)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {lesson.lessonId}
                          </span>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            lesson.status === 'Published' ? 'bg-emerald-500/20 text-emerald-400' :
                            lesson.status === 'Review' ? 'bg-amber-500/20 text-amber-400' : 
                            lesson.status === 'Archived' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {lesson.status}
                          </span>
                        </div>
                        <p className="font-bold text-white leading-tight truncate">{lesson.topic}</p>
                        <p className="text-[10px] text-slate-400 truncate">{lesson.gradeLevel}</p>
                        <p className="text-[9px] text-slate-500 font-mono">
                          {lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2 border-t border-slate-800/45 mt-2 pt-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveLesson(lesson);
                          }}
                          className="text-slate-500 hover:text-amber-500 p-1 rounded hover:bg-amber-500/10 transition-colors"
                          title={lesson.status === 'Archived' ? 'Unarchive and restore' : 'Archive Lesson'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLesson(lesson.lessonId);
                          }}
                          className="text-slate-500 hover:text-rose-500 p-1 rounded hover:bg-rose-500/10 transition-colors"
                          title="Delete from database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

        </div>

        {/* Right column: Generated output workspace (3/4 of screen) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Main workspace container */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col min-h-[750px]">
            
            {/* Generation Overlay Loader */}
            {isGenerating && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-center items-center z-50 rounded-2xl">
                <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-amber-500 animate-spin mb-4" />
                <h3 className="text-lg font-extrabold text-white">AI Instructional Specialist Working</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">{generationStep}</p>
                
                {/* Custom Progress Bar */}
                <div className="w-72 bg-slate-900 border border-slate-800 rounded-full h-2.5 mt-4 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-500" 
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-amber-500 font-mono font-bold mt-2">{generationProgress}% Completed</span>
              </div>
            )}

            {/* Empty state: Waiting for input */}
            {!generatedContent && !isGenerating && (
              <div className="flex-1 flex flex-col justify-center items-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4 animate-bounce">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-white">No Active CBA Lesson Generated</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1.5">
                  Input your syllabus, grade level, curriculum references, and topic on the left parameters panel, then trigger the AI Generator to formulate a complete 17-part lesson package compliant with MINESEC standards.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-6 px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
                >
                  Configure Parameters First
                  <ArrowRight className="w-4 h-4 text-amber-500" />
                </button>
              </div>
            )}

            {/* Generated Output Workspace */}
            {generatedContent && !isGenerating && (
              <div className="space-y-6 flex-1 flex flex-col">
                
                {/* Active loaded notification bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-4 rounded-xl border border-slate-800 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-extrabold text-white">Active Lesson Package: {formData.topic}</p>
                      <p className="text-[9px] text-slate-400 font-mono">
                        ID: {generatedMetadata?.lessonId || 'UNSAVED'} • Version: {selectedLesson?.versionNumber || '1.0.0'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyClipboard(`${generatedContent}\n\n${generatedLecture ? `# Ready-to-Teach Lecture\n\n${generatedLecture}\n\n` : ''}${generatedWorksheet || ''}\n\n${generatedQuiz || ''}`)}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-lg text-slate-400 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1.5"
                      title="Copy full lesson to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-500" />
                      Copy Markdown
                    </button>
                    <button
                      onClick={() => handleDownloadFile(`${formData.topic.toLowerCase().replace(/ /g, '_')}_lesson_package.md`, `${generatedContent}\n\n${generatedLecture ? `# Ready-to-Teach Lecture\n\n${generatedLecture}\n\n` : ''}${generatedWorksheet || ''}\n\n${generatedQuiz || ''}`, 'text/markdown')}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-lg text-slate-400 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1.5"
                      title="Download Markdown file"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-500" />
                      Download .md
                    </button>
                    <button
                      onClick={() => {
                        // Construct Word-compatible simple HTML file
                        const htmlString = `
                          <html>
                          <head>
                            <meta charset="utf-8">
                            <title>${formData.topic}</title>
                            <style>
                              body { font-family: Arial, sans-serif; line-height: 1.6; }
                              h1, h2, h3 { color: #2B6CB0; }
                              table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                              th, td { border: 1px solid #CBD5E0; padding: 8px; text-align: left; }
                              th { bg-color: #EDF2F7; }
                            </style>
                          </head>
                          <body>
                            <h1>${formData.topic} - Lesson Plan</h1>
                            <h3>MINESEC Cameroon CBA Curriculum compliant</h3>
                            <hr/>
                            ${generatedContent.replace(/\n/g, '<br>')}
                            ${generatedLecture ? `
                              <br><hr><br>
                              <h1>Ready-to-Teach Lecture Script</h1>
                              ${generatedLecture.replace(/\n/g, '<br>')}
                            ` : ''}
                            <br><hr><br>
                            <h1>Student Worksheet</h1>
                            ${generatedWorksheet.replace(/\n/g, '<br>')}
                            <br><hr><br>
                            <h1>Topic Quiz & Marks Allocation</h1>
                            ${(generatedQuiz || '').replace(/\n/g, '<br>')}
                          </body>
                          </html>
                        `;
                        handleDownloadFile(`${formData.topic.toLowerCase().replace(/ /g, '_')}_lesson.doc`, htmlString, 'application/msword');
                      }}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-lg text-slate-400 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1.5"
                      title="Download Microsoft Word compatible document"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                      Download Word
                    </button>
                     <button
                      onClick={handleExportPDF}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-lg text-slate-400 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1.5"
                      title="Export pristine vector A4 PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      Export A4 PDF
                    </button>
                    <button
                      onClick={handlePrint}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-lg text-slate-400 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1.5"
                      title="Trigger print layout"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-500" />
                      Print Layout
                    </button>
                  </div>
                </div>
                                 {/* Sub-tabs Navigation */}
                <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-px">
                  {[
                    { id: 'plan', label: 'CBA Lesson Plan (Parts 1-13)', icon: FileText },
                    { id: 'lecture', label: 'Ready-to-Teach Lecture', icon: BookOpen },
                    { id: 'slides', label: 'Slide Deck (Part 14)', icon: Sliders },
                    { id: 'worksheet', label: 'Student Worksheet (Part 15)', icon: GraduationCap },
                    { id: 'quiz', label: 'Topic Quizzes & Marks (Part 17)', icon: CheckSquare },
                    { id: 'media', label: 'Media Cloud & Embeds', icon: Upload },
                    { id: 'metadata', label: 'Admin Metadata (Part 16)', icon: Layers }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-extrabold uppercase tracking-widest shrink-0 transition-all ${
                          isActive 
                            ? 'border-amber-500 text-amber-500 bg-slate-900/40 rounded-t-lg' 
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* CBA Active Document Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 border-b border-slate-900 px-4 py-2.5 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Undo Button */}
                    <button
                      onClick={handleUndo}
                      disabled={
                        activeSubTab === 'plan' 
                          ? historyIndex <= 0 
                          : activeSubTab === 'lecture'
                          ? lectureHistoryIndex <= 0
                          : activeSubTab === 'worksheet' 
                          ? worksheetHistoryIndex <= 0 
                          : activeSubTab === 'quiz'
                          ? quizHistoryIndex <= 0
                          : true
                      }
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold flex items-center gap-1 transition-all"
                      title="Undo last change"
                    >
                      <Undo className="w-3.5 h-3.5 text-amber-500" />
                      Undo
                    </button>

                    {/* Redo Button */}
                    <button
                      onClick={handleRedo}
                      disabled={
                        activeSubTab === 'plan' 
                          ? historyIndex >= historyStack.length - 1 
                          : activeSubTab === 'lecture'
                          ? lectureHistoryIndex >= lectureHistoryStack.length - 1
                          : activeSubTab === 'worksheet' 
                          ? worksheetHistoryIndex >= worksheetHistoryStack.length - 1 
                          : activeSubTab === 'quiz'
                          ? quizHistoryIndex >= quizHistoryStack.length - 1
                          : true
                      }
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold flex items-center gap-1 transition-all"
                      title="Redo next change"
                    >
                      <Redo className="w-3.5 h-3.5 text-amber-500" />
                      Redo
                    </button>

                    <div className="h-5 w-px bg-slate-850 mx-1" />

                    {/* Edit Toggles */}
                    {activeSubTab === 'plan' && (
                      <button
                        onClick={() => {
                          setIsEditingContent(!isEditingContent);
                          if (isEditingContent) {
                            showToast('Lesson Plan saved in history', 'success');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all ${
                          isEditingContent 
                            ? 'bg-amber-500 text-slate-950 border-amber-400' 
                            : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {isEditingContent ? 'View Generated Plan' : 'Edit Markdown Code'}
                      </button>
                    )}

                    {activeSubTab === 'lecture' && (
                      <button
                        onClick={() => {
                          setIsEditingLecture(!isEditingLecture);
                          if (isEditingLecture) {
                            showToast('Lecture script saved in history', 'success');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all ${
                          isEditingLecture 
                            ? 'bg-amber-500 text-slate-950 border-amber-400' 
                            : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        {isEditingLecture ? 'View Generated Lecture' : 'Edit Markdown Code'}
                      </button>
                    )}

                    {activeSubTab === 'worksheet' && (
                      <button
                        onClick={() => {
                          setIsEditingWorksheet(!isEditingWorksheet);
                          if (isEditingWorksheet) {
                            showToast('Worksheet saved in history', 'success');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all ${
                          isEditingWorksheet 
                            ? 'bg-amber-500 text-slate-950 border-amber-400' 
                            : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        {isEditingWorksheet ? 'View Generated Worksheet' : 'Edit Markdown Code'}
                      </button>
                    )}

                    {activeSubTab === 'quiz' && (
                      <button
                        onClick={() => {
                          setIsEditingQuiz(!isEditingQuiz);
                          if (isEditingQuiz) {
                            showToast('Quiz saved in history', 'success');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all ${
                          isEditingQuiz 
                            ? 'bg-amber-500 text-slate-950 border-amber-400' 
                            : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        {isEditingQuiz ? 'View Generated Quiz' : 'Edit Markdown Code'}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Duplicate Button */}
                    <button
                      onClick={handleDuplicateActiveLesson}
                      disabled={isSaving}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg font-bold flex items-center gap-1.5 transition-all"
                      title="Duplicate this lesson plan"
                    >
                      <CopyPlus className="w-3.5 h-3.5 text-amber-500" />
                      Duplicate
                    </button>

                    {/* Archive Button */}
                    <button
                      onClick={handleArchiveActiveLesson}
                      disabled={isSaving}
                      className={`px-3 py-1.5 border rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                        selectedLesson?.status === 'Archived'
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20'
                          : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                      }`}
                      title="Toggle Archive Status"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      {selectedLesson?.status === 'Archived' ? 'Archived' : 'Archive'}
                    </button>

                    {/* Save Button */}
                    <button
                      onClick={() => handleSaveToDatabase(selectedLesson?.status as any || 'Draft')}
                      disabled={isSaving || (!generatedContent && !generatedWorksheet)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSaving ? 'Saving...' : 'Save Draft'}
                    </button>
                  </div>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto max-h-[60vh] pr-1" ref={printAreaRef}>
                  
                  {/* TAB 1: Lesson Plan CBA */}
                  {activeSubTab === 'plan' && (
                    <div className="space-y-6 text-sm text-slate-200 leading-relaxed md:p-2 animate-in fade-in duration-300">
                      
                      {/* Safety Alert Badge */}
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-400 uppercase font-mono">Pedagogy Note (Competency-Based Approach)</p>
                          <p className="text-slate-300 text-xs">
                            This lesson package strictly aligns with the Cameroon Ministry of Secondary Education (MINESEC) guidelines. Ensure students actively engage in the workshop practicals and always wear full personal protective equipment (PPE) before handling materials or entering excavations.
                          </p>
                        </div>
                      </div>

                      {isEditingContent ? (
                        <div className="space-y-3">
                          <p className="text-slate-400 text-xs font-mono">
                            ✍️ Edit Lesson Plan markdown. Changes will update your document instantly and keep your undo/redo history.
                          </p>
                          <textarea
                            value={generatedContent}
                            onChange={(e) => updateContentWithHistory(e.target.value)}
                            rows={24}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 p-4 rounded-xl text-white font-mono text-xs leading-relaxed"
                          />
                        </div>
                      ) : (
                        /* Render markdown style */
                        <div className="prose prose-invert max-w-none space-y-4">
                        {generatedContent.split('\n\n').map((block, idx) => {
                          if (block.startsWith('# ')) {
                            return <h1 key={idx} className="text-2xl font-extrabold text-white mt-6 border-b border-slate-900 pb-2">{block.replace('# ', '')}</h1>;
                          }
                          if (block.startsWith('## ')) {
                            return <h2 key={idx} className="text-xl font-bold text-amber-500 mt-5">{block.replace('## ', '')}</h2>;
                          }
                          if (block.startsWith('### ')) {
                            return <h3 key={idx} className="text-md font-bold text-slate-200 mt-4 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-850">{block.replace('### ', '')}</h3>;
                          }
                          if (block.startsWith('* ') || block.startsWith('- ')) {
                            return (
                              <ul key={idx} className="list-disc pl-5 space-y-1">
                                {block.split('\n').map((item, idy) => (
                                  <li key={idy} className="text-xs text-slate-300">{item.replace(/^[*-\s]+/, '')}</li>
                                ))}
                              </ul>
                            );
                          }
                          // Render tables
                          if (block.includes('|')) {
                            const lines = block.split('\n').filter(l => l.trim() !== '');
                            if (lines.length > 1) {
                              const headerRow = lines[0].split('|').map(s => s.trim()).filter(s => s !== '');
                              const dataRows = lines.slice(2).map(line => line.split('|').map(s => s.trim()).filter(s => s !== ''));
                              return (
                                <div key={idx} className="overflow-x-auto my-4 border border-slate-800 rounded-xl">
                                  <table className="w-full text-xs text-left text-slate-300">
                                    <thead className="bg-slate-900 text-amber-500 font-bold uppercase tracking-wider text-[10px]">
                                      <tr>
                                        {headerRow.map((head, idy) => (
                                          <th key={idy} className="px-4 py-3">{head}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                      {dataRows.map((row, idy) => (
                                        <tr key={idy} className="hover:bg-slate-900/40">
                                          {row.map((cell, idz) => (
                                            <td key={idz} className="px-4 py-3 font-medium">{cell}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            }
                          }
                          return renderTextBlock(block, idx);
                        })}
                      </div>
                      )}
                    </div>
                  )}

                  {/* TAB 1.5: Ready-to-Teach Lecture Section */}
                  {activeSubTab === 'lecture' && (
                    <div className="space-y-6 md:p-2 animate-in fade-in duration-300">
                      
                      {/* Lecture Status / Actions Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-4 rounded-xl border border-slate-850 gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-500 font-bold uppercase font-mono block">Professional Instructor Module</span>
                            <h3 className="text-sm font-bold text-slate-200">Ready-to-Teach Lecture Script</h3>
                          </div>
                        </div>

                        <button
                          onClick={handleGenerateLecture}
                          disabled={isGeneratingLecture || !generatedContent}
                          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-55 disabled:cursor-not-allowed text-slate-950 rounded-lg text-xs font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-md"
                        >
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          {isGeneratingLecture ? 'Generating...' : generatedLecture ? 'Regenerate Lecture Script' : 'Generate Lecture Script'}
                        </button>
                      </div>

                      {/* Timeline Pacing Overview */}
                      {generatedLecture && (
                        <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2 animate-in fade-in duration-500">
                          <p className="text-xs font-bold text-slate-400 uppercase font-mono flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-amber-500" />
                            Instructor Pacing & Timeline Checklist (Cameroon Secondary CBA standards)
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-[11px] font-mono">
                            <div className="bg-slate-900/60 p-2.5 border border-slate-850 rounded-lg">
                              <span className="text-amber-500 font-bold block">10-15%</span>
                              <span className="text-slate-400">Classroom Hook</span>
                            </div>
                            <div className="bg-slate-900/60 p-2.5 border border-slate-850 rounded-lg">
                              <span className="text-amber-500 font-bold block">40-50%</span>
                              <span className="text-slate-400">Direct Instruction</span>
                            </div>
                            <div className="bg-slate-900/60 p-2.5 border border-slate-850 rounded-lg">
                              <span className="text-amber-500 font-bold block">20-25%</span>
                              <span className="text-slate-400">Interactive Active Check</span>
                            </div>
                            <div className="bg-slate-900/60 p-2.5 border border-slate-850 rounded-lg">
                              <span className="text-amber-500 font-bold block">10-15%</span>
                              <span className="text-slate-400">Pacing Wrap-up</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Main Lecture Body */}
                      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 space-y-6">
                        
                        {isEditingLecture ? (
                          <div className="space-y-3">
                            <p className="text-slate-400 text-xs font-mono">
                              ✍️ Edit Lecture markdown script directly. Changes will update your document instantly and keep your undo/redo history.
                            </p>
                            <textarea
                              value={generatedLecture}
                              onChange={(e) => updateLectureWithHistory(e.target.value)}
                              rows={24}
                              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 p-4 rounded-xl text-white font-mono text-xs leading-relaxed"
                            />
                          </div>
                        ) : (
                          <div className="prose prose-invert text-xs space-y-4">
                            {generatedLecture ? (
                              generatedLecture.split('\n\n').map((block, idx) => {
                                if (block.startsWith('# ')) {
                                  return <h2 key={idx} className="text-2xl font-extrabold text-white border-b-2 border-slate-800 pb-2">{block.replace('# ', '')}</h2>;
                                }
                                if (block.startsWith('## ')) {
                                  return <h3 key={idx} className="text-lg font-bold text-amber-500 mt-5 border-b border-slate-900 pb-1">{block.replace('## ', '')}</h3>;
                                }
                                if (block.startsWith('### ')) {
                                  return <h4 key={idx} className="text-xs uppercase font-extrabold tracking-wider text-slate-200 mt-4 bg-slate-950/55 p-2 rounded border border-slate-800">{block.replace('### ', '')}</h4>;
                                }
                                if (block.startsWith('* ') || block.startsWith('- ')) {
                                  return (
                                    <ul key={idx} className="list-disc pl-5 space-y-1">
                                      {block.split('\n').map((item, idy) => (
                                        <li key={idy} className="text-xs text-slate-300">{item.replace(/^[*-\s]+/, '')}</li>
                                      ))}
                                    </ul>
                                  );
                                }
                                return renderTextBlock(block, idx);
                              })
                            ) : (
                              <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center gap-4">
                                <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-slate-300">Generate Ready-to-Teach Lecture</p>
                                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                    Generate teacher-facing timelines, pacing suggestions, and scripts mapped directly from your custom CBA syllabus and active lesson goals.
                                  </p>
                                </div>
                                <button
                                  onClick={handleGenerateLecture}
                                  disabled={isGeneratingLecture || !generatedContent}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md animate-bounce"
                                >
                                  {isGeneratingLecture ? 'Generating...' : 'Generate Lecture Script'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                      </div>

                    </div>
                  )}

                  {/* TAB 2: PowerPoint Slide Presentation */}
                  {activeSubTab === 'slides' && (
                    <div className="space-y-6 md:p-2 animate-in fade-in duration-300">
                      
                      {/* Interactive slide projector stage */}
                      <div className="bg-slate-950 border-4 border-slate-850 p-6 rounded-3xl shadow-2xl relative min-h-[360px] flex flex-col justify-between">
                        
                        {/* Slide Top Details */}
                        <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
                          <span className="text-[9px] font-mono text-amber-500 font-bold tracking-widest uppercase flex items-center gap-1">
                            <School className="w-3.5 h-3.5" />
                            Slide {activeSlideIndex + 1} of {generatedSlides.length || 10}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 uppercase">
                            {formData.subject}
                          </span>
                        </div>

                        {/* Slide Content */}
                        {generatedSlides.length > 0 && generatedSlides[activeSlideIndex] ? (
                          <div className="flex-1 flex flex-col justify-center py-6">
                            <h2 className="text-2xl font-black text-white tracking-tight text-center mb-6">
                              {generatedSlides[activeSlideIndex].title}
                            </h2>
                            <ul className="space-y-3 max-w-xl mx-auto">
                              {generatedSlides[activeSlideIndex].bullets.map((b, idx) => (
                                <li key={idx} className="text-sm text-slate-200 flex items-start gap-3">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                  <span className="font-semibold">{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="text-center py-10 text-slate-500">
                            No slides formatted for presentation.
                          </div>
                        )}

                        {/* Interactive Discussion Question Block */}
                        {generatedSlides.length > 0 && generatedSlides[activeSlideIndex]?.discussionQuestion && (
                          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl mt-6">
                            <span className="text-[8px] font-mono uppercase font-bold text-amber-400 block mb-1">
                              Classroom Interactive Question (Engage Learners):
                            </span>
                            <p className="text-xs text-slate-200 font-bold italic">
                              "{generatedSlides[activeSlideIndex].discussionQuestion}"
                            </p>
                          </div>
                        )}

                        {/* Slide Controls Footer */}
                        <div className="flex justify-between items-center border-t border-slate-900 pt-4 mt-6">
                          <button
                            onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                            disabled={activeSlideIndex === 0}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 rounded-lg text-xs font-bold text-slate-300 flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4 text-amber-500" />
                            Prev Slide
                          </button>
                          
                          <div className="flex gap-1">
                            {generatedSlides.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveSlideIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  idx === activeSlideIndex ? 'bg-amber-500 w-4' : 'bg-slate-800'
                                }`}
                              />
                            ))}
                          </div>

                          <button
                            onClick={() => setActiveSlideIndex(prev => Math.min(generatedSlides.length - 1, prev + 1))}
                            disabled={activeSlideIndex === generatedSlides.length - 1}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 rounded-lg text-xs font-bold text-slate-300 flex items-center gap-1"
                          >
                            Next Slide
                            <ChevronRight className="w-4 h-4 text-amber-500" />
                          </button>
                        </div>
                      </div>

                      {/* Presentation Speaker Notes & Diagrams Details */}
                      {generatedSlides.length > 0 && generatedSlides[activeSlideIndex] && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Presenter speaker notes */}
                          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl">
                            <h3 className="text-xs font-extrabold text-amber-500 uppercase font-mono mb-2 flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-amber-500" />
                              Speaker & Lecture Notes
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                              {generatedSlides[activeSlideIndex].speakerNotes}
                            </p>
                          </div>

                          {/* Suggested Diagrams/Drawing instructions */}
                          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl">
                            <h3 className="text-xs font-extrabold text-amber-500 uppercase font-mono mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-500" />
                              Suggested Blueprint Drawing
                            </h3>
                            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-xs font-mono text-emerald-400">
                              <span className="text-[9px] text-slate-500 block mb-1">CHALKBOARD / DRAWING INSTRUCTIONS:</span>
                              {generatedSlides[activeSlideIndex].diagram}
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  )}

                  {/* TAB 3: Printable Student Worksheet */}
                  {activeSubTab === 'worksheet' && (
                    <div className="space-y-6 md:p-2 animate-in fade-in duration-300">
                      
                      {/* Worksheet Option bar */}
                      <div className="flex justify-between items-center bg-slate-900 p-3.5 rounded-xl border border-slate-850">
                        <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-amber-500" />
                          Worksheet Teacher Mode:
                        </span>
                        <button
                          onClick={() => setShowAnswerKey(!showAnswerKey)}
                          className={`px-3 py-1.5 rounded-lg text-xs uppercase font-extrabold tracking-widest flex items-center gap-1.5 transition-colors ${
                            showAnswerKey 
                              ? 'bg-amber-500 text-slate-950 font-bold' 
                              : 'bg-slate-950 border border-slate-800 text-slate-400'
                          }`}
                        >
                          {showAnswerKey ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {showAnswerKey ? 'Answer Key: Visible' : 'Answer Key: Hidden'}
                        </button>
                      </div>

                      {/* Worksheet Sheet Container */}
                      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 space-y-6">
                        
                        {/* Worksheet Header */}
                        <div className="border-b-2 border-slate-800 pb-4 text-center">
                          <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">Cameroon secondary education worksheet</span>
                          <h2 className="text-xl font-extrabold text-white mt-1">
                            STUDENT COMPREHENSION WORKSHEET
                          </h2>
                          <div className="flex justify-center gap-4 text-xs font-mono text-slate-400 mt-2">
                            <span>Subject: {formData.subject}</span>
                            <span>•</span>
                            <span>Grade: {formData.gradeLevel}</span>
                          </div>
                          
                          {/* Student identification boxes */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mt-4 text-xs font-mono">
                            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded text-left">
                              <span className="text-slate-500 text-[9px] block">STUDENT FULL NAME:</span>
                              <span className="text-slate-600">________________________</span>
                            </div>
                            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded text-left">
                              <span className="text-slate-500 text-[9px] block">CLASSROOM SECTION:</span>
                              <span className="text-slate-600">_________________</span>
                            </div>
                            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded text-left">
                              <span className="text-slate-500 text-[9px] block">ACADEMIC DATE:</span>
                              <span className="text-slate-600">_________________</span>
                            </div>
                          </div>
                        </div>

                        {isEditingWorksheet ? (
                          <div className="space-y-3">
                            <p className="text-slate-400 text-xs font-mono">
                              ✍️ Edit Student Worksheet markdown. Changes will update your document instantly and keep your undo/redo history.
                            </p>
                            <textarea
                              value={generatedWorksheet}
                              onChange={(e) => updateWorksheetWithHistory(e.target.value)}
                              rows={24}
                              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 p-4 rounded-xl text-white font-mono text-xs leading-relaxed"
                            />
                          </div>
                        ) : (
                          /* Interactive worksheet content blocks */
                          <div className="prose prose-invert text-xs space-y-4">
                            {generatedWorksheet.split('\n\n').map((block, idx) => {
                              if (block.startsWith('# ')) return null; // Skip redundant top title
                              if (block.startsWith('## ')) {
                                return <h3 key={idx} className="text-lg font-bold text-amber-500 mt-5 border-b border-slate-900 pb-1">{block.replace('## ', '')}</h3>;
                              }
                              if (block.startsWith('### ')) {
                                return <h4 key={idx} className="text-xs uppercase font-extrabold tracking-wider text-slate-200 mt-4 bg-slate-950/55 p-2 rounded border border-slate-900">{block.replace('### ', '')}</h4>;
                              }
                              if (block.toLowerCase().includes('answer key') || block.toLowerCase().includes('answers:')) {
                                if (!showAnswerKey) return null; // Hide answers key if toggled off
                                return (
                                  <div key={idx} className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mt-6">
                                    <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono block mb-2">Teacher Assessment Reference Key:</span>
                                    <p className="text-slate-300 font-semibold whitespace-pre-wrap">{block}</p>
                                  </div>
                                );
                              }
                              return renderTextBlock(block, idx);
                            })}
                          </div>
                        )}

                      </div>

                    </div>
                  )}

                  {/* TAB 3.5: Printable Topic Quizzes & Marks */}
                  {activeSubTab === 'quiz' && (
                    <div className="space-y-6 md:p-2 animate-in fade-in duration-300">
                      
                      {/* Quiz Option bar */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-3.5 rounded-xl border border-slate-850 gap-3">
                        <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-amber-500" />
                          Quiz Assessment Teacher Mode:
                        </span>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={handleGenerateQuiz}
                            disabled={isGeneratingQuiz || !generatedContent}
                            className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-55 disabled:cursor-not-allowed text-slate-950 rounded-lg text-xs font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-md"
                          >
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            {isGeneratingQuiz ? 'Generating...' : generatedQuiz ? 'Regenerate Quiz' : 'Generate Quiz'}
                          </button>

                          <button
                            onClick={() => setShowAnswerKey(!showAnswerKey)}
                            className={`px-3 py-1.5 rounded-lg text-xs uppercase font-extrabold tracking-widest flex items-center justify-center gap-1.5 transition-colors shrink-0 ${
                              showAnswerKey 
                                ? 'bg-amber-500 text-slate-950 font-bold' 
                                : 'bg-slate-950 border border-slate-800 text-slate-400'
                            }`}
                          >
                            {showAnswerKey ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            {showAnswerKey ? 'Answer Key: Visible' : 'Answer Key: Hidden'}
                          </button>
                        </div>
                      </div>

                      {/* Quiz Sheet Container */}
                      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 space-y-6">
                        
                        {/* Quiz Header */}
                        <div className="border-b-2 border-slate-800 pb-4 text-center">
                          <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">Cameroon secondary education topic assessment</span>
                          <h2 className="text-xl font-extrabold text-white mt-1">
                            COMPETENCY-BASED TOPIC QUIZ & MARKS ALLOCATION
                          </h2>
                          <div className="flex justify-center gap-4 text-xs font-mono text-slate-400 mt-2">
                            <span>Subject: {formData.subject}</span>
                            <span>•</span>
                            <span>Grade: {formData.gradeLevel}</span>
                          </div>
                          
                          {/* Student identification boxes */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mt-4 text-xs font-mono">
                            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded text-left">
                              <span className="text-slate-500 text-[9px] block">STUDENT FULL NAME:</span>
                              <span className="text-slate-600">________________________</span>
                            </div>
                            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded text-left">
                              <span className="text-slate-500 text-[9px] block">CLASSROOM SECTION:</span>
                              <span className="text-slate-600">_________________</span>
                            </div>
                            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded text-left">
                              <span className="text-slate-500 text-[9px] block">ACADEMIC DATE:</span>
                              <span className="text-slate-600">_________________</span>
                            </div>
                          </div>
                        </div>

                        {isEditingQuiz ? (
                          <div className="space-y-3">
                            <p className="text-slate-400 text-xs font-mono">
                              ✍️ Edit Student Quiz markdown. Changes will update your document instantly and keep your undo/redo history.
                            </p>
                            <textarea
                              value={generatedQuiz}
                              onChange={(e) => updateQuizWithHistory(e.target.value)}
                              rows={24}
                              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 p-4 rounded-xl text-white font-mono text-xs leading-relaxed"
                            />
                          </div>
                        ) : (
                          /* Interactive quiz content blocks */
                          <div className="prose prose-invert text-xs space-y-4">
                            {generatedQuiz ? (
                              generatedQuiz.split('\n\n').map((block, idx) => {
                                if (block.startsWith('# ')) return null; // Skip redundant top title
                                if (block.startsWith('## ')) {
                                  return <h3 key={idx} className="text-lg font-bold text-amber-500 mt-5 border-b border-slate-800 pb-1">{block.replace('## ', '')}</h3>;
                                }
                                if (block.startsWith('### ')) {
                                  return <h4 key={idx} className="text-xs uppercase font-extrabold tracking-wider text-slate-200 mt-4 bg-slate-950/55 p-2 rounded border border-slate-800">{block.replace('### ', '')}</h4>;
                                }
                                if (block.toLowerCase().includes('answer key') || block.toLowerCase().includes('answers:')) {
                                  if (!showAnswerKey) return null; // Hide answers key if toggled off
                                  return (
                                    <div key={idx} className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mt-6">
                                      <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono block mb-2">Teacher Assessment Reference Key:</span>
                                      <p className="text-slate-300 font-semibold whitespace-pre-wrap">{block}</p>
                                    </div>
                                  );
                                }
                                return renderTextBlock(block, idx);
                              })
                            ) : (
                              <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center gap-4">
                                <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-slate-300">Generate CBA Assessment Quiz</p>
                                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                    Assess student competencies automatically using questions aligned with Cameroon secondary school curriculum guidelines.
                                  </p>
                                </div>
                                <button
                                  onClick={handleGenerateQuiz}
                                  disabled={isGeneratingQuiz || !generatedContent}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md animate-bounce"
                                >
                                  {isGeneratingQuiz ? 'Generating...' : 'Generate Assessment Now'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                      </div>

                    </div>
                  )}

                  {/* TAB 4: Database Metadata Spec */}
                  {activeSubTab === 'metadata' && (
                    <div className="space-y-6 md:p-2 animate-in fade-in duration-300">
                      
                      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-850 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                            <Layers className="w-5 h-5 text-amber-500" />
                            Active JSON Metadata Schema
                          </h3>
                          <button
                            onClick={() => handleCopyClipboard(JSON.stringify(generatedMetadata, null, 2))}
                            className="p-1.5 bg-slate-950 border border-slate-800 rounded text-slate-400 hover:text-white text-xs font-mono"
                          >
                            Copy Schema
                          </button>
                        </div>
                        
                        <p className="text-xs text-slate-400">
                          These parameters match exactly the structured schema for storage and indexing in the PostgreSQL database.
                        </p>

                        <div className="bg-slate-950 p-4 rounded-xl font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-[300px]">
                          <pre>{JSON.stringify(generatedMetadata, null, 2)}</pre>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 3.6: Media Cloud & Interactive Illustrations */}
                  {activeSubTab === 'media' && (
                    <div className="space-y-6 md:p-2 animate-in fade-in duration-300">
                      
                      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 space-y-6">
                        <div>
                          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                            <Upload className="w-5 h-5 text-amber-500" />
                            MINESEC Media Cloud Integration
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">
                            Upload site photos, building blueprints, machinery drawings, or instructional video clips. Embed them directly to illustrate specific sections in your lessons, lecture scripts, or student quizzes.
                          </p>
                        </div>

                        {/* Drag and Drop Zone */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverActive(true);
                          }}
                          onDragLeave={() => setDragOverActive(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverActive(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleMediaUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                            dragOverActive 
                              ? 'border-amber-500 bg-amber-500/10' 
                              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                          }`}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*,video/*,audio/*';
                            input.onchange = (e: any) => {
                              if (e.target.files && e.target.files[0]) {
                                handleMediaUpload(e.target.files[0]);
                              }
                            };
                            input.click();
                          }}
                        >
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-amber-500 border border-slate-800 shadow-inner">
                              <Upload className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-300">
                                {isUploadingMedia ? 'Uploading in progress...' : 'Drag & Drop files here, or click to browse'}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Supports images (PNG, JPG, SVG), video clips (MP4, WebM), and audio demonstrations
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Uploading Status */}
                        {isUploadingMedia && (
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-amber-500 font-bold flex items-center gap-1.5 animate-pulse">
                                <Sparkles className="w-3.5 h-3.5" />
                                Processing Cloud Upload...
                              </span>
                              <span className="text-slate-400 font-mono text-[10px]">{mediaUploadProgress}</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full animate-pulse" style={{ width: '100%' }} />
                            </div>
                          </div>
                        )}

                        {/* Uploaded Files Gallery */}
                        <div className="space-y-4">
                          <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center justify-between border-b border-slate-850 pb-2">
                            <span>Uploaded Media Gallery ({uploadedMediaFiles.length})</span>
                            {uploadedMediaFiles.length > 0 && (
                              <button 
                                onClick={() => {
                                  if (window.confirm('Clear all media files from local gallery cache?')) {
                                    setUploadedMediaFiles([]);
                                    showToast('Gallery cache cleared.', 'info');
                                  }
                                }}
                                className="text-[10px] text-red-400 hover:text-red-300 font-mono normal-case"
                              >
                                Clear Cache
                              </button>
                            )}
                          </h3>

                          {uploadedMediaFiles.length === 0 ? (
                            <div className="text-center py-12 bg-slate-950/20 rounded-xl border border-dashed border-slate-850 text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
                              <Image className="w-8 h-8 text-slate-600" />
                              <p>No media files uploaded yet</p>
                              <p className="text-[11px] text-slate-600 max-w-xs">
                                Uploaded items are securely stored on Cloudinary and will appear here for fast embedding into your course materials.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {uploadedMediaFiles.map((file) => {
                                const isImage = file.type?.startsWith('image/');
                                const isVideo = file.type?.startsWith('video/');
                                return (
                                  <div key={file.id} className="bg-slate-950/80 rounded-xl border border-slate-850 p-4 flex flex-col gap-4 hover:border-slate-700 transition-all">
                                    <div className="flex gap-3">
                                      {/* Preview Container */}
                                      <div className="w-20 h-20 rounded-lg bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-800 shrink-0 relative">
                                        {isImage ? (
                                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : isVideo ? (
                                          <video src={file.url} className="w-full h-full object-cover" />
                                        ) : (
                                          <Link className="w-6 h-6 text-slate-500" />
                                        )}
                                        <span className="absolute bottom-1 right-1 text-[8px] bg-slate-950/80 px-1 rounded text-slate-400 font-mono">
                                          {isImage ? 'IMG' : isVideo ? 'VID' : 'FILE'}
                                        </span>
                                      </div>

                                      {/* File Info */}
                                      <div className="flex-1 min-w-0 space-y-1">
                                        <p className="text-xs font-bold text-white truncate" title={file.name}>
                                          {file.name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-mono">
                                          {(file.size / (1024 * 1024)).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                                        </p>
                                        <div className="flex items-center gap-2 pt-1">
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(file.url);
                                              showToast('Direct link copied!', 'success');
                                            }}
                                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[9px] text-slate-300 font-bold uppercase transition-colors"
                                          >
                                            Copy Link
                                          </button>
                                          <button
                                            onClick={() => {
                                              const code = isImage ? `![${file.name}](${file.url})` : `<video src="${file.url}" controls className="w-full max-w-2xl rounded-xl my-4 mx-auto border border-slate-800 shadow-xl" />`;
                                              navigator.clipboard.writeText(code);
                                              showToast('Embed code copied!', 'success');
                                            }}
                                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[9px] text-slate-300 font-bold uppercase transition-colors"
                                          >
                                            Copy Embed
                                          </button>
                                          <button
                                            onClick={() => handleDeleteMedia(file.id)}
                                            className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors ml-auto"
                                            title="Delete media"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Embed Destination Actions */}
                                    <div className="border-t border-slate-900 pt-3">
                                      <span className="text-[9px] font-mono font-bold tracking-wider text-slate-500 uppercase block mb-2">
                                        🚀 Quick Embed Destination:
                                      </span>
                                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <button
                                          onClick={() => handleEmbedMedia('plan', file.url, file.type, file.name)}
                                          disabled={!generatedContent}
                                          className="py-1 px-2 bg-slate-900 hover:bg-slate-850 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-center truncate font-medium transition-all"
                                        >
                                          + Lesson Plan
                                        </button>
                                        <button
                                          onClick={() => handleEmbedMedia('lecture', file.url, file.type, file.name)}
                                          disabled={!generatedLecture}
                                          className="py-1 px-2 bg-slate-900 hover:bg-slate-850 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-center truncate font-medium transition-all"
                                        >
                                          + Lecture Script
                                        </button>
                                        <button
                                          onClick={() => handleEmbedMedia('worksheet', file.url, file.type, file.name)}
                                          disabled={!generatedWorksheet}
                                          className="py-1 px-2 bg-slate-900 hover:bg-slate-850 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-center truncate font-medium transition-all"
                                        >
                                          + Student Worksheet
                                        </button>
                                        <button
                                          onClick={() => handleEmbedMedia('quiz', file.url, file.type, file.name)}
                                          disabled={!generatedQuiz}
                                          className="py-1 px-2 bg-slate-900 hover:bg-slate-850 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-center truncate font-medium transition-all"
                                        >
                                          + Assessment Quiz
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                      </div>

                    </div>
                  )}

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* EXCLUSIVELY FOR PRINT: Staged multi-page document */}
      <div className="print-only-container hidden print:block">
        
        {/* Page 1: CBA Lesson Plan */}
        <div className="print-page">
          <MinesecPrintHeader title="COMPETENCY-BASED APPROACH (CBA) LESSON PLAN" code="MINESEC-LP" />
          
          <div className="grid grid-cols-2 gap-4 border border-black p-3 mb-4 text-[9pt]">
            <div><strong>School/Institution:</strong> Government Technical High School (GTHS)</div>
            <div><strong>Teacher Name:</strong> {formData.teacherName || 'Senior Specialist'}</div>
            <div><strong>Subject Specialty:</strong> {formData.subject}</div>
            <div><strong>Target Class / Grade:</strong> {formData.gradeLevel}</div>
            <div><strong>Academic Year / Term:</strong> {formData.academicYear} | {formData.term}</div>
            <div><strong>Sequence / Week:</strong> {formData.sequence} | {formData.week}</div>
            <div><strong>Lesson Duration:</strong> {formData.duration}</div>
            <div><strong>Specialty Department:</strong> {formData.department || 'Civil Engineering'}</div>
          </div>

          <div className="border border-black p-3 mb-4 text-[9pt] bg-slate-50">
            <div><strong>Core Competency Statement:</strong> {formData.competency}</div>
            <div className="mt-1"><strong>Expected Learning Outcomes:</strong> {formData.learningOutcomes}</div>
          </div>

          <div className="flex-1">
            {renderMarkdownForPrint(generatedContent)}
          </div>

          <div className="print-footer">
            <span>Generated via Lesson Prep Studio (MINESEC CBA Standard)</span>
            <span>Page 1 of 3</span>
          </div>
        </div>

        {/* Page 2: Ready-to-Teach Lecture */}
        {generatedLecture && (
          <div className="print-page">
            <MinesecPrintHeader title="READY-TO-TEACH LECTURE SCRIPT" code="MINESEC-LCT" />
            
            <div className="grid grid-cols-2 gap-4 border border-black p-3 mb-4 text-[9pt]">
              <div><strong>Course Topic:</strong> {formData.topic}</div>
              <div><strong>Specialty:</strong> {formData.subject}</div>
              <div><strong>Grade Level:</strong> {formData.gradeLevel}</div>
              <div><strong>Timing / Pacing:</strong> 90 Minute Delivery</div>
            </div>

            <div className="flex-1">
              {renderMarkdownForPrint(generatedLecture)}
            </div>

            <div className="print-footer">
              <span>Prepared for Classroom Delivery (CBA Methodology)</span>
              <span>Page 2 of 3</span>
            </div>
          </div>
        )}

        {/* Page 3: Topic Assessment & Quiz */}
        {generatedQuiz && (
          <div className="print-page">
            <MinesecPrintHeader title="COMPETENCY-BASED ASSESSMENT & QUIZ" code="MINESEC-EVAL" />
            
            <StudentAssessmentMeta 
              subject={formData.subject} 
              topic={formData.topic} 
              gradeLevel={formData.gradeLevel} 
            />

            <div className="border border-black p-3 mb-4 bg-slate-50 text-[8.5pt]">
              <div className="font-bold uppercase text-center mb-1">CBA MARKS ALLOCATION & COMPLIANCE MATRIX</div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left py-0.5">Section</th>
                    <th className="text-left py-0.5">Evaluation Criteria</th>
                    <th className="text-right py-0.5">Max Marks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black/30">
                    <td className="py-0.5">Section A: MCQs</td>
                    <td className="py-0.5">Conceptual Knowledge and Recall of Safety Codes</td>
                    <td className="text-right py-0.5">5 Marks</td>
                  </tr>
                  <tr className="border-b border-black/30">
                    <td className="py-0.5">Section B: Short-Answer</td>
                    <td className="py-0.5">Technical Explanations & Structural Calculations</td>
                    <td className="text-right py-0.5">6 Marks</td>
                  </tr>
                  <tr>
                    <td className="py-0.5">Section C: Case Study</td>
                    <td className="py-0.5">Practical Problem Solving, Materials Estimation & Safety Planning</td>
                    <td className="text-right py-0.5">9 Marks</td>
                  </tr>
                  <tr className="border-t border-black font-bold">
                    <td className="py-0.5">TOTAL SCORE</td>
                    <td className="py-0.5">CBA COMPLIANCE EVALUATION</td>
                    <td className="text-right py-0.5">20 / 20 Marks</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex-1">
              {renderMarkdownForPrint(generatedQuiz)}
            </div>

            <div className="print-footer">
              <span>Official MINESEC CBA Assessment Document</span>
              <span>Page 3 of 3</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
