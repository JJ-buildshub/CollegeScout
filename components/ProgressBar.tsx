import clsx from "clsx";

export default function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={clsx("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
