import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollegeScout | Find Colleges You Didn't Know to Look For",
  description:
    "College Directory, Admissions Matcher, and Runway Checklist to help students discover schools based on fit — not just rankings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <NavBar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
          CollegeScout — GPA and fit estimates are directional planning tools, not admissions guarantees.
        </footer>
      </body>
    </html>
  );
}
