CREATE TYPE "public"."session_trigger" AS ENUM('manual', 'tracker');--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "trigger" "session_trigger" DEFAULT 'manual' NOT NULL;