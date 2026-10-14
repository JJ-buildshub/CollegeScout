import type { Metadata } from "next";

// This route's page is a client component, which cannot export metadata.
const description =
  "Scholarships and competitions you can apply for in 9th to 12th grade: who can apply, what to submit, how to apply and when, each quoted from the organization that gives the award.";

export const metadata: Metadata = {
  title: "Scholarships",
  description,
  alternates: { canonical: "/scholarships" },
  openGraph: { title: "Scholarships | CollegeScout", description, url: "/scholarships" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
