import type { Metadata } from "next";
import { IBM_Plex_Mono, Libertinus_Serif } from "next/font/google";
import "./globals.css";

import { SiteHeader } from "@/components/ui/SiteHeader";
import { NearProvider } from "@/lib/near";

const libertinus = Libertinus_Serif({
  variable: "--font-libertinus",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "NEAR Envelope",
  description: "Send crypto inside a digital envelope that carries history, rarity, and meaning.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${libertinus.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <NearProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 pb-24 sm:px-16">{children}</main>
        </NearProvider>
      </body>
    </html>
  );
}
