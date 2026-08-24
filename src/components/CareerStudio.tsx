import React, { useState, useEffect } from 'react';
import { fetchUserSyncData, saveUserSyncData } from '../lib/syncService.ts';
import PrintPreviewModal from './PrintPreviewModal.tsx';
import { jsPDF } from 'jspdf';
import { 
  FileText, 
  Download, 
  Trash2, 
  Edit, 
  Copy, 
  Plus, 
  Eye, 
  Briefcase, 
  BookOpen, 
  Mail, 
  Phone, 
  MapPin, 
  User as UserIcon, 
  Award, 
  ChevronRight, 
  ChevronLeft,
  Printer,
  FileSignature,
  Layers,
  Sparkles
} from 'lucide-react';

interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  dateRange: string;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  school: string;
  location: string;
  dateRange: string;
  details: string;
}

interface CVData {
  id: string;
  title: string;
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  niu?: string;
  summary: string;
  experiences: Experience[];
  educations: Education[];
  skills: string[];
  languages: string[];
  certifications: string[];
  profilePhoto?: string;
  templateId?: 'modern-sidebar' | 'classic-executive' | 'creative-gold';
  accentColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
}

interface LetterData {
  id: string;
  title: string;
  senderName: string;
  senderTitle: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  senderNiu?: string;
  recipientName: string;
  recipientTitle: string;
  recipientCompany: string;
  recipientAddress: string;
  date: string;
  subject: string;
  salutation: string;
  bodyParagraphs: string[];
  signoff: string;
}

interface CareerStudioProps {
  mode: 'cv' | 'letter';
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function CareerStudio({ mode, showToast }: CareerStudioProps) {
  const [cvs, setCvs] = useState<CVData[]>([]);
  const [letters, setLetters] = useState<LetterData[]>([]);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Form states for CV
  const [cvForm, setCvForm] = useState<Partial<CVData>>({});
  // Form states for Letter
  const [letterForm, setLetterForm] = useState<Partial<LetterData>>({});

  // Print preview modal state
  const [showPrintModal, setShowPrintModal] = useState(false);

  // AI Letter Generator states
  const [letterCategory, setLetterCategory] = useState<'application' | 'teaching-jobs'>('application');
  const [letterSubtype, setLetterSubtype] = useState<string>('general-employment');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Standard Presets
  const CV_PRESETS: CVData[] = [
    {
      id: 'cv-preset-1',
      title: 'Civil Engineer Resume',
      fullName: 'Jean-Pierre Kamga',
      professionalTitle: 'Senior Civil Engineer & Project Director',
      email: 'jp.kamga@madecc.com',
      phone: '+237 677 890 123',
      address: 'Yaoundé Mbankolo, Cameroon',
      website: 'www.madecc.com',
      niu: 'M12090001423X',
      summary: 'Dynamic and results-driven Senior Civil Engineer with over 12 years of hands-on experience in public infrastructure, geotechnical engineering, and eco-friendly urban construction. Proven expertise in directing multi-million dollar architectural tenders, supervising site operations in Central Africa, and ensuring strict structural compliance.',
      experiences: [
        {
          id: 'exp-1',
          role: 'Lead Project Director',
          company: 'MADECC Group SARL',
          location: 'Douala, Cameroon',
          dateRange: '2021 - Present',
          description: 'Direct construction bids, environmental impact assessments, and resource dispatch for green-certified structural tenders across Littoral and Center regions. Manage a multidisciplinary team of 24 structural engineers and draftsmen.'
        },
        {
          id: 'exp-2',
          role: 'Senior Structural Engineer',
          company: 'Central Africa Construction Corp',
          location: 'Yaounde, Cameroon',
          dateRange: '2016 - 2021',
          description: 'Engineered structural integrity matrices for municipal bridge expansions and high-density office highrises. Reduced structural steel costs by 15% through advanced load-balancing computations.'
        }
      ],
      educations: [
        {
          id: 'edu-1',
          degree: 'M.Sc. in Civil & Structural Engineering',
          school: 'Ecole Nationale Superieure Polytechnique (ENSPY)',
          location: 'Yaounde, Cameroon',
          dateRange: '2011 - 2013',
          details: 'Graduated first in cohort. Specialized in high-performance reinforced concrete and seismic design.'
        },
        {
          id: 'edu-2',
          degree: 'B.Sc. in Physics & Building Sciences',
          school: 'University of Douala',
          location: 'Douala, Cameroon',
          dateRange: '2008 - 2011',
          details: 'Core focus on thermodynamics, geology, and fluid mechanics.'
        }
      ],
      skills: ['Autodesk Civil 3D', 'Revit Structure', 'Etabs & SAP2000', 'Project Management', 'Structural Load Calculations', 'Tender Bid Preparation', 'Geotechnical Testing'],
      languages: ['French (Native)', 'English (Fluent)', 'Ewondo (Conversational)'],
      certifications: ['Certified Project Management Professional (PMP)', 'Registered Professional Engineer - ONIGC Cameroon (Reg: 4122)'],
      templateId: 'modern-sidebar',
      accentColor: '#1e40af',
      fontSize: 'medium'
    },
    {
      id: 'cv-preset-2',
      title: 'High School Teacher Resume',
      fullName: 'Grace Ngo Nyemb',
      professionalTitle: 'Lead Mathematics & Physics Educator',
      email: 'grace.nyemb@gmail.com',
      phone: '+237 699 123 456',
      address: 'Bastos, Yaounde, Cameroon',
      summary: 'Dedicated and passionate Lead Secondary Educator with 8+ years of classroom experience teaching Advanced Level Mathematics and Physics. Expert in implementing innovative curriculum structures, facilitating bilingual STEM workshops, and preparing students for excellent GCE A-Level and Baccalaureat results.',
      experiences: [
        {
          id: 'exp-1-2',
          role: 'Head of Mathematics Department',
          company: 'Bilingual College of Central Africa',
          location: 'Yaounde, Cameroon',
          dateRange: '2019 - Present',
          description: 'Supervise math curriculum design, organize region-wide STEM olympiads, and mentor junior faculty. Achieved 94% pass rate in national GCE Advanced Level examinations.'
        },
        {
          id: 'exp-2-2',
          role: 'Mathematics & Physics Teacher',
          company: 'Government Bilingual High School (Lycée)',
          location: 'Limbe, Cameroon',
          dateRange: '2015 - 2019',
          description: 'Delivered lectures on calculus, classical mechanics, and electromagnetism. Pioneered a weekly bilingual math-coaching circle for underrepresented high school girls.'
        }
      ],
      educations: [
        {
          id: 'edu-1-2',
          degree: 'DIPES II (Postgraduate Teacher Diploma)',
          school: 'Ecole Normale Superieure (ENS) de Yaounde',
          location: 'Yaounde, Cameroon',
          dateRange: '2013 - 2015',
          details: 'Professional teaching qualification for secondary education.'
        },
        {
          id: 'edu-2-2',
          degree: 'B.Sc. in Pure Mathematics',
          school: 'University of Buea',
          location: 'Buea, Cameroon',
          dateRange: '2010 - 2013',
          details: 'Specialization in Abstract Algebra and Real Analysis.'
        }
      ],
      skills: ['Pedagogical Curriculum Design', 'Classroom Management', 'Bilingual Instruction', 'STEM Student Mentorship', 'Differentiated Learning', 'Interactive Physics Lab Setup'],
      languages: ['English (Fluent)', 'French (Fluent)', 'Basaa (Native)'],
      certifications: ['National Secondary Education License', 'STEM Educator Excellence Certification (UNESCO)'],
      templateId: 'creative-gold',
      accentColor: '#d97706',
      fontSize: 'medium'
    }
  ];

  const LETTER_PRESETS: LetterData[] = [
    {
      id: 'let-preset-1',
      title: 'Teaching Application Letter',
      senderName: 'Grace Ngo Nyemb',
      senderTitle: 'Lead Mathematics Educator',
      senderEmail: 'grace.nyemb@gmail.com',
      senderPhone: '+237 699 123 456',
      senderAddress: 'Bastos, Yaounde, Cameroon',
      senderNiu: 'M08140003924T',
      recipientName: 'The Principal / Director of Academics',
      recipientTitle: 'Director',
      recipientCompany: 'Government Bilingual High School',
      recipientAddress: 'Molyko, Buea, SWR, Cameroon',
      date: new Date().toLocaleDateString('en-GB'),
      subject: 'APPLICATION FOR THE POST OF SENIOR MATHEMATICS & PHYSICS TEACHER',
      salutation: 'Dear Sir/Madam,',
      bodyParagraphs: [
        'I am writing to express my strong interest in the Senior Mathematics and Physics teaching vacancy at your esteemed institution. Having followed your school’s remarkable academic achievements and commitment to STEM education in Cameroon, I am eager to contribute my pedagogical expertise and passion for educational excellence to your faculty.',
        'With over eight years of teaching experience, including serving as the Head of Mathematics at the Bilingual College of Central Africa, I have successfully designed student-centered curriculum frameworks that make complex concepts in calculus, trigonometry, and Newtonian mechanics highly accessible. In my previous role, I guided my classes to a record-breaking 94% pass rate in the GCE Advanced Level Examinations.',
        'Beyond teaching, I am highly committed to fostering a supportive, inclusive learning environment. I have successfully organized region-wide STEM forums, pioneered bilingual mathematics clubs, and mentored junior educators in implementing digital math modeling software in the classroom.',
        'Thank you for your time and consideration of my application. I look forward to the opportunity to discuss how my qualifications align with the academic aspirations of your institution.'
      ],
      signoff: 'Yours faithfully,'
    },
    {
      id: 'let-preset-2',
      title: 'Job Application Letter (Civil)',
      senderName: 'Jean-Pierre Kamga',
      senderTitle: 'Senior Civil Engineer',
      senderEmail: 'jp.kamga@madecc.com',
      senderPhone: '+237 677 890 123',
      senderAddress: 'Yaoundé Mbankolo, Cameroon',
      senderNiu: 'M12090001423X',
      recipientName: 'The Managing Director',
      recipientTitle: 'Human Resources & Engineering Board',
      recipientCompany: 'MADECC Group SARL',
      recipientAddress: 'Yaoundé Mbankolo, Cameroon',
      date: new Date().toLocaleDateString('en-GB'),
      subject: 'APPLICATION FOR THE POSITION OF SENIOR PROJECTS INFRASTRUCTURE DIRECTOR',
      salutation: 'Dear Board of Directors,',
      bodyParagraphs: [
        'It is with great enthusiasm that I submit my application for the position of Senior Projects Infrastructure Director at MADECC Group SARL. As a registered Professional Civil Engineer in Cameroon with 12 years of specialized infrastructure experience, I have long admired MADECC’s industry-leading sustainable civil engineering designs and municipal development projects.',
        'Throughout my career, I have successfully directed structural bids, geotechnical testing, and concrete reinforcement operations for complex public works. My technical supervision on the Yaounde Municipal Bridge expansion and Littoral high-rise developments ensured 100% safety compliance, while advanced load computations helped reduce raw materials cost overheads by 15% without sacrificing design durability.',
        'I possess extensive knowledge in engineering software suites including Autodesk Civil 3D, Revit, and SAP2000, alongside comprehensive experience navigating local building codes and ONIGC compliance frameworks. My leadership style centers on active site supervision, seamless materials logistics coordination, and clear stakeholder communications.',
        'I would welcome the opportunity to discuss how my project management background and technical background can add value to MADECC Group’s upcoming civil portfolios. Thank you for your review and consideration.'
      ],
      signoff: 'Yours sincerely,'
    }
  ];

  // Initialize data from Neon DB / sync data
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      const syncData = await fetchUserSyncData();
      if (!active) return;
      
      const dbCvs = syncData['madecc_career_cvs'];
      if (dbCvs) {
        setCvs(dbCvs);
      } else {
        setCvs(CV_PRESETS);
      }

      const dbLetters = syncData['madecc_career_letters'];
      if (dbLetters) {
        setLetters(dbLetters);
      } else {
        setLetters(LETTER_PRESETS);
      }
    };
    
