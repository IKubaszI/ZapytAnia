-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    "grade" INTEGER NOT NULL,
    "interval" INTEGER NOT NULL,
    "repetition" INTEGER NOT NULL,
    "easiness" REAL NOT NULL,
    "nextReviewAt" DATETIME NOT NULL,
    "reviewedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Flashcard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("cardId", "easiness", "grade", "id", "interval", "nextReviewAt", "repetition", "reviewedAt", "userId") SELECT "cardId", "easiness", "grade", "id", "interval", "nextReviewAt", "repetition", "reviewedAt", "userId" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE UNIQUE INDEX "Review_userId_cardId_key" ON "Review"("userId", "cardId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
