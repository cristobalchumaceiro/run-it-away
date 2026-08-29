CREATE TYPE "public"."activity_kind" AS ENUM('run', 'walk', 'cycle', 'race');--> statement-breakpoint
CREATE TYPE "public"."prompt_state" AS ENUM('pending', 'accepted', 'declined', 'swapped');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "activity_kind" NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"state" "prompt_state" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prompts" ADD CONSTRAINT "prompts_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prompts" ADD CONSTRAINT "prompts_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "prompts_live_activity_idx" ON "prompts" USING btree ("activity_id") WHERE "prompts"."state" in ('pending', 'accepted');