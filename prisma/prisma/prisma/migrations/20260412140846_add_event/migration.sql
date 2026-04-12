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
CREATE TABLE "hook_tool_events" (
    "id" SERIAL NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "hookEventName" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "model" TEXT,
    "cursorVersion" TEXT,
    "workspaceRoot" TEXT,
    "userEmail" TEXT,
    "transcriptPath" TEXT,
    "toolName" TEXT NOT NULL,
    "toolInput" JSONB,
    "toolOutput" TEXT,
    "toolUseId" TEXT,
    "cwd" TEXT,
    "duration" DOUBLE PRECISION,
    "agentMessage" TEXT,
    "errorMessage" TEXT,
    "failureType" TEXT,
    "isInterrupt" BOOLEAN,

    CONSTRAINT "hook_tool_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hook_shell_events" (
    "id" SERIAL NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "hookEventName" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "model" TEXT,
    "cursorVersion" TEXT,
    "workspaceRoot" TEXT,
    "userEmail" TEXT,
    "transcriptPath" TEXT,
    "command" TEXT NOT NULL,
    "output" TEXT,
    "duration" DOUBLE PRECISION,
    "sandbox" BOOLEAN,
    "cwd" TEXT,

    CONSTRAINT "hook_shell_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hook_mcp_events" (
    "id" SERIAL NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "hookEventName" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "model" TEXT,
    "cursorVersion" TEXT,
    "workspaceRoot" TEXT,
    "userEmail" TEXT,
    "transcriptPath" TEXT,
    "toolName" TEXT NOT NULL,
    "toolInput" TEXT,
    "resultJson" TEXT,
    "duration" DOUBLE PRECISION,
    "url" TEXT,
    "command" TEXT,

    CONSTRAINT "hook_mcp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hook_file_events" (
    "id" SERIAL NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "hookEventName" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "model" TEXT,
    "cursorVersion" TEXT,
    "workspaceRoot" TEXT,
    "userEmail" TEXT,
    "transcriptPath" TEXT,
    "filePath" TEXT NOT NULL,
    "content" TEXT,
    "edits" JSONB,
    "attachments" JSONB,

    CONSTRAINT "hook_file_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hook_agent_events" (
    "id" SERIAL NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "hookEventName" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "model" TEXT,
    "cursorVersion" TEXT,
    "workspaceRoot" TEXT,
    "userEmail" TEXT,
    "transcriptPath" TEXT,
    "subagentId" TEXT,
    "subagentType" TEXT,
    "task" TEXT,
    "parentConversationId" TEXT,
    "toolCallId" TEXT,
    "subagentModel" TEXT,
    "isParallelWorker" BOOLEAN,
    "gitBranch" TEXT,
    "status" TEXT,
    "description" TEXT,
    "summary" TEXT,
    "durationMs" INTEGER,
    "messageCount" INTEGER,
    "toolCallCount" INTEGER,
    "loopCount" INTEGER,
    "modifiedFiles" JSONB,
    "agentTranscriptPath" TEXT,
    "text" TEXT,

    CONSTRAINT "hook_agent_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hook_session_events" (
    "id" SERIAL NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "hookEventName" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "model" TEXT,
    "cursorVersion" TEXT,
    "workspaceRoot" TEXT,
    "userEmail" TEXT,
    "transcriptPath" TEXT,
    "sessionId" TEXT,
    "isBackgroundAgent" BOOLEAN,
    "composerMode" TEXT,
    "reason" TEXT,
    "durationMs" INTEGER,
    "finalStatus" TEXT,
    "errorMessage" TEXT,
    "prompt" TEXT,
    "attachments" JSONB,
    "trigger" TEXT,
    "contextUsagePercent" DOUBLE PRECISION,
    "contextTokens" INTEGER,
    "contextWindowSize" INTEGER,
    "messageCount" INTEGER,
    "messagesToCompact" INTEGER,
    "isFirstCompaction" BOOLEAN,

    CONSTRAINT "hook_session_events_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "hook_tool_events_loggedAt_idx" ON "hook_tool_events"("loggedAt");

-- CreateIndex
CREATE INDEX "hook_tool_events_conversationId_idx" ON "hook_tool_events"("conversationId");

-- CreateIndex
CREATE INDEX "hook_tool_events_hookEventName_idx" ON "hook_tool_events"("hookEventName");

-- CreateIndex
CREATE INDEX "hook_tool_events_toolName_idx" ON "hook_tool_events"("toolName");

-- CreateIndex
CREATE INDEX "hook_shell_events_loggedAt_idx" ON "hook_shell_events"("loggedAt");

-- CreateIndex
CREATE INDEX "hook_shell_events_conversationId_idx" ON "hook_shell_events"("conversationId");

-- CreateIndex
CREATE INDEX "hook_shell_events_hookEventName_idx" ON "hook_shell_events"("hookEventName");

-- CreateIndex
CREATE INDEX "hook_mcp_events_loggedAt_idx" ON "hook_mcp_events"("loggedAt");

-- CreateIndex
CREATE INDEX "hook_mcp_events_conversationId_idx" ON "hook_mcp_events"("conversationId");

-- CreateIndex
CREATE INDEX "hook_mcp_events_hookEventName_idx" ON "hook_mcp_events"("hookEventName");

-- CreateIndex
CREATE INDEX "hook_mcp_events_toolName_idx" ON "hook_mcp_events"("toolName");

-- CreateIndex
CREATE INDEX "hook_file_events_loggedAt_idx" ON "hook_file_events"("loggedAt");

-- CreateIndex
CREATE INDEX "hook_file_events_conversationId_idx" ON "hook_file_events"("conversationId");

-- CreateIndex
CREATE INDEX "hook_file_events_hookEventName_idx" ON "hook_file_events"("hookEventName");

-- CreateIndex
CREATE INDEX "hook_file_events_filePath_idx" ON "hook_file_events"("filePath");

-- CreateIndex
CREATE INDEX "hook_agent_events_loggedAt_idx" ON "hook_agent_events"("loggedAt");

-- CreateIndex
CREATE INDEX "hook_agent_events_conversationId_idx" ON "hook_agent_events"("conversationId");

-- CreateIndex
CREATE INDEX "hook_agent_events_hookEventName_idx" ON "hook_agent_events"("hookEventName");

-- CreateIndex
CREATE INDEX "hook_agent_events_subagentId_idx" ON "hook_agent_events"("subagentId");

-- CreateIndex
CREATE INDEX "hook_session_events_loggedAt_idx" ON "hook_session_events"("loggedAt");

-- CreateIndex
CREATE INDEX "hook_session_events_conversationId_idx" ON "hook_session_events"("conversationId");

-- CreateIndex
CREATE INDEX "hook_session_events_hookEventName_idx" ON "hook_session_events"("hookEventName");

-- CreateIndex
CREATE INDEX "hook_session_events_sessionId_idx" ON "hook_session_events"("sessionId");
