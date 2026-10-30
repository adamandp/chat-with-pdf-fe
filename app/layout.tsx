import type { Metadata } from "next";
import { MockProvider } from "@/providers/mock-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chat with PDF",
  description: "Ask questions, explore documents, and find answers with sources.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <MockProvider enabled={process.env.NEXT_PUBLIC_API_MOCKING !== "disabled"}>
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors />
          </QueryProvider>
        </MockProvider>
      </body>
    </html>
  );
}
