export type { ReceiptExportModel } from './receiptTypes.ts';

export type ExportModuleType = 
  | 'civil_works'
  | 'articles_of_association'
  | 'blueprints'
  | 'safety_inspections'
  | 'pedagogical_lessons'
  | 'receipts';

export type ExportFormat = 'pdf' | 'docx';

export interface ExportRequestParams {
  moduleType: ExportModuleType;
  recordId: string | number;
  recordVersion?: number | string;
  documentTitle?: string;
  exportFormat: ExportFormat;
  data?: any; // Selected record object
  orientation?: 'portrait' | 'landscape';
  requestedBy?: string;
}

export interface ExportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  record?: any;
}

export interface ExportHistoryLog {
  id?: number | string;
  userEmail: string;
  moduleType: ExportModuleType;
  recordId: string | number;
  documentTitle: string;
  version: string | number;
  format: ExportFormat;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  filename: string;
  errorMessage?: string;
}

// Module Specific Data Models

export interface CivilWorksExportModel {
  recordId: string;
  version?: string | number;
  title: string;
  projectName: string;
  clientName: string;
  contractorName: string;
  siteLocation: string;
  workCategory: string;
  status: string;
  startDate: string;
  completionDate: string;
  progressPercentage: number;
  preparedBy: string;
  checkedBy: string;
  approvedBy: string;
  description: string;
  sitePreparation?: string;
  earthworks?: string;
  foundationWorks?: string;
  concreteWorks?: string;
  structuralWorks?: string;
  drainageAndRoads?: string;
  items: Array<{
    itemNumber: string;
    description: string;
    unit: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  totalAmount: number;
  remarks?: string;
}

export interface ArticlesOfAssociationExportModel {
  recordId: string;
  version?: string | number;
  companyName: string;
  registeredOffice: string;
  registrationNumber: string;
  shareCapital: string;
  shareholders: Array<{
    name: string;
    shares: number;
    percentage: number;
  }>;
  directors: string[];
  adoptionDate: string;
  signatories: Array<{
    name: string;
    title: string;
  }>;
  articles: Array<{
    articleNumber: number | string;
    title: string;
    clauses: Array<{
      clauseNumber: string;
      content: string;
    }>;
  }>;
}

export interface BlueprintExportModel {
  recordId: string;
  drawingCode: string;
  revision: string;
  title: string;
  projectName: string;
  discipline: string; // Architectural, Structural, Civil, MEP
  scale: string;
  siteLocation: string;
  leadEngineer: string;
  checkedBy: string;
  approvedBy: string;
  materialsSpecs: string;
  structuralNotes: string;
  date: string;
  previewImageUrl?: string;
  previewBase64?: string;
  drawingType?: string;
}

export interface SafetyInspectionExportModel {
  recordId: string;
  inspectionCode: string;
  projectName: string;
  siteLocation: string;
  inspectionDate: string;
  inspectorName: string;
  contractorName: string;
  inspectionType: string;
  ppeCompliancePercentage: number;
  status: 'Passed Compliance' | 'Conditional Pass' | 'Failed Audit' | string;
  items: Array<{
    itemNo: number;
    checkItem: string;
    category: string;
    status: 'Pass' | 'Fail' | 'N/A' | 'Requires Attention';
    observation: string;
    correctiveAction: string;
  }>;
  riskAssessment: Array<{
    hazard: string;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    likelihood: string;
    severity: string;
    controlMeasure: string;
  }>;
  correctiveActions: Array<{
    finding: string;
    requiredAction: string;
    responsiblePerson: string;
    dueDate: string;
    status: 'Pending' | 'In Progress' | 'Completed';
  }>;
  hazardsIdentified?: string;
  mandatedActions?: string;
  inspectorSignature?: string;
  siteRepresentativeSignature?: string;
  projectManagerSignature?: string;
}

export interface PedagogicalLessonExportModel {
  recordId: string;
  subject: string;
  topic: string;
  subtopic?: string;
  classLevel: string;
  duration: string;
  syllabusUnit: string;
  cbaGoal: string; // Competency Based Approach Goal
  schoolName: string;
  teacherName: string;
  lessonNumber: string | number;
  term: string;
  academicYear: string;
  learningObjectives: string[];
  prerequisites: string;
  teachingResources: string;
  teacherCoachingAdvice: string;
  developmentStages: Array<{
    stage: string; // Introduction, Presentation, Guided Practice, Assessment, Conclusion
    timeMinutes: number | string;
    teacherActivities: string;
    learnerActivities: string;
    resourcesUsed: string;
    assessmentMethod: string;
  }>;
  homeworkAssignment: string;
}
