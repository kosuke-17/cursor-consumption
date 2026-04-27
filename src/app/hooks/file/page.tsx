import { getFileEvents } from "@/lib";
import { EventTable } from "@/components/event-table";

export default async function FileEventsPage() {
  const events = await getFileEvents(100);

  return (
    <EventTable
      title="File Events"
      data={events as unknown as Record<string, unknown>[]}
      columns={[
        { key: "filePath", label: "File Path" },
        { key: "conversationId", label: "Conversation" },
      ]}
    />
  );
}
