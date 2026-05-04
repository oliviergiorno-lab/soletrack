/*
  Warnings:

  - Added the required column `userId` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Purchase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "colorway" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "sku" TEXT,
    "thumbnail" TEXT,
    "orderNumber" TEXT,
    "platform" TEXT NOT NULL,
    "buyPrice" REAL NOT NULL,
    "fees" REAL NOT NULL DEFAULT 0,
    "totalCost" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "sellPrice" REAL,
    "sellFees" REAL,
    "sellPlatform" TEXT,
    "soldAt" DATETIME,
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Purchase" ("brand", "buyPrice", "colorway", "fees", "id", "model", "orderNumber", "platform", "purchasedAt", "sellFees", "sellPlatform", "sellPrice", "size", "sku", "soldAt", "status", "thumbnail", "totalCost") SELECT "brand", "buyPrice", "colorway", "fees", "id", "model", "orderNumber", "platform", "purchasedAt", "sellFees", "sellPlatform", "sellPrice", "size", "sku", "soldAt", "status", "thumbnail", "totalCost" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
