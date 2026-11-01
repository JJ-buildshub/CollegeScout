import type { Metadata } from "next";

// This route's page is a client component, which cannot export metadata.
const description = "Upcoming scholarship and summer program deadlines for high school students, in one list, soonest first.";

export const metadata: Metadata = {
  title: "Due Soon",
  description,
  alternates: { canonical: "/due-soon" },
  openGraph: { title: "Due Soon | CollegeScout", description, url: "/due-soon" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
