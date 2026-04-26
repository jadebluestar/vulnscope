// app/layout.tsx
import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Mono, Barlow } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/layout-wrapper";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const mono = IBM_Plex_Mono({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
});

const body = Barlow({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "VulnScope - Penetration Testing Pipeline",
  description: "Automated web app penetration testing pipeline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} ${body.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning  // ✅ Prevents hydration mismatch from browser extensions
    >
      <body className="bg-bg-primary antialiased">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}