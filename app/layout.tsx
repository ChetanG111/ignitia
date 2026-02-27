import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "@/lib/DataContext";

export const metadata: Metadata = {
  title: "AXIS | Transparent Infrastructure Intelligence",
  description: "Next-generation road maintenance and SLA enforcement platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-black selection:text-white">
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}


