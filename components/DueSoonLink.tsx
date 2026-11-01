import Link from "next/link";
import { CalendarClock } from "lucide-react";

export default function DueSoonLink() {
  return (
    <Link href="/due-soon" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600">
      <CalendarClock className="h-4 w-4" aria-hidden="true" />
      See everything due soon
    </Link>
  );
}
