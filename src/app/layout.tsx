import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerInit from "../components/ServiceWorkerInit";
import NavigationBar from "../components/NavigationBar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Feedreader",
  description: "A modern RSS reader with newspaper-like interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ServiceWorkerInit />
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <NavigationBar />

            {/* Main Content */}
            <main className="min-h-[calc(100vh-4rem)]">
              {children}
            </main>
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
