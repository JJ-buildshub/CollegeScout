import type { Metadata } from "next";

// This route's page is a client component, which cannot export metadata.
const description =
  "Free and paid summer internships, university programs and project ideas for high school students, with cost, who can apply and deadlines from each program's official site.";

export const metadata: Metadata = {
  title: "Summer Opportunities",
  description,
  alternates: { canonical: "/summer" },
  openGraph: { title: "Summer Opportunities | CollegeScout", description, url: "/summer" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
