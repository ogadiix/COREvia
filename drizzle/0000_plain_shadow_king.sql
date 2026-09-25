CREATE TABLE "account_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"available_balance" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"ledger_balance" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"lien_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"unclear_balance" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"as_of_date" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_balances_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_number" text NOT NULL,
	"customer_id" integer NOT NULL,
	"account_type" text NOT NULL,
	"scheme_code" text NOT NULL,
	"scheme_name" text NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"interest_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"branch_code" text DEFAULT '0104' NOT NULL,
	"branch_name" text DEFAULT 'Mumbai Fort Branch' NOT NULL,
	"ifsc_code" text DEFAULT 'CRVI0001042' NOT NULL,
	"open_date" date NOT NULL,
	"pan_number" text NOT NULL,
	"nominee_name" text,
	"nominee_relation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"actor_name" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"request_id" text NOT NULL,
	"outcome" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"author_id" integer,
	"author_name" text NOT NULL,
	"comment" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"address_type" text DEFAULT 'REGISTERED' NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"pin_code" text NOT NULL,
	"country" text DEFAULT 'INDIA' NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"contact_type" text NOT NULL,
	"contact_value" text NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"insight_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"urgency" text DEFAULT 'MEDIUM' NOT NULL,
	"action_prompt" text,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"account_id" integer,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"enrolled_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"core_score" integer NOT NULL,
	"financial_health_score" integer NOT NULL,
	"credit_risk_score" integer NOT NULL,
	"engagement_score" integer NOT NULL,
	"churn_probability" numeric(5, 2) NOT NULL,
	"calculation_date" date NOT NULL,
	"factors" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_scores_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_code" text NOT NULL,
	"cif_number" text NOT NULL,
	"name" text NOT NULL,
	"entity_type" text NOT NULL,
	"ckyc_number" text,
	"pan_number" text NOT NULL,
	"aadhaar_status" text DEFAULT 'VERIFIED' NOT NULL,
	"gstin" text,
	"risk_category" text DEFAULT 'LOW' NOT NULL,
	"cibil_score" integer DEFAULT 750 NOT NULL,
	"occupation_or_sector" text NOT NULL,
	"annual_turnover_or_income" numeric(18, 2) NOT NULL,
	"relationship_value" numeric(18, 2) NOT NULL,
	"onboarding_date" date NOT NULL,
	"kyc_last_reviewed" date,
	"kyc_next_review_due" date,
	"aml_alert_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"assigned_rm_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_customer_code_unique" UNIQUE("customer_code"),
	CONSTRAINT "customers_cif_number_unique" UNIQUE("cif_number")
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"channel" text NOT NULL,
	"interaction_type" text NOT NULL,
	"subject" text NOT NULL,
	"summary" text NOT NULL,
	"outcome" text NOT NULL,
	"agent_id" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_account_number" text NOT NULL,
	"customer_id" integer NOT NULL,
	"loan_type" text NOT NULL,
	"sanctioned_limit" numeric(18, 2) NOT NULL,
	"drawing_power" numeric(18, 2) NOT NULL,
	"outstanding_principal" numeric(18, 2) NOT NULL,
	"interest_due" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"interest_rate" numeric(5, 2) NOT NULL,
	"benchmark_rate" text NOT NULL,
	"sanction_date" date NOT NULL,
	"maturity_date" date NOT NULL,
	"next_emi_date" date,
	"emi_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"overdue_days" integer DEFAULT 0 NOT NULL,
	"asset_classification" text DEFAULT 'STANDARD' NOT NULL,
	"collateral_type" text,
	"collateral_value" numeric(18, 2) DEFAULT '0.00',
	"hypothecation_details" text,
	"priority_sector" boolean DEFAULT false NOT NULL,
	"provision_amount" numeric(18, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loans_loan_account_number_unique" UNIQUE("loan_account_number")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"notification_type" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"link_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"opportunity_code" text NOT NULL,
	"customer_id" integer NOT NULL,
	"product_id" integer,
	"title" text NOT NULL,
	"stage" text DEFAULT 'PROSPECT' NOT NULL,
	"expected_value" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"probability" integer DEFAULT 50 NOT NULL,
	"expected_close_date" date,
	"notes" text,
	"assigned_to_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "opportunities_opportunity_code_unique" UNIQUE("opportunity_code")
);
--> statement-breakpoint
CREATE TABLE "opportunity_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"opportunity_id" integer NOT NULL,
	"activity_type" text NOT NULL,
	"description" text NOT NULL,
	"performed_by_id" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"module" text NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_code" text NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_product_code_unique" UNIQUE("product_code")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "service_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"customer_id" integer NOT NULL,
	"account_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"assigned_to_id" integer,
	"resolution_summary" text,
	"sla_due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_cases_case_number_unique" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" date NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"assigned_to_id" integer,
	"related_type" text,
	"related_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"utr_number" text NOT NULL,
	"account_id" integer,
	"customer_id" integer,
	"txn_type" text NOT NULL,
	"rail" text NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"balance_after" numeric(18, 2),
	"counterparty_account" text,
	"counterparty_name" text,
	"counterparty_ifsc" text,
	"narration" text NOT NULL,
	"status" text DEFAULT 'SETTLED' NOT NULL,
	"batch_number" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_transaction_id_unique" UNIQUE("transaction_id"),
	CONSTRAINT "transactions_utr_number_unique" UNIQUE("utr_number")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"employee_id" text NOT NULL,
	"role" text DEFAULT 'OFFICER' NOT NULL,
	"department" text DEFAULT 'BRANCH_OPERATIONS' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_uid_unique" UNIQUE("uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
