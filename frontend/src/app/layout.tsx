import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderActions from "@/components/HeaderActions";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GlobalTrotters",
  description: "Plan multi‑city travel itineraries",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen">
          <header className="header">
            <div className="container">
              <nav className="flex items-center justify-between py-4">
                <div className="flex items-center gap-6">
                  <Link href="/" className="text-xl font-extrabold text-[var(--brand-blue)]">GT</Link>
                </div>
                <HeaderActions />
              </nav>
            </div>
          </header>
          <main className="container py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
