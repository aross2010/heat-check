CREATE TYPE "public"."shot_location" AS ENUM('left', 'center', 'right');--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "shots" ADD COLUMN "shot_location" "shot_location" NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "multiplayer";