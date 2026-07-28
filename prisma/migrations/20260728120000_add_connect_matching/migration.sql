-- CreateEnum
CREATE TYPE "ConnectGender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "ConnectShowMe" AS ENUM ('MALE', 'FEMALE', 'EVERYONE');

-- CreateEnum
CREATE TYPE "ConnectSwipeDirection" AS ENUM ('LIKE', 'PASS');

-- CreateTable
CREATE TABLE "ConnectProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "instagram" TEXT NOT NULL,
    "gender" "ConnectGender" NOT NULL,
    "showMe" "ConnectShowMe" NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectSwipe" (
    "id" TEXT NOT NULL,
    "fromProfileId" TEXT NOT NULL,
    "toProfileId" TEXT NOT NULL,
    "direction" "ConnectSwipeDirection" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectSwipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectMatch" (
    "id" TEXT NOT NULL,
    "profileAId" TEXT NOT NULL,
    "profileBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConnectProfile_userId_key" ON "ConnectProfile"("userId");

-- CreateIndex
CREATE INDEX "ConnectProfile_gender_isActive_idx" ON "ConnectProfile"("gender", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectSwipe_fromProfileId_toProfileId_key" ON "ConnectSwipe"("fromProfileId", "toProfileId");

-- CreateIndex
CREATE INDEX "ConnectSwipe_toProfileId_idx" ON "ConnectSwipe"("toProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectMatch_profileAId_profileBId_key" ON "ConnectMatch"("profileAId", "profileBId");

-- CreateIndex
CREATE INDEX "ConnectMatch_profileBId_idx" ON "ConnectMatch"("profileBId");

-- AddForeignKey
ALTER TABLE "ConnectProfile" ADD CONSTRAINT "ConnectProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectSwipe" ADD CONSTRAINT "ConnectSwipe_fromProfileId_fkey" FOREIGN KEY ("fromProfileId") REFERENCES "ConnectProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectSwipe" ADD CONSTRAINT "ConnectSwipe_toProfileId_fkey" FOREIGN KEY ("toProfileId") REFERENCES "ConnectProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectMatch" ADD CONSTRAINT "ConnectMatch_profileAId_fkey" FOREIGN KEY ("profileAId") REFERENCES "ConnectProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectMatch" ADD CONSTRAINT "ConnectMatch_profileBId_fkey" FOREIGN KEY ("profileBId") REFERENCES "ConnectProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
