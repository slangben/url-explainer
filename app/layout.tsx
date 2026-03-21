import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeToggle from "./components/ThemeToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://url-explainer.com"
      : "http://localhost:3000"
  ),
  title: {
    default: "URL Explainer",
    template: "%s — URL Explainer",
  },
  description:
    "Free tool to break down any URL into its parts — path, query parameters, and fragments. Annotate each part and share as a link.",
  alternates: {
    canonical: "https://url-explainer.com",
  },
  openGraph: {
    title: "URL Explainer",
    description:
      "Break down any URL into its parts — path, query parameters, and fragments. Annotate and share with anyone.",
    url: "https://url-explainer.com",
    siteName: "URL Explainer",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "URL Explainer",
    description:
      "Break down any URL into its parts — path, query parameters, and fragments. Annotate and share with anyone.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="//gc.zgo.at/count.js" data-goatcounter="https://slangben.goatcounter.com/count" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var stored = localStorage.getItem('theme');
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (stored === 'dark' || (!stored && prefersDark)) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.add('light');
            }
          })();
        `}} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