ALTER TABLE "account_balances" ADD CONSTRAINT "account_balances_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_comments" ADD CONSTRAINT "case_comments_case_id_service_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."service_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_comments" ADD CONSTRAINT "case_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD CONSTRAINT "customer_insights_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_scores" ADD CONSTRAINT "customer_scores_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_assigned_rm_id_users_id_fk" FOREIGN KEY ("assigned_rm_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_activities" ADD CONSTRAINT "opportunity_activities_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_activities" ADD CONSTRAINT "opportunity_activities_performed_by_id_users_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_cases" ADD CONSTRAINT "service_cases_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_cases" ADD CONSTRAINT "service_cases_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_cases" ADD CONSTRAINT "service_cases_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_balances_account_id_idx" ON "account_balances" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_acc_num_idx" ON "accounts" USING btree ("account_number");--> statement-breakpoint
CREATE INDEX "accounts_customer_idx" ON "accounts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "accounts_status_idx" ON "accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_request_idx" ON "audit_logs" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scores_customer_id_idx" ON "customer_scores" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_code_idx" ON "customers" USING btree ("customer_code");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_cif_idx" ON "customers" USING btree ("cif_number");--> statement-breakpoint
CREATE INDEX "customers_pan_idx" ON "customers" USING btree ("pan_number");--> statement-breakpoint
CREATE INDEX "customers_risk_idx" ON "customers" USING btree ("risk_category");--> statement-breakpoint
CREATE INDEX "interactions_customer_idx" ON "interactions" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loans_account_num_idx" ON "loans" USING btree ("loan_account_number");--> statement-breakpoint
CREATE INDEX "loans_customer_idx" ON "loans" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "loans_asset_class_idx" ON "loans" USING btree ("asset_classification");--> statement-breakpoint
CREATE UNIQUE INDEX "opp_code_idx" ON "opportunities" USING btree ("opportunity_code");--> statement-breakpoint
CREATE INDEX "opp_customer_idx" ON "opportunities" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "opp_stage_idx" ON "opportunities" USING btree ("stage");--> statement-breakpoint
CREATE UNIQUE INDEX "cases_number_idx" ON "service_cases" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "cases_customer_idx" ON "service_cases" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "cases_status_idx" ON "service_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_customer_idx" ON "tasks" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_txn_id_idx" ON "transactions" USING btree ("transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_utr_idx" ON "transactions" USING btree ("utr_number");--> statement-breakpoint
CREATE INDEX "transactions_account_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_customer_idx" ON "transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_uid_idx" ON "users" USING btree ("uid");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_emp_id_idx" ON "users" USING btree ("employee_id");