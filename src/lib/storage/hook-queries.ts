import { getPrisma } from "./prisma";

type Payload = Record<string, unknown>;

export const TABLE_MAP: Record<string, string> = {
  preToolUse: "toolEvent",
  postToolUse: "toolEvent",
  postToolUseFailure: "toolEvent",
  beforeShellExecution: "shellEvent",
  afterShellExecution: "shellEvent",
  beforeMCPExecution: "mcpEvent",
  afterMCPExecution: "mcpEvent",
  beforeReadFile: "fileEvent",
  afterFileEdit: "fileEvent",
  beforeTabFileRead: "fileEvent",
  afterTabFileEdit: "fileEvent",
  subagentStart: "agentEvent",
  subagentStop: "agentEvent",
  afterAgentResponse: "agentEvent",
  afterAgentThought: "agentEvent",
  stop: "agentEvent",
  sessionStart: "sessionEvent",
  sessionEnd: "sessionEvent",
  beforeSubmitPrompt: "sessionEvent",
  preCompact: "sessionEvent",
};

function extractCommonFields(payload: Payload) {
  return {
    loggedAt: new Date((payload._loggedAt as string) ?? Date.now()),
    hookEventName: payload.hook_event_name as string,
    conversationId: payload.conversation_id as string,
    generationId: payload.generation_id as string,
    model: (payload.model as string) ?? null,
    cursorVersion: (payload.cursor_version as string) ?? null,
    workspaceRoot: Array.isArray(payload.workspace_roots)
      ? ((payload.workspace_roots[0] as string) ?? null)
      : null,
    userEmail: (payload.user_email as string) ?? null,
    transcriptPath: (payload.transcript_path as string) ?? null,
  };
}

async function saveToolEvent(payload: Payload): Promise<void> {
  const prisma = getPrisma();
  await prisma.toolEvent.create({
    data: {
      ...extractCommonFields(payload),
      toolName: payload.tool_name as string,
      toolInput: (payload.tool_input as object) ?? undefined,
      toolOutput: (payload.tool_output as string) ?? null,
      toolUseId: (payload.tool_use_id as string) ?? null,
      cwd: (payload.cwd as string) ?? null,
      duration: payload.duration != null ? Number(payload.duration) : null,
      agentMessage: (payload.agent_message as string) ?? null,
      errorMessage: (payload.error_message as string) ?? null,
      failureType: (payload.failure_type as string) ?? null,
      isInterrupt:
        payload.is_interrupt != null ? Boolean(payload.is_interrupt) : null,
    },
  });
}

async function saveShellEvent(payload: Payload): Promise<void> {
  const prisma = getPrisma();
  await prisma.shellEvent.create({
    data: {
      ...extractCommonFields(payload),
      command: payload.command as string,
      output: (payload.output as string) ?? null,
      duration: payload.duration != null ? Number(payload.duration) : null,
      sandbox: payload.sandbox != null ? Boolean(payload.sandbox) : null,
      cwd: (payload.cwd as string) ?? null,
    },
  });
}

async function saveMcpEvent(payload: Payload): Promise<void> {
  const prisma = getPrisma();
  await prisma.mcpEvent.create({
    data: {
      ...extractCommonFields(payload),
      toolName: payload.tool_name as string,
      toolInput: (payload.tool_input as string) ?? null,
      resultJson: (payload.result_json as string) ?? null,
      duration: payload.duration != null ? Number(payload.duration) : null,
      url: (payload.url as string) ?? null,
      command: (payload.command as string) ?? null,
    },
  });
}

async function saveFileEvent(payload: Payload): Promise<void> {
  const prisma = getPrisma();
  await prisma.fileEvent.create({
    data: {
      ...extractCommonFields(payload),
      filePath: payload.file_path as string,
      edits: (payload.edits as object) ?? undefined,
      attachments: (payload.attachments as object) ?? undefined,
    },
  });
}

async function saveAgentEvent(payload: Payload): Promise<void> {
  const prisma = getPrisma();
  await prisma.agentEvent.create({
    data: {
      ...extractCommonFields(payload),
      subagentId: (payload.subagent_id as string) ?? null,
      subagentType: (payload.subagent_type as string) ?? null,
      task: (payload.task as string) ?? null,
      parentConversationId: (payload.parent_conversation_id as string) ?? null,
      toolCallId: (payload.tool_call_id as string) ?? null,
      subagentModel: (payload.subagent_model as string) ?? null,
      isParallelWorker:
        payload.is_parallel_worker != null
          ? Boolean(payload.is_parallel_worker)
          : null,
      gitBranch: (payload.git_branch as string) ?? null,
      status: (payload.status as string) ?? null,
      description: (payload.description as string) ?? null,
      summary: (payload.summary as string) ?? null,
      durationMs:
        payload.duration_ms != null ? Number(payload.duration_ms) : null,
      messageCount:
        payload.message_count != null ? Number(payload.message_count) : null,
      toolCallCount:
        payload.tool_call_count != null
          ? Number(payload.tool_call_count)
          : null,
      loopCount: payload.loop_count != null ? Number(payload.loop_count) : null,
      modifiedFiles: (payload.modified_files as object) ?? undefined,
      agentTranscriptPath: (payload.agent_transcript_path as string) ?? null,
      text: (payload.text as string) ?? null,
      inputTokens:
        payload.input_tokens != null ? Number(payload.input_tokens) : null,
      outputTokens:
        payload.output_tokens != null ? Number(payload.output_tokens) : null,
      cacheReadTokens:
        payload.cache_read_tokens != null
          ? Number(payload.cache_read_tokens)
          : null,
      cacheWriteTokens:
        payload.cache_write_tokens != null
          ? Number(payload.cache_write_tokens)
          : null,
    },
  });
}