    loadData();
    return () => {
      active = false;
    };
  }, []);

  // Save updates to Neon Database / local cache
  const saveCvsToStorage = (updated: CVData[]) => {
    setCvs(updated);
    saveUserSyncData('madecc_career_cvs', updated);
  };

  const saveLettersToStorage = (updated: LetterData[]) => {
    setLetters(updated);
    saveUserSyncData('madecc_career_letters', updated);
  };

  const activeCV = cvs.find(c => c.id === activeId);
  const activeLetter = letters.find(l => l.id === activeId);

  // General operations
  const handleSelect = (id: string) => {
    setActiveId(id);
    setIsEditing(false);
    setIsPreviewing(true);
    
    if (mode === 'cv') {
      const current = cvs.find(c => c.id === id);
      if (current) setCvForm({ ...current });
    } else {
      const current = letters.find(l => l.id === id);
      if (current) setLetterForm({ ...current });
    }
  };

  const handleCreateNew = () => {
    const newId = `item-${Date.now()}`;
    setActiveId(newId);
    setIsEditing(true);
    setIsPreviewing(false);

    if (mode === 'cv') {
      const emptyCv: CVData = {
        id: newId,
        title: 'New Custom CV',
        fullName: '',
        professionalTitle: '',
        email: '',
        phone: '',
        address: '',
        summary: '',
        experiences: [],
        educations: [],
        skills: [],
        languages: [],
        certifications: [],
        templateId: 'modern-sidebar',
        accentColor: '#1e40af',
        fontSize: 'medium'
      };
      setCvForm(emptyCv);
    } else {
      const emptyLetter: LetterData = {
        id: newId,
        title: 'New Custom Letter',
        senderName: '',
        senderTitle: '',
        senderEmail: '',
        senderPhone: '',
        senderAddress: '',
        recipientName: '',
        recipientTitle: '',
        recipientCompany: '',
        recipientAddress: '',
        date: new Date().toLocaleDateString('en-GB'),
        subject: '',
        salutation: 'Dear Sir/Madam,',
        bodyParagraphs: [''],
        signoff: 'Yours faithfully,'
      };
      setLetterForm(emptyLetter);
    }
  };

  const handleSave = () => {
    if (mode === 'cv') {
      if (!cvForm.fullName || !cvForm.title) {
        showToast('Please specify a title and full name for the CV.', 'warning');
        return;
      }
      
      const existingIdx = cvs.findIndex(c => c.id === activeId);
      let updatedCvs = [...cvs];
      
      if (existingIdx > -1) {
        updatedCvs[existingIdx] = cvForm as CVData;
      } else {
        updatedCvs.push(cvForm as CVData);
      }
      
      saveCvsToStorage(updatedCvs);
      showToast('CV saved successfully to your administration profile!', 'success');
    } else {
      if (!letterForm.senderName || !letterForm.title) {
        showToast('Please specify a title and sender name for the application letter.', 'warning');
        return;
      }

      const existingIdx = letters.findIndex(l => l.id === activeId);
      let updatedLetters = [...letters];

      if (existingIdx > -1) {
        updatedLetters[existingIdx] = letterForm as LetterData;
      } else {
        updatedLetters.push(letterForm as LetterData);
      }

      saveLettersToStorage(updatedLetters);
      showToast('Application Letter saved successfully to your administration profile!', 'success');
    }
    setIsEditing(false);
    setIsPreviewing(true);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `item-dup-${Date.now()}`;
    
    if (mode === 'cv') {
      const source = cvs.find(c => c.id === id);
      if (!source) return;
      const duplicated: CVData = {
        ...source,
        id: newId,
        title: `${source.title} (Copy)`,
      };
      const updated = [...cvs, duplicated];
      saveCvsToStorage(updated);
      showToast(`Duplicated CV: ${source.title}`, 'success');
    } else {
      const source = letters.find(l => l.id === id);
      if (!source) return;
      const duplicated: LetterData = {
        ...source,
        id: newId,
        title: `${source.title} (Copy)`,
      };
      const updated = [...letters, duplicated];
      saveLettersToStorage(updated);
      showToast(`Duplicated Letter: ${source.title}`, 'success');
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document from your records?')) return;

    if (mode === 'cv') {
      const updated = cvs.filter(c => c.id !== id);
      saveCvsToStorage(updated);
      showToast('CV removed successfully.', 'success');
    } else {
      const updated = letters.filter(l => l.id !== id);
      saveLettersToStorage(updated);
      showToast('Application letter removed successfully.', 'success');
    }

    if (activeId === id) {
      setActiveId(null);
      setIsEditing(false);
      setIsPreviewing(false);
    }
  };

  // List Item Form Adders
  const addExperience = () => {
    const updatedExps = [...(cvForm.experiences || [])];
    updatedExps.push({
      id: `exp-${Date.now()}`,
      role: '',
      company: '',
      location: '',
      dateRange: '',
      description: ''
    });
    setCvForm({ ...cvForm, experiences: updatedExps });
  };

  const removeExperience = (expId: string) => {
    const updatedExps = (cvForm.experiences || []).filter(e => e.id !== expId);
    setCvForm({ ...cvForm, experiences: updatedExps });
  };

  const addEducation = () => {
    const updatedEdus = [...(cvForm.educations || [])];
    updatedEdus.push({
      id: `edu-${Date.now()}`,
      degree: '',
      school: '',
      location: '',
      dateRange: '',
      details: ''
    });
    setCvForm({ ...cvForm, educations: updatedEdus });
  };

  const removeEducation = (eduId: string) => {
    const updatedEdus = (cvForm.educations || []).filter(e => e.id !== eduId);
    setCvForm({ ...cvForm, educations: updatedEdus });
  };

  const addSkill = (val: string) => {
    if (!val.trim()) return;
    const skills = [...(cvForm.skills || [])];
    if (!skills.includes(val.trim())) {
      skills.push(val.trim());
      setCvForm({ ...cvForm, skills });
    }
  };

  const removeSkill = (index: number) => {
    const skills = (cvForm.skills || []).filter((_, idx) => idx !== index);
    setCvForm({ ...cvForm, skills });
  };

  const addCert = (val: string) => {
    if (!val.trim()) return;
    const certifications = [...(cvForm.certifications || [])];
    if (!certifications.includes(val.trim())) {
      certifications.push(val.trim());
      setCvForm({ ...cvForm, certifications });
    }
  };

  const removeCert = (index: number) => {
    const certifications = (cvForm.certifications || []).filter((_, idx) => idx !== index);
    setCvForm({ ...cvForm, certifications });
  };

  const addLanguage = (val: string) => {
    if (!val.trim()) return;
    const languages = [...(cvForm.languages || [])];
    if (!languages.includes(val.trim())) {
      languages.push(val.trim());
      setCvForm({ ...cvForm, languages });
    }
  };

  const removeLanguage = (index: number) => {
    const languages = (cvForm.languages || []).filter((_, idx) => idx !== index);
    setCvForm({ ...cvForm, languages });
  };

  // Letter paragraph handlers
  const addParagraph = () => {
    const paras = [...(letterForm.bodyParagraphs || [])];
    paras.push('');
    setLetterForm({ ...letterForm, bodyParagraphs: paras });
  };

  const updateParagraph = (index: number, val: string) => {
    const paras = [...(letterForm.bodyParagraphs || [])];
    paras[index] = val;
    setLetterForm({ ...letterForm, bodyParagraphs: paras });
  };

  const removeParagraph = (index: number) => {
    const paras = (letterForm.bodyParagraphs || []).filter((_, idx) => idx !== index);
    setLetterForm({ ...letterForm, bodyParagraphs: paras });
  };

  const handleGenerateLetter = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/career/generate-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          letterType: letterCategory,
          subType: letterSubtype,
          senderName: letterForm.senderName || '',
          senderTitle: letterForm.senderTitle || '',
          senderEmail: letterForm.senderEmail || '',
          senderPhone: letterForm.senderPhone || '',
          senderAddress: letterForm.senderAddress || '',
          recipientName: letterForm.recipientName || '',
          recipientTitle: letterForm.recipientTitle || '',
          recipientCompany: letterForm.recipientCompany || '',
          recipientAddress: letterForm.recipientAddress || '',
          customPrompt: customInstruction
        })
      });

      if (!response.ok) {
        throw new Error('Letter generation request failed.');
      }

      const data = await response.json();
      
      setLetterForm(prev => ({
        ...prev,
        subject: data.subject,
        salutation: data.salutation,
        bodyParagraphs: data.bodyParagraphs,
        signoff: data.signoff,
        title: letterForm.title && letterForm.title !== 'New Custom Letter' ? letterForm.title : `${letterSubtype.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Letter`
      }));

      showToast('Professional cover letter generated successfully! Review the drafted fields below.', 'success');
    } catch (err: any) {
      console.error('[GENERATE_LETTER_ERROR]', err);
      showToast('Failed to generate professional letter. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Standard PDF Download Logic - Pristine Vector Quality A4 Layout
  const downloadAsPDF = () => {
    if (mode === 'cv') {
      const data = activeCV;
      if (!data) return;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Default Template variables
      const template = data.templateId || 'modern-sidebar';
      const accentHex = data.accentColor || '#1e40af';
      
      // Parse hex to rgb
      const hexToRgb = (hex: string) => {
        const clean = hex.replace('#', '');
        const num = parseInt(clean, 16);
        return {
          r: (num >> 16) & 255,
          g: (num >> 8) & 255,
          b: num & 255
        };
      };

      const accent = hexToRgb(accentHex);
      const primaryDark = { r: 15, g: 23, b: 42 }; // Slate 900
      const textGray = { r: 71, g: 85, b: 105 }; // Slate 600
      const textLight = { r: 148, g: 163, b: 184 }; // Slate 400

      // Helper to draw initials placeholder
      const drawInitialsPDF = (x: number, y: number, size: number) => {
        const initials = data.fullName 
          ? data.fullName.split(' ').filter(n => n.trim()).map(n => n[0]).slice(0, 2).join('').toUpperCase() 
          : 'CV';
        doc.setFillColor(accent.r, accent.g, accent.b);
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1);
        doc.rect(x, y, size, size, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(size > 25 ? 14 : 10);
        doc.setTextColor(255, 255, 255);
        doc.text(initials, x + (size / 2), y + (size / 2) + 3, { align: 'center' });
      };

      // Helper to draw photo if exists
      const drawPhotoPDF = (x: number, y: number, size: number) => {
        if (data.profilePhoto) {
          try {
            // Draw luxury accent border
            doc.setDrawColor(accent.r, accent.g, accent.b);
            doc.setLineWidth(0.8);
            doc.rect(x - 1, y - 1, size + 2, size + 2, 'D');
            doc.addImage(data.profilePhoto, 'JPEG', x, y, size, size);
          } catch (err) {
            console.error("Failed to add image to PDF", err);
            drawInitialsPDF(x, y, size);
          }
        } else {
          drawInitialsPDF(x, y, size);
        }
      };

      // -----------------------------------------------------
      // 1. MODERN SIDEBAR TEMPLATE (Canva Style)
      // -----------------------------------------------------
      if (template === 'modern-sidebar') {
        // Draw Left Sidebar Background (Deep Charcoal Slate)
        doc.setFillColor(24, 32, 49); // Luxury Dark Navy
        doc.rect(0, 0, 72, 297, 'F');

        // Draw Left Sidebar Accent Bar
        doc.setFillColor(accent.r, accent.g, accent.b);
        doc.rect(0, 0, 4, 297, 'F');

        // Draw Profile Photo in Sidebar
        drawPhotoPDF(18, 16, 36);

        // Sidebar Text Content (Aligned Left, X start at 10mm, max width 52mm)
        let sidebarY = 62;

        // Contact Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(accent.r, accent.g, accent.b);
        doc.text('CONTACT DETAILS', 10, sidebarY);
        sidebarY += 3;
        doc.setDrawColor(accent.r, accent.g, accent.b);
        doc.setLineWidth(0.3);
        doc.line(10, sidebarY, 62, sidebarY);
        sidebarY += 5;

        // Contact List
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(230, 235, 245);

        const emailText = doc.splitTextToSize(`Email: ${data.email}`, 52);
        doc.text(emailText, 10, sidebarY);
        sidebarY += (emailText.length * 3.8) + 1.5;

        const phoneText = doc.splitTextToSize(`Phone: ${data.phone}`, 52);
        doc.text(phoneText, 10, sidebarY);
        sidebarY += (phoneText.length * 3.8) + 1.5;

        const addressText = doc.splitTextToSize(`Addr: ${data.address}`, 52);
        doc.text(addressText, 10, sidebarY);
        sidebarY += (addressText.length * 3.8) + 1.5;

        if (data.website) {
          const webText = doc.splitTextToSize(`Web: ${data.website}`, 52);
          doc.text(webText, 10, sidebarY);
          sidebarY += (webText.length * 3.8) + 1.5;
        }

        if (data.niu) {
          doc.text(`Tax ID: ${data.niu}`, 10, sidebarY);
          sidebarY += 5.5;
        }

        sidebarY += 3;

        // Skills Section in Sidebar
        if (data.skills && data.skills.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(accent.r, accent.g, accent.b);
          doc.text('COMPETENCIES', 10, sidebarY);
          sidebarY += 3;
          doc.line(10, sidebarY, 62, sidebarY);
          sidebarY += 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(215, 225, 235);
          
          data.skills.forEach(skill => {
            if (sidebarY < 235) {
              doc.text(`• ${skill}`, 12, sidebarY);
              sidebarY += 4.5;
            }
          });
          sidebarY += 3;
        }

        // Languages Section
        if (data.languages && data.languages.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(accent.r, accent.g, accent.b);
          doc.text('LANGUAGES', 10, sidebarY);
          sidebarY += 3;
          doc.line(10, sidebarY, 62, sidebarY);
          sidebarY += 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(215, 225, 235);
          doc.text(data.languages.join('  |  '), 10, sidebarY);
          sidebarY += 9;
        }

        // Certifications Section
        if (data.certifications && data.certifications.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(accent.r, accent.g, accent.b);
          doc.text('CREDENTIALS', 10, sidebarY);
          sidebarY += 3;
          doc.line(10, sidebarY, 62, sidebarY);
          sidebarY += 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(205, 215, 225);
          data.certifications.forEach(cert => {
            if (sidebarY < 285) {
              const splitCert = doc.splitTextToSize(cert, 50);
              doc.text(splitCert, 10, sidebarY);
              sidebarY += (splitCert.length * 3.5) + 2;
            }
          });
        }

        // RIGHT COLUMN (Main Details. Start X=80mm, Max width=118mm)
        let mainY = 22;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
        doc.text(data.fullName.toUpperCase(), 80, mainY);
        mainY += 6;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(accent.r, accent.g, accent.b);
        doc.text(data.professionalTitle.toUpperCase(), 80, mainY);
        mainY += 10;

        // Profile Summary Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
        doc.text('PROFESSIONAL STATEMENT', 80, mainY);
        mainY += 2;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(80, mainY, 198, mainY);
        mainY += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
        const mainSummary = doc.splitTextToSize(data.summary, 118);
        doc.text(mainSummary, 80, mainY);
        mainY += (mainSummary.length * 4.2) + 8;

        // Experiences Section
        if (data.experiences && data.experiences.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
          doc.text('WORK HISTORY', 80, mainY);
          mainY += 2;
          doc.line(80, mainY, 198, mainY);
          mainY += 5;

          data.experiences.forEach(exp => {
            if (mainY > 265) {
              doc.addPage();
              // Keep sidebar background design on next pages to preserve Premium feel
              doc.setFillColor(24, 32, 49);
              doc.rect(0, 0, 72, 297, 'F');
              doc.setFillColor(accent.r, accent.g, accent.b);
              doc.rect(0, 0, 4, 297, 'F');
              mainY = 20;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
            doc.text(exp.role, 80, mainY);
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(accent.r, accent.g, accent.b);
            doc.text(exp.dateRange, 198, mainY, { align: 'right' });
            mainY += 4;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(textGray.r, textGray.g, textGray.b);
            doc.text(`${exp.company}  [${exp.location}]`, 80, mainY);
            mainY += 4.5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
            const expDesc = doc.splitTextToSize(exp.description, 118);
            doc.text(expDesc, 80, mainY);
            mainY += (expDesc.length * 4) + 6;
          });
        }

        // Education Section
        if (data.educations && data.educations.length > 0) {
          if (mainY > 250) {
            doc.addPage();
            doc.setFillColor(24, 32, 49);
            doc.rect(0, 0, 72, 297, 'F');
            doc.setFillColor(accent.r, accent.g, accent.b);
            doc.rect(0, 0, 4, 297, 'F');
            mainY = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
          doc.text('EDUCATION & ACADEMICS', 80, mainY);
          mainY += 2;
          doc.line(80, mainY, 198, mainY);
          mainY += 5;

          data.educations.forEach(edu => {
            if (mainY > 265) {
              doc.addPage();
              doc.setFillColor(24, 32, 49);
              doc.rect(0, 0, 72, 297, 'F');
              doc.setFillColor(accent.r, accent.g, accent.b);
              doc.rect(0, 0, 4, 297, 'F');
              mainY = 20;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
            doc.text(edu.degree, 80, mainY);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(accent.r, accent.g, accent.b);
            doc.text(edu.dateRange, 198, mainY, { align: 'right' });
            mainY += 4;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(textGray.r, textGray.g, textGray.b);
            doc.text(`${edu.school}  [${edu.location}]`, 80, mainY);
            mainY += 4.5;

            if (edu.details) {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
              const eduDesc = doc.splitTextToSize(edu.details, 118);
              doc.text(eduDesc, 80, mainY);
              mainY += (eduDesc.length * 4) + 6;
            } else {
              mainY += 2.5;
            }
          });
        }

        // Elegant Footer bar on Main Column
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(textLight.r, textLight.g, textLight.b);
        doc.text('Canva Premium CV Studio  |  Pristine Automated High-Resolution Layout', 80, 288);

      // -----------------------------------------------------
      // 2. CLASSIC EXECUTIVE TEMPLATE
      // -----------------------------------------------------
      } else if (template === 'classic-executive') {
        // High-end elegant header band
        doc.setFillColor(primaryDark.r, primaryDark.g, primaryDark.b);
        doc.rect(0, 0, 210, 10, 'F');
        doc.setFillColor(accent.r, accent.g, accent.b);
        doc.rect(0, 10, 210, 2, 'F');

        // Main Header content
        let headerY = 22;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
        doc.text(data.fullName.toUpperCase(), 20, headerY);
        
        // Profile Photo on Top Right
        drawPhotoPDF(160, 18, 30);

        headerY += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(accent.r, accent.g, accent.b);
        doc.text(data.professionalTitle.toUpperCase(), 20, headerY);

        headerY += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(textGray.r, textGray.g, textGray.b);
        
        let contactInfo = `Email: ${data.email}  |  Phone: ${data.phone}  |  Address: ${data.address}`;
        if (data.website) contactInfo += `  |  Web: ${data.website}`;
        if (data.niu) contactInfo += `  |  NIU: ${data.niu}`;
        doc.text(contactInfo, 20, headerY);

        headerY += 3;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(20, headerY, 190, headerY);

        // Grid Columns: Wide left column (112mm) and Sidebar right column (52mm)
        // Column X coordinates: Left (20mm to 132mm), Right (138mm to 190mm)
        let leftY = headerY + 8;
        let rightY = headerY + 8;

        // LEFT COLUMN Content
        // Summary
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
        doc.text('PROFESSIONAL PROFILE', 20, leftY);
        leftY += 2;
        doc.setDrawColor(accent.r, accent.g, accent.b);
        doc.setLineWidth(0.3);
        doc.line(20, leftY, 132, leftY);
        leftY += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
        const profileSummary = doc.splitTextToSize(data.summary, 112);
        doc.text(profileSummary, 20, leftY);
        leftY += (profileSummary.length * 4.2) + 8;

        // Work Experience
        if (data.experiences && data.experiences.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
          doc.text('PROFESSIONAL EXPERIENCE', 20, leftY);
          leftY += 2;
          doc.line(20, leftY, 132, leftY);
          leftY += 5;

          data.experiences.forEach(exp => {
            if (leftY > 265) {
              doc.addPage();
              // Re-draw small top bar
              doc.setFillColor(primaryDark.r, primaryDark.g, primaryDark.b);
              doc.rect(0, 0, 210, 6, 'F');
              leftY = 18;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
            doc.text(exp.role, 20, leftY);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(accent.r, accent.g, accent.b);
            doc.text(exp.dateRange, 132, leftY, { align: 'right' });
            leftY += 4;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(textGray.r, textGray.g, textGray.b);
            doc.text(`${exp.company} — ${exp.location}`, 20, leftY);
            leftY += 4;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
            const expDesc = doc.splitTextToSize(exp.description, 112);
            doc.text(expDesc, 20, leftY);
            leftY += (expDesc.length * 4.1) + 6;
          });
        }

        // Education
        if (data.educations && data.educations.length > 0) {
          if (leftY > 240) {
            doc.addPage();
            doc.setFillColor(primaryDark.r, primaryDark.g, primaryDark.b);
            doc.rect(0, 0, 210, 6, 'F');
            leftY = 18;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
          doc.text('EDUCATION & ACADEMICS', 20, leftY);
          leftY += 2;
          doc.line(20, leftY, 132, leftY);
          leftY += 5;

          data.educations.forEach(edu => {
            if (leftY > 265) {
              doc.addPage();
              doc.setFillColor(primaryDark.r, primaryDark.g, primaryDark.b);
              doc.rect(0, 0, 210, 6, 'F');
              leftY = 18;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
            doc.text(edu.degree, 20, leftY);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(accent.r, accent.g, accent.b);
            doc.text(edu.dateRange, 132, leftY, { align: 'right' });
            leftY += 4;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(textGray.r, textGray.g, textGray.b);
            doc.text(`${edu.school} (${edu.location})`, 20, leftY);
            leftY += 4;

            if (edu.details) {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
              const eduDesc = doc.splitTextToSize(edu.details, 112);
              doc.text(eduDesc, 20, leftY);
              leftY += (eduDesc.length * 4.1) + 6;
            } else {
              leftY += 2;
            }
          });
        }

        // RIGHT COLUMN Content (Y starts at the same line)
        // Align to X=138, width=52
        rightY = headerY + 12; // lower slightly to make space below the photo card

        // Skills List
        if (data.skills && data.skills.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
          doc.text('KEY SKILLS', 138, rightY);
          rightY += 2;
          doc.setDrawColor(accent.r, accent.g, accent.b);
          doc.line(138, rightY, 190, rightY);
          rightY += 5;

          data.skills.forEach(skill => {
            if (rightY < 275) {
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(8);
              doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
              doc.text(`• ${skill}`, 138, rightY);
              rightY += 4.5;
            }
          });
          rightY += 5;
        }

        // Languages List
        if (data.languages && data.languages.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
          doc.text('LANGUAGES', 138, rightY);
          rightY += 2;
          doc.line(138, rightY, 190, rightY);
          rightY += 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
          doc.text(data.languages.join(', '), 138, rightY);
          rightY += 10;
        }

        // Certifications
        if (data.certifications && data.certifications.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
          doc.text('CREDENTIALS', 138, rightY);
          rightY += 2;
          doc.line(138, rightY, 190, rightY);
          rightY += 5;

          data.certifications.forEach(cert => {
            if (rightY < 275) {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7.5);
              doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
              const splitCert = doc.splitTextToSize(cert, 52);
              doc.text(splitCert, 138, rightY);
              rightY += (splitCert.length * 3.5) + 3;
            }
          });
        }

        // Draw thin footer
        doc.setDrawColor(241, 245, 249);
        doc.line(20, 282, 190, 282);
        doc.setFontSize(7.5);
        doc.setTextColor(textLight.r, textLight.g, textLight.b);
        doc.text('Classic Executive Template  |  Canva Premium Vector Standard', 20, 287);

      // -----------------------------------------------------
      // 3. CREATIVE GOLD TEMPLATE
      // -----------------------------------------------------
      } else {
        // Dynamic banner block
        doc.setFillColor(accent.r, accent.g, accent.b);
        doc.rect(0, 0, 210, 48, 'F');

        // Name and title centered
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text(data.fullName.toUpperCase(), 105, 18, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(255, 255, 255);
        doc.text(data.professionalTitle.toUpperCase(), 105, 25, { align: 'center' });

        // Contact info in banner
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(240, 245, 255);
        let contactStr = `${data.email}  |  ${data.phone}  |  ${data.address}`;
        if (data.website) contactStr += `  |  ${data.website}`;
        doc.text(contactStr, 105, 31, { align: 'center' });

        // Circular profile photo overlapping banner edge
        drawPhotoPDF(88, 36, 34);

        // Contents layout below banner. Offset Y to 78mm
        let yPos = 78;

        // Professional Summary
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(accent.r, accent.g, accent.b);
        doc.text('PROFESSIONAL PROFILE', 20, yPos);
        yPos += 2;
        doc.setDrawColor(accent.r, accent.g, accent.b);
        doc.setLineWidth(0.4);
        doc.line(20, yPos, 190, yPos);
        yPos += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
        const profileSummary = doc.splitTextToSize(data.summary, 170);
        doc.text(profileSummary, 20, yPos);
        yPos += (profileSummary.length * 4.2) + 8;

        // Experiences
        if (data.experiences && data.experiences.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(accent.r, accent.g, accent.b);
          doc.text('EXPERIENCE HISTORY', 20, yPos);
          yPos += 2;
          doc.line(20, yPos, 190, yPos);
          yPos += 5;

          data.experiences.forEach(exp => {
            if (yPos > 265) {
              doc.addPage();
              yPos = 20;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
            doc.text(exp.role, 20, yPos);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(accent.r, accent.g, accent.b);
            doc.text(exp.dateRange, 190, yPos, { align: 'right' });
            yPos += 4;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(textGray.r, textGray.g, textGray.b);
            doc.text(`${exp.company} — [${exp.location}]`, 20, yPos);
            yPos += 4.5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
            const expDesc = doc.splitTextToSize(exp.description, 170);
            doc.text(expDesc, 20, yPos);
            yPos += (expDesc.length * 4) + 6;
          });
        }

        // Education
        if (data.educations && data.educations.length > 0) {
          if (yPos > 240) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(accent.r, accent.g, accent.b);
          doc.text('ACADEMIC QUALIFICATIONS', 20, yPos);
          yPos += 2;
          doc.line(20, yPos, 190, yPos);
          yPos += 5;

          data.educations.forEach(edu => {
            if (yPos > 265) {
              doc.addPage();
              yPos = 20;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
            doc.text(edu.degree, 20, yPos);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(accent.r, accent.g, accent.b);
            doc.text(edu.dateRange, 190, yPos, { align: 'right' });
            yPos += 4;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(textGray.r, textGray.g, textGray.b);
            doc.text(`${edu.school} (${edu.location})`, 20, yPos);
            yPos += 4.5;

            if (edu.details) {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
              const eduDesc = doc.splitTextToSize(edu.details, 170);
              doc.text(eduDesc, 20, yPos);
              yPos += (eduDesc.length * 4) + 6;
            } else {
              yPos += 2;
            }
          });
        }

        // Bottom Competencies Summary block
        if (yPos > 235) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(accent.r, accent.g, accent.b);
        doc.text('ADDITIONAL REQUISITES', 20, yPos);
        yPos += 2;
        doc.line(20, yPos, 190, yPos);
        yPos += 5;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
        doc.text('Skills Portfolio: ', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textGray.r, textGray.g, textGray.b);
        const skillsLine = doc.splitTextToSize(data.skills.join(', '), 145);
        doc.text(skillsLine, 45, yPos);
        yPos += (skillsLine.length * 4) + 2;

        if (data.languages && data.languages.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
          doc.text('Languages: ', 20, yPos);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textGray.r, textGray.g, textGray.b);
          doc.text(data.languages.join('  |  '), 45, yPos);
          yPos += 5;
        }

        if (data.certifications && data.certifications.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
          doc.text('Credentials: ', 20, yPos);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textGray.r, textGray.g, textGray.b);
          const certsLine = doc.splitTextToSize(data.certifications.join(', '), 145);
          doc.text(certsLine, 45, yPos);
        }

        // Draw elegant Gold/Amber footer line
        doc.setDrawColor(accent.r, accent.g, accent.b);
        doc.setLineWidth(0.4);
        doc.line(20, 282, 190, 282);
        doc.setFontSize(7);
        doc.setTextColor(textLight.r, textLight.g, textLight.b);
        doc.text('Creative Gold & Modern layout  |  Canva Premium Printers-Ready Document', 20, 287);
      }

      doc.save(`Premium-Canva-CV-${data.fullName.replace(/\s+/g, '-')}.pdf`);
      showToast('Printers-ready Canva Premium A4 PDF document exported successfully!', 'success');
    } else {
      // Letter Download
      const data = activeLetter;
      if (!data) return;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFont('helvetica', 'normal');

      // Top elegant letterhead bar (MADECC styling)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 8, 'F');
      
      // Amber minor band
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(0, 8, 210, 1.5, 'F');

      // Sender Block (Right Aligned)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(data.senderName, 130, 25);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(data.senderTitle, 130, 29);
      
      const splitAddress = doc.splitTextToSize(data.senderAddress, 70);
      doc.text(splitAddress, 130, 33);
      
      let nextY = 33 + (splitAddress.length * 4) + 1;
      doc.text(`Email: ${data.senderEmail}`, 130, nextY);
      doc.text(`Phone: ${data.senderPhone}`, 130, nextY + 4);
      if (data.senderNiu) {
        doc.text(`NIU: ${data.senderNiu}`, 130, nextY + 8);
      }

      // Recipient Block (Left Aligned)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('TO:', 20, 60);
      doc.text(data.recipientName, 20, 64.5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(data.recipientTitle, 20, 69);
      doc.text(data.recipientCompany, 20, 73.5);
      const splitRecAddr = doc.splitTextToSize(data.recipientAddress, 90);
      doc.text(splitRecAddr, 20, 78);

      // Date line
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Date: ${data.date}`, 20, 95);

      // Subject Block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const splitSub = doc.splitTextToSize(`SUBJECT: ${data.subject.toUpperCase()}`, 170);
      doc.text(splitSub, 20, 104);
      doc.line(20, 105 + ((splitSub.length - 1) * 4.5), 190, 105 + ((splitSub.length - 1) * 4.5));

      // Salutation
      let yPos = 115 + ((splitSub.length - 1) * 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(data.salutation, 20, yPos);

      yPos += 8;

      // Letter paragraphs
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      
      data.bodyParagraphs.forEach((para) => {
        const splitPara = doc.splitTextToSize(para, 170);
        doc.text(splitPara, 20, yPos);
        yPos += (splitPara.length * 4.5) + 6;
      });

      yPos += 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(data.signoff, 20, yPos);

      yPos += 14;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(data.senderName, 20, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(data.senderTitle, 20, yPos + 4.5);

      // Footer line
      doc.setDrawColor(241, 245, 249);
      doc.line(20, 278, 190, 278);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('MADECC Group Certified Administrative Studio  |  A4 Corporate Standard Cover Letter', 20, 283);

      doc.save(`MADECC-Letter-${data.senderName.replace(/\s+/g, '-')}.pdf`);
      showToast('Printers-ready Cover Letter A4 PDF exported successfully!', 'success');
    }
  };

  // High-Fidelity Word Document (.doc) Export Logic
  const downloadAsWord = () => {
    if (mode === 'cv') {
      const data = activeCV;
      if (!data) {
        showToast('No active CV record found to export.', 'error');
        return;
      }

      const template = data.templateId || 'modern-sidebar';
      const accentHex = data.accentColor || '#1e40af';

      let content = '';

      if (template === 'modern-sidebar') {
        content = `
          <div align="center" style="width: 100%; text-align: center;">
            <table width="600" align="center" style="width: 600px; border-collapse: collapse; margin-left: auto; margin-right: auto; padding: 0; table-layout: fixed; text-align: left;">
              <tr>
                <td width="190" style="background-color: #182031; width: 190px; color: #f1f5f9; padding: 25px 20px; vertical-align: top; word-break: break-word; box-sizing: border-box;">
                  ${data.profilePhoto ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${data.profilePhoto}" width="100" height="100" style="width: 100px; height: 100px; border-radius: 50px; border: 3px solid ${accentHex}; display: block; margin: 0 auto;" /></div>` : ''}
                  
                  <div style="font-size: 11pt; font-weight: bold; color: ${accentHex}; text-transform: uppercase; border-bottom: 2px solid ${accentHex}; padding-bottom: 4px; margin-top: 15px; margin-bottom: 12px; letter-spacing: 0.5px;">Contact Info</div>
                  <div style="font-size: 9pt; color: #cbd5e1; margin-bottom: 10px;"><strong>Email:</strong><br/>${data.email}</div>
                  <div style="font-size: 9pt; color: #cbd5e1; margin-bottom: 10px;"><strong>Phone:</strong><br/>${data.phone}</div>
                  <div style="font-size: 9pt; color: #cbd5e1; margin-bottom: 10px;"><strong>Address:</strong><br/>${data.address}</div>
                  ${data.website ? `<div style="font-size: 9pt; color: #cbd5e1; margin-bottom: 10px;"><strong>Web:</strong><br/>${data.website}</div>` : ''}
                  ${data.niu ? `<div style="font-size: 9pt; color: #cbd5e1; margin-bottom: 10px;"><strong>Tax ID:</strong><br/>${data.niu}</div>` : ''}

                  ${data.skills && data.skills.length > 0 ? `
                    <div style="font-size: 11pt; font-weight: bold; color: ${accentHex}; text-transform: uppercase; border-bottom: 2px solid ${accentHex}; padding-bottom: 4px; margin-top: 25px; margin-bottom: 12px; letter-spacing: 0.5px;">Key Skills</div>
                    <div style="font-size: 9pt; color: #f1f5f9; line-height: 1.5;">
                      ${data.skills.map(s => `• ${s}`).join('<br/>')}
                    </div>
                  ` : ''}

                  ${data.languages && data.languages.length > 0 ? `
                    <div style="font-size: 11pt; font-weight: bold; color: ${accentHex}; text-transform: uppercase; border-bottom: 2px solid ${accentHex}; padding-bottom: 4px; margin-top: 25px; margin-bottom: 12px; letter-spacing: 0.5px;">Languages</div>
                    <div style="font-size: 9.5pt; color: #f1f5f9; line-height: 1.5;">
                      ${data.languages.join('  |  ')}
                    </div>
                  ` : ''}

                  ${data.certifications && data.certifications.length > 0 ? `
                    <div style="font-size: 11pt; font-weight: bold; color: ${accentHex}; text-transform: uppercase; border-bottom: 2px solid ${accentHex}; padding-bottom: 4px; margin-top: 25px; margin-bottom: 12px; letter-spacing: 0.5px;">Credentials</div>
                    <div style="font-size: 8.5pt; color: #94a3b8; line-height: 1.4;">
                      ${data.certifications.map(c => `• ${c}`).join('<br/>')}
                    </div>
                  ` : ''}
                </td>
                <td width="410" style="width: 410px; padding: 25px; vertical-align: top; background-color: #ffffff; word-break: break-word; box-sizing: border-box;">
                  <h1 style="color: #0f172a; margin: 0; font-size: 26pt; font-weight: bold; text-transform: uppercase; line-height: 1.1;">${data.fullName}</h1>
                  <div style="font-size: 12pt; font-weight: bold; color: ${accentHex}; text-transform: uppercase; margin-top: 6px; margin-bottom: 25px; letter-spacing: 1px;">${data.professionalTitle}</div>

                  <div style="font-size: 11.5pt; font-weight: bold; color: #0f172a; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px;">Professional Statement</div>
                  <p style="font-size: 10pt; color: #334155; line-height: 1.55; margin-bottom: 25px; text-align: justify; white-space: pre-wrap;">${data.summary}</p>

                  ${data.experiences && data.experiences.length > 0 ? `
                    <div style="font-size: 11.5pt; font-weight: bold; color: #0f172a; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; margin-bottom: 15px;">Work History</div>
                    ${data.experiences.map(exp => `
                      <div style="margin-bottom: 18px;">
                        <table width="100%" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td align="left" style="font-size: 10.5pt; font-weight: bold; color: #0f172a; text-align: left;">${exp.role}</td>
                            <td align="right" style="font-size: 9.5pt; font-weight: bold; color: ${accentHex}; text-align: right;">${exp.dateRange}</td>
                          </tr>
                        </table>
                        <div style="font-size: 9.5pt; color: #64748b; font-weight: bold; margin-bottom: 4px;">${exp.company} &bull; ${exp.location}</div>
                        <p style="font-size: 9.5pt; color: #475569; line-height: 1.45; margin: 0; text-align: justify; white-space: pre-wrap;">${exp.description}</p>
                      </div>
                    `).join('')}
                  ` : ''}

                  ${data.educations && data.educations.length > 0 ? `
                    <div style="font-size: 11.5pt; font-weight: bold; color: #0f172a; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 25px; margin-bottom: 15px;">Education & Academics</div>
                    ${data.educations.map(edu => `
                      <div style="margin-bottom: 15px;">
                        <table width="100%" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td align="left" style="font-size: 10.5pt; font-weight: bold; color: #0f172a; text-align: left;">${edu.degree}</td>
                            <td align="right" style="font-size: 9.5pt; font-weight: bold; color: ${accentHex}; text-align: right;">${edu.dateRange}</td>
                          </tr>
                        </table>
                        <div style="font-size: 9.5pt; color: #64748b; font-weight: bold; margin-bottom: 4px;">${edu.school} &bull; ${edu.location}</div>
                        ${edu.details ? `<p style="font-size: 9.5pt; color: #475569; line-height: 1.45; margin: 0; text-align: justify; white-space: pre-wrap;">${edu.details}</p>` : ''}
                      </div>
                    `).join('')}
                  ` : ''}
                </td>
              </tr>
            </table>
          </div>
        `;
      } else if (template === 'classic-executive') {
        content = `
          <div align="center" style="width: 100%; text-align: center;">
            <table width="600" align="center" style="width: 600px; border-collapse: collapse; margin-left: auto; margin-right: auto; margin-bottom: 20px; table-layout: fixed; text-align: left;">
              <tr>
                <td width="470" style="vertical-align: top; width: 470px; word-break: break-word;">
                  <h1 style="color: #0f172a; margin: 0; font-size: 26pt; font-weight: bold; text-transform: uppercase; line-height: 1.1;">${data.fullName}</h1>
                  <div style="font-size: 12pt; font-weight: bold; color: ${accentHex}; text-transform: uppercase; margin-top: 5px; margin-bottom: 10px; letter-spacing: 1px;">${data.professionalTitle}</div>
                  <div style="font-size: 9.5pt; color: #475569; line-height: 1.4;">
                    Email: ${data.email} | Phone: ${data.phone} | Address: ${data.address}<br/>
                    ${data.website ? `Website: ${data.website} | ` : ''} ${data.niu ? `Tax ID: ${data.niu}` : ''}
                  </div>
                </td>
                <td width="130" style="vertical-align: top; width: 130px; text-align: right; word-break: break-word;">
                  ${data.profilePhoto ? `<img src="${data.profilePhoto}" width="100" height="100" style="width: 100px; height: 100px; border-radius: 50px; border: 2px solid ${accentHex};" />` : ''}
                </td>
              </tr>
            </table>

            <table width="600" align="center" style="width: 600px; border-collapse: collapse; margin-left: auto; margin-right: auto; margin-bottom: 25px;">
              <tr>
                <td>
                  <hr style="border: 0; border-top: 3px solid ${accentHex}; margin: 0;" />
                </td>
              </tr>
            </table>

            <table width="600" align="center" style="width: 600px; border-collapse: collapse; margin-left: auto; margin-right: auto; table-layout: fixed; text-align: left;">
              <tr>
                <td width="390" style="width: 390px; padding-right: 25px; vertical-align: top; word-break: break-word; box-sizing: border-box;">
                  <div style="font-size: 11.5pt; font-weight: bold; color: #0f172a; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px;">Professional Profile</div>
                  <p style="font-size: 10pt; color: #334155; line-height: 1.55; margin-bottom: 25px; text-align: justify; white-space: pre-wrap;">${data.summary}</p>

                  ${data.experiences && data.experiences.length > 0 ? `
                    <div style="font-size: 11.5pt; font-weight: bold; color: #0f172a; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; margin-bottom: 15px;">Professional Experience</div>
                    ${data.experiences.map(exp => `
                      <div style="margin-bottom: 18px;">
                        <table width="100%" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td align="left" style="font-size: 10.5pt; font-weight: bold; color: #0f172a; text-align: left;">${exp.role}</td>
                            <td align="right" style="font-size: 9.5pt; font-weight: bold; color: ${accentHex}; text-align: right;">${exp.dateRange}</td>
                          </tr>
                        </table>
                        <div style="font-size: 9.5pt; color: #64748b; font-weight: bold; margin-bottom: 4px;">${exp.company} &bull; ${exp.location}</div>
                        <p style="font-size: 9.5pt; color: #475569; line-height: 1.45; margin: 0; text-align: justify; white-space: pre-wrap;">${exp.description}</p>
                      </div>
                    `).join('')}
                  ` : ''}

                  ${data.educations && data.educations.length > 0 ? `
                    <div style="font-size: 11.5pt; font-weight: bold; color: #0f172a; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 25px; margin-bottom: 15px;">Education & Academics</div>
                    ${data.educations.map(edu => `
                      <div style="margin-bottom: 15px;">
                        <table width="100%" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td align="left" style="font-size: 10.5pt; font-weight: bold; color: #0f172a; text-align: left;">${edu.degree}</td>
                            <td align="right" style="font-size: 9.5pt; font-weight: bold; color: ${accentHex}; text-align: right;">${edu.dateRange}</td>
                          </tr>
                        </table>
                        <div style="font-size: 9.5pt; color: #64748b; font-weight: bold; margin-bottom: 4px;">${edu.school} &bull; ${edu.location}</div>
                        ${edu.details ? `<p style="font-size: 9.5pt; color: #475569; line-height: 1.45; margin: 0; text-align: justify; white-space: pre-wrap;">${edu.details}</p>` : ''}
                      </div>
                    `).join('')}
                  ` : ''}
                </td>

                <td width="210" style="width: 210px; background-color: #f8fafc; padding: 20px 15px; vertical-align: top; border-radius: 8px; word-break: break-word; box-sizing: border-box;">
                  ${data.skills && data.skills.length > 0 ? `
                    <div style="font-size: 11pt; font-weight: bold; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid ${accentHex}; padding-bottom: 3px; margin-bottom: 10px; letter-spacing: 0.5px;">Key Skills</div>
                    <div style="font-size: 9.5pt; color: #334155; line-height: 1.6; margin-bottom: 20px;">
                      ${data.skills.map(s => `• ${s}`).join('<br/>')}
                    </div>
                  ` : ''}

                  ${data.languages && data.languages.length > 0 ? `
                    <div style="font-size: 11pt; font-weight: bold; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid ${accentHex}; padding-bottom: 3px; margin-bottom: 10px; letter-spacing: 0.5px;">Languages</div>
                    <div style="font-size: 9.5pt; color: #334155; line-height: 1.6; margin-bottom: 20px;">
                      ${data.languages.join(', ')}
                    </div>
                  ` : ''}

                  ${data.certifications && data.certifications.length > 0 ? `
                    <div style="font-size: 11pt; font-weight: bold; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid ${accentHex}; padding-bottom: 3px; margin-bottom: 10px; letter-spacing: 0.5px;">Credentials</div>
                    <div style="font-size: 9pt; color: #475569; line-height: 1.4;">
                      ${data.certifications.map(c => `• ${c}`).join('<br/>')}
                    </div>
                  ` : ''}
                </td>
              </tr>
            </table>
          </div>
        `;
      } else {
        // Creative Gold
        content = `
          <div align="center" style="width: 100%; text-align: center;">
            <table width="600" align="center" style="width: 600px; border-collapse: collapse; margin-left: auto; margin-right: auto; table-layout: fixed; text-align: left;">
              <tr>
                <td style="padding: 0; word-break: break-word;">
                  <div style="background-color: ${accentHex}; padding: 30px; text-align: center; color: #ffffff; border-radius: 8px; margin-bottom: 20px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28pt; font-weight: bold; text-transform: uppercase; line-height: 1.1;">${data.fullName}</h1>
                    <div style="font-size: 12pt; font-weight: bold; color: #fef08a; text-transform: uppercase; margin-top: 5px; margin-bottom: 12px; letter-spacing: 1.5px;">${data.professionalTitle}</div>
                    <div style="font-size: 9.5pt; color: #f1f5f9; opacity: 0.95;">
                      Email: ${data.email} | Phone: ${data.phone} | Address: ${data.address}
                      ${data.website ? `<br/>Web: ${data.website}` : ''} ${data.niu ? ` | NIU: ${data.niu}` : ''}
                    </div>
                  </div>

                  ${data.profilePhoto ? `
                    <div style="text-align: center; margin-bottom: 25px;">
                      <img src="${data.profilePhoto}" width="100" height="100" style="width: 100px; height: 100px; border-radius: 50px; border: 4px solid #ffffff; background-color: #ffffff; display: block; margin: 0 auto;" />
                    </div>
                  ` : ''}

                  <div style="padding: 10px 0;">
                    <div style="font-size: 12pt; font-weight: bold; color: ${accentHex}; text-transform: uppercase; border-bottom: 2px solid ${accentHex}; padding-bottom: 4px; margin-bottom: 10px; text-align: center; letter-spacing: 0.5px;">Professional Profile</div>
                    <p style="font-size: 10pt; color: #334155; line-height: 1.55; margin-bottom: 25px; text-align: center; max-width: 90%; margin-left: auto; margin-right: auto; white-space: pre-wrap;">${data.summary}</p>

                    ${data.experiences && data.experiences.length > 0 ? `
                      <div style="font-size: 12pt; font-weight: bold; color: ${accentHex}; text-transform: uppercase; border-bottom: 2px solid ${accentHex}; padding-bottom: 4px; margin-top: 20px; margin-bottom: 15px; letter-spacing: 0.5px;">Work History</div>
                      ${data.experiences.map(exp => `
                        <div style="margin-bottom: 18px;">
                          <table width="100%" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td align="left" style="font-size: 10.5pt; font-weight: bold; color: #0f172a; text-align: left;">${exp.role}</td>
                              <td align="right" style="font-size: 9.5pt; font-weight: bold; color: ${accentHex}; text-align: right;">${exp.dateRange}</td>
                            </tr>
                          </table>
                          <div style="font-size: 9.5pt; color: #64748b; font-weight: bold; margin-bottom: 4px;">${exp.company} &bull; ${exp.location}</div>
                          <p style="font-size: 9.5pt; color: #475569; line-height: 1.45; margin: 0; text-align: justify; white-space: pre-wrap;">${exp.description}</p>
                        </div>
                      `).join('')}
                    ` : ''}

                    ${data.educations && data.educations.length > 0 ? `
                      <div style="font-size: 12pt; font-weight: bold; color: ${accentHex}; text-transform: uppercase; border-bottom: 2px solid ${accentHex}; padding-bottom: 4px; margin-top: 25px; margin-bottom: 15px; letter-spacing: 0.5px;">Academic Qualifications</div>
                      ${data.educations.map(edu => `
                        <div style="margin-bottom: 15px;">
                          <table width="100%" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td align="left" style="font-size: 10.5pt; font-weight: bold; color: #0f172a; text-align: left;">${edu.degree}</td>
                              <td align="right" style="font-size: 9.5pt; font-weight: bold; color: ${accentHex}; text-align: right;">${edu.dateRange}</td>
                            </tr>
                          </table>
                          <div style="font-size: 9.5pt; color: #64748b; font-weight: bold; margin-bottom: 4px;">${edu.school} &bull; ${edu.location}</div>
                          ${edu.details ? `<p style="font-size: 9.5pt; color: #475569; line-height: 1.45; margin: 0; text-align: justify; white-space: pre-wrap;">${edu.details}</p>` : ''}
                        </div>
                      `).join('')}
                    ` : ''}

                    <div style="font-size: 12pt; font-weight: bold; color: ${accentHex}; text-transform: uppercase; border-bottom: 2px solid ${accentHex}; padding-bottom: 4px; margin-top: 25px; margin-bottom: 15px; letter-spacing: 0.5px;">Additional Requisites</div>
                    <table width="100%" style="width: 100%; border-collapse: collapse; font-size: 9.5pt; color: #334155; table-layout: fixed;">
                      <tr>
                        <td width="33%" style="width: 33%; padding: 10px; vertical-align: top; background-color: #f8fafc; border-right: 5px solid #ffffff; border-radius: 4px; word-break: break-word;">
                          <div style="font-weight: bold; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">Skills Portfolio</div>
                          ${data.skills.map(s => `• ${s}`).join('<br/>')}
                        </td>
                        <td width="33%" style="width: 33%; padding: 10px; vertical-align: top; background-color: #f8fafc; border-right: 5px solid #ffffff; border-radius: 4px; word-break: break-word;">
                          <div style="font-weight: bold; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">Languages</div>
                          ${data.languages.join('  |  ')}
                        </td>
                        <td width="33%" style="width: 33%; padding: 10px; vertical-align: top; background-color: #f8fafc; border-radius: 4px; word-break: break-word;">
                          <div style="font-weight: bold; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">Credentials</div>
                          ${data.certifications.map(c => `• ${c}`).join('<br/>')}
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        `;
      }

      // Complete Word Document HTML Structure
      const fullDoc = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>Premium Canva Word Document CV</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: 210mm 297mm; /* A4 */
              margin: 15mm 15mm 15mm 15mm;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #0f172a;
              font-size: 11pt;
              line-height: 1.45;
              background-color: #ffffff;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `;

      // Create blob of type application/msword and trigger download
      const blob = new Blob(['\ufeff' + fullDoc], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Premium-Canva-CV-${data.fullName.replace(/\s+/g, '-')}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Printers-ready Canva Premium Word Document exported successfully!', 'success');
    } else {
      // Cover Letter Download as Word Document
      const data = activeLetter;
      if (!data) {
        showToast('No active cover letter record found to export.', 'error');
        return;
      }

      const letterContent = `
        <div align="center" style="width: 100%; text-align: center;">
          <table width="600" align="center" style="width: 600px; border-collapse: collapse; margin-left: auto; margin-right: auto; text-align: left; padding: 20px;">
            <tr>
              <td style="word-break: break-word;">
                <!-- Top letterhead border -->
                <div style="background-color: #0f172a; height: 10px; margin-bottom: 25px;"></div>

                <!-- Sender Block (Right Aligned) -->
                <table width="100%" style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                  <tr>
                    <td width="50%" style="width: 50%;"></td>
                    <td width="50%" style="width: 50%; font-size: 10pt; color: #475569; text-align: left; line-height: 1.4; word-break: break-word;">
                      <strong style="font-size: 11pt; color: #0f172a;">${data.senderName}</strong><br/>
                      ${data.senderTitle}<br/>
                      ${data.senderAddress.replace(/\n/g, '<br/>')}<br/>
                      Email: ${data.senderEmail}<br/>
                      Phone: ${data.senderPhone}<br/>
                      ${data.senderNiu ? `NIU: ${data.senderNiu}` : ''}
                    </td>
                  </tr>
                </table>

                <!-- Recipient Block -->
                <div style="font-size: 10pt; color: #0f172a; margin-bottom: 30px; line-height: 1.45;">
                  <strong>TO:</strong><br/>
                  <strong style="font-size: 10.5pt;">${data.recipientName}</strong><br/>
                  ${data.recipientTitle}<br/>
                  ${data.recipientCompany}<br/>
                  ${data.recipientAddress.replace(/\n/g, '<br/>')}
                </div>

                <!-- Date -->
                <div style="font-size: 10pt; color: #475569; margin-bottom: 25px;">
                  <strong>Date:</strong> ${data.date}
                </div>

                <!-- Subject -->
                <div style="font-size: 10.5pt; font-weight: bold; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-bottom: 25px;">
                  SUBJECT: ${data.subject}
                </div>

                <!-- Salutation -->
                <p style="font-size: 10pt; color: #0f172a; margin-bottom: 15px;">${data.salutation}</p>

                <!-- Paragraphs -->
                ${data.bodyParagraphs.map(para => `<p style="font-size: 10pt; color: #334155; line-height: 1.5; text-align: justify; margin-bottom: 15px; white-space: pre-wrap;">${para}</p>`).join('')}

                <!-- Sign-off -->
                <div style="margin-top: 35px; font-size: 10pt; color: #0f172a; line-height: 1.4;">
                  ${data.signoff},<br/><br/><br/>
                  <strong>${data.senderName}</strong><br/>
                  <span style="color: #64748b; font-size: 9pt;">${data.senderTitle}</span>
                </div>
              </td>
            </tr>
          </table>
        </div>
      `;

      const fullDoc = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>Premium Cover Letter</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: 210mm 297mm; /* A4 */
              margin: 20mm 15mm 20mm 15mm;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #0f172a;
              font-size: 11pt;
              line-height: 1.45;
              background-color: #ffffff;
            }
          </style>
        </head>
        <body>
          ${letterContent}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + fullDoc], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MADECC-Cover-Letter-${data.senderName.replace(/\s+/g, '-')}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Printers-ready Cover Letter exported successfully to Word Document!', 'success');
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500" id={`admin-${mode}-studio`}>
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-amber-500 text-xs font-mono font-bold uppercase">
            {mode === 'cv' ? 'Professional Portfolio Builder' : 'Corporate Letter Studio'}
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {mode === 'cv' ? 'CV & Biography Records' : 'Application & Cover Letters'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'cv' 
              ? 'Draft, edit, duplicate, and compile full A4-ready curriculum vitaes for employment or teaching positions.' 
              : 'Create real-life professional application cover letters with custom headers, structures, and download options.'}
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-amber-500 text-slate-950 font-bold uppercase text-xs tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-amber-400 transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create {mode === 'cv' ? 'CV Profile' : 'Letter Draft'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Record Directory */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 font-mono flex items-center gap-2 uppercase tracking-widest">
            <Layers className="w-4 h-4 text-amber-500" />
            Saved {mode === 'cv' ? 'CV Profiles' : 'Letters'}
          </h3>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-850">
            {mode === 'cv' ? (
              cvs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No saved profiles. Create one now.</div>
              ) : (
                cvs.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-slate-900/60 flex items-center justify-between ${
                      activeId === item.id ? 'bg-slate-900 border-l-4 border-amber-500' : ''
                    }`}
                  >
                    <div className="truncate pr-2">
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.fullName} | {item.professionalTitle}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleDuplicate(item.id, e)}
                        title="Duplicate"
                        className="p-1 hover:text-amber-500 text-slate-400 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Delete"
                        className="p-1 hover:text-red-500 text-slate-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              letters.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No saved letters. Create one now.</div>
              ) : (
                letters.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-slate-900/60 flex items-center justify-between ${
                      activeId === item.id ? 'bg-slate-900 border-l-4 border-amber-500' : ''
                    }`}
                  >
                    <div className="truncate pr-2">
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.senderName} to {item.recipientCompany}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleDuplicate(item.id, e)}
                        title="Duplicate"
                        className="p-1 hover:text-amber-500 text-slate-400 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Delete"
                        className="p-1 hover:text-red-500 text-slate-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Studio Work area */}
        <div className="lg:col-span-8">
          {!activeId ? (
            <div className="bg-slate-950/40 border border-slate-800 border-dashed rounded-3xl p-16 text-center flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
              <h3 className="text-white font-bold text-base">Interactive Career Design Studio</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                Select an existing profile preset from the left directory to preview, edit, clone or compile as an A4 document. Or start a blank document draft.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Studio Controls Header */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-bold font-mono uppercase text-white truncate">
                    Draft: {mode === 'cv' ? cvForm.title : letterForm.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase px-3 py-2 rounded-lg transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setIsPreviewing(true);
                          // Restore
                          if (mode === 'cv') setCvForm({ ...activeCV });
                          else setLetterForm({ ...activeLetter });
                        }}
                        className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase px-3 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setIsPreviewing(false);
                        }}
                        className="bg-slate-800 hover:bg-slate-750 text-amber-500 border border-amber-500/20 font-bold text-xs uppercase px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit Draft
                      </button>
                      <button
                        onClick={() => setShowPrintModal(true)}
                        className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 font-extrabold text-xs uppercase px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Preview
                      </button>
                      <button
                        onClick={downloadAsPDF}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download A4 PDF
                      </button>
                      <button
                        onClick={downloadAsWord}
                        className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs uppercase px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Export Word Doc
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* EDITOR PANEL */}
              {isEditing && (
                <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-3xl space-y-6 max-h-[750px] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-white font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Modify Document Fields
                  </h3>

                  {mode === 'cv' ? (
                    <div className="space-y-4 text-xs">
                      {/* PREMIUM DESIGN ENGINE CONTROLS */}
                      <div className="bg-slate-900/80 border border-amber-500/30 p-4 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 text-amber-500 font-mono font-bold uppercase tracking-wide">
                          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                          <span>Canva Premium Design Suite</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Photo Upload block */}
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Profile Photo (Base64 Automated Sync)</label>
                            <div className="flex items-center gap-4">
                              {cvForm.profilePhoto ? (
                                <div className="relative group shrink-0">
                                  <img 
                                    src={cvForm.profilePhoto} 
                                    alt="Profile" 
                                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-500"
                                    referrerPolicy="no-referrer"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setCvForm(prev => ({ ...prev, profilePhoto: undefined }))}
                                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-500 transition-all"
                                    title="Remove Photo"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0 font-bold font-mono text-xs">
                                  NO IMG
                                </div>
                              )}
                              <div className="flex-1">
                                <input
                                  type="file"
                                  accept="image/*"
                                  id="premium-photo-upload"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setCvForm(prev => ({ ...prev, profilePhoto: reader.result as string }));
                                        showToast('Premium profile photo synced and optimized successfully!', 'success');
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label
                                  htmlFor="premium-photo-upload"
                                  className="inline-block bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500/50 cursor-pointer text-slate-200 text-[11px] font-bold uppercase px-3 py-2 rounded-lg transition-all"
                                >
                                  Upload Photo
                                </label>
                                <p className="text-[10px] text-slate-500 mt-1">Recommended square dimension, JPG/PNG formats.</p>
                              </div>
                            </div>
                          </div>

                          {/* Template Layout Selection */}
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Premium Canva Template</label>
                            <select
                              value={cvForm.templateId || 'modern-sidebar'}
                              onChange={(e) => setCvForm(prev => ({ ...prev, templateId: e.target.value as any }))}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none font-semibold text-[11px]"
                            >
                              <option value="modern-sidebar">Modern Corporate Sidebar (Canva High-End)</option>
                              <option value="classic-executive">Classic Sophisticated Executive</option>
                              <option value="creative-gold">Creative Overlapping Gold Banner</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/60 pt-3">
                          {/* Accent color picker dots */}
                          <div>
                            <label className="block text-slate-300 font-bold mb-1.5">Accent Styling Color</label>
                            <div className="flex items-center gap-3">
                              {[
                                { name: 'Amber', hex: '#d97706', bg: 'bg-amber-600' },
                                { name: 'Sapphire', hex: '#1e40af', bg: 'bg-blue-800' },
                                { name: 'Emerald', hex: '#065f46', bg: 'bg-emerald-800' },
                                { name: 'Rose', hex: '#9f1239', bg: 'bg-rose-800' },
                                { name: 'Charcoal', hex: '#475569', bg: 'bg-slate-600' }
                              ].map(col => (
                                <button
                                  key={col.hex}
                                  type="button"
                                  onClick={() => setCvForm(prev => ({ ...prev, accentColor: col.hex }))}
                                  title={col.name}
                                  className={`w-6 h-6 rounded-full ${col.bg} transition-all relative ${
                                    (cvForm.accentColor || '#1e40af') === col.hex 
                                      ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-110' 
                                      : 'hover:scale-105'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Font Scaling */}
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Document Text Scale</label>
                            <div className="flex gap-2">
                              {['small', 'medium', 'large'].map(sz => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => setCvForm(prev => ({ ...prev, fontSize: sz as any }))}
                                  className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                                    (cvForm.fontSize || 'medium') === sz
                                      ? 'bg-amber-500 border-amber-500 text-slate-950 font-black'
                                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                                  }`}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Document Record Title</label>
                          <input
                            type="text"
                            value={cvForm.title || ''}
                            onChange={(e) => setCvForm({ ...cvForm, title: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., Civil Engineer Resume"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Full Name</label>
                          <input
                            type="text"
                            value={cvForm.fullName || ''}
                            onChange={(e) => setCvForm({ ...cvForm, fullName: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., Jean-Pierre Kamga"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Professional Title</label>
                          <input
                            type="text"
                            value={cvForm.professionalTitle || ''}
                            onChange={(e) => setCvForm({ ...cvForm, professionalTitle: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., Senior Mathematics Educator"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Contact Email</label>
                          <input
                            type="email"
                            value={cvForm.email || ''}
                            onChange={(e) => setCvForm({ ...cvForm, email: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., email@domain.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Contact Phone</label>
                          <input
                            type="text"
                            value={cvForm.phone || ''}
                            onChange={(e) => setCvForm({ ...cvForm, phone: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., +237 6..."
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Personal Website / Bio</label>
                          <input
                            type="text"
                            value={cvForm.website || ''}
                            onChange={(e) => setCvForm({ ...cvForm, website: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., www.domain.com"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Tax NIU / ID (Optional)</label>
                          <input
                            type="text"
                            value={cvForm.niu || ''}
                            onChange={(e) => setCvForm({ ...cvForm, niu: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., M120..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Postal Address</label>
                        <input
                          type="text"
                          value={cvForm.address || ''}
                          onChange={(e) => setCvForm({ ...cvForm, address: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                          placeholder="Yaoundé Mbankolo, Cameroon"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Professional Summary</label>
                        <textarea
                          rows={3}
                          value={cvForm.summary || ''}
                          onChange={(e) => setCvForm({ ...cvForm, summary: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none font-sans"
                          placeholder="Write a powerful career overview summary..."
                        />
                      </div>

                      {/* Work Experiences Section */}
                      <div className="border-t border-slate-800 pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold font-mono uppercase tracking-wide">Work History</span>
                          <button
                            type="button"
                            onClick={addExperience}
                            className="text-amber-500 font-bold flex items-center gap-1 hover:text-amber-400 transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Add Job Role
                          </button>
                        </div>
                        
                        {(cvForm.experiences || []).map((exp, idx) => (
                          <div key={exp.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 relative">
                            <button
                              type="button"
                              onClick={() => removeExperience(exp.id)}
                              className="absolute top-3 right-3 text-red-500 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] font-mono text-amber-500 uppercase font-bold">Role #{idx + 1}</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-slate-400 mb-1">Job Title</label>
                                <input
                                  type="text"
                                  value={exp.role}
                                  onChange={(e) => {
                                    const exps = [...(cvForm.experiences || [])];
                                    exps[idx].role = e.target.value;
                                    setCvForm({ ...cvForm, experiences: exps });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1">Company / Institution</label>
                                <input
                                  type="text"
                                  value={exp.company}
                                  onChange={(e) => {
                                    const exps = [...(cvForm.experiences || [])];
                                    exps[idx].company = e.target.value;
                                    setCvForm({ ...cvForm, experiences: exps });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-slate-400 mb-1">Location</label>
                                <input
                                  type="text"
                                  value={exp.location}
                                  onChange={(e) => {
                                    const exps = [...(cvForm.experiences || [])];
                                    exps[idx].location = e.target.value;
                                    setCvForm({ ...cvForm, experiences: exps });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1">Date Range</label>
                                <input
                                  type="text"
                                  value={exp.dateRange}
                                  onChange={(e) => {
                                    const exps = [...(cvForm.experiences || [])];
                                    exps[idx].dateRange = e.target.value;
                                    setCvForm({ ...cvForm, experiences: exps });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-slate-400 mb-1">Job Responsibilities & Achievements</label>
                              <textarea
                                rows={2}
                                value={exp.description}
                                onChange={(e) => {
                                    const exps = [...(cvForm.experiences || [])];
                                    exps[idx].description = e.target.value;
                                    setCvForm({ ...cvForm, experiences: exps });
                                }}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Education Section */}
                      <div className="border-t border-slate-800 pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold font-mono uppercase tracking-wide">Education History</span>
                          <button
                            type="button"
                            onClick={addEducation}
                            className="text-amber-500 font-bold flex items-center gap-1 hover:text-amber-400 transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Add Academic Level
                          </button>
                        </div>
                        
                        {(cvForm.educations || []).map((edu, idx) => (
                          <div key={edu.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 relative">
                            <button
                              type="button"
                              onClick={() => removeEducation(edu.id)}
                              className="absolute top-3 right-3 text-red-500 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] font-mono text-amber-500 uppercase font-bold">Academic Degree #{idx + 1}</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-slate-400 mb-1">Degree / Certificate</label>
                                <input
                                  type="text"
                                  value={edu.degree}
                                  onChange={(e) => {
                                    const edus = [...(cvForm.educations || [])];
                                    edus[idx].degree = e.target.value;
                                    setCvForm({ ...cvForm, educations: edus });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1">School / University</label>
                                <input
                                  type="text"
                                  value={edu.school}
                                  onChange={(e) => {
                                    const edus = [...(cvForm.educations || [])];
                                    edus[idx].school = e.target.value;
                                    setCvForm({ ...cvForm, educations: edus });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-slate-400 mb-1">Location</label>
                                <input
                                  type="text"
                                  value={edu.location}
                                  onChange={(e) => {
                                    const edus = [...(cvForm.educations || [])];
                                    edus[idx].location = e.target.value;
                                    setCvForm({ ...cvForm, educations: edus });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1">Year Range</label>
                                <input
                                  type="text"
                                  value={edu.dateRange}
                                  onChange={(e) => {
                                    const edus = [...(cvForm.educations || [])];
                                    edus[idx].dateRange = e.target.value;
                                    setCvForm({ ...cvForm, educations: edus });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-slate-400 mb-1">Academic Honors / Details</label>
                              <textarea
                                rows={2}
                                value={edu.details}
                                onChange={(e) => {
                                    const edus = [...(cvForm.educations || [])];
                                    edus[idx].details = e.target.value;
                                    setCvForm({ ...cvForm, educations: edus });
                                }}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Technical Skills & Certifications Tags */}
                      <div className="border-t border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white font-bold font-mono uppercase tracking-wide mb-2">Key Skills</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              id="skill-adder"
                              placeholder="Type and hit Enter"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addSkill((e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                              className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById('skill-adder') as HTMLInputElement;
                                if (el) {
                                  addSkill(el.value);
                                  el.value = '';
                                }
                              }}
                              className="bg-slate-800 hover:bg-slate-750 text-white font-bold px-3 py-2 rounded-lg"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(cvForm.skills || []).map((skill, index) => (
                              <span key={index} className="bg-slate-900 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                                {skill}
                                <button type="button" onClick={() => removeSkill(index)} className="text-red-500 hover:text-red-400 font-bold">&times;</button>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-white font-bold font-mono uppercase tracking-wide mb-2">Certifications & Professional Licenses</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              id="cert-adder"
                              placeholder="e.g., Registered Architect ONIGC"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addCert((e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                              className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById('cert-adder') as HTMLInputElement;
                                if (el) {
                                  addCert(el.value);
                                  el.value = '';
                                }
                              }}
                              className="bg-slate-800 hover:bg-slate-750 text-white font-bold px-3 py-2 rounded-lg"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(cvForm.certifications || []).map((cert, index) => (
                              <span key={index} className="bg-slate-900 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                                {cert}
                                <button type="button" onClick={() => removeCert(index)} className="text-red-500 hover:text-red-400 font-bold">&times;</button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Languages */}
                      <div className="border-t border-slate-800 pt-4">
                        <label className="block text-white font-bold font-mono uppercase tracking-wide mb-2">Languages Spoken</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            id="lang-adder"
                            placeholder="e.g., French (Native)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addLanguage((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                            className="bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-white w-64"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById('lang-adder') as HTMLInputElement;
                              if (el) {
                                addLanguage(el.value);
                                el.value = '';
                              }
                            }}
                            className="bg-slate-800 hover:bg-slate-750 text-white font-bold px-3 py-2 rounded-lg"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(cvForm.languages || []).map((lang, index) => (
                            <span key={index} className="bg-slate-900 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                              {lang}
                              <button type="button" onClick={() => removeLanguage(index)} className="text-red-500 hover:text-red-400 font-bold">&times;</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* APPLICATION LETTER FORM */
                    <div className="space-y-4 text-xs">
                      {/* AI ASSISTED LETTER GENERATOR PANEL */}
                      <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/20 p-5 rounded-2xl space-y-4 shadow-xl">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-amber-500/10 rounded-lg">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <h4 className="text-amber-400 font-extrabold text-sm uppercase tracking-wider">AI Cover & Application Letter Generator</h4>
                            <p className="text-[10px] text-slate-400">Instantly generate high-quality Cameroon-aligned academic, teaching, corporate, or tender letters using Gemini AI.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Letter Category Group</label>
                            <select
                              value={letterCategory}
                              onChange={(e) => {
                                const val = e.target.value as 'application' | 'teaching-jobs';
                                setLetterCategory(val);
                                // Set a matching subtype immediately
                                if (val === 'application') setLetterSubtype('general-employment');
                                else setLetterSubtype('stem-teacher');
                              }}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            >
                              <option value="application">General & Corporate Application Letters</option>
                              <option value="teaching-jobs">Academic, Teaching & Engineering Cover Letters</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Specific Letter Sub-type</label>
                            <select
                              value={letterSubtype}
                              onChange={(e) => setLetterSubtype(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            >
                              {letterCategory === 'application' ? (
                                <>
                                  <option value="general-employment">General Employment Application</option>
                                  <option value="internship">Professional Internship Request</option>
                                  <option value="promotion">Internal Promotion Request</option>
                                  <option value="tender-eoi">Expression of Interest (EOI) for Tenders</option>
                                  <option value="corp-collab">Corporate Partnership Proposal</option>
                                  <option value="grad-school">Graduate School Admission Letter</option>
                                  <option value="admin-permit">Administrative Permit / Clearance Request</option>
                                </>
                              ) : (
                                <>
                                  <option value="stem-teacher">STEM Teacher (Mathematics & Physics)</option>
                                  <option value="university-lecturer">University Lecturer / Academic Fellow</option>
                                  <option value="civil-engineer">Civil / Structural Engineering Specialist</option>
                                  <option value="architect">Architect & Space Designer</option>
                                  <option value="project-manager">Senior Projects / Operations Manager</option>
                                  <option value="it-developer">Software Engineer & IT Developer</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Special highlights, achievements or custom goals (Optional)</label>
                          <textarea
                            rows={2}
                            value={customInstruction}
                            onChange={(e) => setCustomInstruction(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-200 outline-none focus:border-amber-500 text-xs placeholder:text-slate-600"
                            placeholder="e.g., Mention my 8 years of teaching math, 94% advanced-level success, or structural design skills for municipal bridges."
                          />
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
                          <div className="text-[10px] text-slate-500 font-medium">
                            *Uses sender and recipient fields below to construct official headers automatically.
                          </div>
                          <button
                            type="button"
                            disabled={isGenerating}
                            onClick={handleGenerateLetter}
                            className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-850 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-1.5 shrink-0"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {isGenerating ? 'Generating Letter...' : 'Generate Real-Life Letter'}
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-slate-800/80 pt-4 mt-6">
                        <h4 className="text-white font-bold font-mono uppercase tracking-widest text-[11px] mb-4 text-slate-400">Manual Letter Fields Configuration</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Document Record Title</label>
                          <input
                            type="text"
                            value={letterForm.title || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, title: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., Job Application Letter"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Sender Name</label>
                          <input
                            type="text"
                            value={letterForm.senderName || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, senderName: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., Grace Ngo Nyemb"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Sender Professional Title</label>
                          <input
                            type="text"
                            value={letterForm.senderTitle || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, senderTitle: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., Lead Mathematics Educator"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Sender Email</label>
                          <input
                            type="email"
                            value={letterForm.senderEmail || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, senderEmail: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., grace.nyemb@gmail.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Sender Phone</label>
                          <input
                            type="text"
                            value={letterForm.senderPhone || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, senderPhone: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., +237 6..."
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Sender Address</label>
                          <input
                            type="text"
                            value={letterForm.senderAddress || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, senderAddress: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., Bastos, Yaounde"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Sender NIU / ID (Optional)</label>
                          <input
                            type="text"
                            value={letterForm.senderNiu || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, senderNiu: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., M081..."
                          />
                        </div>
                      </div>

                      <h4 className="text-white font-bold font-mono uppercase tracking-wide border-t border-slate-800 pt-4 mt-2">Recipient Information</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Recipient Name / Board</label>
                          <input
                            type="text"
                            value={letterForm.recipientName || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, recipientName: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., The Principal / Director of Academics"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Recipient Professional Title</label>
                          <input
                            type="text"
                            value={letterForm.recipientTitle || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, recipientTitle: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., Director / Head of Board"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Recipient Company / School</label>
                          <input
                            type="text"
                            value={letterForm.recipientCompany || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, recipientCompany: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., Government Bilingual High School"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Recipient Full Address</label>
                          <input
                            type="text"
                            value={letterForm.recipientAddress || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, recipientAddress: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., Molyko, Buea, SWR, Cameroon"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4 mt-2">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Document Date</label>
                          <input
                            type="text"
                            value={letterForm.date || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, date: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Letter Salutation</label>
                          <input
                            type="text"
                            value={letterForm.salutation || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, salutation: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="e.g., Dear Board of Directors,"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Official Subject Line</label>
                        <input
                          type="text"
                          value={letterForm.subject || ''}
                          onChange={(e) => setLetterForm({ ...letterForm, subject: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none font-bold text-amber-500"
                          placeholder="e.g., APPLICATION FOR THE POST OF MATHEMATICS INSTRUCTOR"
                        />
                      </div>

                      {/* Paragraph Builder */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                          <span className="text-white font-bold font-mono uppercase tracking-wide">Letter Body Paragraphs</span>
                          <button
                            type="button"
                            onClick={addParagraph}
                            className="text-amber-500 font-bold flex items-center gap-1 hover:text-amber-400 transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Add Paragraph
                          </button>
                        </div>

                        {(letterForm.bodyParagraphs || []).map((para, index) => (
                          <div key={index} className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative space-y-2">
                            <button
                              type="button"
                              onClick={() => removeParagraph(index)}
                              className="absolute top-3 right-3 text-red-500 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] font-mono text-amber-500 uppercase font-bold">Paragraph #{index + 1}</span>
                            <textarea
                              rows={3}
                              value={para}
                              onChange={(e) => updateParagraph(index, e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-white"
                              placeholder="Type paragraph content..."
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Sign-off / Valediction</label>
                          <input
                            type="text"
                            value={letterForm.signoff || ''}
                            onChange={(e) => setLetterForm({ ...letterForm, signoff: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-white outline-none"
                            placeholder="Yours faithfully,"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LIVE A4 PRINT PREVIEW */}
              {isPreviewing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-300 font-mono flex items-center gap-2 uppercase tracking-widest">
                      <Eye className="w-4 h-4 text-amber-500" />
                      Live A4 Print Preview
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">210mm x 297mm (Standard Letterhead Dimensions)</span>
                  </div>

                  {mode === 'cv' && activeCV ? (
                    (() => {
                      const template = activeCV.templateId || 'modern-sidebar';
                      const accentColor = activeCV.accentColor || '#1e40af';
                      const fontSize = activeCV.fontSize || 'medium';

                      // Font size mapping
                      const bodyFontSize = 
                        fontSize === 'small' ? 'text-[10px]' : 
                        fontSize === 'large' ? 'text-[12px] md:text-[13px]' : 'text-[11px] md:text-[12px]';
                      
                      const headingSize = 
                        fontSize === 'small' ? 'text-xs' : 
                        fontSize === 'large' ? 'text-sm' : 'text-xs md:text-[13px]';

                      // Helper initials
                      const initials = activeCV.fullName
                        ? activeCV.fullName.split(' ').filter(n => n.trim()).map(n => n[0]).slice(0, 2).join('').toUpperCase()
                        : 'CV';

                      // -----------------------------------------------------
                      // 1. MODERN SIDEBAR LAYOUT PREVIEW
                      // -----------------------------------------------------
                      if (template === 'modern-sidebar') {
                        return (
                          <div className={`bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-100 max-w-4xl mx-auto font-sans grid grid-cols-12 overflow-hidden ${bodyFontSize}`}>
                            {/* Left Sidebar Column */}
                            <div className="col-span-4 bg-slate-900 text-slate-100 p-6 flex flex-col gap-6 border-l-4" style={{ borderColor: accentColor }}>
                              {/* Photo / Avatar */}
                              <div className="flex flex-col items-center gap-3">
                                {activeCV.profilePhoto ? (
                                  <img 
                                    src={activeCV.profilePhoto} 
                                    alt={activeCV.fullName} 
                                    className="w-24 h-24 rounded-lg object-cover shadow-lg border-2"
                                    style={{ borderColor: accentColor }}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-24 h-24 rounded-lg flex items-center justify-center font-bold text-2xl text-white shadow-lg" style={{ backgroundColor: accentColor }}>
                                    {initials}
                                  </div>
                                )}
                              </div>

                              {/* Contacts */}
                              <div className="space-y-3">
                                <h4 className={`font-extrabold uppercase tracking-widest border-b pb-1`} style={{ color: accentColor, borderColor: `${accentColor}30` }}>
                                  Contact Info
                                </h4>
                                <div className="space-y-2 text-[10px] text-slate-300 break-all">
                                  <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} /> {activeCV.email}</div>
                                  <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} /> {activeCV.phone}</div>
                                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} /> {activeCV.address}</div>
                                  {activeCV.website && <div className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} /> {activeCV.website}</div>}
                                  {activeCV.niu && <div className="font-mono text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 inline-block">NIU: {activeCV.niu}</div>}
                                </div>
                              </div>

                              {/* Skills */}
                              {activeCV.skills && activeCV.skills.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className={`font-extrabold uppercase tracking-widest border-b pb-1`} style={{ color: accentColor, borderColor: `${accentColor}30` }}>
                                    Key Skills
                                  </h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {activeCV.skills.map((skill, idx) => (
                                      <span key={idx} className="bg-slate-800 text-slate-100 text-[9px] px-2 py-0.5 rounded font-medium">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Languages */}
                              {activeCV.languages && activeCV.languages.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className={`font-extrabold uppercase tracking-widest border-b pb-1`} style={{ color: accentColor, borderColor: `${accentColor}30` }}>
                                    Languages
                                  </h4>
                                  <p className="text-[10px] text-slate-300">{activeCV.languages.join(', ')}</p>
                                </div>
                              )}

                              {/* Certifications */}
                              {activeCV.certifications && activeCV.certifications.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className={`font-extrabold uppercase tracking-widest border-b pb-1`} style={{ color: accentColor, borderColor: `${accentColor}30` }}>
                                    Credentials
                                  </h4>
                                  <ul className="space-y-1.5 text-[10px] text-slate-300 list-disc list-inside">
                                    {activeCV.certifications.map((cert, idx) => (
                                      <li key={idx} className="leading-tight">{cert}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Right Main Column */}
                            <div className="col-span-8 p-10 flex flex-col gap-6">
                              {/* Header Title Block */}
                              <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">{activeCV.fullName}</h1>
                                <h3 className="text-xs font-bold uppercase tracking-widest mt-2" style={{ color: accentColor }}>{activeCV.professionalTitle}</h3>
                              </div>

                              {/* Profile Summary */}
                              <div className="space-y-2">
                                <h4 className={`font-black uppercase tracking-wider border-b pb-1 text-slate-900 ${headingSize}`} style={{ borderColor: `${accentColor}40` }}>
                                  Professional Statement
                                </h4>
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{activeCV.summary}</p>
                              </div>

                              {/* Experiences */}
                              {activeCV.experiences && activeCV.experiences.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className={`font-black uppercase tracking-wider border-b pb-1 text-slate-900 ${headingSize}`} style={{ borderColor: `${accentColor}40` }}>
                                    Work History
                                  </h4>
                                  <div className="space-y-4">
                                    {activeCV.experiences.map((exp) => (
                                      <div key={exp.id} className="space-y-1">
                                        <div className="flex justify-between items-baseline">
                                          <h5 className="font-bold text-slate-900 text-xs md:text-[13px]">{exp.role}</h5>
                                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{exp.dateRange}</span>
                                        </div>
                                        <p className="text-[10px] font-bold" style={{ color: accentColor }}>{exp.company} &bull; <span className="text-slate-500 font-normal">{exp.location}</span></p>
                                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-[10px] md:text-[11px]">{exp.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Education */}
                              {activeCV.educations && activeCV.educations.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className={`font-black uppercase tracking-wider border-b pb-1 text-slate-900 ${headingSize}`} style={{ borderColor: `${accentColor}40` }}>
                                    Education & Qualifications
                                  </h4>
                                  <div className="space-y-3">
                                    {activeCV.educations.map((edu) => (
                                      <div key={edu.id} className="space-y-1">
                                        <div className="flex justify-between items-baseline">
                                          <h5 className="font-bold text-slate-900 text-xs md:text-[13px]">{edu.degree}</h5>
                                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{edu.dateRange}</span>
                                        </div>
                                        <p className="text-[10px] font-semibold text-slate-700">{edu.school} &bull; <span className="font-normal">{edu.location}</span></p>
                                        {edu.details && <p className="text-slate-500 leading-relaxed whitespace-pre-wrap text-[10px] md:text-[11px]">{edu.details}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // -----------------------------------------------------
                      // 2. CLASSIC EXECUTIVE LAYOUT PREVIEW
                      // -----------------------------------------------------
                      if (template === 'classic-executive') {
                        return (
                          <div className={`bg-white text-slate-900 p-10 shadow-2xl rounded-2xl border border-slate-100 max-w-4xl mx-auto font-sans flex flex-col gap-6 ${bodyFontSize}`}>
                            {/* Thin Accent top bar */}
                            <div className="h-2 w-full rounded" style={{ backgroundColor: accentColor }} />

                            {/* Top header layout */}
                            <div className="flex items-start justify-between gap-6 border-b pb-4 border-slate-100">
                              <div className="space-y-2">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">{activeCV.fullName}</h1>
                                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>{activeCV.professionalTitle}</h3>
                                <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                                  <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {activeCV.email}</span>
                                  <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {activeCV.phone}</span>
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {activeCV.address}</span>
                                  {activeCV.website && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-slate-400" /> {activeCV.website}</span>}
                                </div>
                              </div>

                              {activeCV.profilePhoto ? (
                                <img 
                                  src={activeCV.profilePhoto} 
                                  alt={activeCV.fullName} 
                                  className="w-20 h-20 rounded-full object-cover shadow border"
                                  style={{ borderColor: accentColor }}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-lg text-white shadow" style={{ backgroundColor: accentColor }}>
                                  {initials}
                                </div>
                              )}
                            </div>

                            {/* Two Column Grid */}
                            <div className="grid grid-cols-12 gap-6">
                              {/* Left main area (col-span-8) */}
                              <div className="col-span-8 space-y-6">
                                {/* Profile Summary */}
                                <div className="space-y-2">
                                  <h4 className={`font-black uppercase tracking-wider border-b pb-1 text-slate-900 ${headingSize}`} style={{ borderColor: `${accentColor}40` }}>
                                    Professional Statement
                                  </h4>
                                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{activeCV.summary}</p>
                                </div>

                                {/* Experience */}
                                {activeCV.experiences && activeCV.experiences.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className={`font-black uppercase tracking-wider border-b pb-1 text-slate-900 ${headingSize}`} style={{ borderColor: `${accentColor}40` }}>
                                      Work History
                                    </h4>
                                    <div className="space-y-4">
                                      {activeCV.experiences.map((exp) => (
                                        <div key={exp.id} className="space-y-1">
                                          <div className="flex justify-between items-baseline">
                                            <h5 className="font-bold text-slate-900 text-xs md:text-[13px]">{exp.role}</h5>
                                            <span className="text-[10px] font-bold text-slate-500">{exp.dateRange}</span>
                                          </div>
                                          <p className="text-[10px] font-bold" style={{ color: accentColor }}>{exp.company} &bull; <span className="text-slate-500 font-normal">{exp.location}</span></p>
                                          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-[10px] md:text-[11px]">{exp.description}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Education */}
                                {activeCV.educations && activeCV.educations.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className={`font-black uppercase tracking-wider border-b pb-1 text-slate-900 ${headingSize}`} style={{ borderColor: `${accentColor}40` }}>
                                      Education & Academics
                                    </h4>
                                    <div className="space-y-3">
                                      {activeCV.educations.map((edu) => (
                                        <div key={edu.id} className="space-y-1">
                                          <div className="flex justify-between items-baseline">
                                            <h5 className="font-bold text-slate-900 text-xs md:text-[13px]">{edu.degree}</h5>
                                            <span className="text-[10px] font-bold text-slate-500">{edu.dateRange}</span>
                                          </div>
                                          <p className="text-[10px] font-semibold text-slate-700">{edu.school} &bull; <span className="font-normal">{edu.location}</span></p>
                                          {edu.details && <p className="text-slate-500 leading-relaxed whitespace-pre-wrap text-[10px] md:text-[11px]">{edu.details}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right sidebar details (col-span-4) */}
                              <div className="col-span-4 bg-slate-50 p-4 rounded-xl space-y-6">
                                {/* Skills */}
                                {activeCV.skills && activeCV.skills.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="font-black uppercase tracking-wider text-slate-900 text-xs border-b pb-1" style={{ borderColor: `${accentColor}40` }}>
                                      Skills
                                    </h4>
                                    <div className="flex flex-col gap-1.5 text-[10px]">
                                      {activeCV.skills.map((skill, i) => (
                                        <span key={i} className="text-slate-700 font-medium flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Languages */}
                                {activeCV.languages && activeCV.languages.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="font-black uppercase tracking-wider text-slate-900 text-xs border-b pb-1" style={{ borderColor: `${accentColor}40` }}>
                                      Languages
                                    </h4>
                                    <p className="text-slate-600 text-[10px]">{activeCV.languages.join(', ')}</p>
                                  </div>
                                )}

                                {/* Certifications */}
                                {activeCV.certifications && activeCV.certifications.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="font-black uppercase tracking-wider text-slate-900 text-xs border-b pb-1" style={{ borderColor: `${accentColor}40` }}>
                                      Credentials
                                    </h4>
                                    <ul className="text-slate-600 text-[9px] space-y-1 list-disc list-inside leading-tight">
                                      {activeCV.certifications.map((cert, i) => (
                                        <li key={i}>{cert}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // -----------------------------------------------------
                      // 3. CREATIVE GOLD LAYOUT PREVIEW
                      // -----------------------------------------------------
                      return (
                        <div className={`bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-100 max-w-4xl mx-auto font-sans overflow-hidden ${bodyFontSize}`}>
                          {/* Colored Top Banner */}
                          <div className="p-8 text-center text-white relative flex flex-col items-center justify-center gap-2" style={{ backgroundColor: accentColor }}>
                            <h1 className="text-3xl font-black tracking-tight uppercase leading-none">{activeCV.fullName}</h1>
                            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-100">{activeCV.professionalTitle}</h3>
                            <div className="text-[10px] text-slate-100 flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1 opacity-90">
                              <span>Email: {activeCV.email}</span>
                              <span>Phone: {activeCV.phone}</span>
                              <span>Address: {activeCV.address}</span>
                              {activeCV.website && <span>Web: {activeCV.website}</span>}
                            </div>
                          </div>

                          {/* Centered Photo overlapping the banner */}
                          <div className="flex justify-center -mt-8 relative z-10">
                            {activeCV.profilePhoto ? (
                              <img 
                                src={activeCV.profilePhoto} 
                                alt={activeCV.fullName} 
                                className="w-24 h-24 rounded-full object-cover shadow-xl border-4 border-white bg-white"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-xl border-4 border-white" style={{ backgroundColor: accentColor }}>
                                {initials}
                              </div>
                            )}
                          </div>

                          {/* Inner Content spacing */}
                          <div className="p-10 space-y-6">
                            {/* Summary */}
                            <div className="space-y-2">
                              <h4 className={`font-black uppercase tracking-wider text-center pb-1 text-slate-900 border-b ${headingSize}`} style={{ borderColor: `${accentColor}40` }}>
                                Professional Profile
                              </h4>
                              <p className="text-slate-700 leading-relaxed text-center whitespace-pre-wrap max-w-2xl mx-auto">{activeCV.summary}</p>
                            </div>

                            {/* Work history */}
                            {activeCV.experiences && activeCV.experiences.length > 0 && (
                              <div className="space-y-4">
                                <h4 className={`font-black uppercase tracking-wider pb-1 text-slate-900 border-b ${headingSize}`} style={{ borderColor: `${accentColor}40` }}>
                                  Experience & Work History
                                </h4>
                                <div className="space-y-4 pl-1">
                                  {activeCV.experiences.map((exp) => (
                                    <div key={exp.id} className="space-y-1">
                                      <div className="flex justify-between items-baseline">
                                        <h5 className="font-bold text-slate-900 text-xs md:text-[13px]">{exp.role}</h5>
                                        <span className="text-[10px] font-bold text-slate-500">{exp.dateRange}</span>
                                      </div>
                                      <p className="text-[10px] font-semibold" style={{ color: accentColor }}>{exp.company} &bull; <span className="text-slate-500 font-normal">{exp.location}</span></p>
                                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-[10px] md:text-[11px]">{exp.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Education */}
                            {activeCV.educations && activeCV.educations.length > 0 && (
                              <div className="space-y-4">
                                <h4 className={`font-black uppercase tracking-wider pb-1 text-slate-900 border-b ${headingSize}`} style={{ borderColor: `${accentColor}40` }}>
                                  Academic Credentials
                                </h4>
                                <div className="space-y-3 pl-1">
                                  {activeCV.educations.map((edu) => (
                                    <div key={edu.id} className="space-y-1">
                                      <div className="flex justify-between items-baseline">
                                        <h5 className="font-bold text-slate-900 text-xs md:text-[13px]">{edu.degree}</h5>
                                        <span className="text-[10px] font-bold text-slate-500">{edu.dateRange}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-700 font-semibold">{edu.school} &bull; <span className="font-normal">{edu.location}</span></p>
                                      {edu.details && <p className="text-slate-500 leading-relaxed whitespace-pre-wrap text-[10px] md:text-[11px]">{edu.details}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dynamic lists for skills languages and certs */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                              <div>
                                <h5 className="font-bold text-slate-900 text-xs uppercase mb-1">Key Competencies</h5>
                                <div className="flex flex-wrap gap-1">
                                  {activeCV.skills.map((skill, idx) => (
                                    <span key={idx} className="bg-slate-100 text-slate-800 text-[9px] px-2 py-0.5 rounded font-medium">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-900 text-xs uppercase mb-1">Languages</h5>
                                <p className="text-slate-600 text-[10px] leading-relaxed">{activeCV.languages.join(', ')}</p>
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-900 text-xs uppercase mb-1">Additional Certifications</h5>
                                <ul className="text-slate-600 text-[9px] list-disc list-inside leading-tight space-y-0.5">
                                  {activeCV.certifications.map((cert, idx) => (
                                    <li key={idx}>{cert}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : activeLetter ? (
                    <div className="bg-white text-slate-900 p-16 shadow-2xl rounded-2xl border border-slate-100 max-w-4xl mx-auto font-sans leading-relaxed text-xs">
                      {/* Letterhead Accents */}
                      <div className="h-1 bg-amber-500 w-full mb-8" />

                      {/* Sender details (Right aligned) */}
                      <div className="text-right space-y-0.5 mb-12 text-[10px] text-slate-600">
                        <h4 className="font-bold text-slate-900 text-xs">{activeLetter.senderName}</h4>
                        <p>{activeLetter.senderTitle}</p>
                        <p className="whitespace-pre-wrap">{activeLetter.senderAddress}</p>
                        <p>Email: {activeLetter.senderEmail}</p>
                        <p>Phone: {activeLetter.senderPhone}</p>
                        {activeLetter.senderNiu && <p className="font-mono text-[9px]">NIU: {activeLetter.senderNiu}</p>}
                      </div>

                      {/* Recipient Details (Left Aligned) */}
                      <div className="space-y-0.5 mb-8 text-[11px] text-slate-800">
                        <p className="font-bold text-[10px] text-slate-400">TO:</p>
                        <h4 className="font-bold text-slate-900">{activeLetter.recipientName}</h4>
                        <p>{activeLetter.recipientTitle}</p>
                        <p className="font-semibold text-amber-600">{activeLetter.recipientCompany}</p>
                        <p className="whitespace-pre-wrap">{activeLetter.recipientAddress}</p>
                      </div>

                      {/* Date */}
                      <p className="text-slate-500 font-medium mb-6 text-[10px]">Date: {activeLetter.date}</p>

                      {/* Subject */}
                      <div className="mb-6 font-black text-slate-900 uppercase border-b border-slate-200 pb-1.5 text-[11px] tracking-wide">
                        SUBJECT: {activeLetter.subject}
                      </div>

                      {/* Salutation */}
                      <p className="text-slate-900 font-bold mb-4">{activeLetter.salutation}</p>

                      {/* Letter Body */}
                      <div className="space-y-4 text-slate-700 leading-relaxed pl-1 text-[11px] mb-8">
                        {activeLetter.bodyParagraphs.map((para, i) => (
                          <p key={i} className="whitespace-pre-wrap">{para}</p>
                        ))}
                      </div>

                      {/* Sign-off */}
                      <div className="space-y-12">
                        <p className="text-slate-900">{activeLetter.signoff}</p>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{activeLetter.senderName}</h4>
                          <p className="text-[10px] text-slate-500">{activeLetter.senderTitle}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showPrintModal && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 overflow-y-auto p-4 md:p-8 custom-scrollbar print-modal-container animate-in fade-in duration-300">
          <style>{`
            @media print {
              #root {
                display: none !important;
              }
              .print-hide-element, .print-hide-element * {
                display: none !important;
                visibility: hidden !important;
              }
              body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .print-modal-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
                padding: 0 !important;
                overflow: visible !important;
              }
              .print-preview-content {
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 10mm !important;
                width: 100% !important;
                max-width: 100% !important;
                background: white !important;
                color: black !important;
              }
            }
          `}</style>
          {/* Header / Actions - hidden during print */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl mb-6 print-hide-element">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Printer className="w-5 h-5 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-sm tracking-wide uppercase">Print Setup & Document Preview</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">uses standard CSS @media print queries for perfect fit</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase px-5 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Now / Save PDF
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>

          {/* Document canvas */}
          <div className="flex-1 w-full flex justify-center pb-12">
            <div className="print-preview-content w-full max-w-[210mm] min-h-[297mm] shadow-2xl bg-white text-slate-950 rounded-2xl overflow-hidden p-8 md:p-12">
              {mode === 'cv' ? (
                (() => {
                  const data = cvForm; // Use current draft form state for instant reactive preview!
                  const template = data.templateId || 'modern-sidebar';
                  const accentColor = data.accentColor || '#1e40af';
                  const fontSize = data.fontSize || 'medium';

                  const bodyFontSize = 
                    fontSize === 'small' ? 'text-[10px]' : 
                    fontSize === 'large' ? 'text-[13px]' : 'text-[11px]';
                  
                  const headingSize = 
                    fontSize === 'small' ? 'text-xs' : 
                    fontSize === 'large' ? 'text-sm' : 'text-xs md:text-[13px]';

                  const initials = data.fullName
                    ? data.fullName.split(' ').filter(n => n.trim()).map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'CV';

                  if (template === 'modern-sidebar') {
                    return (
                      <div className={`grid grid-cols-12 min-h-[297mm] ${bodyFontSize}`}>
                        {/* Left Sidebar Column */}
                        <div className="col-span-4 bg-slate-900 text-slate-100 p-6 flex flex-col gap-6 border-l-4" style={{ borderColor: accentColor }}>
                          <div className="flex flex-col items-center gap-3">
                            {data.profilePhoto ? (
                              <img 
                                src={data.profilePhoto} 
                                alt={data.fullName} 
                                className="w-24 h-24 rounded-lg object-cover shadow-lg border-2"
                                style={{ borderColor: accentColor }}
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-lg flex items-center justify-center font-bold text-2xl text-white shadow-lg" style={{ backgroundColor: accentColor }}>
                                {initials}
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-extrabold uppercase tracking-widest border-b pb-1 text-[10px]" style={{ color: accentColor, borderColor: `${accentColor}30` }}>
                              Contact Info
                            </h4>
                            <div className="space-y-2 text-[10px] text-slate-300 break-all">
                              <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {data.email || 'N/A'}</div>
                              <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {data.phone || 'N/A'}</div>
                              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {data.address || 'N/A'}</div>
                              {data.website && <div className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {data.website}</div>}
                              {data.niu && <div className="font-mono text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 inline-block">NIU: {data.niu}</div>}
                            </div>
                          </div>

                          {data.skills && data.skills.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-extrabold uppercase tracking-widest border-b pb-1 text-[10px]" style={{ color: accentColor, borderColor: `${accentColor}30` }}>
                                Key Skills
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {data.skills.map((skill, idx) => (
                                  <span key={idx} className="bg-slate-800 text-slate-200 text-[9px] px-2 py-0.5 rounded font-medium border border-slate-700">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {data.languages && data.languages.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-extrabold uppercase tracking-widest border-b pb-1 text-[10px]" style={{ color: accentColor, borderColor: `${accentColor}30` }}>
                                Languages
                              </h4>
                              <div className="text-[10px] text-slate-300 font-medium">
                                {data.languages.join('  |  ')}
                              </div>
                            </div>
                          )}

                          {data.certifications && data.certifications.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-extrabold uppercase tracking-widest border-b pb-1 text-[10px]" style={{ color: accentColor, borderColor: `${accentColor}30` }}>
                                Certifications
                              </h4>
                              <ul className="text-[9px] text-slate-400 list-disc list-inside space-y-1">
                                {data.certifications.map((cert, idx) => (
                                  <li key={idx} className="truncate">{cert}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Right main column */}
                        <div className="col-span-8 bg-white text-slate-900 p-8 flex flex-col gap-6">
                          <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{data.fullName || 'FULL NAME'}</h1>
                            <div className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: accentColor }}>{data.professionalTitle || 'PROFESSIONAL TITLE'}</div>
                          </div>

                          <div className="space-y-2">
                            <h4 className={`font-extrabold uppercase tracking-widest pb-1 border-b text-slate-900 ${headingSize}`} style={{ borderColor: `${accentColor}30` }}>
                              Professional Statement
                            </h4>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{data.summary || 'Write your professional profile...'}</p>
                          </div>

                          {data.experiences && data.experiences.length > 0 && (
                            <div className="space-y-4">
                              <h4 className={`font-extrabold uppercase tracking-widest pb-1 border-b text-slate-900 ${headingSize}`} style={{ borderColor: `${accentColor}30` }}>
                                Work History
                              </h4>
                              <div className="space-y-4">
                                {data.experiences.map((exp) => (
                                  <div key={exp.id} className="space-y-1">
                                    <div className="flex justify-between items-baseline">
                                      <h5 className="font-bold text-slate-900 text-xs">{exp.role}</h5>
                                      <span className="text-[10px] font-bold text-slate-500">{exp.dateRange}</span>
                                    </div>
                                    <p className="text-[10px] font-semibold" style={{ color: accentColor }}>{exp.company} &bull; <span className="text-slate-500 font-normal">{exp.location}</span></p>
                                    <p className="text-slate-650 leading-relaxed whitespace-pre-wrap text-[10px]">{exp.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {data.educations && data.educations.length > 0 && (
                            <div className="space-y-4">
                              <h4 className={`font-extrabold uppercase tracking-widest pb-1 border-b text-slate-900 ${headingSize}`} style={{ borderColor: `${accentColor}30` }}>
                                Education & Academics
                              </h4>
                              <div className="space-y-3">
                                {data.educations.map((edu) => (
                                  <div key={edu.id} className="space-y-1">
                                    <div className="flex justify-between items-baseline">
                                      <h5 className="font-bold text-slate-900 text-xs">{edu.degree}</h5>
                                      <span className="text-[10px] font-bold text-slate-500">{edu.dateRange}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-700 font-semibold">{edu.school} &bull; <span className="font-normal text-slate-500">{edu.location}</span></p>
                                    {edu.details && <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-[10px]">{edu.details}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (template === 'classic-executive') {
                    return (
                      <div className={`p-10 space-y-6 ${bodyFontSize}`}>
                        <div className="flex justify-between items-start border-b-2 pb-4" style={{ borderColor: accentColor }}>
                          <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{data.fullName || 'FULL NAME'}</h1>
                            <div className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: accentColor }}>{data.professionalTitle || 'PROFESSIONAL TITLE'}</div>
                            <div className="text-[10px] text-slate-500 mt-2 space-y-0.5">
                              <p>{data.email} | {data.phone}</p>
                              <p>{data.address}</p>
                              {data.website && <p>{data.website}</p>}
                              {data.niu && <p className="font-mono text-[9px] text-amber-600">NIU: {data.niu}</p>}
                            </div>
                          </div>
                          {data.profilePhoto && (
                            <img 
                              src={data.profilePhoto} 
                              alt={data.fullName} 
                              className="w-20 h-20 rounded-full object-cover shadow-md border-2"
                              style={{ borderColor: accentColor }}
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>

                        <div className="grid grid-cols-12 gap-8">
                          {/* Main content col */}
                          <div className="col-span-8 space-y-6">
                            <div className="space-y-2">
                              <h4 className={`font-extrabold uppercase tracking-widest pb-1 border-b text-slate-900 ${headingSize}`} style={{ borderColor: `${accentColor}30` }}>
                                Professional Profile
                              </h4>
                              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{data.summary}</p>
                            </div>

                            {data.experiences && data.experiences.length > 0 && (
                              <div className="space-y-4">
                                <h4 className={`font-extrabold uppercase tracking-widest pb-1 border-b text-slate-900 ${headingSize}`} style={{ borderColor: `${accentColor}30` }}>
                                  Professional Experience
                                </h4>
                                <div className="space-y-4">
                                  {data.experiences.map((exp) => (
                                    <div key={exp.id} className="space-y-1">
                                      <div className="flex justify-between items-baseline">
                                        <h5 className="font-bold text-slate-900 text-xs">{exp.role}</h5>
                                        <span className="text-[10px] font-bold text-slate-500">{exp.dateRange}</span>
                                      </div>
                                      <p className="text-[10px] font-semibold" style={{ color: accentColor }}>{exp.company} &bull; <span className="text-slate-500 font-normal">{exp.location}</span></p>
                                      <p className="text-slate-650 leading-relaxed whitespace-pre-wrap text-[10px]">{exp.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {data.educations && data.educations.length > 0 && (
                              <div className="space-y-4">
                                <h4 className={`font-extrabold uppercase tracking-widest pb-1 border-b text-slate-900 ${headingSize}`} style={{ borderColor: `${accentColor}30` }}>
                                  Education & Academics
                                </h4>
                                <div className="space-y-3">
                                  {data.educations.map((edu) => (
                                    <div key={edu.id} className="space-y-1">
                                      <div className="flex justify-between items-baseline">
                                        <h5 className="font-bold text-slate-900 text-xs">{edu.degree}</h5>
                                        <span className="text-[10px] font-bold text-slate-500">{edu.dateRange}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-700 font-semibold">{edu.school} &bull; <span className="font-normal text-slate-500">{edu.location}</span></p>
                                      {edu.details && <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-[10px]">{edu.details}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Sidebar col */}
                          <div className="col-span-4 space-y-6 bg-slate-50 p-4 rounded-xl border border-slate-100 h-fit">
                            {data.skills && data.skills.length > 0 && (
                              <div>
                                <h5 className="font-bold text-slate-900 text-[10px] uppercase mb-2 tracking-wider">Key Skills</h5>
                                <div className="flex flex-wrap gap-1">
                                  {data.skills.map((skill, idx) => (
                                    <span key={idx} className="bg-white text-slate-800 text-[9px] px-2 py-0.5 rounded font-semibold border border-slate-200">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {data.languages && data.languages.length > 0 && (
                              <div>
                                <h5 className="font-bold text-slate-900 text-[10px] uppercase mb-1 tracking-wider">Languages</h5>
                                <p className="text-slate-600 text-[10px] font-medium leading-relaxed">{data.languages.join(', ')}</p>
                              </div>
                            )}

                            {data.certifications && data.certifications.length > 0 && (
                              <div>
                                <h5 className="font-bold text-slate-900 text-[10px] uppercase mb-2 tracking-wider">Certifications</h5>
                                <ul className="text-slate-600 text-[9px] list-disc list-inside leading-tight space-y-1">
                                  {data.certifications.map((cert, idx) => (
                                    <li key={idx}>{cert}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Creative Gold template
                  return (
                    <div className={`p-0 ${bodyFontSize}`}>
                      {/* Gold header block */}
                      <div className="p-8 text-center text-white rounded-xl" style={{ backgroundColor: accentColor }}>
                        <h1 className="text-2xl font-black text-white uppercase tracking-wider">{data.fullName || 'FULL NAME'}</h1>
                        <div className="text-xs font-bold uppercase tracking-widest mt-1 text-amber-300">{data.professionalTitle || 'PROFESSIONAL TITLE'}</div>
                        <div className="text-[10px] text-slate-200 mt-3 flex flex-wrap justify-center gap-3">
                          <span>Email: {data.email}</span>
                          <span>&bull;</span>
                          <span>Phone: {data.phone}</span>
                          <span>&bull;</span>
                          <span>Address: {data.address}</span>
                          {data.website && <><span>&bull;</span><span>Web: {data.website}</span></>}
                          {data.niu && <><span>&bull;</span><span className="font-mono text-amber-200">NIU: {data.niu}</span></>}
                        </div>
                      </div>

                      {data.profilePhoto && (
                        <div className="flex justify-center -mt-8 relative z-10">
                          <img 
                            src={data.profilePhoto} 
                            alt={data.fullName} 
                            className="w-24 h-24 rounded-full object-cover shadow-xl border-4 border-white bg-white"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="p-8 space-y-6">
                        <div className="space-y-2">
                          <h4 className={`font-black uppercase tracking-wider text-center pb-1 text-slate-900 border-b ${headingSize}`} style={{ borderColor: `${accentColor}40` }}>
                            Professional Profile
                          </h4>
                          <p className="text-slate-700 leading-relaxed text-center whitespace-pre-wrap max-w-2xl mx-auto">{data.summary}</p>
                        </div>

                        {data.experiences && data.experiences.length > 0 && (
                          <div className="space-y-4">
                            <h4 className={`font-black uppercase tracking-wider pb-1 text-slate-900 border-b ${headingSize}`} style={{ borderColor: `${accentColor}40` }}>
                              Experience & Work History
                            </h4>
                            <div className="space-y-4">
                              {data.experiences.map((exp) => (
                                <div key={exp.id} className="space-y-1">
                                  <div className="flex justify-between items-baseline">
                                    <h5 className="font-bold text-slate-900 text-xs">{exp.role}</h5>
                                    <span className="text-[10px] font-bold text-slate-500">{exp.dateRange}</span>
                                  </div>
                                  <p className="text-[10px] font-semibold" style={{ color: accentColor }}>{exp.company} &bull; <span className="text-slate-500 font-normal">{exp.location}</span></p>
                                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-[10px]">{exp.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {data.educations && data.educations.length > 0 && (
                          <div className="space-y-4">
                            <h4 className={`font-black uppercase tracking-wider pb-1 text-slate-900 border-b ${headingSize}`} style={{ borderColor: `${accentColor}40` }}>
                              Academic Credentials
                            </h4>
                            <div className="space-y-3">
                              {data.educations.map((edu) => (
                                <div key={edu.id} className="space-y-1">
                                  <div className="flex justify-between items-baseline">
                                    <h5 className="font-bold text-slate-900 text-xs">{edu.degree}</h5>
                                    <span className="text-[10px] font-bold text-slate-500">{edu.dateRange}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-700 font-semibold">{edu.school} &bull; <span className="font-normal text-slate-500">{edu.location}</span></p>
                                  {edu.details && <p className="text-slate-500 leading-relaxed whitespace-pre-wrap text-[10px]">{edu.details}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                          <div>
                            <h5 className="font-bold text-slate-900 text-xs uppercase mb-1">Key Competencies</h5>
                            <div className="flex flex-wrap gap-1">
                              {data.skills.map((skill, idx) => (
                                <span key={idx} className="bg-slate-100 text-slate-800 text-[9px] px-2 py-0.5 rounded font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 text-xs uppercase mb-1">Languages</h5>
                            <p className="text-slate-600 text-[10px] leading-relaxed">{data.languages.join(', ')}</p>
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 text-xs uppercase mb-1">Additional Certifications</h5>
                            <ul className="text-slate-600 text-[9px] list-disc list-inside leading-tight space-y-0.5">
                              {data.certifications.map((cert, idx) => (
                                <li key={idx}>{cert}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const data = letterForm;
                  return (
                    <div className="bg-white text-slate-900 p-8 md:p-12 min-h-[297mm] font-sans leading-relaxed text-xs">
                      {/* Letterhead Accent */}
                      <div className="h-1 bg-amber-500 w-full mb-8" />

                      {/* Sender block */}
                      <div className="text-right space-y-0.5 mb-12 text-[10px] text-slate-600">
                        <h4 className="font-bold text-slate-900 text-xs">{data.senderName || 'Sender Name'}</h4>
                        <p>{data.senderTitle || 'Sender Title'}</p>
                        <p className="whitespace-pre-wrap">{data.senderAddress || 'Sender Address'}</p>
                        <p>Email: {data.senderEmail || 'Sender Email'}</p>
                        <p>Phone: {data.senderPhone || 'Sender Phone'}</p>
                        {data.senderNiu && <p className="font-mono text-[9px]">NIU: {data.senderNiu}</p>}
                      </div>

                      {/* Recipient block */}
                      <div className="space-y-0.5 mb-8 text-[11px] text-slate-800">
                        <p className="font-bold text-[10px] text-slate-400">TO:</p>
                        <h4 className="font-bold text-slate-900">{data.recipientName || 'Recipient Name'}</h4>
                        <p>{data.recipientTitle || 'Recipient Title'}</p>
                        <p className="font-semibold text-amber-600">{data.recipientCompany || 'Recipient Company'}</p>
                        <p className="whitespace-pre-wrap">{data.recipientAddress || 'Recipient Address'}</p>
                      </div>

                      {/* Date */}
                      <p className="text-slate-500 font-medium mb-6 text-[10px]">Date: {data.date || new Date().toLocaleDateString('en-GB')}</p>

                      {/* Subject */}
                      <div className="mb-6 font-black text-slate-900 uppercase border-b border-slate-200 pb-1.5 text-[11px] tracking-wide">
                        SUBJECT: {data.subject || 'SUBJECT OF LETTER'}
                      </div>

                      {/* Salutation */}
                      <p className="text-slate-900 font-bold mb-4">{data.salutation || 'Dear Sir/Madam,'}</p>

                      {/* Body */}
                      <div className="space-y-4 text-slate-750 leading-relaxed pl-1 text-[11px] mb-8 text-justify">
                        {data.bodyParagraphs && data.bodyParagraphs.length > 0 ? (
                          data.bodyParagraphs.map((para, i) => (
                            <p key={i} className="whitespace-pre-wrap">{para}</p>
                          ))
                        ) : (
                          <p className="text-slate-400 italic">No body paragraph added yet...</p>
                        )}
                      </div>

                      {/* Signoff */}
                      <div className="space-y-12">
                        <p className="text-slate-900">{data.signoff || 'Yours faithfully,'}</p>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{data.senderName || 'Sender Name'}</h4>
                          <p className="text-[10px] text-slate-500">{data.senderTitle || 'Sender Title'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
