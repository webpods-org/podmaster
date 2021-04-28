CREATE TABLE "pod" (
    "url" TEXT NOT NULL,
    "identity_domain" TEXT NOT NULL,
    "identity_username" TEXT NOT NULL,
    "timestamp" bigint NOT NULL,
    "tags" TEXT NOT NULL,
    CONSTRAINT "pod_pkey" 
        PRIMARY KEY ("url"));