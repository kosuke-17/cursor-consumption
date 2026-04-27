import { getAgentEvents } from "@cursor-consumption/core";
import { EventTable } from "@/components/event-table";

export default async function AgentEventsPage() {
  const events = await getAgentEvents(100);

  return (
    <EventTable
      title="Agent Events"
      data={events as unknown as Record<string, unknown>[]}
      columns={[
        { key: "subagentType", label: "Type" },
        { key: "task", label: "Task" },
        { key: "status", label: "Status" },
        { key: "model", label: "Model" },
        {
          key: "inputTokens",
          label: "Input Tokens",
          render: (v) => (v != null ? Number(v).toLocaleString() : "-"),
        },
        {
          key: "outputTokens",
          label: "Output Tokens",
          render: (v) => (v != null ? Number(v).toLocaleString() : "-"),
        },
        {
          key: "cacheReadTokens",
          label: "Cache Read",
          render: (v) => (v != null ? Number(v).toLocaleString() : "-"),
        },
        {
          key: "cacheWriteTokens",
          label: "Cache Write",
          render: (v) => (v != null ? Number(v).toLocaleString() : "-"),
        },
        {
          key: "durationMs",
          label: "Duration",
          render: (v) => (v != null ? `${(Number(v) / 1000).toFixed(1)}s` : "-"),
        },
        { key: "loopCount", label: "Loops" },
        { key: "conversationId", label: "Conversation" },
      ]}
    />
  );
}
