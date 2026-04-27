import { getHookEventCounts } from "@/lib";

const CARDS = [
  { key: "tool", label: "Tool Events", href: "/hooks/tool", color: "bg-blue-500" },
  { key: "shell", label: "Shell Events", href: "/hooks/shell", color: "bg-green-500" },
  { key: "mcp", label: "MCP Events", href: "/hooks/mcp", color: "bg-purple-500" },
  { key: "file", label: "File Events", href: "/hooks/file", color: "bg-yellow-500" },
  { key: "agent", label: "Agent Events", href: "/hooks/agent", color: "bg-red-500" },
  { key: "session", label: "Session Events", href: "/hooks/session", color: "bg-cyan-500" },
] as const;

export default async function Home() {
  const counts = await getHookEventCounts();
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Hook Events Dashboard</h1>

      <div className="mb-8 p-4 rounded-lg bg-gray-900 border border-gray-800">
        <p className="text-sm text-gray-400">Total Events</p>
        <p className="text-4xl font-bold text-white">{total.toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((card) => (
          <a
            key={card.key}
            href={card.href}
            className="block p-5 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className={`w-3 h-3 rounded-full ${card.color}`} />
              <span className="text-sm font-medium text-gray-400">
                {card.label}
              </span>
            </div>
            <p className="text-3xl font-bold text-white">
              {counts[card.key].toLocaleString()}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
