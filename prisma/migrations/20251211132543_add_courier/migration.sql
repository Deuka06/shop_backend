-- CreateTable
CREATE TABLE "CourierOrder" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "deliveryTo" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "CourierOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CourierOrder" ADD CONSTRAINT "CourierOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
