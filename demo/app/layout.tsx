import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dungeon Cartographer Demo",
  description: "Procedural map generation library demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
