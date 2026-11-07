import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/app/theme-provider";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin", "latin-ext"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://loopwise-ruddy.vercel.app"),
  title: "Loopwise",
  description: "Agenți AI de creștere pentru social media, construiți pe date reale din Instagram.",
  openGraph: {
    title: "Loopwise",
    description: "Agenți AI de creștere pentru social media, construiți pe date reale din Instagram.",
    images: ["/brand/loopwise-icon.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
