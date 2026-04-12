-- CreateTable
CREATE TABLE "usage_events" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "model" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "chargedCents" DOUBLE PRECISION,
    "calculatedCostCents" DOUBLE PRECISION NOT NULL,
    "rawResponse" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_summary" (
    "date" DATE NOT NULL,
    "model" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "totalInputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCostCents" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requestCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_summary_pkey" PRIMARY KEY ("date","model","feature")
);

-- CreateTable
CREATE TABLE "config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "config_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "hook_events" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hookEventName" TEXT NOT NULL,
    "model" TEXT,
    "conversationId" TEXT,
    "generationId" TEXT,
    "durationMs" INTEGER,
    "toolName" TEXT,
    "userEmail" TEXT,
    "workspaceRoot" TEXT,
    "cursorVersion" TEXT,
    "rawPayload" JSONB,

    CONSTRAINT "hook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_events_timestamp_idx" ON "usage_events"("timestamp");

-- CreateIndex
CREATE INDEX "usage_events_model_idx" ON "usage_events"("model");

-- CreateIndex
CREATE INDEX "usage_events_timestamp_model_idx" ON "usage_events"("timestamp", "model");

-- CreateIndex
CREATE UNIQUE INDEX "usage_events_timestamp_model_feature_key" ON "usage_events"("timestamp", "model", "feature");

-- CreateIndex
CREATE INDEX "daily_summary_date_idx" ON "daily_summary"("date");

-- CreateIndex
CREATE INDEX "hook_events_timestamp_idx" ON "hook_events"("timestamp");

-- CreateIndex
CREATE INDEX "hook_events_model_idx" ON "hook_events"("model");

-- CreateIndex
CREATE INDEX "hook_events_conversationId_idx" ON "hook_events"("conversationId");
