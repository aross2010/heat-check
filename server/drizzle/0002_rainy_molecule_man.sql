ALTER TABLE "shots" DROP CONSTRAINT "shots_session_id_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "date" TYPE date USING "date"::date;--> statement-breakpoint
ALTER TABLE "shots" ADD CONSTRAINT "shots_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shots" DROP COLUMN "x";--> statement-breakpoint
ALTER TABLE "shots" DROP COLUMN "y";