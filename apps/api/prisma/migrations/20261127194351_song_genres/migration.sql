-- AlterTable
ALTER TABLE "songs" ADD COLUMN     "genres" TEXT[] DEFAULT ARRAY[]::TEXT[];
