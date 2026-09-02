import { pgTable, serial, text, timestamp, integer, boolean, numeric, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users table (Admin, Staff, Clients)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('client'), // admin, staff, client
  theme: text('theme').notNull().default('dark'), // dark, light
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
});

// 3. Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  budget: numeric('budget'),
  location: text('location').notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: text('status').notNull().default('planning'), // planning, in-progress, completed, on-hold
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  image: text('image').notNull(),
  videoUrl: text('video_url'), // Optional 150MB SEO Video Url
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. ProjectProgress table (milestones)
export const projectProgress = pgTable('project_progress', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  milestoneName: text('milestone_name').notNull(),
  percentage: integer('percentage').notNull().default(0),
  date: timestamp('date').notNull().defaultNow(),
  description: text('description').notNull(),
  status: text('status').notNull().default('pending'), // pending, active, completed
});

// 5. BlogPosts table
export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  publishedAt: timestamp('published_at').defaultNow().notNull(),
  image: text('image').notNull(),
  videoUrl: text('video_url'), // Optional 150MB SEO Video Url
  summary: text('summary').notNull(),
  category: text('category').notNull(),
});

// 6. Reviews table (with approval system)
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  authorName: text('author_name').notNull(),
  rating: integer('rating').notNull(),
  text: text('text').notNull(),
  approved: boolean('approved').notNull().default(false),
  approvedAt: timestamp('approved_at'),
  projectName: text('project_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Appointments table
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  serviceName: text('service_name').notNull(),
  appointmentDate: timestamp('appointment_date').notNull(),
  status: text('status').notNull().default('pending'), // pending, confirmed, cancelled, completed
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. ContactMessages table
export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('new'), // new, read, replied
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. NewsletterSubscribers table
export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  status: text('status').notNull().default('subscribed'), // subscribed, unsubscribed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9b. Data Deletion / GDPR / Meta Privacy Requests
export const dataDeletionRequests = pgTable('data_deletion_requests', {
  id: serial('id').primaryKey(),
  trackingCode: text('tracking_code').notNull(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  requestType: text('request_type').notNull().default('all'),
  details: text('details'),
  status: text('status').default('pending').notNull(), // pending, in_progress, completed, rejected
  complianceNotes: text('compliance_notes'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 10. Services table
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  slug: text('slug'),
  name: text('name').notNull(),
  serviceCode: text('service_code'),
  shortDescription: text('short_description'),
  description: text('description').notNull(),
  fullDescription: text('full_description'),
  category: text('category').default('Construction & Execution'),
  status: text('status').default('DRAFT').notNull(), // DRAFT, PUBLISHED, ARCHIVED
  featured: boolean('featured').default(false),
  displayOrder: integer('display_order').default(1),
  priceRange: text('price_range'),
  icon: text('icon').notNull(),
  coverImage: text('cover_image'),
  gallery: json('gallery'),
  supportingDocuments: json('supporting_documents'),
  seoTitle: text('seo_title'),
  metaDescription: text('meta_description'),
  keywords: text('keywords'),
  canonicalSlug: text('canonical_slug'),
  socialTitle: text('social_title'),
  socialDescription: text('social_description'),
  socialImage: text('social_image'),
  overview: text('overview'),
  whatWeDeliver: json('what_we_deliver'),
  deliverables: json('deliverables'),
  processSteps: json('process_steps'),
  typicalProjects: json('typical_projects'),
  industriesServed: json('industries_served'),
  faqs: json('faqs'),
  relatedProjects: json('related_projects'),
  relatedInsights: json('related_insights'),
  sections: json('sections'),
  ctaText: text('cta_text'),
  ctaDestination: text('cta_destination'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 11. GalleryItems table
export const galleryItems = pgTable('gallery_items', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  videoUrl: text('video_url'), // Optional 150MB SEO Video Url
  category: text('category').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. HeroBanners table
export const heroBanners = pgTable('hero_banners', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  imageUrl: text('image_url').notNull(),
  videoUrl: text('video_url'),
  displayOrder: integer('display_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

// 13. CompanyDocuments table
export const companyDocuments = pgTable('company_documents', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  fileUrl: text('file_url').notNull(),
  docType: text('doc_type').notNull(), // safety_policy, certification, quote_template, general
  version: text('version').notNull().default('1.0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. AuditLogs table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id'), // Firebase Auth UID
  userEmail: text('user_email'),
  action: text('action').notNull(), // e.g., 'CREATE_PROJECT', 'APPROVE_REVIEW'
  details: text('details').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// 15. TeamMembers table
export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(), // e.g., "Director", "Lead Architect", "Project Coordinator"
  specialization: text('specialization').notNull(), // e.g., "Civil Engineering", "Geotechnical Analysis"
  image: text('image'), // Photo URL
  email: text('email'), // Contact email
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


// Relationships definitions
export const usersRelations = relations(users, ({ many }) => ({
  blogPosts: many(blogPosts),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  category: one(categories, {
    fields: [projects.categoryId],
    references: [categories.id],
  }),
  progress: many(projectProgress),
}));

export const projectProgressRelations = relations(projectProgress, ({ one }) => ({
  project: one(projects, {
    fields: [projectProgress.projectId],
    references: [projects.id],
  }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}));

// 16. Signed Contracts table for QR verification
export const signedContracts = pgTable('signed_contracts', {
  id: serial('id').primaryKey(),
  contractNo: text('contract_no').notNull().unique(),
  clientName: text('client_name').notNull(),
  clientNiu: text('client_niu'),
  clientEmail: text('client_email'),
  clientAddress: text('client_address'),
  clientCity: text('client_city'),
  contractProject: text('contract_project').notNull(),
  contractProjectLocation: text('contract_project_location'),
  contractValue: text('contract_value').notNull(),
  contractDuration: text('contract_duration'),
  contractScope: text('contract_scope'),
  contractDate: text('contract_date'),
  contractAgreedBalance: text('contract_agreed_balance'),
  contractAdvancePayment: text('contract_advance_payment'),
  representativeName: text('representative_name'),
  representativeTitle: text('representative_title'),
  signatoryTitle: text('signatory_title'),
  typedClientSignature: text('typed_client_signature').notNull(),
  drawnClientSignature: text('drawn_client_signature'),
  verificationToken: text('verification_token').notNull().unique(),
  signedAt: timestamp('signed_at').defaultNow().notNull(),
});

// 17. Signed Receipts table for QR and BAR code verification
export const signedReceipts = pgTable('signed_receipts', {
  id: serial('id').primaryKey(),
  receiptNo: text('receipt_no').notNull().unique(),
  clientName: text('client_name').notNull(),
  clientNiu: text('client_niu'),
  clientEmail: text('client_email'),
  receiptProject: text('receipt_project').notNull(),
  invoiceTotalAmount: text('invoice_total_amount'),
  receiptAmount: text('receipt_amount').notNull(),
  remainingBalance: text('remaining_balance'),
  receiptTaxRate: text('receipt_tax_rate'),
  currency: text('currency').default('XAF'),
  receiptMethod: text('receipt_method').notNull(),
  receiptMemo: text('receipt_memo'),
  receiptSignatory: text('receipt_signatory').notNull(),
  receiptTypedSign: text('receipt_typed_sign').notNull(),
  drawnCfoSignature: text('drawn_cfo_signature'),
  verificationToken: text('verification_token').notNull().unique(),
  version: integer('version').default(1).notNull(),
  status: text('status').default('ISSUED').notNull(),
  signedAt: timestamp('signed_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 17b. Document Export Audit Trail Logs
export const exportHistoryLogs = pgTable('export_history_logs', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  moduleType: text('module_type').notNull(),
  recordId: text('record_id').notNull(),
  documentTitle: text('document_title').notNull(),
  version: text('version').default('1.0').notNull(),
  format: text('format').notNull(), // 'pdf' | 'docx'
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  status: text('status').notNull(), // 'SUCCESS' | 'FAILED'
  filename: text('filename').notNull(),
  errorMessage: text('error_message'),
  metadata: json('metadata'),
});

// 18. User sync data (replaces localStorage persistence for themes, proposals, cvs, Cover letters, compliance ledger overrides, kyc etc.)
export const userSyncData = pgTable('user_sync_data', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Firebase Auth UID
  key: text('key').notNull(), // 'theme', 'madecc_career_cvs', 'madecc_career_letters', 'madecc_aoa_statuses', 'madecc_shareholders_directors', 'madecc_proposals_db'
  value: text('value').notNull(), // JSON payload string
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 19. Cameroon Technical School Lesson Plans table
export const lessonPlans = pgTable('lesson_plans', {
  id: serial('id').primaryKey(),
  lessonId: text('lesson_id').notNull().unique(),
  subjectId: text('subject_id'),
  teacherId: text('teacher_id'),
  departmentId: text('department_id'),
  academicYear: text('academic_year'),
  term: text('term'),
  sequence: text('sequence'),
  week: text('week'),
  lessonDuration: text('lesson_duration'),
  gradeLevel: text('grade_level'),
  topic: text('topic').notNull(),
  keywords: text('keywords'),
  competency: text('competency'),
  learningOutcomes: text('learning_outcomes'),
  versionNumber: text('version_number').default('1.0.0').notNull(),
  status: text('status').default('Draft').notNull(), // 'Draft' | 'Review' | 'Published'
  content: text('content').notNull(), // Full Markdown or rich JSON content representing Parts 1-13
  presentation: text('presentation'), // JSON string representing Part 14 PPT
  worksheet: text('worksheet'), // JSON or Markdown representing Part 15 Student Worksheet
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 20. Syllabus Documents table for metadata storage and automatic alignment
export const syllabusDocuments = pgTable('syllabus_documents', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  fileType: text('file_type').notNull(), // 'pdf', 'docx', 'doc', 'txt'
  extractedText: text('extracted_text').notNull(),
  learningObjectives: text('learning_objectives'),
  curriculumStandards: text('curriculum_standards'),
  keyTopics: text('key_topics'),
  subject: text('subject'),
  gradeLevel: text('grade_level'),
  academicYear: text('academic_year'),
  category: text('category'),
  versionNumber: text('version_number').default('1.0.0'),
  status: text('status').default('processed').notNull(), // 'processing' | 'processed' | 'error' | 'archived' | 'published'
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// 21. BOQs table
export const boqs = pgTable('boqs', {
  id: serial('id').primaryKey(),
  boqReference: text('boq_reference').notNull().unique(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
  projectName: text('project_name').notNull(),
  clientId: integer('client_id').references(() => users.id, { onDelete: 'set null' }),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email'),
  clientNiu: text('client_niu'),
  clientAddress: text('client_address'),
  location: text('location').notNull(),
  description: text('description'),
  datePrepared: timestamp('date_prepared').defaultNow().notNull(),
  preparedBy: text('prepared_by').notNull(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
  revisionNumber: text('revision_number').default('REV-00').notNull(),
  currency: text('currency').default('XAF').notNull(),
  status: text('status').default('DRAFT').notNull(), // DRAFT, PENDING_REVIEW, APPROVED, REJECTED, ARCHIVED, COMPLETED
  overheadPercent: numeric('overhead_percent').default('0').notNull(),
  contingencyPercent: numeric('contingency_percent').default('0').notNull(),
  profitPercent: numeric('profit_percent').default('0').notNull(),
  taxPercent: numeric('tax_percent').default('0').notNull(),
  discountPercent: numeric('discount_percent').default('0'),
  subtotal: numeric('subtotal').default('0').notNull(),
  overheadAmount: numeric('overhead_amount').default('0').notNull(),
  contingencyAmount: numeric('contingency_amount').default('0').notNull(),
  profitAmount: numeric('profit_amount').default('0').notNull(),
  discountAmount: numeric('discount_amount').default('0'),
  transportAmount: numeric('transport_amount').default('0'),
  supervisionAmount: numeric('supervision_amount').default('0'),
  taxAmount: numeric('tax_amount').default('0').notNull(),
  grandTotal: numeric('grand_total').default('0').notNull(),
  notes: text('notes'),
  attachments: json('attachments'),
  aiResults: json('ai_results'),
  metadata: json('metadata'),
  pdfUrl: text('pdf_url'),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  sentToClientAt: timestamp('sent_to_client_at'),
  sentToClientBy: text('sent_to_client_by'),
  consultantName: text('consultant_name'),
  consultantEmail: text('consultant_email'),
  contractType: text('contract_type').default('UNIT_RATE'), // 'LUMP_SUM', 'UNIT_RATE', 'COST_PLUS', 'DESIGN_BUILD', 'FIDIC_RED'
  tenderReference: text('tender_reference'),
  tenderDate: text('tender_date'),
  submissionDeadline: text('submission_deadline'),
  constructionCategory: text('construction_category').default('Commercial'), // 'Residential', 'Commercial', 'High-Rise', 'Infrastructure', 'Industrial'
  tenderMode: text('tender_mode').default('CLIENT_TENDER'), // 'INTERNAL_ESTIMATE', 'CLIENT_TENDER'
  approvalStage: text('approval_stage').default('DRAFT'), // 'DRAFT', 'QS_REVIEW', 'COMMERCIAL_REVIEW', 'TECHNICAL_REVIEW', 'DIRECTOR_APPROVAL', 'SUBMITTED', 'CONTRACT_AWARDED'
  approvalHistory: json('approval_history'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 21.5 Managed Units of Measurement Library
export const boqUnits = pgTable('boq_units', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'Length', 'Area', 'Volume', 'Weight', 'Time', 'Count', 'Masonry', 'Concrete', 'Steel', 'Roofing', 'Doors & Windows', 'Electrical', 'Plumbing', 'External Works'
  description: text('description'),
  isDefault: boolean('is_default').default(false).notNull(),
  isDisabled: boolean('is_disabled').default(false).notNull(),
  isFavourite: boolean('is_favourite').default(false).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 22. BOQ Sections table
export const boqSections = pgTable('boq_sections', {
  id: serial('id').primaryKey(),
  boqId: integer('boq_id').references(() => boqs.id, { onDelete: 'cascade' }).notNull(),
  sectionCode: text('section_code').notNull(),
  title: text('title').notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  subtotal: numeric('subtotal').default('0').notNull(),
});

// 23. BOQ Line Items table
export const boqItems = pgTable('boq_items', {
  id: serial('id').primaryKey(),
  sectionId: integer('section_id').references(() => boqSections.id, { onDelete: 'cascade' }).notNull(),
  boqId: integer('boq_id').references(() => boqs.id, { onDelete: 'cascade' }).notNull(),
  itemNumber: text('item_number').notNull(),
  description: text('description').notNull(),
  unit: text('unit').notNull(),
  quantity: numeric('quantity').default('0').notNull(),
  unitRate: numeric('unit_rate').default('0').notNull(),
  amount: numeric('amount').default('0').notNull(),
  notes: text('notes'),
  measurementBasis: text('measurement_basis'),
  internalMaterialCost: numeric('internal_material_cost').default('0').notNull(),
  internalLabourCost: numeric('internal_labour_cost').default('0').notNull(),
  internalPlantCost: numeric('internal_plant_cost').default('0').notNull(),
  internalOtherCost: numeric('internal_other_cost').default('0').notNull(),
  rateBreakdown: json('rate_breakdown'),
  dimensionSheet: json('dimension_sheet'),
  progressExecutedQty: numeric('progress_executed_qty').default('0'),
  progressExecutedPercent: numeric('progress_executed_percent').default('0'),
  displayOrder: integer('display_order').default(0).notNull(),
});

// 24. BOQ Revisions table
export const boqRevisions = pgTable('boq_revisions', {
  id: serial('id').primaryKey(),
  boqId: integer('boq_id').references(() => boqs.id, { onDelete: 'cascade' }).notNull(),
  revisionNumber: text('revision_number').notNull(),
  snapshotData: text('snapshot_data').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at').defaultNow().notNull(),
  pdfUrl: text('pdf_url'),
  notes: text('notes'),
});

// 25. BOQ Audit Logs table
export const boqAuditLogs = pgTable('boq_audit_logs', {
  id: serial('id').primaryKey(),
  boqId: integer('boq_id').references(() => boqs.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id'),
  userEmail: text('user_email'),
  action: text('action').notNull(),
  details: text('details').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Additional Relations
export const structuralProjects = pgTable('structural_projects', {
  id: serial('id').primaryKey(),
  projectCode: text('project_code').notNull(),
  projectName: text('project_name').notNull(),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email'),
  location: text('location').notNull(),
  preparedBy: text('prepared_by').notNull(),
  status: text('status').default('DRAFT').notNull(),
  designInputs: json('design_inputs'),
  drawings: json('drawings'),
  detectedElements: json('detected_elements'),
  calculationsResult: json('calculations_result'),
  revisionNumber: text('revision_number').default('REV-01').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const boqsRelations = relations(boqs, ({ one, many }) => ({
  project: one(projects, {
    fields: [boqs.projectId],
    references: [projects.id],
  }),
  client: one(users, {
    fields: [boqs.clientId],
    references: [users.id],
  }),
  sections: many(boqSections),
  items: many(boqItems),
  revisions: many(boqRevisions),
  auditLogs: many(boqAuditLogs),
}));

export const boqSectionsRelations = relations(boqSections, ({ one, many }) => ({
  boq: one(boqs, {
    fields: [boqSections.boqId],
    references: [boqs.id],
  }),
  items: many(boqItems),
}));

export const boqItemsRelations = relations(boqItems, ({ one }) => ({
  section: one(boqSections, {
    fields: [boqItems.sectionId],
    references: [boqSections.id],
  }),
  boq: one(boqs, {
    fields: [boqItems.boqId],
    references: [boqs.id],
  }),
}));

// Labour Calculator Table
export const labourCalculations = pgTable('labour_calculations', {
  id: serial('id').primaryKey(),
  quotationRef: text('quotation_ref').notNull(),
  projectName: text('project_name').notNull(),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email'),
  location: text('location').notNull(),
  projectType: text('project_type').notNull(),
  buildingFloors: integer('building_floors').default(1).notNull(),
  date: text('date').notNull(),
  preparedBy: text('prepared_by').notNull(),
  approvedBy: text('approved_by'),
  status: text('status').default('DRAFT').notNull(), // DRAFT, PENDING, FINAL, APPROVED, ARCHIVED, TRASH
  currency: text('currency').default('XAF').notNull(),
  overheadPercent: numeric('overhead_percent').default('10.00'),
  contingencyPercent: numeric('contingency_percent').default('5.00'),
  profitPercent: numeric('profit_percent').default('15.00'),
  discountPercent: numeric('discount_percent').default('0.00'),
  taxPercent: numeric('tax_percent').default('19.25'),
  baseSubtotal: numeric('base_subtotal').default('0.00'),
  overheadAmount: numeric('overhead_amount').default('0.00'),
  contingencyAmount: numeric('contingency_amount').default('0.00'),
  profitAmount: numeric('profit_amount').default('0.00'),
  discountAmount: numeric('discount_amount').default('0.00'),
  taxableNet: numeric('taxable_net').default('0.00'),
  taxAmount: numeric('tax_amount').default('0.00'),
  grandTotal: numeric('grand_total').default('0.00'),
  paidAmount: numeric('paid_amount').default('0.00'),
  balanceDue: numeric('balance_due').default('0.00'),
  revisionNumber: text('revision_number').default('REV-01').notNull(),
  sectionsData: json('sections_data').notNull(), // JSON list of sections & items
  revisionsHistory: json('revisions_history'), // List of past revisions
  auditLogsData: json('audit_logs_data'), // List of audit log actions
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Drawing Upload, Processing, Analysis & Quantity Takeoff Table
export const drawingTakeoffs = pgTable('drawing_takeoffs', {
  id: serial('id').primaryKey(),
  takeoffRef: text('takeoff_ref').notNull(),
  projectName: text('project_name').notNull(),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email'),
  location: text('location').notNull(),
  drawingName: text('drawing_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').default(0),
  fileUrl: text('file_url'),
  mimeType: text('mime_type'),
  metadata: json('metadata'), // pageCount, paperSize, scale, resolution, orientation, hash, softwareOrigin, revision, etc.
  analysisStage: text('analysis_stage').default('Validation').notNull(),
  pipelineLog: json('pipeline_log'), // Array of logs for all 12 stages & recovery attempts
  detectedElements: json('detected_elements').notNull(), // walls, columns, footings, beams, slabs, doors, windows, etc.
  quantitiesData: json('quantities_data').notNull(), // Block count, Concrete m3, Steel kg, Excavation m3, Formwork m2, etc.
  labourEstimateData: json('labour_estimate_data'), // Bronze, Silver, Gold, Platinum package totals and item breakdown
  status: text('status').default('DRAFT').notNull(), // DRAFT, IN_REVIEW, APPROVED, ARCHIVED, SOFT_DELETED
  aiVerified: boolean('ai_verified').default(false).notNull(),
  preparedBy: text('prepared_by').notNull(),
  approvedBy: text('approved_by'),
  approvalNotes: text('approval_notes'),
  revisionNumber: text('revision_number').default('REV-01').notNull(),
  revisionsHistory: json('revisions_history'),
  auditLogsData: json('audit_logs_data'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// MADECC AI CONSTRUCTION INTELLIGENCE TABLES
// ==========================================

// 26. Construction Projects Table
export const constructionProjects = pgTable('construction_projects', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull().unique(),
  projectName: text('project_name').notNull(),
  client: text('client').notNull(),
  contractor: text('contractor'),
  consultant: text('consultant'),
  location: text('location').notNull(),
  gpsCoordinates: text('gps_coordinates'),
  buildingType: text('building_type').notNull().default('Residential'),
  numberOfFloors: integer('number_of_floors').default(1),
  currency: text('currency').notNull().default('XAF'),
  contractSum: numeric('contract_sum').default('0'),
  startDate: text('start_date'),
  completionDate: text('completion_date'),
  projectStatus: text('project_status').notNull().default('Planning'), // Planning, Active, Completed, On-Hold, Archived
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 27. Construction Drawings Table
export const constructionDrawings = pgTable('construction_drawings', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  title: text('title').notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(), // PDF, DWG, DXF, IFC, PNG, JPG
  fileSizeMb: numeric('file_size_mb'),
  category: text('category').notNull().default('Architectural'), // Architectural, Structural, MEP, Civil
  version: text('version').notNull().default('v1.0'),
  uploadedBy: text('uploaded_by'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// 28. Drawing Analysis Output Table
export const drawingAnalysis = pgTable('drawing_analysis', {
  id: serial('id').primaryKey(),
  drawingId: integer('drawing_id'),
  projectId: text('project_id').notNull(),
  detectedElements: json('detected_elements').notNull(), // Rooms, Dimensions, Columns, Beams, Foundations, etc.
  confidenceScore: numeric('confidence_score').default('95.0'),
  engineerStatus: text('engineer_status').default('Pending Review'), // Pending Review, Approved, Rejected
  reviewedBy: text('reviewed_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 29. Quantities Take-Off Table
export const quantitiesTakeoff = pgTable('quantities_takeoff', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  item: text('item').notNull(),
  category: text('category').notNull(), // Earthworks, Foundation, Structure, Architectural, Openings
  description: text('description').notNull(),
  source: text('source'),
  formula: text('formula'),
  quantity: numeric('quantity').notNull().default('0'),
  unit: text('unit').notNull(),
  confidenceLevel: numeric('confidence_level').default('95.0'),
  approved: boolean('approved').default(false),
  approvedBy: text('approved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 30. Construction Programmes (Schedules & Gantt) Table
export const constructionProgrammes = pgTable('construction_programmes', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  programmeName: text('programme_name').notNull(),
  activitiesData: json('activities_data').notNull(), // List of activities, start, duration, dependencies, critical path, % complete
  completionPercentage: numeric('completion_percentage').default('0'),
  status: text('status').default('Draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 31. Procurement Orders & Material Tracking
export const procurementOrders = pgTable('procurement_orders', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  materialName: text('material_name').notNull(),
  quantity: numeric('quantity').notNull().default('0'),
  unit: text('unit').notNull(),
  requiredDate: text('required_date'),
  supplier: text('supplier'),
  purchaseStatus: text('purchase_status').default('Draft'), // Draft, Ordered, Shipped, Delivered, Cancelled
  cost: numeric('cost').default('0'),
  deliveryStatus: text('delivery_status').default('Pending'),
  stockBalance: numeric('stock_balance').default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 32. Reinforcement Bar Bending Schedules Table
export const reinforcementSchedules = pgTable('reinforcement_schedules', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  member: text('member').notNull(), // Beam, Column, Slab, Footing
  barMark: text('bar_mark').notNull(),
  shapeCode: text('shape_code').notNull(),
  diameterMm: integer('diameter_mm').notNull(),
  cutLengthM: numeric('cut_length_m').notNull(),
  totalBars: integer('total_bars').notNull(),
  totalWeightKg: numeric('total_weight_kg').notNull(),
  cuttingList: json('cutting_list'),
  approved: boolean('approved').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 33. Cashflow Forecasts Table
export const cashflowForecasts = pgTable('cashflow_forecasts', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  periodName: text('period_name').notNull(), // e.g. Month 1, Week 1
  forecastData: json('forecast_data').notNull(), // Income, Materials, Labour, Equipment, Expenses, Profit, Balance
  sCurveData: json('s_curve_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 34. Structural Engineering Assistant Calculations Table
export const structuralCalculations = pgTable('structural_calculations', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  elementName: text('element_name').notNull(), // Beam, Column, Slab, Foundation
  designCode: text('design_code').default('EN 1992 Eurocode 2').notNull(),
  inputsData: json('inputs_data').notNull(),
  stepsData: json('steps_data').notNull(),
  resultsData: json('results_data').notNull(),
  approvedByEngineer: boolean('approved_by_engineer').default(false),
  engineerName: text('engineer_name'),
  disclaimerNotice: text('disclaimer_notice').default('AI-generated engineering outputs are design assistance drafts. Final responsibility, verification and approval remain with qualified engineers.'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 35. Module Versions & Audits Table
export const moduleVersions = pgTable('module_versions', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  moduleName: text('module_name').notNull(),
  versionNumber: text('version_number').notNull(),
  userEmail: text('user_email').notNull(),
  changeDescription: text('change_description').notNull(),
  snapshotData: json('snapshot_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 36. Enterprise Master Cost Library Table
export const costLibraryItems = pgTable('cost_library_items', {
  id: serial('id').primaryKey(),
  itemCode: text('item_code').notNull(),
  category: text('category').notNull(), // Material, Labour, Plant, Fuel, Transport, Subcontractor
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  basePriceXaf: numeric('base_price_xaf').notNull().default('0'),
  doualaPrice: numeric('douala_price').default('0'),
  yaoundePrice: numeric('yaounde_price').default('0'),
  garouaPrice: numeric('garoua_price').default('0'),
  supplierName: text('supplier_name'),
  brand: text('brand'),
  specifications: text('specifications'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 37. Change Orders / Variation Orders (VO) Table
export const boqChangeOrders = pgTable('boq_change_orders', {
  id: serial('id').primaryKey(),
  boqId: integer('boq_id').notNull(),
  projectId: text('project_id').notNull(),
  variationNumber: text('variation_number').notNull(), // VO-001
  title: text('title').notNull(),
  reason: text('reason').notNull(),
  costDifference: numeric('cost_difference').notNull().default('0'),
  timeExtensionDays: integer('time_extension_days').default(0),
  status: text('status').default('DRAFT'), // DRAFT, SUBMITTED, ENGINEER_APPROVED, CLIENT_APPROVED, REJECTED
  requestedBy: text('requested_by'),
  approvedBy: text('approved_by'),
  itemsData: json('items_data'), // List of added/modified/deleted items
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 38. Enterprise Inventory & Warehouses Table
export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  warehouseName: text('warehouse_name').notNull().default('Main Douala Yard'),
  materialCode: text('material_code').notNull(),
  materialName: text('material_name').notNull(),
  unit: text('unit').notNull(),
  quantityInStock: numeric('quantity_in_stock').notNull().default('0'),
  minStock: numeric('min_stock').default('100'),
  maxStock: numeric('max_stock').default('5000'),
  wastagePercent: numeric('wastage_percent').default('3.5'),
  qrCodeToken: text('qr_code_token'),
  lastRestockedAt: timestamp('last_restocked_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 39. Interim Payment Certificates (IPC) Table
export const paymentCertificates = pgTable('payment_certificates', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  boqId: integer('boq_id').notNull(),
  ipcNumber: text('ipc_number').notNull(), // IPC-001
  periodName: text('period_name').notNull(), // Month 1, Progress Claim #1
  grossWorkDone: numeric('gross_work_done').notNull().default('0'),
  previousClaimed: numeric('previous_claimed').default('0'),
  currentClaimed: numeric('current_claimed').notNull().default('0'),
  retentionDeduction: numeric('retention_deduction').default('0'),
  advanceRepayment: numeric('advance_repayment').default('0'),
  netAmountPayable: numeric('net_amount_payable').notNull().default('0'),
  status: text('status').default('DRAFT'), // DRAFT, QS_VERIFIED, ENGINEER_CERTIFIED, CLIENT_APPROVED, PAID
  certifiedDate: text('certified_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 40. Subcontracts & Trade Packages Table
export const subcontractPackages = pgTable('subcontract_packages', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  subcontractorName: text('subcontractor_name').notNull(),
  tradePackage: text('trade_package').notNull(), // Steel Fabrication, Plumbing, Electrical
  contractSum: numeric('contract_sum').notNull().default('0'),
  progressPercentage: numeric('progress_percentage').default('0'),
  totalPaid: numeric('total_paid').default('0'),
  retentionHeld: numeric('retention_held').default('0'),
  status: text('status').default('ACTIVE'), // ACTIVE, COMPLETED, TERMINATED
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 41. Daily Site Logs & Inspection Records Table
export const siteDailyLogs = pgTable('site_daily_logs', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  logDate: text('log_date').notNull(),
  weatherCondition: text('weather_condition').default('Sunny / Clear'),
  workforceCount: integer('workforce_count').default(0),
  workDoneSummary: text('work_done_summary').notNull(),
  concreteCubeTests: json('concrete_cube_tests'), // List of slump tests, 7-day, 28-day strength
  sitePhotos: json('site_photos'), // Cloudinary/storage URLs
  siteInstructions: text('site_instructions'),
  rfisAndIssues: text('rfis_and_issues'),
  recordedBy: text('recorded_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 42. Staff Access & Login Keys Table (Admin-Controlled Provisioning)
export const staffAccessKeys = pgTable('staff_access_keys', {
  id: serial('id').primaryKey(),
  employeeNumber: text('employee_number').notNull().unique(), // EMP-2026-001
  loginKey: text('login_key').notNull().unique(), // MDCC-ENG-8F4K29
  tempPassword: text('temp_password').notNull(),
  email: text('email').notNull(),
  username: text('username').notNull(),
  fullName: text('full_name').notNull(),
  department: text('department').notNull().default('Engineering'),
  position: text('position').notNull().default('Project Engineer'),
  assignedProjects: json('assigned_projects'), // ["PROJECT-001", "Douala Bridge Phase 2"]
  assignedPermissions: json('assigned_permissions'), // ["boq_read", "boq_write", "takeoff_view", "site_logs"]
  status: text('status').notNull().default('PENDING'), // PENDING, ACTIVATED, SUSPENDED, DISABLED, EXPIRED
  createdBy: text('created_by').notNull().default('Adminmadeccgroup'),
  activatedAt: timestamp('activated_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 43. Employee HR Profiles Table
export const employeeProfiles = pgTable('employee_profiles', {
  id: serial('id').primaryKey(),
  employeeNumber: text('employee_number').notNull().unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  gender: text('gender').default('Male'),
  dob: text('dob'),
  nationality: text('nationality').default('Cameroonian'),
  nationalId: text('national_id'),
  passportNumber: text('passport_number'),
  taxNumber: text('tax_number'),
  socialSecurityNumber: text('social_security_number'), // CNPS
  phone: text('phone'),
  address: text('address'),
  emergencyContact: text('emergency_contact'),
  department: text('department').notNull(),
  position: text('position').notNull(),
  reportingManager: text('reporting_manager').default('Adminmadeccgroup'),
  employmentDate: text('employment_date'),
  employmentType: text('employment_type').default('FULL_TIME'), // FULL_TIME, CONTRACT, CONSULTANT
  salaryXaf: numeric('salary_xaf').default('0'),
  allowancesXaf: numeric('allowances_xaf').default('0'),
  bankDetails: text('bank_details'),
  skills: json('skills'), // ["Quantity Surveying", "Eurocode 2", "Civil 3D", "AutoCAD"]
  certifications: json('certifications'), // ["COBAC Registered Engineer", "PMP", "RICS Fellow"]
  engineeringRegistration: text('engineering_registration'), // ONIGC Registration No.
  leaveBalanceDays: integer('leave_balance_days').default(24),
  status: text('status').default('ACTIVE'), // ACTIVE, ON_LEAVE, SUSPENDED, TERMINATED
  digitalSignatureUrl: text('digital_signature_url'),
  passportPhotoUrl: text('passport_photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 44. Immutable Staff Security & Action Audit Logs Table
export const staffAuditLogs = pgTable('staff_audit_logs', {
  id: serial('id').primaryKey(),
  adminUser: text('admin_user').notNull(), // Adminmadeccgroup or acting user
  targetEmployee: text('target_employee'),
  action: text('action').notNull(), // GENERATE_LOGIN_KEY, ACTIVATE_ACCOUNT, RESET_PASSWORD, SUSPEND_USER, UPDATE_PERMISSIONS, LOGIN_FAILED, LOGIN_SUCCESS
  details: text('details').notNull(),
  ipAddress: text('ip_address').default('127.0.0.1'),
  deviceInfo: text('device_info').default('Enterprise Web Client'),
  module: text('module').default('STAFF_MANAGEMENT'),
  previousValue: text('previous_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 45. Staff & Department Announcements Table
export const staffAnnouncements = pgTable('staff_announcements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  department: text('department').default('ALL'),
  author: text('author').default('Adminmadeccgroup'),
  priority: text('priority').default('NORMAL'), // URGENT, NORMAL, LOW
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 46. Staff RBAC Roles & Template Permissions Table
export const staffRoles = pgTable('staff_roles', {
  id: serial('id').primaryKey(),
  roleName: text('role_name').notNull().unique(), // Managing Director, Lead QS, Site Engineer, Safety Inspector, Auditor
  description: text('description'),
  department: text('department').default('Engineering'),
  permissions: json('permissions'), // Matrix of allowed module actions
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 47. Staff Notifications Feed Table
export const staffNotifications = pgTable('staff_notifications', {
  id: serial('id').primaryKey(),
  employeeNumber: text('employee_number').notNull(), // Target employee or ALL
  title: text('title').notNull(),
  message: text('message').notNull(),
  category: text('category').default('SYSTEM'), // ASSIGNMENT, APPROVAL, SECURITY, DEADLINE, ANNOUNCEMENT
  isRead: integer('is_read').default(0),
  actionUrl: text('action_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 48. Staff Security & Authentication History Table
export const staffLoginHistory = pgTable('staff_login_history', {
  id: serial('id').primaryKey(),
  employeeNumber: text('employee_number').notNull(),
  loginKeyUsed: text('login_key_used'),
  ipAddress: text('ip_address').default('127.0.0.1'),
  deviceInfo: text('device_info').default('Enterprise Web Client'),
  status: text('status').notNull(), // SUCCESS, FAILED_KEY, FAILED_PASSWORD, ACCOUNT_SUSPENDED
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 49. Staff Performance & KPI Review Table
export const staffPerformanceReviews = pgTable('staff_performance_reviews', {
  id: serial('id').primaryKey(),
  employeeNumber: text('employee_number').notNull(),
  reviewerName: text('reviewer_name').default('Adminmadeccgroup'),
  reviewPeriod: text('review_period').notNull(), // e.g. "Q1 2026", "Annual 2025"
  kpiScore: numeric('kpi_score').default('85.0'), // 0 - 100
  qualityRating: numeric('quality_rating').default('90.0'),
  safetyRating: numeric('safety_rating').default('95.0'),
  completedTasksCount: integer('completed_tasks_count').default(12),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 50. Staff Training & Certification Records Table
export const staffTrainingRecords = pgTable('staff_training_records', {
  id: serial('id').primaryKey(),
  employeeNumber: text('employee_number').notNull(),
  courseTitle: text('course_title').notNull(),
  institution: text('institution').default('ONIGC / Eurocode Academy'),
  completionDate: text('completion_date'),
  expiryDate: text('expiry_date'),
  certificateUrl: text('certificate_url'),
  status: text('status').default('COMPLETED'), // COMPLETED, IN_PROGRESS, EXPIRED
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 51. Social Media Channels Table
export const socialMediaChannels = pgTable('social_media_channels', {
  id: serial('id').primaryKey(),
  platform: text('platform').notNull(), // youtube, facebook, instagram, whatsapp, tiktok, linkedin, twitter, custom
  channelName: text('channel_name').notNull(), // e.g. "MADECC Group Official YouTube", "MADECC Cameroon FB"
  accountHandle: text('account_handle'), // @madeccgroup_cm
  accountId: text('account_id'), // Provider account or page ID
  profileImageUrl: text('profile_image_url'),
  status: text('status').notNull().default('CONNECTED'), // NOT_CONNECTED, CONNECTING, CONNECTED, TOKEN_EXPIRING, TOKEN_EXPIRED, REAUTH_REQUIRED, ERROR, DISCONNECTED
  healthStatus: text('health_status').default('HEALTHY'), // HEALTHY, WARNING, EXPIRED, ERROR
  approvalStatus: text('approval_status').default('APPROVED'), // PENDING, APPROVED, REJECTED
  apiKeyOrToken: text('api_key_or_token'),
  accessTokenEncrypted: text('access_token_encrypted'),
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  tokenExpiresAt: timestamp('token_expires_at'),
  scopes: json('scopes'),
  webhookUrl: text('webhook_url'),
  isCustom: boolean('is_custom').default(false),
  connectedBy: text('connected_by'),
  connectedAt: timestamp('connected_at'),
  lastSuccessfulApiCheck: timestamp('last_successful_api_check'),
  lastErrorCode: text('last_error_code'),
  lastErrorMessage: text('last_error_message'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 53. Social Media Posts & SEO Content Table
export const socialMediaPosts = pgTable('social_media_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  seoTopic: text('seo_topic'),
  targetPlatforms: json('target_platforms'), // Array of strings e.g. ["youtube", "facebook", "instagram", "whatsapp", "tiktok"]
  caption: text('caption').notNull(),
  hashtags: text('hashtags'),
  ctaText: text('cta_text'),
  mediaUrl: text('media_url'), // Image or video file link
  mediaType: text('media_type').default('image'), // image, video, document, gallery
  status: text('status').notNull().default('DRAFT'), // DRAFT, SCHEDULED, PUBLISHED, FAILED
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  reachEstimate: integer('reach_estimate').default(0),
  engagementCount: integer('engagement_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 54. Public Project Budget Estimates Table
export const projectBudgetEstimates = pgTable('project_budget_estimates', {
  id: serial('id').primaryKey(),
  estimateReference: text('estimate_reference').notNull().unique(), // MADECC-EST-2026-000245
  clientName: text('client_name'),
  clientEmail: text('client_email'),
  clientPhone: text('client_phone'),
  preferredContactMethod: text('preferred_contact_method').default('WhatsApp'),
  projectTimeline: text('project_timeline'),
  projectType: text('project_type').notNull(),
  customProjectType: text('custom_project_type'),
  location: text('location').notNull(),
  region: text('region'),
  totalFloorAreaM2: numeric('total_floor_area_m2').notNull(),
  numberOfFloors: integer('number_of_floors').default(1),
  constructionStandard: text('construction_standard').notNull().default('Standard'),
  buildingConfiguration: json('building_configuration'), // basement, roofType, foundationType, structuralSystem, wallConstruction, floorsBreakdown
  selectedScopes: json('selected_scopes'), // array of included scopes
  selectedFinishes: json('selected_finishes'), // flooring, doors, windows, kitchen, bathroom, painting
  mode: text('mode').default('quick'), // 'quick' | 'detailed'
  estimatedBudgetMin: numeric('estimated_budget_min').notNull(),
  estimatedBudgetMax: numeric('estimated_budget_max').notNull(),
  estimatedBudgetExpected: numeric('estimated_budget_expected').notNull(),
  costPerM2: numeric('cost_per_m2'),
  rateVersion: text('rate_version').default('MADECC-RATES-2026-08').notNull(),
  rateSnapshot: json('rate_snapshot'), // snapshot of rates used during calculation
  lineItemsBreakdown: json('line_items_breakdown'), // category breakdown
  status: text('status').default('CALCULATED').notNull(), // DRAFT, CALCULATED, SAVED, CONTACT_REQUESTED, REVIEW_REQUIRED, CONVERTED_TO_LEAD, CONVERTED_TO_PROJECT, EXPIRED, ARCHIVED
  leadStatus: text('lead_status').default('NEW'), // NEW, CONTACTED, BOQ_REQUESTED, QUALIFIED, CLOSED
  convertedProjectId: integer('converted_project_id'),
  convertedBoqId: integer('converted_boq_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 55. Quote Requests Table (Multi-step project intake system)
export const quoteRequests = pgTable('quote_requests', {
  id: serial('id').primaryKey(),
  referenceNumber: text('reference_number').notNull().unique(), // e.g. MADECC-REQ-2026-0001
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  clientName: text('client_name').notNull(),
  clientCompany: text('client_company'),
  clientEmail: text('client_email').notNull(),
  clientPhone: text('client_phone').notNull(),
  whatsappNumber: text('whatsapp_number'),
  preferredContactMethod: text('preferred_contact_method').default('WhatsApp'),
  preferredContactTime: text('preferred_contact_time').default('Any time'),
  projectType: text('project_type').notNull(), // Residential, Commercial, Industrial, Institutional, Infrastructure, Renovation, Extension, Other
  servicesRequested: json('services_requested').notNull(), // Array of service strings
  region: text('region').notNull(), // Centre, Littoral, South, etc.
  division: text('division'),
  subdivision: text('subdivision'),
  city: text('city'),
  neighborhood: text('neighborhood'),
  siteAddress: text('site_address'),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  projectName: text('project_name').notNull(),
  projectDescription: text('project_description'),
  buildingType: text('building_type'), // Bungalow, Duplex, Apartment, Villa, Office, Hotel, Warehouse, School, Hospital, Shop, Factory, Other
  storeys: integer('storeys').default(1),
  floorArea: numeric('floor_area'),
  floorAreaUnit: text('floor_area_unit').default('m²'),
  siteStatus: text('site_status'), // Land acquired, Land being acquired, Existing building, Construction started, Existing structure requiring renovation
  projectStage: text('project_stage'), // Idea / Concept, Land acquired, Architectural design available, Structural design available, BOQ available, Ready for tender, Contractor selection, Construction started, Renovation required, Other
  budgetCurrency: text('budget_currency').default('XAF'),
  budgetMin: numeric('budget_min'),
  budgetMax: numeric('budget_max'),
  budgetRangeText: text('budget_range_text'),
  desiredStartDate: timestamp('desired_start_date'),
  expectedCompletionDate: timestamp('expected_completion_date'),
  urgency: text('urgency').default('Standard'), // Low, Standard, High, Urgent
  additionalNotes: text('additional_notes'),
  source: text('source').default('Website Direct'), // Budget Calculator, Cost Guide, Services Page, Project Page, Insights, Direct
  sourceMetadata: json('source_metadata'),
  status: text('status').default('NEW').notNull(), // NEW, UNDER_REVIEW, NEEDS_INFORMATION, SITE_ASSESSMENT, ESTIMATING, QUOTATION_PREPARATION, QUOTATION_SENT, NEGOTIATION, WON, LOST, ARCHIVED
  priority: text('priority').default('NORMAL').notNull(), // LOW, NORMAL, HIGH, URGENT
  assignedTo: integer('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  internalNotes: text('internal_notes'),
  activityTimeline: json('activity_timeline'), // Array of timeline event objects
  convertedProjectId: integer('converted_project_id'),
  convertedBoqId: integer('converted_boq_id'),
  convertedEstimateId: integer('converted_estimate_id'),
  adminNotificationStatus: text('admin_notification_status').default('PENDING'), // PENDING, SENT, FAILED
  clientConfirmationStatus: text('client_confirmation_status').default('PENDING'), // PENDING, SENT, FAILED
  adminNotificationSentAt: timestamp('admin_notification_sent_at'),
  clientConfirmationSentAt: timestamp('client_confirmation_sent_at'),
  emailError: text('email_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 56. Quote Request Documents Table
export const quoteRequestDocuments = pgTable('quote_request_documents', {
  id: serial('id').primaryKey(),
  quoteRequestId: integer('quote_request_id').references(() => quoteRequests.id, { onDelete: 'cascade' }).notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// =========================================================================
// 57. SUSTAINABILITY & SOCIAL IMPACT TABLES
// =========================================================================
export const sustainabilityContent = pgTable('sustainability_content', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().default('Sustainability & Social Impact'),
  heroSubtitle: text('hero_subtitle').notNull().default('Building responsibly. Creating lasting value.'),
  introduction: text('introduction').notNull(),
  environmentalPolicy: text('environmental_policy'),
  safetyPolicy: text('safety_policy'),
  localEconomicCommitment: text('local_economic_commitment'),
  documents: json('documents'), // [{ title, fileUrl, docType, version }]
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sustainabilityInitiatives = pgTable('sustainability_initiatives', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull().default('Sustainable Construction'), // Sustainable Construction, Environmental Responsibility, Resource Efficiency, Safety & Health
  description: text('description').notNull(),
  impactSummary: text('impact_summary'),
  image: text('image'),
  documents: json('documents'),
  displayOrder: integer('display_order').default(1).notNull(),
  status: text('status').default('PUBLISHED').notNull(), // DRAFT, PENDING_REVIEW, APPROVED, PUBLISHED, UNPUBLISHED, ARCHIVED
  featured: boolean('featured').default(false).notNull(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const socialImpactProjects = pgTable('social_impact_projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull().default('Community Participation'), // Local Employment, Skills Development, Technical Training, Community Participation, Health & Safety
  location: text('location').notNull(),
  dateCompleted: text('date_completed'),
  description: text('description').notNull(),
  impactMetricsText: text('impact_metrics_text'), // e.g. "120 Local Youth Trained; 15 Subcontractors engaged"
  image: text('image'),
  gallery: json('gallery'),
  documents: json('documents'),
  displayOrder: integer('display_order').default(1).notNull(),
  status: text('status').default('PUBLISHED').notNull(), // DRAFT, PENDING_REVIEW, APPROVED, PUBLISHED, UNPUBLISHED, ARCHIVED
  featured: boolean('featured').default(false).notNull(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const impactMetrics = pgTable('impact_metrics', {
  id: serial('id').primaryKey(),
  label: text('label').notNull(), // e.g. "People Trained", "Local Workers Engaged", "Local Suppliers Supported"
  value: text('value').notNull(), // e.g. "2,500+", "85%"
  category: text('category').notNull().default('Social Impact'), // Employment, Training, Safety, Environment, Community
  icon: text('icon').default('Users'),
  displayOrder: integer('display_order').default(1).notNull(),
  status: text('status').default('PUBLISHED').notNull(),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 58. FAQ / HELP CENTRE TABLES
// =========================================================================
export const faqCategories = pgTable('faq_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // General, Construction, Engineering, Quantity Surveying, BOQ & Estimation, Budget & Costs, Project Management, Request a Quote, Drawings & Documents, Payments, Site Assessment, Suppliers, Tenders, Careers
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon').default('HelpCircle'),
  displayOrder: integer('display_order').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const faqs = pgTable('faqs', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  categoryId: integer('category_id').references(() => faqCategories.id, { onDelete: 'cascade' }),
  categoryName: text('category_name').notNull().default('General'),
  tags: json('tags'), // string[] e.g. ["quote", "payment", "estimation"]
  featured: boolean('featured').default(false).notNull(),
  displayOrder: integer('display_order').default(1).notNull(),
  status: text('status').default('PUBLISHED').notNull(), // DRAFT, PENDING_REVIEW, APPROVED, PUBLISHED, UNPUBLISHED, ARCHIVED
  author: text('author').default('MADECC Editorial Team'),
  reviewer: text('reviewer'),
  publishedAt: timestamp('published_at').defaultNow(),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  relatedService: text('related_service'),
  relatedPage: text('related_page'),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 59. SUPPLIERS & SUBCONTRACTORS TABLES
// =========================================================================
export const supplierSubcontractorCategories = pgTable('supplier_subcontractor_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // Cement, Steel, Masonry, Plumbing, Electrical, HVAC, etc.
  type: text('type').notNull().default('supplier'), // 'supplier' | 'subcontractor'
  description: text('description'),
  displayOrder: integer('display_order').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const supplierApplications = pgTable('supplier_applications', {
  id: serial('id').primaryKey(),
  applicationNumber: text('application_number').notNull().unique(), // MADECC-SUP-2026-0001
  companyName: text('company_name').notNull(),
  registrationNumber: text('registration_number').notNull(),
  companyType: text('company_type').notNull().default('SARL'), // SARL, SA, ETS, Multinational
  country: text('country').notNull().default('Cameroon'),
  region: text('region').notNull(),
  division: text('division'),
  city: text('city').notNull(),
  address: text('address').notNull(),
  website: text('website'),
  contactPerson: text('contact_person').notNull(),
  position: text('position').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  whatsapp: text('whatsapp'),
  supplierCategory: text('supplier_category').notNull(),
  products: text('products').notNull(),
  yearsInBusiness: integer('years_in_business').default(1),
  serviceRegions: json('service_regions'), // string[]
  capacity: text('capacity'),
  previousProjects: text('previous_projects'),
  majorClients: text('major_clients'),
  complianceDocuments: json('compliance_documents'), // [{ title, docType, fileUrl, uploadedAt }]
  declarationAccepted: boolean('declaration_accepted').default(true).notNull(),
  status: text('status').default('SUBMITTED').notNull(), // SUBMITTED, UNDER_REVIEW, DOCUMENT_VERIFICATION, APPROVED, REJECTED, NEEDS_INFORMATION, SUSPENDED, ARCHIVED
  reviewerNotes: text('reviewer_notes'), // Confidential internal notes
  assignedReviewer: text('assigned_reviewer'),
  assignedReviewerId: integer('assigned_reviewer_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subcontractorApplications = pgTable('subcontractor_applications', {
  id: serial('id').primaryKey(),
  applicationNumber: text('application_number').notNull().unique(), // MADECC-SUB-2026-0001
  companyName: text('company_name').notNull(),
  trade: text('trade').notNull(), // Masonry, Carpentry, Steel fixing, Roofing, Plumbing, Electrical, Tiling, HVAC, Civil, Earthworks, etc.
  yearsInBusiness: integer('years_in_business').default(1),
  workforceSize: integer('workforce_size').default(5),
  equipmentOwned: text('equipment_owned'),
  previousProjects: text('previous_projects'),
  geographicCoverage: text('geographic_coverage'),
  safetyRecord: text('safety_record'),
  certifications: text('certifications'),
  referencesList: text('references_list'),
  country: text('country').notNull().default('Cameroon'),
  region: text('region').notNull(),
  city: text('city').notNull(),
  address: text('address').notNull(),
  contactPerson: text('contact_person').notNull(),
  position: text('position').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  whatsapp: text('whatsapp'),
  complianceDocuments: json('compliance_documents'), // [{ title, docType, fileUrl }]
  declarationAccepted: boolean('declaration_accepted').default(true).notNull(),
  status: text('status').default('SUBMITTED').notNull(), // SUBMITTED, UNDER_REVIEW, DOCUMENT_VERIFICATION, APPROVED, REJECTED, NEEDS_INFORMATION, SUSPENDED, ARCHIVED
  reviewerNotes: text('reviewer_notes'), // Confidential internal notes
  assignedReviewer: text('assigned_reviewer'),
  assignedReviewerId: integer('assigned_reviewer_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 60. TENDERS & OPPORTUNITIES TABLES
// =========================================================================
export const tenderCategories = pgTable('tender_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // Construction, Civil Works, Engineering, Materials Supply, Equipment, Specialist Works, Subcontracting, Consultancy, Partnerships, Other
  description: text('description'),
  displayOrder: integer('display_order').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tenders = pgTable('tenders', {
  id: serial('id').primaryKey(),
  tenderNumber: text('tender_number').notNull().unique(), // e.g. TND-2026-MDCC-001
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  categoryId: integer('category_id').references(() => tenderCategories.id, { onDelete: 'set null' }),
  categoryName: text('category_name').notNull().default('Construction'),
  clientProject: text('client_project').notNull(),
  location: text('location').notNull(),
  description: text('description').notNull(),
  scopeOfWork: text('scope_of_work').notNull(),
  eligibility: text('eligibility').notNull(),
  requiredExperience: text('required_experience'),
  requiredDocuments: text('required_documents'),
  submissionMethod: text('submission_method').notNull().default('Online Submission & Hard Copy at MADECC Douala Head Office'),
  openingDate: timestamp('opening_date').defaultNow().notNull(),
  closingDate: timestamp('closing_date').notNull(),
  status: text('status').default('OPEN').notNull(), // DRAFT, PENDING_REVIEW, APPROVED, OPEN, CLOSING_SOON, CLOSED, AWARDED, CANCELLED, ARCHIVED
  contactInstructions: text('contact_instructions').notNull().default('For tender clarifications, contact procurement@madeccgroup.com or call +237 670 00 00 00.'),
  attachments: json('attachments'), // [{ title, fileUrl, fileType, fileSize }]
  featured: boolean('featured').default(false).notNull(),
  displayOrder: integer('display_order').default(1).notNull(),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  createdBy: text('created_by'),
  publishedAt: timestamp('published_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tenderSubmissions = pgTable('tender_submissions', {
  id: serial('id').primaryKey(),
  submissionNumber: text('submission_number').notNull().unique(), // EOI-2026-0001
  tenderId: integer('tender_id').references(() => tenders.id, { onDelete: 'cascade' }).notNull(),
  tenderReference: text('tender_reference').notNull(),
  companyName: text('company_name').notNull(),
  contactPerson: text('contact_person').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  expressionOfInterest: text('expression_of_interest').notNull(),
  supportingDocuments: json('supporting_documents'), // [{ title, fileUrl, fileType }]
  status: text('status').default('SUBMITTED').notNull(), // SUBMITTED, UNDER_REVIEW, SHORTLISTED, ACCEPTED, REJECTED
  internalEvaluationNotes: text('internal_evaluation_notes'), // Private evaluation info
  evaluatedBy: text('evaluated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =========================================================================
// 61. GLOBAL CMS ACTIVITY LOGS & REVISIONS TABLE
// =========================================================================
export const cmsActivityLogs = pgTable('cms_activity_logs', {
  id: serial('id').primaryKey(),
  module: text('module').notNull(), // 'SUSTAINABILITY' | 'FAQ' | 'SUPPLIERS' | 'TENDERS'
  action: text('action').notNull(), // 'CREATE' | 'EDIT' | 'DUPLICATE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'PUBLISH' | 'UNPUBLISH' | 'ARCHIVE' | 'RESTORE' | 'DELETE' | 'EXPORT' | 'REORDER'
  recordId: text('record_id').notNull(),
  recordTitle: text('record_title').notNull(),
  performedBy: text('performed_by').notNull(),
  details: text('details').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const cmsContentRevisions = pgTable('cms_content_revisions', {
  id: serial('id').primaryKey(),
  module: text('module').notNull(),
  recordId: integer('record_id').notNull(),
  versionNumber: integer('version_number').notNull().default(1),
  snapshot: json('snapshot').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =========================================================================
// 62. CUSTOM BROADCAST OUTLETS & EXTERNAL WEBHOOKS
// =========================================================================
export const customBroadcastOutlets = pgTable('custom_broadcast_outlets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  endpointUrl: text('endpoint_url').notNull(),
  httpMethod: text('http_method').default('POST').notNull(), // POST, PUT
  authenticationType: text('authentication_type').default('NONE').notNull(), // NONE, BEARER_TOKEN, API_KEY, BASIC_AUTH, CUSTOM_HEADER, HMAC_SIGNATURE
  encryptedCredentials: text('encrypted_credentials'), // AES-256-GCM encrypted
  encryptedHeaders: text('encrypted_headers'), // AES-256-GCM encrypted JSON
  contentFormat: text('content_format').default('JSON').notNull(), // JSON, FORM_URLENCODED, CUSTOM_JSON_TEMPLATE
  customTemplate: text('custom_template'),
  timeoutMs: integer('timeout_ms').default(5000),
  retryPolicy: json('retry_policy'), // { maxRetries: 3, backoffMultiplier: 2 }
  status: text('status').default('CONFIGURED').notNull(), // CONFIGURED, ACTIVE, INACTIVE, ERROR
  enabled: boolean('enabled').default(true).notNull(),
  createdBy: text('created_by').default('MADECC Executive Admin'),
  lastTestedAt: timestamp('last_tested_at'),
  lastSuccessAt: timestamp('last_success_at'),
  lastError: text('last_error'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 63. CUSTOM BROADCAST DELIVERY HISTORY LOGS
// =========================================================================
export const customBroadcastDeliveryLogs = pgTable('custom_broadcast_delivery_logs', {
  id: serial('id').primaryKey(),
  broadcastId: text('broadcast_id').notNull(), // e.g. BROADCAST-2026-000012
  outletId: integer('outlet_id').references(() => customBroadcastOutlets.id, { onDelete: 'cascade' }),
  outletName: text('outlet_name').notNull(),
  status: text('status').notNull(), // SUCCESS, FAILED, RETRYING
  httpStatus: integer('http_status'),
  attempt: integer('attempt').default(1).notNull(),
  durationMs: integer('duration_ms'),
  payloadExcerpt: json('payload_excerpt'),
  errorDetails: text('error_details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// =========================================================================
// 64. SOCIAL MEDIA MULTI-DESTINATION PUBLISHING JOBS
// =========================================================================
export const socialPublishingJobs = pgTable('social_media_publishing_jobs', {
  id: serial('id').primaryKey(),
  jobId: text('job_id').notNull().unique(), // e.g. JOB-2026-000123
  postId: integer('post_id'),
  campaignName: text('campaign_name'),
  platform: text('platform').notNull(), // facebook, instagram, youtube, tiktok, whatsapp, linkedin, twitter, custom
  destinationName: text('destination_name').notNull(),
  status: text('status').default('PENDING').notNull(), // PENDING, SUCCESS, FAILED, RETRYING
  attempt: integer('attempt').default(1).notNull(),
  externalPostId: text('external_post_id'),
  externalUrl: text('external_url'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Dedicated Non-Firebase Meta Reviewer Credentials Table (Server-Side Neon PostgreSQL)
export const reviewerCredentials = pgTable('reviewer_credentials', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull().default('Meta App Review Tester'),
  role: text('role').notNull().default('social_media_reviewer'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 65. GLOBAL SITE SETTINGS & BRANDING (CMS)
// =========================================================================
export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  siteName: text('site_name').notNull().default('MADECC Group'),
  tagline: text('tagline').default('Premier Engineering, Construction & Project Management in Cameroon'),
  developerName: text('developer_name').default('Kasah Rodrick Reboya'),
  phone: text('phone').default('+237 671 063 511'),
  phoneSecondary: text('phone_secondary').default('+237 683 316 486'),
  phoneTertiary: text('phone_tertiary').default('+237 640 194 505'),
  emergencyPhone: text('emergency_phone').default('+237 683 316 486'),
  email: text('email').default('madecccons@gmail.com'),
  secondaryEmail: text('secondary_email').default('Infomadeccconstruction@gmail.com'),
  officeAddressYaounde: text('office_address_yaounde').default('Yaoundé, Centre Region, Cameroon'),
  officeAddressDouala: text('office_address_douala').default('Akwa, Douala, Littoral Region, Cameroon'),
  businessHours: text('business_hours').default('Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 14:00 (GMT+1)'),
  whatsappNumber: text('whatsapp_number').default('+237 683 316 486'),
  whatsappSecondary: text('whatsapp_secondary').default('+237 671 063 511'),
  paymentMtnNumbers: text('payment_mtn_numbers').default('671063511, 683316486, 671289643'),
  paymentOrangeNumbers: text('payment_orange_numbers').default('689115595, 640194505'),
  paymentInstructions: text('payment_instructions').default('Send payment via MTN Mobile Money or Orange Money to any of our official merchant/business accounts. Retain the transaction ID for instant verification.'),
  facebookUrl: text('facebook_url').default('https://facebook.com/madeccgroup'),
  linkedinUrl: text('linkedin_url').default('https://linkedin.com/company/madecc-group'),
  instagramUrl: text('instagram_url').default('https://instagram.com/madeccgroup'),
  youtubeUrl: text('youtube_url').default('https://youtube.com/@madeccgroup'),
  twitterUrl: text('twitter_url').default('https://x.com/madeccgroup'),
  tiktokUrl: text('tiktok_url').default('https://tiktok.com/@madeccgroup'),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  legalStatus: text('legal_status').default('SARL (Société à Responsabilité Limitée)'),
  rccmNumber: text('rccm_number').default('RC/YAO/2023/B/1458'),
  niuTaxId: text('niu_tax_id').default('M072318492019A'),
  themeSettings: json('theme_settings'), // { primaryColor, accentColor, fontHeading, fontBody, borderRadius, containerWidth }
  globalSeo: json('global_seo'), // { seoTitle, metaDescription, canonicalBase, ogImage, keywords }
  navigationLinks: json('navigation_links'), // Array of nav items
  footerContent: json('footer_content'), // { aboutText, copyrightText, accreditationBadges }
  emergencyBanner: json('emergency_banner'), // { enabled, message, linkText, linkUrl, badgeType }
  updatedBy: text('updated_by').default('MADECC Executive Admin'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 66. CMS PAGE CONTENTS & SECTION BUILDER
// =========================================================================
export const pageContents = pgTable('page_contents', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(), // 'home', 'about', 'services', 'projects', 'sustainability', 'tenders', 'suppliers', 'careers', 'blog', 'contact', 'privacy-policy', 'terms', 'cookie-policy', 'disclaimer'
  title: text('title').notNull(),
  status: text('status').notNull().default('PUBLISHED'), // DRAFT, PUBLISHED, UNPUBLISHED, ARCHIVED
  heroConfig: json('hero_config'), // Full Hero section configuration
  sections: json('sections'), // Ordered page sections
  seo: json('seo'), // SEO title, description, canonical, OG, robots
  draftData: json('draft_data'), // Unpublished draft modifications
  publishedData: json('published_data'), // Active live payload
  version: integer('version').default(1).notNull(),
  lastSavedBy: text('last_saved_by').default('MADECC Executive Admin'),
  publishedAt: timestamp('published_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 67. CENTRALIZED MADECC MEDIA LIBRARY
// =========================================================================
export const mediaLibrary = pgTable('media_library', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  filename: text('filename').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull().default('image'), // image, video, document, audio, logo, icon
  mimeType: text('mime_type'),
  fileSize: integer('file_size').default(0), // Bytes
  dimensions: text('dimensions'), // e.g. 1920x1080
  altText: text('alt_text'),
  caption: text('caption'),
  category: text('category').default('General').notNull(), // Hero Media, Projects, Services, Logos, Documents, Team, Blog, General
  tags: json('tags'), // Array of strings
  usedIn: json('used_in'), // Array of strings describing usage
  status: text('status').default('ACTIVE').notNull(), // ACTIVE, ARCHIVED
  uploadedBy: text('uploaded_by').default('MADECC Media Admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 68. CMS PAGE CONTENT REVISIONS & AUDIT TRAIL
// =========================================================================
export const pageContentRevisions = pgTable('page_content_revisions', {
  id: serial('id').primaryKey(),
  pageSlug: text('page_slug').notNull(),
  version: integer('version').notNull(),
  title: text('title'),
  snapshotData: json('snapshot_data').notNull(),
  changeSummary: text('change_summary'),
  author: text('author').default('MADECC CMS Admin'),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =========================================================================
// 70. SAAS TENANTS (COMPANIES & ORGANIZATIONS)
// =========================================================================
export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g. 'MADECC Group'
  slug: text('slug').notNull().unique(), // e.g. 'madecc-group'
  legalName: text('legal_name'),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  primaryDomain: text('primary_domain'), // e.g. 'madeccgroup.online'
  customDomain: text('custom_domain'),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE', 'SUSPENDED', 'PENDING_APPROVAL', 'CANCELLED'
  planCode: text('plan_code').notNull().default('ENTERPRISE'), // 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'
  currency: text('currency').notNull().default('XAF'), // 'XAF', 'USD', 'EUR', 'NGN', 'GHS', 'GBP'
  timezone: text('timezone').default('Africa/Douala'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  country: text('country').default('Cameroon'),
  settings: json('settings'), // { themeColor, primaryColor, accentColor, font, customCss, socialLinks, companyDetails, seoDefaults }
  aiCreditsBalance: integer('ai_credits_balance').default(10000).notNull(),
  storageUsageBytes: integer('storage_usage_bytes').default(0).notNull(),
  isFlagship: boolean('is_flagship').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 71. TENANT MEMBERSHIPS & RBAC
// =========================================================================
export const tenantMemberships = pgTable('tenant_memberships', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull(),
  userId: text('user_id').notNull(), // Links to users.id
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: text('role').notNull().default('MEMBER'), // 'OWNER', 'ADMIN', 'PROJECT_MANAGER', 'ESTIMATOR', 'ENGINEER', 'STAFF', 'VIEWER', 'SUPER_ADMIN'
  permissions: json('permissions'), // Custom permission overrides array
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE', 'INVITED', 'SUSPENDED'
  invitedBy: text('invited_by'),
  invitedAt: timestamp('invited_at'),
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 72. SAAS SUBSCRIPTION PLANS
// =========================================================================
export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'
  name: text('name').notNull(),
  description: text('description'),
  monthlyPrice: integer('monthly_price').notNull(), // In FCFA
  annualPrice: integer('annual_price').notNull(), // In FCFA
  currency: text('currency').notNull().default('XAF'),
  maxUsers: integer('max_users').notNull().default(3), // -1 for unlimited
  maxProjects: integer('max_projects').notNull().default(5), // -1 for unlimited
  maxStorageGb: integer('max_storage_gb').notNull().default(5),
  aiCreditsMonthly: integer('ai_credits_monthly').notNull().default(100),
  features: json('features'), // Array of feature flags & entitlements
  isPopular: boolean('is_popular').default(false),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE', 'ARCHIVED'
  displayOrder: integer('display_order').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 73. TENANT SUBSCRIPTIONS & DIRECT PAYMENT CONFIRMATION FLOW
// =========================================================================
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull(),
  planCode: text('plan_code').notNull(), // 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'
  billingCycle: text('billing_cycle').notNull().default('MONTHLY'), // 'MONTHLY', 'ANNUAL'
  amount: integer('amount').notNull(), // in FCFA
  currency: text('currency').notNull().default('XAF'),
  status: text('status').notNull().default('PENDING_CONFIRMATION'), // 'ACTIVE', 'PENDING_CONFIRMATION', 'PAST_DUE', 'CANCELLED', 'EXPIRED'
  paymentMethod: text('payment_method'), // 'MTN_MOMO', 'ORANGE_MONEY', 'VISA_CARD', 'BANK_WIRE', 'CASH'
  paymentReference: text('payment_reference'), // Transaction TXID / Ref code provided by tenant
  senderPhone: text('sender_phone'), // Phone number or account used to send funds
  notes: text('notes'),
  startDate: timestamp('start_date').defaultNow().notNull(),
  renewalDate: timestamp('renewal_date').notNull(),
  confirmedAt: timestamp('confirmed_at'),
  confirmedBy: text('confirmed_by'), // Super Admin email/name who verified the payment
  thankYouShown: boolean('thank_you_shown').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 74. CUSTOM DOMAINS REGISTRY & VERIFICATION
// =========================================================================
export const tenantDomains = pgTable('tenant_domains', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull(),
  domain: text('domain').notNull().unique(), // e.g. 'madeccgroup.online' or 'alpha-civil.com'
  domainType: text('domain_type').notNull().default('CUSTOM'), // 'PRIMARY', 'SUBDOMAIN', 'CUSTOM'
  status: text('status').notNull().default('ACTIVE'), // 'PENDING_DNS', 'ACTIVE', 'SUSPENDED'
  sslStatus: text('ssl_status').default('PROVISIONED'), // 'PENDING', 'PROVISIONED', 'FAILED'
  verificationToken: text('verification_token'),
  verifiedAt: timestamp('verified_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 75. AI & PLATFORM USAGE METERING
// =========================================================================
export const usageEvents = pgTable('usage_events', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull(),
  userId: text('user_id'),
  eventType: text('event_type').notNull(), // 'AI_DRAWING_ANALYSIS', 'AI_QUANTITY_TAKEOFF', 'BOQ_GENERATION', 'DOCUMENT_EXPORT', 'FILE_STORAGE', 'API_REQUEST'
  quantity: integer('quantity').default(1).notNull(),
  unit: text('unit').default('credit').notNull(), // 'credit', 'request', 'bytes', 'page'
  estimatedCost: integer('estimated_cost').default(0), // in micro-FCFA or credits
  metadata: json('metadata'), // Project ID, drawing details, model used
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =========================================================================
// 76. PLATFORM-LEVEL SUPER ADMIN AUDIT LOGS
// =========================================================================
export const platformAuditLogs = pgTable('platform_audit_logs', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id'), // Optional if platform-level
  userId: text('user_id'),
  userEmail: text('user_email'),
  action: text('action').notNull(), // 'TENANT_CREATED', 'PAYMENT_CONFIRMED', 'TENANT_SUSPENDED', 'PLAN_MODIFIED', 'ROLE_CHANGED'
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  ipAddress: text('ip_address'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =========================================================================
// 77. FEATURE FLAGS & DYNAMIC MODULE TOGGLES
// =========================================================================
export const featureFlags = pgTable('feature_flags', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id'), // Nullable for global flags
  key: text('key').notNull(), // e.g. 'AI_QUANTITY_TAKEOFF', 'ADVANCED_BOQ', 'CUSTOM_DOMAIN'
  enabled: boolean('enabled').default(true).notNull(),
  description: text('description'),
  rules: json('rules'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 79. API PRODUCTS CATALOG (PAID API PLATFORM)
// =========================================================================
export const apiProducts = pgTable('api_products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g. 'MADECC Smart BOQ & Quantity Take-Off API'
  slug: text('slug').notNull().unique(), // 'boq-api'
  description: text('description').notNull(),
  category: text('category').notNull().default('Engineering & BOQ'), // 'Engineering & BOQ', 'Cost Intelligence', 'Structural Calculations', 'Eurocode Tools'
  version: text('version').notNull().default('v1'),
  endpoints: json('endpoints'), // Array of { method, path, description, requestBody, responseBody, scopes }
  documentation: text('documentation'), // Markdown documentation
  priceMonthly: integer('price_monthly').default(0).notNull(), // in FCFA (XAF)
  currency: text('currency').default('XAF').notNull(),
  billingModel: text('billing_model').default('MONTHLY').notNull(), // 'MONTHLY', 'PER_REQUEST', 'ANNUAL', 'UNLIMITED'
  rateLimitDefault: integer('rate_limit_default').default(60).notNull(), // requests per minute
  enabled: boolean('enabled').default(true).notNull(),
  requiresApproval: boolean('requires_approval').default(true).notNull(),
  availablePlans: json('available_plans'), // List of plan codes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 80. API SUBSCRIPTION PLANS & TIERS
// =========================================================================
export const apiPlans = pgTable('api_plans', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // 'DEVELOPER_FREE', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE_UNLIMITED'
  name: text('name').notNull(), // 'Enterprise Unlimited'
  description: text('description'),
  price: integer('price').notNull().default(0), // in FCFA (XAF)
  currency: text('currency').notNull().default('XAF'),
  billingCycle: text('billing_cycle').notNull().default('MONTHLY'), // 'MONTHLY', 'ANNUAL', 'PAY_AS_YOU_GO'
  rateLimitPerMinute: integer('rate_limit_per_minute').notNull().default(120),
  monthlyQuota: integer('monthly_quota').notNull().default(50000), // -1 for unlimited (fair use)
  maxApiKeys: integer('max_api_keys').notNull().default(5),
  permissions: json('permissions'), // Array of scopes: ['boq:calculate', 'budget:calculate', 'concrete:calculate', 'reinforcement:calculate', 'costs:read', 'eurocode:calculate']
  features: json('features'), // Array of descriptive feature bullet points
  isPopular: boolean('is_popular').default(false).notNull(),
  requiresApproval: boolean('requires_approval').default(true).notNull(),
  active: boolean('active').default(true).notNull(),
  displayOrder: integer('display_order').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 81. API CUSTOMERS / DEVELOPER PROFILES
// =========================================================================
export const apiCustomers = pgTable('api_customers', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Firebase UID or developer account ID
  developerName: text('developer_name').notNull(),
  companyName: text('company_name').notNull(),
  contactEmail: text('contact_email').notNull().unique(),
  contactPhone: text('contact_phone'),
  websiteUrl: text('website_url'),
  useCaseDescription: text('use_case_description'),
  billingAddress: text('billing_address'),
  country: text('country').default('Cameroon'),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 82. API ACCESS REQUESTS & APPLICATION ONBOARDING
// =========================================================================
export const apiAccessRequests = pgTable('api_access_requests', {
  id: serial('id').primaryKey(),
  requestId: text('requestId').notNull().unique(), // e.g. REQ-2026-0001
  customerId: integer('customer_id').references(() => apiCustomers.id, { onDelete: 'cascade' }),
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name').notNull(),
  companyName: text('company_name').notNull(),
  planCode: text('plan_code').notNull(),
  productSlug: text('product_slug'), // Specific product or 'all-products'
  amount: integer('amount').notNull().default(0), // Price in FCFA
  currency: text('currency').notNull().default('XAF'),
  paymentMethod: text('payment_method').notNull(), // 'MTN_MOMO', 'ORANGE_MONEY', 'VISA_MASTERCARD', 'BANK_TRANSFER'
  transactionReference: text('transaction_reference'), // MoMo/Orange TxID or Gateway Ref
  payerPhone: text('payer_phone'),
  payerName: text('payer_name'),
  paymentReceiptUrl: text('payment_receipt_url'), // Uploaded proof of payment
  status: text('status').default('PENDING').notNull(), // 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'
  adminNotes: text('admin_notes'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 83. API PAYMENT TRANSACTIONS LEDGER
// =========================================================================
export const apiPaymentTransactions = pgTable('api_payment_transactions', {
  id: serial('id').primaryKey(),
  transactionId: text('transaction_id').notNull().unique(), // e.g. TXN-2026-XXXX
  accessRequestId: integer('access_request_id').references(() => apiAccessRequests.id, { onDelete: 'set null' }),
  customerEmail: text('customer_email').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').default('XAF').notNull(),
  paymentMethod: text('payment_method').notNull(), // 'MTN_MOMO', 'ORANGE_MONEY', 'VISA_CARD', 'BANK_WIRE'
  transactionRef: text('transaction_ref').notNull(),
  payerPhone: text('payer_phone'),
  payerName: text('payer_name'),
  receiptUrl: text('receipt_url'),
  status: text('status').default('PENDING').notNull(), // 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REFUNDED'
  verifiedBy: text('verified_by'),
  verifiedAt: timestamp('verified_at'),
  gatewayPayload: json('gateway_payload'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =========================================================================
// 84. ACTIVE API ENTITLEMENTS (PERMISSIONS & SUBSCRIPTIONS)
// =========================================================================
export const apiEntitlements = pgTable('api_entitlements', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => apiCustomers.id, { onDelete: 'cascade' }),
  customerEmail: text('customer_email').notNull(),
  planCode: text('plan_code').notNull(),
  permissions: json('permissions').notNull(), // Array of granted permission scopes
  rateLimitPerMinute: integer('rate_limit_per_minute').default(120).notNull(),
  monthlyQuota: integer('monthly_quota').default(50000).notNull(),
  quotaUsedThisMonth: integer('quota_used_this_month').default(0).notNull(),
  isUnlimited: boolean('is_unlimited').default(false).notNull(),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE', 'SUSPENDED', 'EXPIRED'
  startDate: timestamp('start_date').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  approvedBy: text('approved_by').default('MADECC API Administrator'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 85. CRYPTOGRAPHICALLY SECURE API CREDENTIALS (API KEYS & HASHES)
// =========================================================================
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => apiCustomers.id, { onDelete: 'cascade' }),
  customerEmail: text('customer_email').notNull(),
  name: text('name').notNull(), // e.g. 'Production Core Server Key'
  keyId: text('key_id').notNull().unique(), // e.g. 'mk_live_9f83a8b2c1d4...'
  secretHash: text('secret_hash').notNull(), // SHA-256 hash of secret
  secretPrefix: text('secret_prefix').notNull(), // e.g. 'sec_live_9f83...' (first 12 chars for verification display)
  environment: text('environment').default('production').notNull(), // 'production', 'sandbox'
  permissions: json('permissions').notNull(), // Array of allowed scopes
  rateLimitPerMinute: integer('rate_limit_per_minute').default(120).notNull(),
  monthlyQuota: integer('monthly_quota').default(50000).notNull(),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE', 'REVOKED', 'SUSPENDED', 'EXPIRED'
  lastUsedAt: timestamp('last_used_at'),
  lastUsedIp: text('last_used_ip'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =========================================================================
// 86. API REQUESTS & TELEMETRY LOGS (REAL-TIME USAGE & LATENCY)
// =========================================================================
export const apiRequestsLog = pgTable('api_requests_log', {
  id: serial('id').primaryKey(),
  keyId: text('key_id'),
  customerEmail: text('customer_email'),
  endpoint: text('endpoint').notNull(), // e.g. '/api/v1/boq/calculate'
  method: text('method').notNull(), // 'GET', 'POST'
  statusCode: integer('status_code').notNull(), // 200, 400, 401, 429, 500
  latencyMs: integer('latency_ms').default(0).notNull(),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  requestSize: integer('request_size').default(0).notNull(),
  responseSize: integer('response_size').default(0).notNull(),
  errorMessage: text('error_message'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// =========================================================================
// 87. API PLATFORM AUDIT LOGS
// =========================================================================
export const apiPlatformAuditLogs = pgTable('api_platform_audit_logs', {
  id: serial('id').primaryKey(),
  adminEmail: text('admin_email').notNull(),
  action: text('action').notNull(), // 'APPROVE_ACCESS', 'REJECT_PAYMENT', 'REVOKE_KEY', 'GENERATE_KEY', 'MODIFY_PLAN'
  targetType: text('target_type').notNull(), // 'REQUEST', 'KEY', 'PLAN', 'CUSTOMER', 'TRANSACTION'
  targetId: text('target_id'),
  details: text('details').notNull(),
  metadata: json('metadata'),
  ipAddress: text('ip_address'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});














