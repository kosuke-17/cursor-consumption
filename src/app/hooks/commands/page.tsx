import { getCommandEvents } from "@/lib";

function formatDate(v: unknown) {
  if (!v) return "-";
  return new Date(v as string).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
}

function extractCommand(prompt: string): string {
  const match = prompt.match(/^(\/\S+)/);
  return match ? match[1] : prompt;
}

function extractArgs(prompt: string): string {
  const match = prompt.match(/^\/\S+\s+([\s\S]*)/);
  return match ? match[1] : "";
}

export default async function CommandsPage() {
  const events = await getCommandEvents(200);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Cursor Commands</h1>
      <p className="text-sm text-gray-400 mb-4">
        {events.length} commands from beforeSubmitPrompt events
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400 text-left">
            <tr>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Time</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Command</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Args</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Mode</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Model</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Conversation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {events.map((ev) => {
              const prompt = ev.prompt ?? "";
              const cmd = extractCommand(prompt);
              const args = extractArgs(prompt);
              return (
                <tr key={ev.id} className="hover:bg-gray-900/50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                    {formatDate(ev.loggedAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-indigo-900 text-indigo-300">
                      {cmd}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-md truncate" title={args}>
                    {args || <span className="text-gray-600">-</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                    {ev.composerMode ?? "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                    {ev.model ?? "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400 max-w-[200px] truncate">
                    {ev.conversationId ?? "-"}
                  </td>
                </tr>
              );
            })}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No commands found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
