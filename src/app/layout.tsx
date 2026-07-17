import type { Metadata } from "next";
import { Orbitron, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "No Signal",
  description: "Ticket booking for No Signal — an underground night out.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppSessionProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AppSessionProvider>
      </body>
    </html>
  );
}
