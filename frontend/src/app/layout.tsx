import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SiteHeader } from "@/components/ui/SiteHeader";
import { NearProvider } from "@/lib/near";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEAR Envelope",
  description: "Send crypto inside a digital envelope that carries history, rarity, and meaning.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <NearProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-[1312px] flex-1 px-6 pb-16 sm:px-16">{children}</main>
        </NearProvider>
      </body>
    </html>
  );
}
