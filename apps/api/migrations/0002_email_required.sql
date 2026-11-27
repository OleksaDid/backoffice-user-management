-- Contract step of spec 06 (DATA-02). Every image since v0.3.0 writes an email, so the
-- remaining rows without one are users created before credentials existed (Part 0).
-- They get a placeholder on the reserved .invalid TLD, which can never receive mail;
-- without credentials they cannot sign in until a password reset feature exists.
UPDATE "users" SET "email" = 'legacy-' || "id" || '@example.invalid' WHERE "email" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
