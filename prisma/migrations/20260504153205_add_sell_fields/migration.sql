-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN "sellFees" REAL;
ALTER TABLE "Purchase" ADD COLUMN "sellPlatform" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "sellPrice" REAL;
ALTER TABLE "Purchase" ADD COLUMN "soldAt" DATETIME;