async function saveSessionEvent(payload: Payload): Promise<void> {
  const prisma = getPrisma();
  await prisma.sessionEvent.create({
    data: {
      ...extractCommonFields(payload),
      sessionId: (payload.session_id as string) ?? null,
      isBackgroundAgent:
        payload.is_background_agent != null
          ? Boolean(payload.is_background_agent)
          : null,
      composerMode: (payload.composer_mode as string) ?? null,
      reason: (payload.reason as string) ?? null,
      durationMs:
        payload.duration_ms != null ? Number(payload.duration_ms) : null,
      finalStatus: (payload.final_status as string) ?? null,
      errorMessage: (payload.error_message as string) ?? null,
      prompt: (payload.prompt as string) ?? null,
      attachments: (payload.attachments as object) ?? undefined,
      trigger: (payload.trigger as string) ?? null,
      contextUsagePercent:
        payload.context_usage_percent != null
          ? Number(payload.context_usage_percent)
          : null,
      contextTokens:
        payload.context_tokens != null ? Number(payload.context_tokens) : null,
      contextWindowSize:
        payload.context_window_size != null
          ? Number(payload.context_window_size)
          : null,
      messageCount:
        payload.message_count != null ? Number(payload.message_count) : null,
      messagesToCompact:
        payload.messages_to_compact != null
          ? Number(payload.messages_to_compact)
          : null,
      isFirstCompaction:
        payload.is_first_compaction != null
          ? Boolean(payload.is_first_compaction)
          : null,
    },
  });
}

const SAVE_FNS: Record<string, (payload: Payload) => Promise<void>> = {
  toolEvent: saveToolEvent,
  shellEvent: saveShellEvent,
  mcpEvent: saveMcpEvent,
  fileEvent: saveFileEvent,
  agentEvent: saveAgentEvent,
  sessionEvent: saveSessionEvent,
};

export async function saveHookEvent(payload: Payload): Promise<void> {
  const eventName = payload.hook_event_name as string;
  const table = TABLE_MAP[eventName];
  if (!table) {
    throw new Error(`Unknown hook event: ${eventName}`);
  }
  await SAVE_FNS[table](payload);
}

// ─── Query functions ───

export async function getToolEvents(limit = 100) {
  return getPrisma().toolEvent.findMany({
    orderBy: { loggedAt: "desc" },
    take: limit,
  });
}

export async function getShellEvents(limit = 100) {
  return getPrisma().shellEvent.findMany({
    orderBy: { loggedAt: "desc" },
    take: limit,
  });
}

export async function getMcpEvents(limit = 100) {
  return getPrisma().mcpEvent.findMany({
    orderBy: { loggedAt: "desc" },
    take: limit,
  });
}

export async function getFileEvents(limit = 100) {
  return getPrisma().fileEvent.findMany({
    orderBy: { loggedAt: "desc" },
    take: limit,
  });
}

export async function getAgentEvents(limit = 100) {
  return getPrisma().agentEvent.findMany({
    orderBy: { loggedAt: "desc" },
    take: limit,
  });
}

export async function getSessionEvents(limit = 100) {
  return getPrisma().sessionEvent.findMany({
    orderBy: { loggedAt: "desc" },
    take: limit,
  });
}

export async function getCommandEvents(limit = 200) {
  return getPrisma().sessionEvent.findMany({
    where: {
      hookEventName: "beforeSubmitPrompt",
      prompt: { startsWith: "/" },
    },
    orderBy: { loggedAt: "desc" },
    take: limit,
  });
}

export async function getHookEventCounts() {
  const prisma = getPrisma();
  const [tool, shell, mcp, file, agent, session] = await Promise.all([
    prisma.toolEvent.count(),
    prisma.shellEvent.count(),
    prisma.mcpEvent.count(),
    prisma.fileEvent.count(),
    prisma.agentEvent.count(),
    prisma.sessionEvent.count(),
  ]);
  return { tool, shell, mcp, file, agent, session };
}
