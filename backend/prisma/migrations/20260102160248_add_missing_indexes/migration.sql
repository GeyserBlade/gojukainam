-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "MagicLink_email_idx" ON "public"."MagicLink"("email");
