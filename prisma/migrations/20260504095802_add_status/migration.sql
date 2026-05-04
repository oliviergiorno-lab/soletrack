-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Purchase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "colorway" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "orderNumber" TEXT,
    "platform" TEXT NOT NULL,
    "buyPrice" REAL NOT NULL,
    "fees" REAL NOT NULL DEFAULT 0,
    "totalCost" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Purchase" ("brand", "buyPrice", "colorway", "fees", "id", "model", "orderNumber", "platform", "purchasedAt", "size", "totalCost") SELECT "brand", "buyPrice", "colorway", "fees", "id", "model", "orderNumber", "platform", "purchasedAt", "size", "totalCost" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
