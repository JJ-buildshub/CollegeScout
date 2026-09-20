import { notFound } from "next/navigation";
import { colleges, getCollegeById } from "@/lib/colleges";
import CollegeProfileDashboard from "@/components/CollegeProfileDashboard";

export function generateStaticParams() {
  return colleges.map((c) => ({ id: c.id }));
}

export default function CollegeDetailPage({ params }: { params: { id: string } }) {
  const college = getCollegeById(params.id);
  if (!college) notFound();

  return <CollegeProfileDashboard college={college} />;
}
