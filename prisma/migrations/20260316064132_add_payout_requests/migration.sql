-- CreateTable
CREATE TABLE "payout_requests" (
    "payout_id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "account_number" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("payout_id")
);

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("agent_id") ON DELETE RESTRICT ON UPDATE CASCADE;
