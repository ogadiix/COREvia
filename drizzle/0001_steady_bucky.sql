CREATE TABLE "agent_plan_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"step_number" integer NOT NULL,
	"action_type" text NOT NULL,
	"target_entity_type" text,
	"target_entity_id" text,
	"parameters" jsonb,
	"rationale" text NOT NULL,
	"required_permission" text DEFAULT 'customers:read' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"requires_confirmation" boolean DEFAULT true NOT NULL,
	"depends_on_step_number" integer,
	"dependency_policy" text DEFAULT 'SKIP',
	"idempotency_key" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_code" text,
	"error_message" text,
	"result_summary" text,
	"audit_log_id" integer,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"session_id" integer NOT NULL,
	"customer_id" integer,
	"title" text NOT NULL,
	"objective" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"plan_version" integer DEFAULT 1 NOT NULL,
	"decision_trace_id" text,
	"scenario_id" text,
	"estimated_effect" text,
	"plan_rationale" text,
	"rejection_reason" text,
	"expires_at" timestamp,
	"approved_at" timestamp,
	"approved_by" integer,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_plans_plan_id_unique" UNIQUE("plan_id")
);
--> statement-breakpoint
CREATE TABLE "agent_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"customer_id" integer,
	"context_type" text NOT NULL,
	"context_id" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "customer_journey_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"journey_id" integer NOT NULL,
	"step_id" text NOT NULL,
	"step_number" integer NOT NULL,
	"step_key" text NOT NULL,
	"step_type" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"owner_id" integer,
	"owner_role" text,
	"required" boolean DEFAULT true NOT NULL,
	"dependency" text,
	"sla_days" integer DEFAULT 3 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"due_at" timestamp,
	"sla_status" text DEFAULT 'ON_TRACK' NOT NULL,
	"blocked_reason" text,
	"completion_evidence" jsonb,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_journeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"journey_id" text NOT NULL,
	"customer_id" integer NOT NULL,
	"template_id" integer,
	"journey_type" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'NOT_STARTED' NOT NULL,
	"priority" text DEFAULT 'NORMAL' NOT NULL,
	"owner_id" integer,
	"owner_role" text DEFAULT 'RELATIONSHIP_MANAGER' NOT NULL,
	"current_step_id" integer,
	"started_at" timestamp,
	"target_completion_at" timestamp,
	"completed_at" timestamp,
	"blocked_reason" text,
	"blocked_at" timestamp,
	"sla_status" text DEFAULT 'ON_TRACK' NOT NULL,
	"escalated_at" timestamp,
	"escalated_to" integer,
	"escalated_by" integer,
	"escalation_reason" text,
	"decision_trace_id" text,
	"metadata" jsonb,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_journeys_journey_id_unique" UNIQUE("journey_id")
);
--> statement-breakpoint
CREATE TABLE "customer_opportunity_radar" (
	"id" serial PRIMARY KEY NOT NULL,
	"radar_id" text NOT NULL,
	"customer_id" integer NOT NULL,
	"signal_type" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"category" text NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"relevance_score" integer DEFAULT 70 NOT NULL,
	"confidence" text DEFAULT 'MEDIUM' NOT NULL,
	"rationale" text NOT NULL,
	"expected_value_band" text,
	"status" text DEFAULT 'DETECTED' NOT NULL,
	"rule_id" text NOT NULL,
	"rule_version" text DEFAULT 'RADAR-v1' NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"converted_opportunity_id" integer,
	"existing_opportunity_id" integer,
	"target_product_id" integer,
	"dismissed_reason" text,
	"dismissed_by_id" integer,
	"dismissed_by_name" text,
	"dismissed_at" timestamp,
	"reviewed_by_id" integer,
	"reviewed_by_name" text,
	"reviewed_at" timestamp,
	"evidence" text DEFAULT '[]' NOT NULL,
	"dedup_key" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_opportunity_radar_radar_id_unique" UNIQUE("radar_id")
);
--> statement-breakpoint
CREATE TABLE "customer_opportunity_radar_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"radar_id" integer NOT NULL,
	"source_entity_type" text NOT NULL,
	"source_entity_id" text NOT NULL,
	"source_entity_code" text NOT NULL,
	"record_title" text NOT NULL,
	"evidence_type" text DEFAULT 'RECORD' NOT NULL,
	"evidence_summary" text NOT NULL,
	"detail" text,
	"route_path" text,
	"metric_value" text,
	"timestamp" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_score_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"core_score" integer NOT NULL,
	"financial_health_score" integer NOT NULL,
	"credit_risk_score" integer NOT NULL,
	"engagement_score" integer NOT NULL,
	"recorded_date" date NOT NULL,
	"factors" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_trace_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"decision_trace_id" integer NOT NULL,
	"evidence_type" text NOT NULL,
	"source_engine" text NOT NULL,
	"source_entity_type" text NOT NULL,
	"source_entity_id" text NOT NULL,
	"source_field" text,
	"description" text NOT NULL,
	"observed_value" text NOT NULL,
	"previous_value" text,
	"change_direction" text,
	"contribution_type" text DEFAULT 'SUPPORTING' NOT NULL,
	"contribution_weight" text,
	"data_as_of" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_trace_source_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"decision_trace_id" integer NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"source_engine" text NOT NULL,
	"description" text NOT NULL,
	"source_timestamp" timestamp DEFAULT now() NOT NULL,
	"authorization_scope" text DEFAULT 'BRANCH' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_traces" (
	"id" serial PRIMARY KEY NOT NULL,
	"decision_id" text NOT NULL,
	"customer_id" integer,
	"user_id" integer,
	"source_module" text NOT NULL,
	"source_engine" text NOT NULL,
	"decision_type" text NOT NULL,
	"decision_status" text DEFAULT 'PENDING' NOT NULL,
	"recommendation_title" text NOT NULL,
	"recommendation_summary" text NOT NULL,
	"recommendation_payload" text,
	"decision_mode" text DEFAULT 'DETERMINISTIC' NOT NULL,
	"confidence" text,
	"confidence_basis" text DEFAULT 'Rule-based' NOT NULL,
	"limitations" text,
	"action_title" text,
	"action_type" text,
	"action_payload" text,
	"confirmed_by_id" integer,
	"confirmed_at" timestamp,
	"execution_status" text,
	"executed_at" timestamp,
	"outcome" text,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"data_as_of" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decision_traces_decision_id_unique" UNIQUE("decision_id")
);
--> statement-breakpoint
CREATE TABLE "document_extractions" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"field_name" text NOT NULL,
	"extracted_value" text,
	"confidence" numeric(4, 2) DEFAULT '0.92',
	"verification_status" text DEFAULT 'NOT_VERIFIED' NOT NULL,
	"verified_by_id" integer,
	"verified_by_name" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_title" text,
	"relationship" text DEFAULT 'SUPPORTING_DOCUMENT' NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"requirement_code" text NOT NULL,
	"customer_id" integer NOT NULL,
	"related_entity_type" text DEFAULT 'CUSTOMER' NOT NULL,
	"related_entity_id" text,
	"document_type" text NOT NULL,
	"category" text DEFAULT 'IDENTITY' NOT NULL,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'MISSING' NOT NULL,
	"fulfilled_document_id" integer,
	"notes" text,
	"due_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"reviewer_id" integer,
	"reviewer_name" text NOT NULL,
	"decision" text NOT NULL,
	"comments" text,
	"rejection_reason" text,
	"replacement_doc_type" text,
	"replacement_due_date" date,
	"reviewed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"version" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_size" text DEFAULT '1.2 MB',
	"mime_type" text DEFAULT 'application/pdf',
	"storage_key" text,
	"status" text NOT NULL,
	"review_status" text NOT NULL,
	"uploaded_by_id" integer,
	"uploaded_by_name" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"change_reason" text,
	"rejection_reason" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_code" text NOT NULL,
	"document_type" text NOT NULL,
	"category" text DEFAULT 'IDENTITY' NOT NULL,
	"customer_id" integer NOT NULL,
	"customer_name" text NOT NULL,
	"related_entity_type" text DEFAULT 'CUSTOMER' NOT NULL,
	"related_entity_id" text,
	"file_name" text NOT NULL,
	"file_size" text DEFAULT '1.2 MB',
	"mime_type" text DEFAULT 'application/pdf',
	"storage_key" text,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'UPLOADED' NOT NULL,
	"review_status" text DEFAULT 'PENDING' NOT NULL,
	"uploaded_by_id" integer,
	"uploaded_by_name" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by_id" integer,
	"reviewed_by_name" text,
	"reviewed_at" timestamp,
	"expiry_date" date,
	"rejection_reason" text,
	"replacement_required" boolean DEFAULT false NOT NULL,
	"replacement_reason" text,
	"replacement_doc_type" text,
	"replacement_due_date" date,
	"visibility" text DEFAULT 'INTERNAL' NOT NULL,
	"description" text,
	"is_synthetic" boolean DEFAULT true NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "documents_document_code_unique" UNIQUE("document_code")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"flag_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"environment" text DEFAULT 'ALL' NOT NULL,
	"rollout_scope" text DEFAULT 'ALL' NOT NULL,
	"owner" text DEFAULT 'SYSTEM_ADMIN' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_flag_key_unique" UNIQUE("flag_key")
);
--> statement-breakpoint
CREATE TABLE "governance_exceptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"exception_id" text NOT NULL,
	"category" text NOT NULL,
	"severity" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"description" text NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"assigned_to" integer,
	"resolved_at" timestamp,
	"resolution" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "governance_exceptions_exception_id_unique" UNIQUE("exception_id")
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"request_hash" text NOT NULL,
	"endpoint" text NOT NULL,
	"actor_id" text NOT NULL,
	"status" text DEFAULT 'PROCESSING' NOT NULL,
	"response_status" integer,
	"response_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "idempotency_records_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "integration_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"credential_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"environment" text DEFAULT 'DEVELOPMENT' NOT NULL,
	"permissions" jsonb DEFAULT '["read","execute"]'::jsonb NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"revoked_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integration_credentials_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "integration_endpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"purpose" text NOT NULL,
	"version" text DEFAULT 'v1' NOT NULL,
	"auth_type" text DEFAULT 'SERVICE_TOKEN' NOT NULL,
	"rate_limit" integer DEFAULT 60 NOT NULL,
	"timeout_ms" integer DEFAULT 5000 NOT NULL,
	"idempotency_required" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integration_endpoints_endpoint_id_unique" UNIQUE("endpoint_id")
);
--> statement-breakpoint
CREATE TABLE "integration_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"event_type" text NOT NULL,
	"direction" text DEFAULT 'OUTBOUND' NOT NULL,
	"status" text DEFAULT 'SUCCESS' NOT NULL,
	"correlation_id" text NOT NULL,
	"related_entity_type" text,
	"related_entity_id" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"latency_ms" integer,
	"error_code" text,
	"error_message" text,
	"retryable" boolean DEFAULT false NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"payload_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integration_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "integration_webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"webhook_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"event_type" text NOT NULL,
	"target_url" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"secret_hash" text NOT NULL,
	"secret_metadata" jsonb NOT NULL,
	"last_delivery_at" timestamp,
	"last_response_status" integer,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integration_webhooks_webhook_id_unique" UNIQUE("webhook_id")
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_id" text NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"adapter_type" text NOT NULL,
	"mode" text DEFAULT 'SIMULATOR' NOT NULL,
	"status" text DEFAULT 'SIMULATED' NOT NULL,
	"environment" text DEFAULT 'DEVELOPMENT' NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"base_url" text DEFAULT 'http://localhost:3000/api/integrations/simulators' NOT NULL,
	"timeout_ms" integer DEFAULT 5000 NOT NULL,
	"rate_limit_rpm" integer DEFAULT 120 NOT NULL,
	"retry_policy" jsonb DEFAULT '{"maxRetries":3,"backoffMs":1000,"retryableCodes":["TIMEOUT","NETWORK_ERROR","503","502"]}'::jsonb NOT NULL,
	"circuit_breaker" jsonb DEFAULT '{"state":"CLOSED","failureThreshold":5,"consecutiveFailures":0,"resetTimeoutMs":30000}'::jsonb NOT NULL,
	"health_status" text DEFAULT 'SIMULATOR_HEALTHY' NOT NULL,
	"last_health_check" timestamp,
	"last_successful_event" timestamp,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"success_rate" numeric(5, 2) DEFAULT '100.0' NOT NULL,
	"average_latency_ms" integer DEFAULT 45 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integrations_integration_id_unique" UNIQUE("integration_id")
);
--> statement-breakpoint
CREATE TABLE "interaction_commitments" (
	"id" serial PRIMARY KEY NOT NULL,
	"interaction_id" integer NOT NULL,
	"commitment_type" text NOT NULL,
	"description" text NOT NULL,
	"owner_name" text,
	"due_date" timestamp,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_task_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "interaction_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"interaction_id" integer NOT NULL,
	"link_type" text NOT NULL,
	"link_id" text NOT NULL,
	"title" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interaction_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"interaction_id" integer NOT NULL,
	"participant_type" text DEFAULT 'CUSTOMER' NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"role" text,
	"attended" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_outcomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"journey_id" integer NOT NULL,
	"outcome_type" text NOT NULL,
	"outcome" text NOT NULL,
	"summary" text NOT NULL,
	"evidence" jsonb,
	"recorded_by" integer NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "journey_template_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"step_order" integer NOT NULL,
	"step_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"step_type" text NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"sla_days" integer DEFAULT 3 NOT NULL,
	"dependency_step_keys" jsonb,
	"default_owner_role" text DEFAULT 'RELATIONSHIP_MANAGER' NOT NULL,
	"evidence_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'LIFECYCLE' NOT NULL,
	"default_priority" text DEFAULT 'NORMAL' NOT NULL,
	"target_duration_days" integer DEFAULT 14 NOT NULL,
	"default_owner_role" text DEFAULT 'RELATIONSHIP_MANAGER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "journey_templates_template_code_unique" UNIQUE("template_code")
);
--> statement-breakpoint
CREATE TABLE "kyb_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"legal_entity_name" text NOT NULL,
	"entity_type" text DEFAULT 'PRIVATE_LIMITED' NOT NULL,
	"cin_or_registration_number" text,
	"gstin" text,
	"incorporation_date" date,
	"registered_address" text,
	"ubo_verification_status" text DEFAULT 'PENDING' NOT NULL,
	"ubo_count" integer DEFAULT 1 NOT NULL,
	"board_resolution_status" text DEFAULT 'PENDING' NOT NULL,
	"authorized_signatories_status" text DEFAULT 'PENDING' NOT NULL,
	"status" text DEFAULT 'NOT_STARTED' NOT NULL,
	"reviewer_id" integer,
	"reviewed_at" timestamp,
	"simulation_disclaimer" text DEFAULT 'Simulation / Synthetic Verification - For Demonstration and Evaluation Only',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"customer_id" integer,
	"identity_status" text DEFAULT 'NOT_STARTED' NOT NULL,
	"address_status" text DEFAULT 'NOT_STARTED' NOT NULL,
	"contact_status" text DEFAULT 'NOT_STARTED' NOT NULL,
	"pan_verification_status" text DEFAULT 'SIMULATED_VERIFIED' NOT NULL,
	"pan_number" text,
	"aadhaar_status" text DEFAULT 'SIMULATED_VERIFIED' NOT NULL,
	"ckyc_number" text,
	"pep_status" text DEFAULT 'NO_MATCH' NOT NULL,
	"sanctions_check_status" text DEFAULT 'PASSED_SIMULATED' NOT NULL,
	"adverse_media_status" text DEFAULT 'CLEAR' NOT NULL,
	"risk_category" text DEFAULT 'LOW' NOT NULL,
	"status" text DEFAULT 'NOT_STARTED' NOT NULL,
	"review_summary" text,
	"reviewer_id" integer,
	"reviewed_at" timestamp,
	"simulation_disclaimer" text DEFAULT 'Simulation / Synthetic Verification - For Demonstration and Evaluation Only',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_repayments" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"principal_paid" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"interest_paid" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(18, 2) NOT NULL,
	"outstanding_balance_after" numeric(18, 2) NOT NULL,
	"payment_mode" text DEFAULT 'AUTO_DEBIT' NOT NULL,
	"reference_number" text,
	"status" text DEFAULT 'PAID' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "next_best_action_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_id" integer NOT NULL,
	"source_entity_type" text NOT NULL,
	"source_entity_id" text NOT NULL,
	"source_entity_code" text NOT NULL,
	"record_title" text NOT NULL,
	"evidence_type" text DEFAULT 'RECORD' NOT NULL,
	"evidence_summary" text NOT NULL,
	"detail" text,
	"route_path" text,
	"metric_value" text,
	"timestamp" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "next_best_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"customer_id" integer NOT NULL,
	"action_type" text NOT NULL,
	"category" text DEFAULT 'GENERAL' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"urgency" text DEFAULT 'SOON' NOT NULL,
	"rationale" text NOT NULL,
	"expected_impact" text NOT NULL,
	"confidence" text DEFAULT 'HIGH' NOT NULL,
	"confidence_score" numeric(4, 2) DEFAULT '0.90' NOT NULL,
	"rank_score" numeric(8, 2) DEFAULT '0.00' NOT NULL,
	"is_top_recommendation" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"rule_id" text NOT NULL,
	"rule_version" text DEFAULT 'NBA-v1' NOT NULL,
	"source_entity_type" text DEFAULT 'CUSTOMER' NOT NULL,
	"source_entity_id" text DEFAULT '0' NOT NULL,
	"source_entity_code" text,
	"evidence" text DEFAULT '[]' NOT NULL,
	"action_route" text,
	"target_entity_context" text,
	"dismissed_reason" text,
	"dismissed_by_id" integer,
	"dismissed_by_name" text,
	"dismissed_at" timestamp,
	"accepted_by_id" integer,
	"accepted_by_name" text,
	"accepted_at" timestamp,
	"completed_at" timestamp,
	"created_task_id" integer,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"dedup_key" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "next_best_actions_action_id_unique" UNIQUE("action_id")
);
--> statement-breakpoint
CREATE TABLE "onboarding_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_number" text NOT NULL,
	"customer_id" integer,
	"applicant_name" text NOT NULL,
	"customer_type" text DEFAULT 'INDIVIDUAL' NOT NULL,
	"onboarding_type" text DEFAULT 'NEW_ACCOUNT' NOT NULL,
	"assigned_rm_id" integer,
	"assigned_officer_id" integer,
	"branch_code" text DEFAULT 'BR-0104' NOT NULL,
	"branch_name" text DEFAULT 'Fort, Mumbai Main Branch' NOT NULL,
	"submitted_date" timestamp,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"kyc_status" text DEFAULT 'NOT_STARTED' NOT NULL,
	"kyb_status" text DEFAULT 'NOT_APPLICABLE',
	"document_status" text DEFAULT 'PENDING' NOT NULL,
	"risk_review_status" text DEFAULT 'PENDING' NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"sla_hours_total" integer DEFAULT 48 NOT NULL,
	"sla_hours_remaining" integer DEFAULT 48 NOT NULL,
	"sla_status" text DEFAULT 'ON_TRACK' NOT NULL,
	"sla_deadline" timestamp,
	"exception_count" integer DEFAULT 0 NOT NULL,
	"opportunity_id" integer,
	"notes" text,
	"rejection_reason" text,
	"approved_by_id" integer,
	"approved_at" timestamp,
	"completed_by_id" integer,
	"completed_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"assigned_from_id" integer,
	"assigned_to_id" integer NOT NULL,
	"role_scope" text DEFAULT 'KYC_OFFICER' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "onboarding_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_code" text NOT NULL,
	"application_id" integer NOT NULL,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" text DEFAULT '1.2 MB',
	"mime_type" text DEFAULT 'application/pdf',
	"status" text DEFAULT 'UPLOADED' NOT NULL,
	"uploaded_by_id" integer,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by_id" integer,
	"reviewed_at" timestamp,
	"expiry_date" date,
	"rejection_reason" text,
	"replacement_reason" text,
	"requested_doc_type" text,
	"replacement_due_date" date,
	"version" integer DEFAULT 1 NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"actor_id" integer,
	"actor_name" text NOT NULL,
	"actor_role" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_exceptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"exception_code" text NOT NULL,
	"application_id" integer NOT NULL,
	"type" text NOT NULL,
	"severity" text DEFAULT 'MEDIUM' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"owner_id" integer,
	"due_date" timestamp,
	"resolution" text,
	"resolved_by_id" integer,
	"resolved_at" timestamp,
	"waive_reason" text,
	"waived_by_id" integer,
	"waived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"product_id" integer,
	"product_name" text NOT NULL,
	"product_code" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"initial_deposit_amount" numeric(18, 2) DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operational_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"approval_id" text NOT NULL,
	"request_type" text NOT NULL,
	"customer_id" integer,
	"customer_code" text,
	"customer_name" text,
	"related_entity_type" text,
	"related_entity_id" text,
	"amount" numeric(15, 2),
	"currency" text DEFAULT 'INR' NOT NULL,
	"maker_id" integer NOT NULL,
	"maker_name" text NOT NULL,
	"maker_role" text,
	"checker_id" integer,
	"checker_name" text,
	"checker_role" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"reason" text NOT NULL,
	"evidence" jsonb,
	"checker_notes" text,
	"sla_deadline" timestamp,
	"actioned_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "operational_approvals_approval_id_unique" UNIQUE("approval_id")
);
--> statement-breakpoint
CREATE TABLE "operational_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"severity" text DEFAULT 'INFO' NOT NULL,
	"source_module" text NOT NULL,
	"customer_id" integer,
	"related_entity_type" text,
	"related_entity_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"actor_id" integer,
	"actor_name" text,
	"actor_role" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "operational_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "operational_exceptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"exception_id" text NOT NULL,
	"category" text NOT NULL,
	"severity" text DEFAULT 'MEDIUM' NOT NULL,
	"source" text NOT NULL,
	"customer_id" integer,
	"customer_code" text,
	"customer_name" text,
	"related_entity_type" text,
	"related_entity_id" text,
	"description" text NOT NULL,
	"evidence" jsonb,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"owner_id" integer,
	"owner_name" text,
	"owner_role" text,
	"sla_deadline" timestamp,
	"resolution_notes" text,
	"resolved_by_id" integer,
	"resolved_by_name" text,
	"resolved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "operational_exceptions_exception_id_unique" UNIQUE("exception_id")
);
--> statement-breakpoint
CREATE TABLE "reconciliation_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"reconciliation_id" text NOT NULL,
	"business_date" date NOT NULL,
	"source" text NOT NULL,
	"reconciliation_type" text NOT NULL,
	"expected_value" numeric(15, 2) NOT NULL,
	"observed_value" numeric(15, 2) NOT NULL,
	"variance" numeric(15, 2) NOT NULL,
	"status" text DEFAULT 'MISMATCH' NOT NULL,
	"customer_id" integer,
	"account_number" text,
	"owner_id" integer,
	"owner_name" text,
	"last_checked" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"adjustment_approval_id" text,
	"resolved_at" timestamp,
	"resolved_by_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reconciliation_records_reconciliation_id_unique" UNIQUE("reconciliation_id")
);
--> statement-breakpoint
CREATE TABLE "relationship_action_trace" (
	"id" serial PRIMARY KEY NOT NULL,
	"trace_code" text NOT NULL,
	"customer_id" integer NOT NULL,
	"action_title" text NOT NULL,
	"action_type" text NOT NULL,
	"origin_engine" text NOT NULL,
	"evidence_ref" text,
	"evidence_summary" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"outcome_summary" text,
	"entity_impact" text,
	"next_step" text,
	"executed_by_id" integer,
	"executed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "relationship_action_trace_trace_code_unique" UNIQUE("trace_code")
);
--> statement-breakpoint
CREATE TABLE "relationship_edges" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_entity_type" text NOT NULL,
	"source_entity_id" text NOT NULL,
	"target_entity_type" text NOT NULL,
	"target_entity_id" text NOT NULL,
	"relationship_type" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"provenance_type" text DEFAULT 'DIRECT_RECORD' NOT NULL,
	"provenance_id" text,
	"visibility_scope" text DEFAULT 'BRANCH' NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationship_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"customer_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"source_entity" text NOT NULL,
	"source_id" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"importance" text DEFAULT 'MEDIUM' NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "relationship_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "relationship_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"role" text NOT NULL,
	"relationship_type" text NOT NULL,
	"ownership_percentage" numeric(5, 2),
	"is_primary" boolean DEFAULT false NOT NULL,
	"valid_from" date,
	"valid_to" date,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationship_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"group_type" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"primary_customer_id" integer,
	"primary_business_id" text,
	"relationship_manager_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "relationship_groups_group_id_unique" UNIQUE("group_id")
);
--> statement-breakpoint
CREATE TABLE "relationship_scenario_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"action_type" text NOT NULL,
	"target_entity_type" text,
	"target_entity_id" text,
	"parameters" jsonb,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationship_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" text NOT NULL,
	"customer_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"base_snapshot" jsonb NOT NULL,
	"result_snapshot" jsonb,
	"comparison_delta" jsonb,
	"decision_trace_id" text,
	"is_stale" boolean DEFAULT false NOT NULL,
	"stale_as_of" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "relationship_scenarios_scenario_id_unique" UNIQUE("scenario_id")
);
--> statement-breakpoint
CREATE TABLE "relationship_signal_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"signal_code" text NOT NULL,
	"customer_id" integer NOT NULL,
	"signal_type" text NOT NULL,
	"headline" text NOT NULL,
	"severity" text NOT NULL,
	"evidence" text NOT NULL,
	"source" text NOT NULL,
	"recommended_action" text,
	"linked_nba_id" integer,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"resolved_at" timestamp,
	"resolved_by_id" integer,
	"resolution_notes" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "relationship_signal_events_signal_code_unique" UNIQUE("signal_code")
);
--> statement-breakpoint
CREATE TABLE "relationship_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_code" text NOT NULL,
	"customer_id" integer NOT NULL,
	"snapshot_date" timestamp NOT NULL,
	"state" text NOT NULL,
	"core_score" integer NOT NULL,
	"previous_core_score" integer,
	"relationship_value" numeric(15, 2) NOT NULL,
	"active_products_count" integer DEFAULT 0 NOT NULL,
	"open_opportunities_count" integer DEFAULT 0 NOT NULL,
	"open_cases_count" integer DEFAULT 0 NOT NULL,
	"open_tasks_count" integer DEFAULT 0 NOT NULL,
	"relationship_momentum" text DEFAULT 'STABLE' NOT NULL,
	"metrics" text NOT NULL,
	"summary" text NOT NULL,
	"material_changes" text,
	"is_meaningful" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "relationship_snapshots_snapshot_code_unique" UNIQUE("snapshot_code")
);
--> statement-breakpoint
CREATE TABLE "relationship_state_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"state" text NOT NULL,
	"previous_state" text,
	"reason" text NOT NULL,
	"evidence" text NOT NULL,
	"source" text DEFAULT 'COREvia Relationship State Engine' NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationship_value_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"snapshot_date" date NOT NULL,
	"relationship_value" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"core_score" integer NOT NULL,
	"product_depth" integer DEFAULT 0 NOT NULL,
	"engagement" integer DEFAULT 0 NOT NULL,
	"service_health" text DEFAULT 'GOOD' NOT NULL,
	"relationship_momentum" text DEFAULT 'STABLE' NOT NULL,
	"opportunity_coverage" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"commitment_health" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"activity_health" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"relationship_state" text DEFAULT 'STABLE' NOT NULL,
	"source_version" text DEFAULT '1.0' NOT NULL,
	"scenario_id" text,
	"decision_trace_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"type" text NOT NULL,
	"severity" text DEFAULT 'MEDIUM' NOT NULL,
	"actor_id" text,
	"actor_name" text,
	"target_resource" text NOT NULL,
	"request_id" text,
	"source_ip" text DEFAULT '127.0.0.1',
	"source" text DEFAULT 'COREvia Security Guard' NOT NULL,
	"outcome" text DEFAULT 'BLOCKED' NOT NULL,
	"evidence_metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "security_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_token" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" jsonb NOT NULL,
	"updated_by" text DEFAULT 'SYSTEM' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"service_alerts" boolean DEFAULT true NOT NULL,
	"task_alerts" boolean DEFAULT true NOT NULL,
	"opportunity_alerts" boolean DEFAULT true NOT NULL,
	"relationship_alerts" boolean DEFAULT true NOT NULL,
	"customer_activity" boolean DEFAULT true NOT NULL,
	"operational_alerts" boolean DEFAULT true NOT NULL,
	"system_alerts" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"delivery_id" text NOT NULL,
	"webhook_id" text NOT NULL,
	"event_id" text NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"http_status" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"latency_ms" integer,
	"error" text,
	"retryable" boolean DEFAULT false NOT NULL,
	"correlation_id" text NOT NULL,
	"payload" jsonb,
	"response_body" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_deliveries_delivery_id_unique" UNIQUE("delivery_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'RELATIONSHIP_MANAGER';--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "previous_hash" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "record_hash" text;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "insight_id" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "category" text DEFAULT 'GENERAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "summary" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "impact" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "priority" text DEFAULT 'MEDIUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "confidence" text DEFAULT 'HIGH' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "confidence_score" numeric(4, 2) DEFAULT '0.90' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "status" text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "detected_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "valid_until" timestamp;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "source_entity_type" text DEFAULT 'CUSTOMER' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "source_entity_id" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "evidence" text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "recommended_action_type" text;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "recommended_action_context" text;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "rule_version" text DEFAULT 'RI-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "dedup_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "acknowledged_by_id" integer;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "acknowledged_by_name" text;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "acknowledged_at" timestamp;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "acknowledgement_note" text;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "resolution_type" text;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "resolution_note" text;--> statement-breakpoint
