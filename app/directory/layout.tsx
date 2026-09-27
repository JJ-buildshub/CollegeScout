import type { Metadata } from "next";

// This route's page is a client component, which cannot export metadata.
// The canonical URL lives here so the page is not treated as a duplicate
// of the homepage.
export const metadata: Metadata = {
  title: {
    default: "Explore Colleges",
    template: "%s | CollegeScout",
  },
  description:
    "Search and filter 336 US colleges by state, system, testing policy and admit rate.",
  alternates: { canonical: "/directory" },
  openGraph: { title: "Explore Colleges | CollegeScout", description: "Search and filter 336 US colleges by state, system, testing policy and admit rate.", url: "/directory" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
