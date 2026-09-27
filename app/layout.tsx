import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import NavBar from "@/components/NavBar";
import DataHealthBanner from "@/components/DataHealthBanner";
import ResetDataButton from "@/components/ResetDataButton";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import "./globals.css";

// Variable font: no `weight` (that would pin static cuts and disallow `axes`),
// so every weight the headings use comes from one file.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const DESCRIPTION =
  "Compare 336 US colleges on admissions, cost and campus life — from the numbers colleges publish themselves. Free, no account needed.";

export const metadata: Metadata = {
  // metadataBase resolves every relative URL below, and without it Next emits
  // share-preview tags pointing at localhost.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CollegeScout | Find Colleges You Didn't Know to Look For",
    template: "%s | CollegeScout",
  },
  description: DESCRIPTION,
  // No canonical here. Metadata set on a layout is inherited by every page
  // beneath it, so a canonical of "/" told search engines that all 336 college
  // profiles were duplicates of the homepage. Each route declares its own.
  openGraph: {
    type: "website",
    siteName: "CollegeScout",
    title: "Find colleges you didn't know to look for",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Find colleges you didn't know to look for",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">
        <NavBar />
        <DataHealthBanner />
        <main className="mx-auto max-w-7xl px-4 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-5">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <p>
            CollegeScout — GPA and fit estimates are directional planning tools, not admissions guarantees.
          </p>
          <p className="mt-1.5">
            College data comes from the U.S. Department of Education&apos;s College Scorecard (2024) and
            public university sources. Some figures are approximate and not yet independently confirmed.{" "}
            <Link href="/about-data" className="font-semibold text-navy-900 underline underline-offset-2 hover:text-navy-700">
              About our data
            </Link>
          </p>
          <p className="mt-2 flex items-center justify-center gap-3">
            <span>Your profile, saved schools and tasks are stored only in this browser — never uploaded, no account needed.</span>
            <ResetDataButton />
          </p>
          <p className="mt-2">
            Questions, feedback or a correction?{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-navy-900 underline underline-offset-2 hover:text-navy-700"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
