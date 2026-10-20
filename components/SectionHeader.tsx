import type { LucideIcon } from "lucide-react";

/**
 * Page heading for a section reached from the top menu: the menu's own icon,
 * a short label saying what the section is for, the title and an intro. The
 * icon and label are what tell Scholarships and Beyond Grades apart at a glance.
 */
export default function SectionHeader({
  icon: Icon,
  label,
  title,
  children,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-gold-400">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wide text-gold-600">{label}</span>
      </div>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{title}</h1>
      <div className="mt-1 max-w-3xl text-sm text-slate-500">{children}</div>
    </header>
  );
}
