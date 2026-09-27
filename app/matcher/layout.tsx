import type { Metadata } from "next";

// This route's page is a client component, which cannot export metadata.
// The canonical URL lives here so the page is not treated as a duplicate
// of the homepage.
export const metadata: Metadata = {
  title: "My Fit",
  description:
    "Enter your GPA and course rigour to see how every college sorts into Reach, Target and Likely for you. Nothing leaves your browser.",
  alternates: { canonical: "/matcher" },
  openGraph: { title: "My Fit | CollegeScout", description: "Enter your GPA and course rigour to see how every college sorts into Reach, Target and Likely for you. Nothing leaves your browser.", url: "/matcher" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
