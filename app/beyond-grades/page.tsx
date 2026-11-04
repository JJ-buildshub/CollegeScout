import type { Metadata } from "next";
import TrackPage from "@/components/TrackPage";

const description = "How music auditions and recordings can be part of a college application: what each college asks and when it happens.";

export const metadata: Metadata = {
  title: "Music Track",
  description,
  alternates: { canonical: "/beyond-grades" },
  openGraph: { title: "Music Track | CollegeScout", description, url: "/beyond-grades" },
};

export default function MusicTrackPage() {
  return <TrackPage track="music" />;
}
