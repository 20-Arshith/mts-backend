-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
