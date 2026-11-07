"use client";

import { ThemeProvider as NextThemes } from "next-themes";

// Class-based themes; next-themes injects a blocking script so the saved theme applies before first paint.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemes attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>{children}</NextThemes>;
}
