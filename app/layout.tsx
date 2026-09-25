import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Splash from "@/components/brand/Splash";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoleTrack",
  description: "Le pilotage de ton business sneakers : achat, stock, revente.",
  appleWebApp: { capable: true, title: "SoleTrack", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#1F2021",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <Splash />
        {children}
      </body>
    </html>
  );
}
