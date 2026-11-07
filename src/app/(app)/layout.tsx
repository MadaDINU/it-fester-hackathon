import { Inter } from "next/font/google";
import { AppShell } from "@/components/app/app-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-loopwise-inter", display: "swap" });

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <div className={inter.variable}><AppShell>{children}</AppShell></div>;
}
