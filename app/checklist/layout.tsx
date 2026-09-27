import type { Metadata } from "next";

// This route's page is a client component, which cannot export metadata.
// The canonical URL lives here so the page is not treated as a duplicate
// of the homepage.
export const metadata: Metadata = {
  title: "My Plan",
  description:
    "A grade-specific plan across academics, testing, extracurriculars, research and financial planning.",
  alternates: { canonical: "/checklist" },
  openGraph: { title: "My Plan | CollegeScout", description: "A grade-specific plan across academics, testing, extracurriculars, research and financial planning.", url: "/checklist" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
