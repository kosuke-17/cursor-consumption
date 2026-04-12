type Column = {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
};

function formatDate(v: unknown) {
  if (!v) return "-";
  return new Date(v as string).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
}

function truncate(v: unknown, max = 80) {
  if (v == null) return "-";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > max ? s.slice(0, max) + "..." : s;
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${color}`}
    >
      {children}
    </span>
  );
}

export function EventBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    preToolUse: "bg-blue-900 text-blue-300",
    postToolUse: "bg-blue-800 text-blue-200",
    postToolUseFailure: "bg-red-900 text-red-300",
    beforeShellExecution: "bg-green-900 text-green-300",
    afterShellExecution: "bg-green-800 text-green-200",
    beforeMCPExecution: "bg-purple-900 text-purple-300",
    afterMCPExecution: "bg-purple-800 text-purple-200",
    beforeReadFile: "bg-yellow-900 text-yellow-300",
    afterFileEdit: "bg-yellow-800 text-yellow-200",
    beforeTabFileRead: "bg-yellow-900 text-yellow-300",
    afterTabFileEdit: "bg-yellow-800 text-yellow-200",
    subagentStart: "bg-red-900 text-red-300",
    subagentStop: "bg-red-800 text-red-200",
    afterAgentResponse: "bg-red-700 text-red-200",
    afterAgentThought: "bg-red-700 text-red-200",
    stop: "bg-red-900 text-red-300",
    sessionStart: "bg-cyan-900 text-cyan-300",
    sessionEnd: "bg-cyan-800 text-cyan-200",
    beforeSubmitPrompt: "bg-cyan-900 text-cyan-300",
    preCompact: "bg-cyan-800 text-cyan-200",
  };
  return <Badge color={colors[name] ?? "bg-gray-700 text-gray-300"}>{name}</Badge>;
}

export function EventTable({
  title,
  columns,
  data,
}: {
  title: string;
  columns: Column[];
  data: Record<string, unknown>[];
}) {
  const allColumns: Column[] = [
    { key: "loggedAt", label: "Time", render: (v) => formatDate(v) },
    {
      key: "hookEventName",
      label: "Event",
      render: (v) => <EventBadge name={v as string} />,
    },
    ...columns,
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="text-sm text-gray-400 mb-4">{data.length} events</p>
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400 text-left">
            <tr>
              {allColumns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-900/50">
                {allColumns.map((col) => (
                  <td key={col.key} className="px-4 py-3 whitespace-nowrap max-w-xs truncate">
                    {col.render
                      ? col.render(row[col.key], row)
                      : truncate(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={allColumns.length}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No events found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
