import { getSessionEvents } from "@/lib";
import { EventTable } from "@/components/event-table";

export default async function SessionEventsPage() {
  const events = await getSessionEvents(100);

  return (
    <EventTable
      title="Session Events"
      data={events as unknown as Record<string, unknown>[]}
      columns={[
        { key: "sessionId", label: "Session ID" },
        { key: "composerMode", label: "Mode" },
        { key: "reason", label: "Reason" },
        {
          key: "durationMs",
          label: "Duration",
          render: (v) => (v != null ? `${(Number(v) / 1000).toFixed(1)}s` : "-"),
        },
        { key: "prompt", label: "Prompt" },
        { key: "trigger", label: "Trigger" },
        { key: "contextUsagePercent", label: "Ctx %" },
        { key: "conversationId", label: "Conversation" },
      ]}
    />
  );
}
