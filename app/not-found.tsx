import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Compass className="h-10 w-10 text-slate-300" />
      <h1 className="text-xl font-bold text-navy-900">Page not found</h1>
      <p className="max-w-sm text-sm text-slate-500">
        We couldn&apos;t find what you were looking for. It may have been moved or doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
      >
        Back to Home
      </Link>
    </div>
  );
}
