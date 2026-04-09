import type {ReactNode} from "react";
import type {Metadata} from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Equity Fair Value Terminal",
  description: "Desktop stock valuation workspace for Japanese and US equities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
