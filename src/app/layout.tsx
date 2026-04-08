import type { Metadata } from "next";
import { Source_Serif_4, Libre_Franklin } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const sourceSerif = Source_Serif_4({
  variable: "--font-display",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const libreFranklin = Libre_Franklin({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mike's Clean Cut Landscaping Inc. | Dream - Design - Build - Enjoy",
    template: "%s | Mike's Clean Cut Landscaping",
  },
  description: "Southeast Michigan's trusted landscaping partner since 2000. Full-service landscape design, hardscaping, outdoor lighting, pools, and year-round property care.",
  metadataBase: new URL("https://mikescleancut.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Mike's Clean Cut Landscaping Inc.",
    url: "https://mikescleancut.com",
    title: "Mike's Clean Cut Landscaping Inc.",
    description: "Southeast Michigan's trusted landscaping partner since 2000.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mike's Clean Cut Landscaping Inc.",
    description: "Southeast Michigan's trusted landscaping partner since 2000.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", sourceSerif.variable, libreFranklin.variable)}>
      <body className="min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
