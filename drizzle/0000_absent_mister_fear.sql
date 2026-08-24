CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text NOT NULL,
	"service_name" text NOT NULL,
	"appointment_date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"user_email" text,
	"action" text NOT NULL,
	"details" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"author_id" integer,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"image" text NOT NULL,
	"video_url" text,
	"summary" text NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boq_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"boq_id" integer NOT NULL,
	"user_id" text,
	"user_email" text,
	"action" text NOT NULL,
	"details" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boq_change_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"boq_id" integer NOT NULL,
	"project_id" text NOT NULL,
	"variation_number" text NOT NULL,
	"title" text NOT NULL,
	"reason" text NOT NULL,
	"cost_difference" numeric DEFAULT '0' NOT NULL,
	"time_extension_days" integer DEFAULT 0,
	"status" text DEFAULT 'DRAFT',
	"requested_by" text,
	"approved_by" text,
	"items_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boq_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"boq_id" integer NOT NULL,
	"item_number" text NOT NULL,
	"description" text NOT NULL,
	"unit" text NOT NULL,
	"quantity" numeric DEFAULT '0' NOT NULL,
	"unit_rate" numeric DEFAULT '0' NOT NULL,
	"amount" numeric DEFAULT '0' NOT NULL,
	"notes" text,
	"measurement_basis" text,
	"internal_material_cost" numeric DEFAULT '0' NOT NULL,
	"internal_labour_cost" numeric DEFAULT '0' NOT NULL,
	"internal_plant_cost" numeric DEFAULT '0' NOT NULL,
	"internal_other_cost" numeric DEFAULT '0' NOT NULL,
	"rate_breakdown" json,
	"dimension_sheet" json,
	"progress_executed_qty" numeric DEFAULT '0',
	"progress_executed_percent" numeric DEFAULT '0',
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boq_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"boq_id" integer NOT NULL,
	"revision_number" text NOT NULL,
	"snapshot_data" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp DEFAULT now() NOT NULL,
	"pdf_url" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "boq_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"boq_id" integer NOT NULL,
	"section_code" text NOT NULL,
	"title" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"subtotal" numeric DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boq_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_disabled" boolean DEFAULT false NOT NULL,
	"is_favourite" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "boq_units_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "boqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"boq_reference" text NOT NULL,
	"project_id" integer,
	"project_name" text NOT NULL,
	"client_id" integer,
	"client_name" text NOT NULL,
	"client_email" text,
	"client_niu" text,
	"client_address" text,
	"location" text NOT NULL,
	"description" text,
	"date_prepared" timestamp DEFAULT now() NOT NULL,
	"prepared_by" text NOT NULL,
	"created_by" text,
	"updated_by" text,
	"revision_number" text DEFAULT 'REV-00' NOT NULL,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"overhead_percent" numeric DEFAULT '0' NOT NULL,
	"contingency_percent" numeric DEFAULT '0' NOT NULL,
	"profit_percent" numeric DEFAULT '0' NOT NULL,
	"tax_percent" numeric DEFAULT '0' NOT NULL,
	"discount_percent" numeric DEFAULT '0',
	"subtotal" numeric DEFAULT '0' NOT NULL,
	"overhead_amount" numeric DEFAULT '0' NOT NULL,
	"contingency_amount" numeric DEFAULT '0' NOT NULL,
	"profit_amount" numeric DEFAULT '0' NOT NULL,
	"discount_amount" numeric DEFAULT '0',
	"transport_amount" numeric DEFAULT '0',
	"supervision_amount" numeric DEFAULT '0',
	"tax_amount" numeric DEFAULT '0' NOT NULL,
	"grand_total" numeric DEFAULT '0' NOT NULL,
	"notes" text,
	"attachments" json,
	"ai_results" json,
	"metadata" json,
	"pdf_url" text,
	"approved_by" text,
	"approved_at" timestamp,
	"sent_to_client_at" timestamp,
	"sent_to_client_by" text,
	"consultant_name" text,
	"consultant_email" text,
	"contract_type" text DEFAULT 'UNIT_RATE',
	"tender_reference" text,
	"tender_date" text,
	"submission_deadline" text,
	"construction_category" text DEFAULT 'Commercial',
	"tender_mode" text DEFAULT 'CLIENT_TENDER',
	"approval_stage" text DEFAULT 'DRAFT',
	"approval_history" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "boqs_boq_reference_unique" UNIQUE("boq_reference")
);
--> statement-breakpoint
CREATE TABLE "cashflow_forecasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"period_name" text NOT NULL,
	"forecast_data" json NOT NULL,
	"s_curve_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cms_activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" text NOT NULL,
	"action" text NOT NULL,
	"record_id" text NOT NULL,
	"record_title" text NOT NULL,
	"performed_by" text NOT NULL,
	"details" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_content_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" text NOT NULL,
	"record_id" integer NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"snapshot" json NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"file_url" text NOT NULL,
	"doc_type" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "construction_drawings" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size_mb" numeric,
	"category" text DEFAULT 'Architectural' NOT NULL,
	"version" text DEFAULT 'v1.0' NOT NULL,
	"uploaded_by" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "construction_programmes" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"programme_name" text NOT NULL,
	"activities_data" json NOT NULL,
	"completion_percentage" numeric DEFAULT '0',
	"status" text DEFAULT 'Draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "construction_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"project_name" text NOT NULL,
	"client" text NOT NULL,
	"contractor" text,
	"consultant" text,
	"location" text NOT NULL,
	"gps_coordinates" text,
	"building_type" text DEFAULT 'Residential' NOT NULL,
	"number_of_floors" integer DEFAULT 1,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"contract_sum" numeric DEFAULT '0',
	"start_date" text,
	"completion_date" text,
	"project_status" text DEFAULT 'Planning' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "construction_projects_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_library_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_code" text NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"base_price_xaf" numeric DEFAULT '0' NOT NULL,
	"douala_price" numeric DEFAULT '0',
	"yaounde_price" numeric DEFAULT '0',
	"garoua_price" numeric DEFAULT '0',
	"supplier_name" text,
	"brand" text,
	"specifications" text,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_broadcast_delivery_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"broadcast_id" text NOT NULL,
	"outlet_id" integer,
	"outlet_name" text NOT NULL,
	"status" text NOT NULL,
	"http_status" integer,
	"attempt" integer DEFAULT 1 NOT NULL,
	"duration_ms" integer,
	"payload_excerpt" json,
	"error_details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "custom_broadcast_outlets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"endpoint_url" text NOT NULL,
	"http_method" text DEFAULT 'POST' NOT NULL,
	"authentication_type" text DEFAULT 'NONE' NOT NULL,
	"encrypted_credentials" text,
	"encrypted_headers" text,
	"content_format" text DEFAULT 'JSON' NOT NULL,
	"custom_template" text,
	"timeout_ms" integer DEFAULT 5000,
	"retry_policy" json,
	"status" text DEFAULT 'CONFIGURED' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by" text DEFAULT 'MADECC Executive Admin',
	"last_tested_at" timestamp,
	"last_success_at" timestamp,
	"last_error" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drawing_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"drawing_id" integer,
	"project_id" text NOT NULL,
	"detected_elements" json NOT NULL,
	"confidence_score" numeric DEFAULT '95.0',
	"engineer_status" text DEFAULT 'Pending Review',
	"reviewed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drawing_takeoffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"takeoff_ref" text NOT NULL,
	"project_name" text NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text,
	"location" text NOT NULL,
	"drawing_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer DEFAULT 0,
	"file_url" text,
	"mime_type" text,
	"metadata" json,
	"analysis_stage" text DEFAULT 'Validation' NOT NULL,
	"pipeline_log" json,
	"detected_elements" json NOT NULL,
	"quantities_data" json NOT NULL,
	"labour_estimate_data" json,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"ai_verified" boolean DEFAULT false NOT NULL,
	"prepared_by" text NOT NULL,
	"approved_by" text,
	"approval_notes" text,
	"revision_number" text DEFAULT 'REV-01' NOT NULL,
	"revisions_history" json,
	"audit_logs_data" json,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_number" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"gender" text DEFAULT 'Male',
	"dob" text,
	"nationality" text DEFAULT 'Cameroonian',
	"national_id" text,
	"passport_number" text,
	"tax_number" text,
	"social_security_number" text,
	"phone" text,
	"address" text,
	"emergency_contact" text,
	"department" text NOT NULL,
	"position" text NOT NULL,
	"reporting_manager" text DEFAULT 'Adminmadeccgroup',
	"employment_date" text,
	"employment_type" text DEFAULT 'FULL_TIME',
	"salary_xaf" numeric DEFAULT '0',
	"allowances_xaf" numeric DEFAULT '0',
	"bank_details" text,
	"skills" json,
	"certifications" json,
	"engineering_registration" text,
	"leave_balance_days" integer DEFAULT 24,
	"status" text DEFAULT 'ACTIVE',
	"digital_signature_url" text,
	"passport_photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_profiles_employee_number_unique" UNIQUE("employee_number"),
	CONSTRAINT "employee_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "faq_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text DEFAULT 'HelpCircle',
	"display_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "faq_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "faq_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category_id" integer,
	"category_name" text DEFAULT 'General' NOT NULL,
	"tags" json,
	"featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'PUBLISHED' NOT NULL,
	"author" text DEFAULT 'MADECC Editorial Team',
	"reviewer" text,
	"published_at" timestamp DEFAULT now(),
	"seo_title" text,
	"seo_description" text,
	"related_service" text,
	"related_page" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"image_url" text NOT NULL,
	"video_url" text,
	"category" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hero_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"image_url" text NOT NULL,
	"video_url" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impact_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"category" text DEFAULT 'Social Impact' NOT NULL,
	"icon" text DEFAULT 'Users',
	"display_order" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'PUBLISHED' NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_name" text DEFAULT 'Main Douala Yard' NOT NULL,
	"material_code" text NOT NULL,
	"material_name" text NOT NULL,
	"unit" text NOT NULL,
	"quantity_in_stock" numeric DEFAULT '0' NOT NULL,
	"min_stock" numeric DEFAULT '100',
	"max_stock" numeric DEFAULT '5000',
	"wastage_percent" numeric DEFAULT '3.5',
	"qr_code_token" text,
	"last_restocked_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labour_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_ref" text NOT NULL,
	"project_name" text NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text,
	"location" text NOT NULL,
	"project_type" text NOT NULL,
	"building_floors" integer DEFAULT 1 NOT NULL,
	"date" text NOT NULL,
	"prepared_by" text NOT NULL,
	"approved_by" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"overhead_percent" numeric DEFAULT '10.00',
	"contingency_percent" numeric DEFAULT '5.00',
	"profit_percent" numeric DEFAULT '15.00',
	"discount_percent" numeric DEFAULT '0.00',
	"tax_percent" numeric DEFAULT '19.25',
	"base_subtotal" numeric DEFAULT '0.00',
	"overhead_amount" numeric DEFAULT '0.00',
	"contingency_amount" numeric DEFAULT '0.00',
	"profit_amount" numeric DEFAULT '0.00',
	"discount_amount" numeric DEFAULT '0.00',
	"taxable_net" numeric DEFAULT '0.00',
	"tax_amount" numeric DEFAULT '0.00',
	"grand_total" numeric DEFAULT '0.00',
	"paid_amount" numeric DEFAULT '0.00',
	"balance_due" numeric DEFAULT '0.00',
	"revision_number" text DEFAULT 'REV-01' NOT NULL,
	"sections_data" json NOT NULL,
	"revisions_history" json,
	"audit_logs_data" json,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"subject_id" text,
	"teacher_id" text,
	"department_id" text,
	"academic_year" text,
	"term" text,
	"sequence" text,
	"week" text,
	"lesson_duration" text,
	"grade_level" text,
	"topic" text NOT NULL,
	"keywords" text,
	"competency" text,
	"learning_outcomes" text,
	"version_number" text DEFAULT '1.0.0' NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"content" text NOT NULL,
	"presentation" text,
	"worksheet" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_plans_lesson_id_unique" UNIQUE("lesson_id")
);
--> statement-breakpoint
CREATE TABLE "module_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"module_name" text NOT NULL,
	"version_number" text NOT NULL,
	"user_email" text NOT NULL,
	"change_description" text NOT NULL,
	"snapshot_data" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'subscribed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "payment_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"boq_id" integer NOT NULL,
	"ipc_number" text NOT NULL,
	"period_name" text NOT NULL,
	"gross_work_done" numeric DEFAULT '0' NOT NULL,
	"previous_claimed" numeric DEFAULT '0',
	"current_claimed" numeric DEFAULT '0' NOT NULL,
	"retention_deduction" numeric DEFAULT '0',
	"advance_repayment" numeric DEFAULT '0',
	"net_amount_payable" numeric DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'DRAFT',
	"certified_date" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procurement_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"material_name" text NOT NULL,
	"quantity" numeric DEFAULT '0' NOT NULL,
	"unit" text NOT NULL,
	"required_date" text,
	"supplier" text,
	"purchase_status" text DEFAULT 'Draft',
	"cost" numeric DEFAULT '0',
	"delivery_status" text DEFAULT 'Pending',
	"stock_balance" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_budget_estimates" (
	"id" serial PRIMARY KEY NOT NULL,
	"estimate_reference" text NOT NULL,
	"client_name" text,
	"client_email" text,
	"client_phone" text,
	"preferred_contact_method" text DEFAULT 'WhatsApp',
	"project_timeline" text,
	"project_type" text NOT NULL,
	"custom_project_type" text,
	"location" text NOT NULL,
	"region" text,
	"total_floor_area_m2" numeric NOT NULL,
	"number_of_floors" integer DEFAULT 1,
	"construction_standard" text DEFAULT 'Standard' NOT NULL,
	"building_configuration" json,
	"selected_scopes" json,
	"selected_finishes" json,
	"mode" text DEFAULT 'quick',
	"estimated_budget_min" numeric NOT NULL,
	"estimated_budget_max" numeric NOT NULL,
	"estimated_budget_expected" numeric NOT NULL,
	"cost_per_m2" numeric,
	"rate_version" text DEFAULT 'MADECC-RATES-2026-08' NOT NULL,
	"rate_snapshot" json,
	"line_items_breakdown" json,
	"status" text DEFAULT 'CALCULATED' NOT NULL,
	"lead_status" text DEFAULT 'NEW',
	"converted_project_id" integer,
	"converted_boq_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_budget_estimates_estimate_reference_unique" UNIQUE("estimate_reference")
);
--> statement-breakpoint
CREATE TABLE "project_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"milestone_name" text NOT NULL,
	"percentage" integer DEFAULT 0 NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"budget" numeric,
	"location" text NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"status" text DEFAULT 'planning' NOT NULL,
	"category_id" integer,
	"image" text NOT NULL,
	"video_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quantities_takeoff" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"item" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"source" text,
	"formula" text,
	"quantity" numeric DEFAULT '0' NOT NULL,
	"unit" text NOT NULL,
	"confidence_level" numeric DEFAULT '95.0',
	"approved" boolean DEFAULT false,
	"approved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_request_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_request_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text,
	"file_size" integer,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_number" text NOT NULL,
	"user_id" integer,
	"client_name" text NOT NULL,
	"client_company" text,
	"client_email" text NOT NULL,
	"client_phone" text NOT NULL,
	"whatsapp_number" text,
	"preferred_contact_method" text DEFAULT 'WhatsApp',
	"preferred_contact_time" text DEFAULT 'Any time',
	"project_type" text NOT NULL,
	"services_requested" json NOT NULL,
	"region" text NOT NULL,
	"division" text,
	"subdivision" text,
	"city" text,
	"neighborhood" text,
	"site_address" text,
	"latitude" numeric,
	"longitude" numeric,
	"project_name" text NOT NULL,
	"project_description" text,
	"building_type" text,
	"storeys" integer DEFAULT 1,
	"floor_area" numeric,
	"floor_area_unit" text DEFAULT 'm²',
	"site_status" text,
	"project_stage" text,
	"budget_currency" text DEFAULT 'XAF',
	"budget_min" numeric,
	"budget_max" numeric,
	"budget_range_text" text,
	"desired_start_date" timestamp,
	"expected_completion_date" timestamp,
	"urgency" text DEFAULT 'Standard',
	"additional_notes" text,
	"source" text DEFAULT 'Website Direct',
	"source_metadata" json,
	"status" text DEFAULT 'NEW' NOT NULL,
	"priority" text DEFAULT 'NORMAL' NOT NULL,
	"assigned_to" integer,
	"internal_notes" text,
	"activity_timeline" json,
	"converted_project_id" integer,
	"converted_boq_id" integer,
	"converted_estimate_id" integer,
	"admin_notification_status" text DEFAULT 'PENDING',
	"client_confirmation_status" text DEFAULT 'PENDING',
	"admin_notification_sent_at" timestamp,
	"client_confirmation_sent_at" timestamp,
	"email_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quote_requests_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "reinforcement_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"member" text NOT NULL,
	"bar_mark" text NOT NULL,
	"shape_code" text NOT NULL,
	"diameter_mm" integer NOT NULL,
	"cut_length_m" numeric NOT NULL,
	"total_bars" integer NOT NULL,
	"total_weight_kg" numeric NOT NULL,
	"cutting_list" json,
	"approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_name" text NOT NULL,
	"rating" integer NOT NULL,
	"text" text NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp,
	"project_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text,
	"name" text NOT NULL,
	"service_code" text,
	"short_description" text,
	"description" text NOT NULL,
	"full_description" text,
	"category" text DEFAULT 'Construction & Execution',
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"featured" boolean DEFAULT false,
	"display_order" integer DEFAULT 1,
	"price_range" text,
	"icon" text NOT NULL,
	"cover_image" text,
	"gallery" json,
	"supporting_documents" json,
	"seo_title" text,
	"meta_description" text,
	"keywords" text,
	"canonical_slug" text,
	"social_title" text,
	"social_description" text,
	"social_image" text,
	"overview" text,
	"what_we_deliver" json,
	"deliverables" json,
	"process_steps" json,
	"typical_projects" json,
	"industries_served" json,
	"faqs" json,
	"related_projects" json,
	"related_insights" json,
	"sections" json,
	"cta_text" text,
	"cta_destination" text,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signed_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_no" text NOT NULL,
	"client_name" text NOT NULL,
	"client_niu" text,
	"client_email" text,
	"client_address" text,
	"client_city" text,
	"contract_project" text NOT NULL,
	"contract_project_location" text,
	"contract_value" text NOT NULL,
	"contract_duration" text,
	"contract_scope" text,
	"contract_date" text,
	"contract_agreed_balance" text,
	"contract_advance_payment" text,
	"representative_name" text,
	"representative_title" text,
	"signatory_title" text,
	"typed_client_signature" text NOT NULL,
	"drawn_client_signature" text,
	"verification_token" text NOT NULL,
	"signed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "signed_contracts_contract_no_unique" UNIQUE("contract_no"),
	CONSTRAINT "signed_contracts_verification_token_unique" UNIQUE("verification_token")
);
--> statement-breakpoint
CREATE TABLE "signed_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_no" text NOT NULL,
	"client_name" text NOT NULL,
	"client_niu" text,
	"receipt_project" text NOT NULL,
	"invoice_total_amount" text,
	"receipt_amount" text NOT NULL,
	"remaining_balance" text,
	"receipt_tax_rate" text,
	"receipt_method" text NOT NULL,
	"receipt_memo" text,
	"receipt_signatory" text NOT NULL,
	"receipt_typed_sign" text NOT NULL,
	"drawn_cfo_signature" text,
	"verification_token" text NOT NULL,
	"signed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "signed_receipts_receipt_no_unique" UNIQUE("receipt_no"),
	CONSTRAINT "signed_receipts_verification_token_unique" UNIQUE("verification_token")
);
--> statement-breakpoint
CREATE TABLE "site_daily_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"log_date" text NOT NULL,
	"weather_condition" text DEFAULT 'Sunny / Clear',
	"workforce_count" integer DEFAULT 0,
	"work_done_summary" text NOT NULL,
	"concrete_cube_tests" json,
	"site_photos" json,
	"site_instructions" text,
	"rfis_and_issues" text,
	"recorded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_impact_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'Community Participation' NOT NULL,
	"location" text NOT NULL,
	"date_completed" text,
	"description" text NOT NULL,
	"impact_metrics_text" text,
	"image" text,
	"gallery" json,
	"documents" json,
	"display_order" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'PUBLISHED' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"channel_name" text NOT NULL,
	"account_handle" text,
	"account_id" text,
	"profile_image_url" text,
	"status" text DEFAULT 'CONNECTED' NOT NULL,
	"health_status" text DEFAULT 'HEALTHY',
	"approval_status" text DEFAULT 'APPROVED',
	"api_key_or_token" text,
	"access_token_encrypted" text,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp,
	"scopes" json,
	"webhook_url" text,
	"is_custom" boolean DEFAULT false,
	"connected_by" text,
	"connected_at" timestamp,
	"last_successful_api_check" timestamp,
	"last_error_code" text,
	"last_error_message" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"seo_topic" text,
	"target_platforms" json,
	"caption" text NOT NULL,
	"hashtags" text,
	"cta_text" text,
	"media_url" text,
	"media_type" text DEFAULT 'image',
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"reach_estimate" integer DEFAULT 0,
	"engagement_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_publishing_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"post_id" integer,
	"campaign_name" text,
	"platform" text NOT NULL,
	"destination_name" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"external_post_id" text,
	"external_url" text,
	"error_code" text,
	"error_message" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "social_media_publishing_jobs_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "staff_access_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_number" text NOT NULL,
	"login_key" text NOT NULL,
	"temp_password" text NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"full_name" text NOT NULL,
	"department" text DEFAULT 'Engineering' NOT NULL,
	"position" text DEFAULT 'Project Engineer' NOT NULL,
	"assigned_projects" json,
	"assigned_permissions" json,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_by" text DEFAULT 'Adminmadeccgroup' NOT NULL,
	"activated_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_access_keys_employee_number_unique" UNIQUE("employee_number"),
	CONSTRAINT "staff_access_keys_login_key_unique" UNIQUE("login_key")
);
--> statement-breakpoint
CREATE TABLE "staff_announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"department" text DEFAULT 'ALL',
	"author" text DEFAULT 'Adminmadeccgroup',
	"priority" text DEFAULT 'NORMAL',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user" text NOT NULL,
	"target_employee" text,
	"action" text NOT NULL,
	"details" text NOT NULL,
	"ip_address" text DEFAULT '127.0.0.1',
	"device_info" text DEFAULT 'Enterprise Web Client',
	"module" text DEFAULT 'STAFF_MANAGEMENT',
	"previous_value" text,
	"new_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_login_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_number" text NOT NULL,
	"login_key_used" text,
	"ip_address" text DEFAULT '127.0.0.1',
	"device_info" text DEFAULT 'Enterprise Web Client',
	"status" text NOT NULL,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_number" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"category" text DEFAULT 'SYSTEM',
	"is_read" integer DEFAULT 0,
	"action_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_performance_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_number" text NOT NULL,
	"reviewer_name" text DEFAULT 'Adminmadeccgroup',
	"review_period" text NOT NULL,
	"kpi_score" numeric DEFAULT '85.0',
	"quality_rating" numeric DEFAULT '90.0',
	"safety_rating" numeric DEFAULT '95.0',
	"completed_tasks_count" integer DEFAULT 12,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_name" text NOT NULL,
	"description" text,
	"department" text DEFAULT 'Engineering',
	"permissions" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_roles_role_name_unique" UNIQUE("role_name")
);
--> statement-breakpoint
CREATE TABLE "staff_training_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_number" text NOT NULL,
	"course_title" text NOT NULL,
	"institution" text DEFAULT 'ONIGC / Eurocode Academy',
	"completion_date" text,
	"expiry_date" text,
	"certificate_url" text,
	"status" text DEFAULT 'COMPLETED',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "structural_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"element_name" text NOT NULL,
	"design_code" text DEFAULT 'EN 1992 Eurocode 2' NOT NULL,
	"inputs_data" json NOT NULL,
	"steps_data" json NOT NULL,
	"results_data" json NOT NULL,
	"approved_by_engineer" boolean DEFAULT false,
	"engineer_name" text,
	"disclaimer_notice" text DEFAULT 'AI-generated engineering outputs are design assistance drafts. Final responsibility, verification and approval remain with qualified engineers.',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "structural_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_code" text NOT NULL,
	"project_name" text NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text,
	"location" text NOT NULL,
	"prepared_by" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"design_inputs" json,
	"drawings" json,
	"detected_elements" json,
	"calculations_result" json,
	"revision_number" text DEFAULT 'REV-01' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subcontract_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"subcontractor_name" text NOT NULL,
	"trade_package" text NOT NULL,
	"contract_sum" numeric DEFAULT '0' NOT NULL,
	"progress_percentage" numeric DEFAULT '0',
	"total_paid" numeric DEFAULT '0',
	"retention_held" numeric DEFAULT '0',
	"status" text DEFAULT 'ACTIVE',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subcontractor_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_number" text NOT NULL,
	"company_name" text NOT NULL,
	"trade" text NOT NULL,
	"years_in_business" integer DEFAULT 1,
	"workforce_size" integer DEFAULT 5,
	"equipment_owned" text,
	"previous_projects" text,
	"geographic_coverage" text,
	"safety_record" text,
	"certifications" text,
	"references_list" text,
	"country" text DEFAULT 'Cameroon' NOT NULL,
	"region" text NOT NULL,
	"city" text NOT NULL,
	"address" text NOT NULL,
	"contact_person" text NOT NULL,
	"position" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp" text,
	"compliance_documents" json,
	"declaration_accepted" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'SUBMITTED' NOT NULL,
	"reviewer_notes" text,
	"assigned_reviewer" text,
	"assigned_reviewer_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subcontractor_applications_application_number_unique" UNIQUE("application_number")
);
--> statement-breakpoint
CREATE TABLE "supplier_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_number" text NOT NULL,
	"company_name" text NOT NULL,
	"registration_number" text NOT NULL,
	"company_type" text DEFAULT 'SARL' NOT NULL,
	"country" text DEFAULT 'Cameroon' NOT NULL,
	"region" text NOT NULL,
	"division" text,
	"city" text NOT NULL,
	"address" text NOT NULL,
	"website" text,
	"contact_person" text NOT NULL,
	"position" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp" text,
	"supplier_category" text NOT NULL,
	"products" text NOT NULL,
	"years_in_business" integer DEFAULT 1,
	"service_regions" json,
	"capacity" text,
	"previous_projects" text,
	"major_clients" text,
	"compliance_documents" json,
	"declaration_accepted" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'SUBMITTED' NOT NULL,
	"reviewer_notes" text,
	"assigned_reviewer" text,
	"assigned_reviewer_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_applications_application_number_unique" UNIQUE("application_number")
);
--> statement-breakpoint
CREATE TABLE "supplier_subcontractor_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'supplier' NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sustainability_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'Sustainability & Social Impact' NOT NULL,
	"hero_subtitle" text DEFAULT 'Building responsibly. Creating lasting value.' NOT NULL,
	"introduction" text NOT NULL,
	"environmental_policy" text,
	"safety_policy" text,
	"local_economic_commitment" text,
	"documents" json,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sustainability_initiatives" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'Sustainable Construction' NOT NULL,
	"description" text NOT NULL,
	"impact_summary" text,
	"image" text,
	"documents" json,
	"display_order" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'PUBLISHED' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "syllabus_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"file_type" text NOT NULL,
	"extracted_text" text NOT NULL,
	"learning_objectives" text,
	"curriculum_standards" text,
	"key_topics" text,
	"subject" text,
	"grade_level" text,
	"academic_year" text,
	"category" text,
	"version_number" text DEFAULT '1.0.0',
	"status" text DEFAULT 'processed' NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"specialization" text NOT NULL,
	"image" text,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tender_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tender_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tender_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_number" text NOT NULL,
	"tender_id" integer NOT NULL,
	"tender_reference" text NOT NULL,
	"company_name" text NOT NULL,
	"contact_person" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"expression_of_interest" text NOT NULL,
	"supporting_documents" json,
	"status" text DEFAULT 'SUBMITTED' NOT NULL,
	"internal_evaluation_notes" text,
	"evaluated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tender_submissions_submission_number_unique" UNIQUE("submission_number")
);
--> statement-breakpoint
CREATE TABLE "tenders" (
	"id" serial PRIMARY KEY NOT NULL,
	"tender_number" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category_id" integer,
	"category_name" text DEFAULT 'Construction' NOT NULL,
	"client_project" text NOT NULL,
	"location" text NOT NULL,
	"description" text NOT NULL,
	"scope_of_work" text NOT NULL,
	"eligibility" text NOT NULL,
	"required_experience" text,
	"required_documents" text,
	"submission_method" text DEFAULT 'Online Submission & Hard Copy at MADECC Douala Head Office' NOT NULL,
	"opening_date" timestamp DEFAULT now() NOT NULL,
	"closing_date" timestamp NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"contact_instructions" text DEFAULT 'For tender clarifications, contact procurement@madeccgroup.com or call +237 670 00 00 00.' NOT NULL,
	"attachments" json,
	"featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"created_by" text,
	"published_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenders_tender_number_unique" UNIQUE("tender_number"),
	CONSTRAINT "tenders_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_sync_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'client' NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_uid_unique" UNIQUE("uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_audit_logs" ADD CONSTRAINT "boq_audit_logs_boq_id_boqs_id_fk" FOREIGN KEY ("boq_id") REFERENCES "public"."boqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_items" ADD CONSTRAINT "boq_items_section_id_boq_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."boq_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_items" ADD CONSTRAINT "boq_items_boq_id_boqs_id_fk" FOREIGN KEY ("boq_id") REFERENCES "public"."boqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_revisions" ADD CONSTRAINT "boq_revisions_boq_id_boqs_id_fk" FOREIGN KEY ("boq_id") REFERENCES "public"."boqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_sections" ADD CONSTRAINT "boq_sections_boq_id_boqs_id_fk" FOREIGN KEY ("boq_id") REFERENCES "public"."boqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boqs" ADD CONSTRAINT "boqs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boqs" ADD CONSTRAINT "boqs_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_broadcast_delivery_logs" ADD CONSTRAINT "custom_broadcast_delivery_logs_outlet_id_custom_broadcast_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."custom_broadcast_outlets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_category_id_faq_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."faq_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_progress" ADD CONSTRAINT "project_progress_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_request_documents" ADD CONSTRAINT "quote_request_documents_quote_request_id_quote_requests_id_fk" FOREIGN KEY ("quote_request_id") REFERENCES "public"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcontractor_applications" ADD CONSTRAINT "subcontractor_applications_assigned_reviewer_id_users_id_fk" FOREIGN KEY ("assigned_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_applications" ADD CONSTRAINT "supplier_applications_assigned_reviewer_id_users_id_fk" FOREIGN KEY ("assigned_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender_submissions" ADD CONSTRAINT "tender_submissions_tender_id_tenders_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_category_id_tender_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tender_categories"("id") ON DELETE set null ON UPDATE no action;