import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${googleSans.variable} h-full antialiased dark`}
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
