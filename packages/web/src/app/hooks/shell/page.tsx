import { getShellEvents } from "@cursor-consumption/core";
import { EventTable } from "@/components/event-table";

export default async function ShellEventsPage() {
  const events = await getShellEvents(100);

  return (
    <EventTable
      title="Shell Events"
      data={events as unknown as Record<string, unknown>[]}
      columns={[
        { key: "command", label: "Command" },
        {
          key: "duration",
          label: "Duration",
          render: (v) => (v != null ? `${Number(v).toFixed(0)}ms` : "-"),
        },
        {
          key: "sandbox",
          label: "Sandbox",
          render: (v) => (v != null ? (v ? "Yes" : "No") : "-"),
        },
        { key: "cwd", label: "CWD" },
        { key: "conversationId", label: "Conversation" },
      ]}
    />
  );
}
