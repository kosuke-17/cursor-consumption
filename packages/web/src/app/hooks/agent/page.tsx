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
        {
          key: "durationMs",
          label: "Duration",
          render: (v) => (v != null ? `${(Number(v) / 1000).toFixed(1)}s` : "-"),
        },
        { key: "loopCount", label: "Loops" },
        { key: "text", label: "Text" },
        { key: "conversationId", label: "Conversation" },
      ]}
    />
  );
}
