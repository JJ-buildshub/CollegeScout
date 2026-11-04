import type { Metadata } from "next";
import TrackPage from "@/components/TrackPage";

const description = "How athletic recruiting can be part of a college application: what coaches and NCAA rules allow, and when.";

export const metadata: Metadata = {
  title: "Sports Track",
  description,
  alternates: { canonical: "/beyond-grades/sports-track" },
  openGraph: { title: "Sports Track | CollegeScout", description, url: "/beyond-grades/sports-track" },
};

export default function SportsTrackPage() {
  return <TrackPage track="sports" />;
}
