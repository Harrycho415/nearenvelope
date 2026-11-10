import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Link from "next/link";

import { ConnectButton } from "@/components/ui/ConnectButton";
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
  description: "Gift an account, not just a transfer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NearProvider>
          <header className="flex items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold">NEAR Envelope</Link>
            <ConnectButton />
          </header>
          <main className="flex-1 px-6 pb-12">{children}</main>
        </NearProvider>
      </body>
    </html>
  );
}
