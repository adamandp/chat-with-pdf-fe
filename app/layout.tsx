import type { Metadata } from "next";
import { MockProvider } from "@/providers/mock-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemedToaster } from "@/components/theme/themed-toaster";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";
import "@/styles/chat-workspace.css";
import "@/styles/mobile-viewport.css";
import "@/styles/sidebar-sessions.css";
import "@/styles/dark-theme.css";

export const metadata: Metadata = {
  title: "Chat with PDF",
  description: "Ask questions, explore documents, and find answers with sources.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <MockProvider enabled={process.env.NEXT_PUBLIC_API_MOCKING !== "disabled"}>
            <QueryProvider>
              {children}
              <ThemedToaster />
            </QueryProvider>
          </MockProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