ALTER TABLE "customer_insights" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "interaction_reference" text;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "sentiment" text DEFAULT 'NEUTRAL';--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "owner_id" integer;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "duration" integer DEFAULT 15;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "participants" text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "followup_required" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "followup_date" timestamp;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "followup_owner_id" integer;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "followup_action" text;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "followup_priority" text DEFAULT 'MEDIUM';--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "followup_task_id" integer;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "customer_commitment" text;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "customer_commitment_task_id" integer;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "rm_commitment" text;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "rm_commitment_task_id" integer;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "linked_opportunity_id" integer;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "linked_case_id" integer;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "linked_task_id" integer;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "linked_relationship_review" text;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "linked_onboarding_id" integer;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "deleted_by" integer;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "tenure_months" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "relationship_manager_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "customer_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "category" text DEFAULT 'SYSTEM' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "severity" text DEFAULT 'INFO' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "action_label" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "action_url" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "source_entity_type" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "source_entity_id" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "status" text DEFAULT 'UNREAD' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "acknowledged_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "dedup_key" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "eligibility" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "interest_rate_range" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "min_balance" numeric(18, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "features" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_plan_steps" ADD CONSTRAINT "agent_plan_steps_plan_id_agent_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."agent_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_plans" ADD CONSTRAINT "agent_plans_session_id_agent_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_plans" ADD CONSTRAINT "agent_plans_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_plans" ADD CONSTRAINT "agent_plans_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_journey_steps" ADD CONSTRAINT "customer_journey_steps_journey_id_customer_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."customer_journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_journey_steps" ADD CONSTRAINT "customer_journey_steps_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_journeys" ADD CONSTRAINT "customer_journeys_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_journeys" ADD CONSTRAINT "customer_journeys_template_id_journey_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."journey_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_journeys" ADD CONSTRAINT "customer_journeys_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_journeys" ADD CONSTRAINT "customer_journeys_escalated_to_users_id_fk" FOREIGN KEY ("escalated_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_journeys" ADD CONSTRAINT "customer_journeys_escalated_by_users_id_fk" FOREIGN KEY ("escalated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_journeys" ADD CONSTRAINT "customer_journeys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_opportunity_radar" ADD CONSTRAINT "customer_opportunity_radar_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_opportunity_radar" ADD CONSTRAINT "customer_opportunity_radar_converted_opportunity_id_opportunities_id_fk" FOREIGN KEY ("converted_opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_opportunity_radar" ADD CONSTRAINT "customer_opportunity_radar_existing_opportunity_id_opportunities_id_fk" FOREIGN KEY ("existing_opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_opportunity_radar" ADD CONSTRAINT "customer_opportunity_radar_target_product_id_products_id_fk" FOREIGN KEY ("target_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_opportunity_radar" ADD CONSTRAINT "customer_opportunity_radar_dismissed_by_id_users_id_fk" FOREIGN KEY ("dismissed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_opportunity_radar" ADD CONSTRAINT "customer_opportunity_radar_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_opportunity_radar_evidence" ADD CONSTRAINT "customer_opportunity_radar_evidence_radar_id_customer_opportunity_radar_id_fk" FOREIGN KEY ("radar_id") REFERENCES "public"."customer_opportunity_radar"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_score_history" ADD CONSTRAINT "customer_score_history_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_trace_evidence" ADD CONSTRAINT "decision_trace_evidence_decision_trace_id_decision_traces_id_fk" FOREIGN KEY ("decision_trace_id") REFERENCES "public"."decision_traces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_trace_source_nodes" ADD CONSTRAINT "decision_trace_source_nodes_decision_trace_id_decision_traces_id_fk" FOREIGN KEY ("decision_trace_id") REFERENCES "public"."decision_traces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_traces" ADD CONSTRAINT "decision_traces_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_traces" ADD CONSTRAINT "decision_traces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_traces" ADD CONSTRAINT "decision_traces_confirmed_by_id_users_id_fk" FOREIGN KEY ("confirmed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extractions" ADD CONSTRAINT "document_extractions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extractions" ADD CONSTRAINT "document_extractions_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requirements" ADD CONSTRAINT "document_requirements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requirements" ADD CONSTRAINT "document_requirements_fulfilled_document_id_documents_id_fk" FOREIGN KEY ("fulfilled_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_exceptions" ADD CONSTRAINT "governance_exceptions_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction_commitments" ADD CONSTRAINT "interaction_commitments_interaction_id_interactions_id_fk" FOREIGN KEY ("interaction_id") REFERENCES "public"."interactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction_commitments" ADD CONSTRAINT "interaction_commitments_created_task_id_tasks_id_fk" FOREIGN KEY ("created_task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction_links" ADD CONSTRAINT "interaction_links_interaction_id_interactions_id_fk" FOREIGN KEY ("interaction_id") REFERENCES "public"."interactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction_participants" ADD CONSTRAINT "interaction_participants_interaction_id_interactions_id_fk" FOREIGN KEY ("interaction_id") REFERENCES "public"."interactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_outcomes" ADD CONSTRAINT "journey_outcomes_journey_id_customer_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."customer_journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_outcomes" ADD CONSTRAINT "journey_outcomes_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_template_steps" ADD CONSTRAINT "journey_template_steps_template_id_journey_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."journey_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyb_reviews" ADD CONSTRAINT "kyb_reviews_application_id_onboarding_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyb_reviews" ADD CONSTRAINT "kyb_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_reviews" ADD CONSTRAINT "kyc_reviews_application_id_onboarding_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_reviews" ADD CONSTRAINT "kyc_reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_reviews" ADD CONSTRAINT "kyc_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_repayments" ADD CONSTRAINT "loan_repayments_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_best_action_evidence" ADD CONSTRAINT "next_best_action_evidence_action_id_next_best_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."next_best_actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_best_actions" ADD CONSTRAINT "next_best_actions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_best_actions" ADD CONSTRAINT "next_best_actions_dismissed_by_id_users_id_fk" FOREIGN KEY ("dismissed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_best_actions" ADD CONSTRAINT "next_best_actions_accepted_by_id_users_id_fk" FOREIGN KEY ("accepted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_best_actions" ADD CONSTRAINT "next_best_actions_created_task_id_tasks_id_fk" FOREIGN KEY ("created_task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_applications" ADD CONSTRAINT "onboarding_applications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_applications" ADD CONSTRAINT "onboarding_applications_assigned_rm_id_users_id_fk" FOREIGN KEY ("assigned_rm_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_applications" ADD CONSTRAINT "onboarding_applications_assigned_officer_id_users_id_fk" FOREIGN KEY ("assigned_officer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_applications" ADD CONSTRAINT "onboarding_applications_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_applications" ADD CONSTRAINT "onboarding_applications_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_applications" ADD CONSTRAINT "onboarding_applications_completed_by_id_users_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_applications" ADD CONSTRAINT "onboarding_applications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_assignments" ADD CONSTRAINT "onboarding_assignments_application_id_onboarding_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_assignments" ADD CONSTRAINT "onboarding_assignments_assigned_from_id_users_id_fk" FOREIGN KEY ("assigned_from_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_assignments" ADD CONSTRAINT "onboarding_assignments_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_documents" ADD CONSTRAINT "onboarding_documents_application_id_onboarding_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_documents" ADD CONSTRAINT "onboarding_documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_documents" ADD CONSTRAINT "onboarding_documents_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_events" ADD CONSTRAINT "onboarding_events_application_id_onboarding_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_events" ADD CONSTRAINT "onboarding_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_exceptions" ADD CONSTRAINT "onboarding_exceptions_application_id_onboarding_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_exceptions" ADD CONSTRAINT "onboarding_exceptions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_exceptions" ADD CONSTRAINT "onboarding_exceptions_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_exceptions" ADD CONSTRAINT "onboarding_exceptions_waived_by_id_users_id_fk" FOREIGN KEY ("waived_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_products" ADD CONSTRAINT "onboarding_products_application_id_onboarding_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_products" ADD CONSTRAINT "onboarding_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_approvals" ADD CONSTRAINT "operational_approvals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_approvals" ADD CONSTRAINT "operational_approvals_maker_id_users_id_fk" FOREIGN KEY ("maker_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_approvals" ADD CONSTRAINT "operational_approvals_checker_id_users_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_events" ADD CONSTRAINT "operational_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_events" ADD CONSTRAINT "operational_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_exceptions" ADD CONSTRAINT "operational_exceptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_exceptions" ADD CONSTRAINT "operational_exceptions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_exceptions" ADD CONSTRAINT "operational_exceptions_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_records" ADD CONSTRAINT "reconciliation_records_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_records" ADD CONSTRAINT "reconciliation_records_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_records" ADD CONSTRAINT "reconciliation_records_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_action_trace" ADD CONSTRAINT "relationship_action_trace_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_action_trace" ADD CONSTRAINT "relationship_action_trace_executed_by_id_users_id_fk" FOREIGN KEY ("executed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_events" ADD CONSTRAINT "relationship_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_group_members" ADD CONSTRAINT "relationship_group_members_group_id_relationship_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."relationship_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_groups" ADD CONSTRAINT "relationship_groups_primary_customer_id_customers_id_fk" FOREIGN KEY ("primary_customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_groups" ADD CONSTRAINT "relationship_groups_relationship_manager_id_users_id_fk" FOREIGN KEY ("relationship_manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_scenario_actions" ADD CONSTRAINT "relationship_scenario_actions_scenario_id_relationship_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."relationship_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_scenarios" ADD CONSTRAINT "relationship_scenarios_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_scenarios" ADD CONSTRAINT "relationship_scenarios_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_signal_events" ADD CONSTRAINT "relationship_signal_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_signal_events" ADD CONSTRAINT "relationship_signal_events_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_snapshots" ADD CONSTRAINT "relationship_snapshots_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_state_history" ADD CONSTRAINT "relationship_state_history_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_value_snapshots" ADD CONSTRAINT "relationship_value_snapshots_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_plan_steps_plan_id" ON "agent_plan_steps" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_agent_plan_steps_status" ON "agent_plan_steps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_agent_plan_steps_order" ON "agent_plan_steps" USING btree ("plan_id","step_number");--> statement-breakpoint
CREATE INDEX "idx_agent_plan_steps_idempotency" ON "agent_plan_steps" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_agent_plans_session_id" ON "agent_plans" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_agent_plans_customer_id" ON "agent_plans" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_agent_plans_status" ON "agent_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_agent_plans_created_at" ON "agent_plans" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_agent_plans_plan_id" ON "agent_plans" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_agent_sessions_user_id" ON "agent_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_agent_sessions_customer_id" ON "agent_sessions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_agent_sessions_status" ON "agent_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_agent_sessions_created_at" ON "agent_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_agent_sessions_session_id" ON "agent_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_cjs_journey_id" ON "customer_journey_steps" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "idx_cjs_step_id" ON "customer_journey_steps" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX "idx_cjs_status" ON "customer_journey_steps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cjs_owner_id" ON "customer_journey_steps" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_cjs_due_at" ON "customer_journey_steps" USING btree ("due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cust_journeys_journey_id" ON "customer_journeys" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "idx_cust_journeys_customer_id" ON "customer_journeys" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_cust_journeys_status" ON "customer_journeys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cust_journeys_owner_id" ON "customer_journeys" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_cust_journeys_type" ON "customer_journeys" USING btree ("journey_type");--> statement-breakpoint
CREATE INDEX "idx_cust_journeys_sla" ON "customer_journeys" USING btree ("sla_status");--> statement-breakpoint
CREATE INDEX "idx_cust_journeys_created_at" ON "customer_journeys" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "radar_cust_idx" ON "customer_opportunity_radar" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "radar_status_idx" ON "customer_opportunity_radar" USING btree ("status");--> statement-breakpoint
CREATE INDEX "radar_priority_idx" ON "customer_opportunity_radar" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "radar_signal_type_idx" ON "customer_opportunity_radar" USING btree ("signal_type");--> statement-breakpoint
CREATE INDEX "radar_dedup_idx" ON "customer_opportunity_radar" USING btree ("dedup_key");--> statement-breakpoint
CREATE INDEX "radar_ev_radar_idx" ON "customer_opportunity_radar_evidence" USING btree ("radar_id");--> statement-breakpoint
CREATE INDEX "csh_customer_idx" ON "customer_score_history" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "csh_date_idx" ON "customer_score_history" USING btree ("recorded_date");--> statement-breakpoint
CREATE INDEX "idx_trace_evidence_trace_id" ON "decision_trace_evidence" USING btree ("decision_trace_id");--> statement-breakpoint
CREATE INDEX "idx_trace_evidence_type" ON "decision_trace_evidence" USING btree ("evidence_type");--> statement-breakpoint
CREATE INDEX "idx_trace_evidence_entity" ON "decision_trace_evidence" USING btree ("source_entity_type","source_entity_id");--> statement-breakpoint
CREATE INDEX "idx_trace_source_trace_id" ON "decision_trace_source_nodes" USING btree ("decision_trace_id");--> statement-breakpoint
CREATE INDEX "idx_trace_source_order" ON "decision_trace_source_nodes" USING btree ("decision_trace_id","order_index");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_decision_trace_code" ON "decision_traces" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "idx_decision_trace_customer" ON "decision_traces" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_decision_trace_engine" ON "decision_traces" USING btree ("source_engine");--> statement-breakpoint
CREATE INDEX "idx_decision_trace_type" ON "decision_traces" USING btree ("decision_type");--> statement-breakpoint
CREATE INDEX "idx_decision_trace_status" ON "decision_traces" USING btree ("decision_status");--> statement-breakpoint
CREATE INDEX "idx_decision_trace_generated" ON "decision_traces" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "idx_doc_ext_doc_id" ON "document_extractions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_doc_link_doc_id" ON "document_links" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_doc_link_entity" ON "document_links" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_doc_req_cust_id" ON "document_requirements" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_doc_req_related" ON "document_requirements" USING btree ("related_entity_type","related_entity_id");--> statement-breakpoint
CREATE INDEX "idx_doc_req_status" ON "document_requirements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_doc_rev_doc_id" ON "document_reviews" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_doc_ver_doc_id" ON "document_versions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_doc_ver_num" ON "document_versions" USING btree ("document_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_docs_code" ON "documents" USING btree ("document_code");--> statement-breakpoint
CREATE INDEX "idx_docs_customer_id" ON "documents" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_docs_status" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_docs_review_status" ON "documents" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "idx_docs_type" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_docs_expiry_date" ON "documents" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_docs_related" ON "documents" USING btree ("related_entity_type","related_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ff_flag_key" ON "feature_flags" USING btree ("flag_key");--> statement-breakpoint
CREATE INDEX "idx_ff_enabled" ON "feature_flags" USING btree ("enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_gex_exception_id" ON "governance_exceptions" USING btree ("exception_id");--> statement-breakpoint
CREATE INDEX "idx_gex_status" ON "governance_exceptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_gex_category" ON "governance_exceptions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_gex_severity" ON "governance_exceptions" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_gex_assigned_to" ON "governance_exceptions" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_gex_detected_at" ON "governance_exceptions" USING btree ("detected_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_idemp_key" ON "idempotency_records" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_idemp_expires_at" ON "idempotency_records" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ic_credential_id" ON "integration_credentials" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "idx_ic_integration_id" ON "integration_credentials" USING btree ("integration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ie_endpoint_id" ON "integration_endpoints" USING btree ("endpoint_id");--> statement-breakpoint
CREATE INDEX "idx_ie_integration_id" ON "integration_endpoints" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "idx_ie_path" ON "integration_endpoints" USING btree ("path");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_iev_event_id" ON "integration_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_iev_integration_id" ON "integration_events" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "idx_iev_status" ON "integration_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_iev_correlation_id" ON "integration_events" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "idx_iev_created_at" ON "integration_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_iw_webhook_id" ON "integration_webhooks" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "idx_iw_integration_id" ON "integration_webhooks" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "idx_iw_event_type" ON "integration_webhooks" USING btree ("event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_int_integration_id" ON "integrations" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "idx_int_domain" ON "integrations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_int_status" ON "integrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_int_mode" ON "integrations" USING btree ("mode");--> statement-breakpoint
CREATE INDEX "idx_commit_inter_id" ON "interaction_commitments" USING btree ("interaction_id");--> statement-breakpoint
CREATE INDEX "idx_commit_status" ON "interaction_commitments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_link_inter_id" ON "interaction_links" USING btree ("interaction_id");--> statement-breakpoint
CREATE INDEX "idx_link_type_id" ON "interaction_links" USING btree ("link_type","link_id");--> statement-breakpoint
CREATE INDEX "idx_part_inter_id" ON "interaction_participants" USING btree ("interaction_id");--> statement-breakpoint
CREATE INDEX "idx_journey_outcomes_journey_id" ON "journey_outcomes" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "idx_journey_outcomes_type" ON "journey_outcomes" USING btree ("outcome_type");--> statement-breakpoint
CREATE INDEX "idx_jt_steps_template_id" ON "journey_template_steps" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_jt_steps_order" ON "journey_template_steps" USING btree ("template_id","step_order");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_journey_templates_code" ON "journey_templates" USING btree ("template_code");--> statement-breakpoint
CREATE INDEX "idx_journey_templates_category" ON "journey_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_journey_templates_active" ON "journey_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_kyb_rev_app_id" ON "kyb_reviews" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_kyc_rev_app_id" ON "kyc_reviews" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "loan_repayments_loan_idx" ON "loan_repayments" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "loan_repayments_due_date_idx" ON "loan_repayments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "nba_ev_action_idx" ON "next_best_action_evidence" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "nba_cust_idx" ON "next_best_actions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "nba_status_idx" ON "next_best_actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nba_priority_idx" ON "next_best_actions" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "nba_action_type_idx" ON "next_best_actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "nba_dedup_idx" ON "next_best_actions" USING btree ("dedup_key");--> statement-breakpoint
CREATE INDEX "idx_onb_app_num" ON "onboarding_applications" USING btree ("application_number");--> statement-breakpoint
CREATE INDEX "idx_onb_cust_id" ON "onboarding_applications" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_onb_status" ON "onboarding_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_onb_kyc_status" ON "onboarding_applications" USING btree ("kyc_status");--> statement-breakpoint
CREATE INDEX "idx_onb_sla_status" ON "onboarding_applications" USING btree ("sla_status");--> statement-breakpoint
CREATE INDEX "idx_onb_asgn_app_id" ON "onboarding_assignments" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_onb_doc_app_id" ON "onboarding_documents" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_onb_doc_status" ON "onboarding_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_onb_doc_type" ON "onboarding_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_onb_evt_app_id" ON "onboarding_events" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_onb_evt_type" ON "onboarding_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_onb_exc_app_id" ON "onboarding_exceptions" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_onb_exc_status" ON "onboarding_exceptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_onb_exc_owner" ON "onboarding_exceptions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_onb_prod_app_id" ON "onboarding_products" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_oa_approval_id" ON "operational_approvals" USING btree ("approval_id");--> statement-breakpoint
CREATE INDEX "idx_oa_status" ON "operational_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_oa_request_type" ON "operational_approvals" USING btree ("request_type");--> statement-breakpoint
CREATE INDEX "idx_oa_customer_id" ON "operational_approvals" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_oa_maker_id" ON "operational_approvals" USING btree ("maker_id");--> statement-breakpoint
CREATE INDEX "idx_oa_checker_id" ON "operational_approvals" USING btree ("checker_id");--> statement-breakpoint
CREATE INDEX "idx_oa_priority" ON "operational_approvals" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_oa_sla_deadline" ON "operational_approvals" USING btree ("sla_deadline");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_oev_event_id" ON "operational_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_oev_type" ON "operational_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_oev_severity" ON "operational_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_oev_customer_id" ON "operational_events" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_oev_created_at" ON "operational_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_oex_exception_id" ON "operational_exceptions" USING btree ("exception_id");--> statement-breakpoint
CREATE INDEX "idx_oex_category" ON "operational_exceptions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_oex_severity" ON "operational_exceptions" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_oex_status" ON "operational_exceptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_oex_customer_id" ON "operational_exceptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_oex_owner_id" ON "operational_exceptions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_oex_sla_deadline" ON "operational_exceptions" USING btree ("sla_deadline");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rec_reconciliation_id" ON "reconciliation_records" USING btree ("reconciliation_id");--> statement-breakpoint
CREATE INDEX "idx_rec_business_date" ON "reconciliation_records" USING btree ("business_date");--> statement-breakpoint
CREATE INDEX "idx_rec_type" ON "reconciliation_records" USING btree ("reconciliation_type");--> statement-breakpoint
CREATE INDEX "idx_rec_status" ON "reconciliation_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rec_customer_id" ON "reconciliation_records" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_rec_owner_id" ON "reconciliation_records" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_rel_trace_cust_id" ON "relationship_action_trace" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_rel_trace_status" ON "relationship_action_trace" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rel_edge_source" ON "relationship_edges" USING btree ("source_entity_type","source_entity_id");--> statement-breakpoint
CREATE INDEX "idx_rel_edge_target" ON "relationship_edges" USING btree ("target_entity_type","target_entity_id");--> statement-breakpoint
CREATE INDEX "idx_rel_edge_type" ON "relationship_edges" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "idx_rel_edge_status" ON "relationship_edges" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rel_edge_unique_pair" ON "relationship_edges" USING btree ("source_entity_type","source_entity_id","target_entity_type","target_entity_id","relationship_type");--> statement-breakpoint
CREATE INDEX "idx_rel_evt_cust_id" ON "relationship_events" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_rel_evt_timestamp" ON "relationship_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_rel_evt_type" ON "relationship_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_rel_evt_source" ON "relationship_events" USING btree ("source_entity");--> statement-breakpoint
CREATE INDEX "idx_group_members_group_id" ON "relationship_group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_members_entity" ON "relationship_group_members" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_group_members_rel_type" ON "relationship_group_members" USING btree ("relationship_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_relationship_groups_group_id" ON "relationship_groups" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_relationship_groups_type" ON "relationship_groups" USING btree ("group_type");--> statement-breakpoint
CREATE INDEX "idx_relationship_groups_primary_cust" ON "relationship_groups" USING btree ("primary_customer_id");--> statement-breakpoint
CREATE INDEX "idx_relationship_groups_rm_id" ON "relationship_groups" USING btree ("relationship_manager_id");--> statement-breakpoint
CREATE INDEX "idx_relationship_groups_status" ON "relationship_groups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_scenario_actions_scenario_id" ON "relationship_scenario_actions" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "idx_scenario_actions_order" ON "relationship_scenario_actions" USING btree ("scenario_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_scenarios_customer_id" ON "relationship_scenarios" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_scenarios_created_by" ON "relationship_scenarios" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_scenarios_status" ON "relationship_scenarios" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_scenarios_scenario_id" ON "relationship_scenarios" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "idx_scenarios_created_at" ON "relationship_scenarios" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_rel_sig_cust_id" ON "relationship_signal_events" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_rel_sig_status" ON "relationship_signal_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rel_sig_severity" ON "relationship_signal_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_rel_snap_cust_id" ON "relationship_snapshots" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_rel_snap_date" ON "relationship_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "idx_rel_state_cust_id" ON "relationship_state_history" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_rel_state_calculated_at" ON "relationship_state_history" USING btree ("calculated_at");--> statement-breakpoint
CREATE INDEX "idx_rv_snapshots_customer_id" ON "relationship_value_snapshots" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_rv_snapshots_date" ON "relationship_value_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "idx_rv_snapshots_state" ON "relationship_value_snapshots" USING btree ("relationship_state");--> statement-breakpoint
CREATE INDEX "idx_rv_snapshots_created_at" ON "relationship_value_snapshots" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sec_event_id" ON "security_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_sec_type" ON "security_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_sec_severity" ON "security_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_sec_actor_id" ON "security_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_sec_timestamp" ON "security_events" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sys_setting_key" ON "system_settings" USING btree ("setting_key");--> statement-breakpoint
CREATE UNIQUE INDEX "notif_pref_user_idx" ON "user_notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_wd_delivery_id" ON "webhook_deliveries" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "idx_wd_webhook_id" ON "webhook_deliveries" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "idx_wd_status" ON "webhook_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_wd_correlation_id" ON "webhook_deliveries" USING btree ("correlation_id");--> statement-breakpoint
ALTER TABLE "customer_insights" ADD CONSTRAINT "customer_insights_acknowledged_by_id_users_id_fk" FOREIGN KEY ("acknowledged_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_followup_owner_id_users_id_fk" FOREIGN KEY ("followup_owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_followup_task_id_tasks_id_fk" FOREIGN KEY ("followup_task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_customer_commitment_task_id_tasks_id_fk" FOREIGN KEY ("customer_commitment_task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_rm_commitment_task_id_tasks_id_fk" FOREIGN KEY ("rm_commitment_task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_linked_opportunity_id_opportunities_id_fk" FOREIGN KEY ("linked_opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_linked_case_id_service_cases_id_fk" FOREIGN KEY ("linked_case_id") REFERENCES "public"."service_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_linked_task_id_tasks_id_fk" FOREIGN KEY ("linked_task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_linked_onboarding_id_onboarding_applications_id_fk" FOREIGN KEY ("linked_onboarding_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_relationship_manager_id_users_id_fk" FOREIGN KEY ("relationship_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_record_hash_idx" ON "audit_logs" USING btree ("record_hash");--> statement-breakpoint
CREATE INDEX "cust_insight_cust_idx" ON "customer_insights" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "cust_insight_status_idx" ON "customer_insights" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cust_insight_priority_idx" ON "customer_insights" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "cust_insight_dedup_idx" ON "customer_insights" USING btree ("dedup_key");--> statement-breakpoint
CREATE INDEX "interactions_owner_idx" ON "interactions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "interactions_reference_idx" ON "interactions" USING btree ("interaction_reference");--> statement-breakpoint
CREATE INDEX "interactions_type_idx" ON "interactions" USING btree ("interaction_type");--> statement-breakpoint
CREATE INDEX "interactions_timestamp_idx" ON "interactions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "interactions_deleted_idx" ON "interactions" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "notif_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notif_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notif_severity_idx" ON "notifications" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "notif_type_idx" ON "notifications" USING btree ("notification_type");--> statement-breakpoint
CREATE INDEX "notif_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notif_cust_idx" ON "notifications" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "notif_source_idx" ON "notifications" USING btree ("source_entity_type","source_entity_id");--> statement-breakpoint
CREATE INDEX "notif_dedup_idx" ON "notifications" USING btree ("dedup_key");