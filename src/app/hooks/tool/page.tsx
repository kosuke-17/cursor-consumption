import { getToolEvents } from "@cursor-consumption/core";
import { EventTable } from "@/components/event-table";

export default async function ToolEventsPage() {
  const events = await getToolEvents(100);

  return (
    <EventTable
      title="Tool Events"
      data={events as unknown as Record<string, unknown>[]}
      columns={[
        { key: "toolName", label: "Tool" },
        {
          key: "duration",
          label: "Duration",
          render: (v) => (v != null ? `${Number(v).toFixed(0)}ms` : "-"),
        },
        { key: "toolUseId", label: "Tool Use ID" },
        { key: "errorMessage", label: "Error" },
        { key: "failureType", label: "Failure Type" },
        { key: "conversationId", label: "Conversation" },
      ]}
    />
  );
}
