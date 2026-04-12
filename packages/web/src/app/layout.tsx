import "./globals.css";

export const metadata = {
  title: "Cursor Consumption",
  description: "Track and analyze Cursor AI token consumption",
};

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/hooks/tool", label: "Tool" },
  { href: "/hooks/shell", label: "Shell" },
  { href: "/hooks/mcp", label: "MCP" },
  { href: "/hooks/file", label: "File" },
  { href: "/hooks/agent", label: "Agent" },
  { href: "/hooks/session", label: "Session" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-800 bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-6">
            <span className="text-lg font-bold text-white">
              Cursor Consumption
            </span>
            <div className="flex gap-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
