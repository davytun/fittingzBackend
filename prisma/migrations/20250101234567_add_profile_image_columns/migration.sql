-- Add missing profile image columns to Admin table
ALTER TABLE "Admin" ADD COLUMN "profileImageUrl" TEXT;
ALTER TABLE "Admin" ADD COLUMN "profileImagePublicId" TEXT;
