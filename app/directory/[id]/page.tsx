import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { colleges, getCollegeById } from "@/lib/colleges";
import CollegeProfileDashboard from "@/components/CollegeProfileDashboard";

export function generateStaticParams() {
  return colleges.map((c) => ({ id: c.id }));
}

/**
 * Each profile is its own page to a search engine: its own title, its own
 * canonical URL. The description only states what the record actually holds,
 * so a school with no verified figures doesn't get a description implying it.
 */
export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const college = getCollegeById(params.id);
  if (!college) return {};
  const path = `/directory/${college.id}`;
  const description = `Admissions, cost, academics and campus details for ${college.name} in ${college.location}, with each figure shown against its source.`;
  return {
    title: college.name,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${college.name} | CollegeScout`, description, url: path },
    twitter: { title: `${college.name} | CollegeScout`, description },
  };
}

export default function CollegeDetailPage({ params }: { params: { id: string } }) {
  const college = getCollegeById(params.id);
  if (!college) notFound();

  return <CollegeProfileDashboard college={college} />;
}
