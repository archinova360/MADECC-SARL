CREATE TABLE "data_deletion_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"confirmation_code" text,
	"tracking_code" text,
	"email" text,
	"user_email" text,
	"user_name" text,
	"facebook_user_id" text,
	"request_reason" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"details" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_history_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"module_type" text NOT NULL,
	"record_id" text NOT NULL,
	"document_title" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"format" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"filename" text NOT NULL,
	"error_message" text,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer,
	"key" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"description" text,
	"rules" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"filename" text NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text DEFAULT 'image' NOT NULL,
	"mime_type" text,
	"file_size" integer DEFAULT 0,
	"dimensions" text,
	"alt_text" text,
	"caption" text,
	"category" text DEFAULT 'General' NOT NULL,
	"tags" json,
	"used_in" json,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"uploaded_by" text DEFAULT 'MADECC Media Admin',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_content_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_slug" text NOT NULL,
	"version" integer NOT NULL,
	"title" text,
	"snapshot_data" json NOT NULL,
	"change_summary" text,
	"author" text DEFAULT 'MADECC CMS Admin',
	"is_published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'PUBLISHED' NOT NULL,
	"hero_config" json,
	"sections" json,
	"seo" json,
	"draft_data" json,
	"published_data" json,
	"version" integer DEFAULT 1 NOT NULL,
	"last_saved_by" text DEFAULT 'MADECC Executive Admin',
	"published_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "page_contents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"monthly_price" integer NOT NULL,
	"annual_price" integer NOT NULL,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"max_users" integer DEFAULT 3 NOT NULL,
	"max_projects" integer DEFAULT 5 NOT NULL,
	"max_storage_gb" integer DEFAULT 5 NOT NULL,
	"ai_credits_monthly" integer DEFAULT 100 NOT NULL,
	"features" json,
	"is_popular" boolean DEFAULT false,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "platform_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer,
	"user_id" text,
	"user_email" text,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"ip_address" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviewer_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text DEFAULT 'Meta App Review Tester' NOT NULL,
	"role" text DEFAULT 'social_media_reviewer' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviewer_credentials_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_name" text DEFAULT 'MADECC Group' NOT NULL,
	"tagline" text DEFAULT 'Premier Engineering, Construction & Project Management in Cameroon',
	"phone" text DEFAULT '+237 670 00 00 00',
	"emergency_phone" text DEFAULT '+237 690 00 00 00',
	"email" text DEFAULT 'contact@madeccgroup.com',
	"office_address_yaounde" text DEFAULT 'Mbankolo, Yaoundé, Centre Region, Cameroon',
	"office_address_douala" text DEFAULT 'Akwa, Douala, Littoral Region, Cameroon',
	"business_hours" text DEFAULT 'Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 14:00 (GMT+1)',
	"whatsapp_number" text DEFAULT '+237670000000',
	"facebook_url" text DEFAULT 'https://facebook.com/madeccgroup',
	"linkedin_url" text DEFAULT 'https://linkedin.com/company/madecc-group',
	"instagram_url" text DEFAULT 'https://instagram.com/madeccgroup',
	"youtube_url" text DEFAULT 'https://youtube.com/@madeccgroup',
	"twitter_url" text DEFAULT 'https://x.com/madeccgroup',
	"logo_url" text,
	"favicon_url" text,
	"global_seo" json,
	"navigation_links" json,
	"footer_content" json,
	"emergency_banner" json,
	"updated_by" text DEFAULT 'MADECC Executive Admin',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"plan_code" text NOT NULL,
	"billing_cycle" text DEFAULT 'MONTHLY' NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"status" text DEFAULT 'PENDING_CONFIRMATION' NOT NULL,
	"payment_method" text,
	"payment_reference" text,
	"sender_phone" text,
	"notes" text,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"renewal_date" timestamp NOT NULL,
	"confirmed_at" timestamp,
	"confirmed_by" text,
	"thank_you_shown" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"domain" text NOT NULL,
	"domain_type" text DEFAULT 'CUSTOM' NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"ssl_status" text DEFAULT 'PROVISIONED',
	"verification_token" text,
	"verified_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "tenant_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"role" text DEFAULT 'MEMBER' NOT NULL,
	"permissions" json,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"invited_by" text,
	"invited_at" timestamp,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"legal_name" text,
	"logo_url" text,
	"favicon_url" text,
	"primary_domain" text,
	"custom_domain" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"plan_code" text DEFAULT 'ENTERPRISE' NOT NULL,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"timezone" text DEFAULT 'Africa/Douala',
	"phone" text,
	"email" text,
	"address" text,
	"country" text DEFAULT 'Cameroon',
	"settings" json,
	"ai_credits_balance" integer DEFAULT 10000 NOT NULL,
	"storage_usage_bytes" integer DEFAULT 0 NOT NULL,
	"is_flagship" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"user_id" text,
	"event_type" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'credit' NOT NULL,
	"estimated_cost" integer DEFAULT 0,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "signed_receipts" ADD COLUMN "client_email" text;--> statement-breakpoint
ALTER TABLE "signed_receipts" ADD COLUMN "currency" text DEFAULT 'XAF';--> statement-breakpoint
ALTER TABLE "signed_receipts" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "signed_receipts" ADD COLUMN "status" text DEFAULT 'ISSUED' NOT NULL;--> statement-breakpoint
ALTER TABLE "signed_receipts" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;