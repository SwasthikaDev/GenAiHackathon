import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderActions from "@/components/HeaderActions";

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
          <header>
            <div className="container">
              <nav className="flex items-center justify-between py-4">
                <a href="/" className="text-xl font-semibold">GlobalTrotters</a>
                <HeaderActions />
              </nav>
            </div>
          </header>
          <main className="container">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
