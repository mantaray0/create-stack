import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "{{APP_TITLE}}",
  description: "Prototype generated with create-stack.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
