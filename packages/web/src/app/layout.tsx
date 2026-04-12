export const metadata = {
  title: "Cursor Consumption",
  description: "Track and analyze Cursor AI token consumption",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
