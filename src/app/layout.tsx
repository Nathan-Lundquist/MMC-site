import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, Geist } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/BackToTop";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-display",
  weight: "400",
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
    description: "Southeast Michigan's trusted landscaping partner since 2000. Full-service landscape design, hardscaping, outdoor lighting, pools, and year-round property care.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mike's Clean Cut Landscaping Inc.",
    description: "Southeast Michigan's trusted landscaping partner since 2000. Full-service landscape design, hardscaping, outdoor lighting, pools, and year-round property care.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", dmSans.variable, dmSerif.variable, "font-sans", geist.variable)}>
      <body className="min-h-screen flex flex-col font-body">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}
