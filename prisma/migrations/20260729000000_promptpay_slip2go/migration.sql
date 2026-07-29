-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('PROMPTPAY');
ALTER TABLE "Payment" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
COMMIT;

-- DropIndex
DROP INDEX "Payment_omiseChargeId_idx";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "expectedAmountSatang" INTEGER;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "omiseChargeId",
DROP COLUMN "omiseSourceId",
ADD COLUMN     "promptpayPayload" TEXT,
ADD COLUMN     "slipImageUrl" TEXT,
ADD COLUMN     "slipTransRef" TEXT,
ALTER COLUMN "provider" SET DEFAULT 'SLIP2GO';

-- CreateIndex
CREATE UNIQUE INDEX "Payment_slipTransRef_key" ON "Payment"("slipTransRef");
