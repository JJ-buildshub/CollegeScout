import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import NavBar from "@/components/NavBar";
import DataHealthBanner from "@/components/DataHealthBanner";
import ResetDataButton from "@/components/ResetDataButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollegeScout | Find Colleges You Didn't Know to Look For",
  description:
    "Explore Colleges, My Fit, and My Plan to help students discover schools based on fit — not just rankings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <NavBar />
        <DataHealthBanner />
        <main className="mx-auto max-w-7xl px-4 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-5">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
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
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
