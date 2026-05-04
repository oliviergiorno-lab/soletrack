/*
  Warnings:

  - You are about to drop the `Alert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MarketPrice` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN "notes" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Alert";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MarketPrice";
PRAGMA foreign_keys=on;
