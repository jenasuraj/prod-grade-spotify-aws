/*
  Warnings:

  - You are about to drop the column `availableForWork` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `github` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `headline` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `instagram` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `interests` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitle` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `medium` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `pronouns` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `twitter` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `youtube` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "availableForWork",
DROP COLUMN "bio",
DROP COLUMN "company",
DROP COLUMN "github",
DROP COLUMN "headline",
DROP COLUMN "instagram",
DROP COLUMN "interests",
DROP COLUMN "jobTitle",
DROP COLUMN "linkedin",
DROP COLUMN "location",
DROP COLUMN "medium",
DROP COLUMN "pronouns",
DROP COLUMN "skills",
DROP COLUMN "twitter",
DROP COLUMN "website",
DROP COLUMN "youtube";