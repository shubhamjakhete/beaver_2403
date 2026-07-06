import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import TitleBar from "@/components/TitleBar";
import BottomNav from "@/components/BottomNav";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BEW-CF15-2403 | Water Treatment Monitor",
  description: "Beaver EcoWorks — Effluent Treatment Skid SCADA Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${inter.variable}`}>
      <body>
        <QueryProvider>
          <div className="min-h-screen flex flex-col gap-[10px] p-[14px_18px_16px]">
            <TitleBar />
            <main className="flex flex-col gap-[10px] flex-1">{children}</main>
            <BottomNav />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
