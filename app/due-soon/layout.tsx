import type { Metadata } from "next";

// This route's page is a client component, which cannot export metadata.
const description = "Upcoming scholarship, internship and program deadlines for high school students, in one list, soonest first.";

export const metadata: Metadata = {
  title: "Scholarship, Internship & Program Deadlines",
  description,
  alternates: { canonical: "/due-soon" },
  openGraph: { title: "Scholarship, Internship & Program Deadlines | CollegeScout", description, url: "/due-soon" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
