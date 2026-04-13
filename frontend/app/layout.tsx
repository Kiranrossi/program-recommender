import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NSRCEL Application Management System",
  description: "Application and review platform for NSRCEL programs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f1117] antialiased text-white">{children}</body>
    </html>
  );
}
