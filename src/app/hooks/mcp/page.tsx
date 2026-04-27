import { getMcpEvents } from "@cursor-consumption/core";
import { EventTable } from "@/components/event-table";

export default async function McpEventsPage() {
  const events = await getMcpEvents(100);

  return (
    <EventTable
      title="MCP Events"
      data={events as unknown as Record<string, unknown>[]}
      columns={[
        { key: "toolName", label: "Tool" },
        {
          key: "duration",
          label: "Duration",
          render: (v) => (v != null ? `${Number(v).toFixed(0)}ms` : "-"),
        },
        { key: "url", label: "URL" },
        { key: "command", label: "Command" },
        { key: "conversationId", label: "Conversation" },
      ]}
    />
  );
}
