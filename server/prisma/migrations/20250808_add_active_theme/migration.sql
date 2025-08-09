-- Add activeTheme field to User model
ALTER TABLE "users" ADD COLUMN "activeTheme" VARCHAR(16) NOT NULL DEFAULT 'light';
