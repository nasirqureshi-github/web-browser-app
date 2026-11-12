import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Small Web — Mini Browser",
  description: "Browse the small web.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
