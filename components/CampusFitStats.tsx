import type { CampusFitAttributes } from "@/lib/types";

export default function CampusFitStats({ fit }: { fit: CampusFitAttributes }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Stat
        label="Undergrad Enrollment"
        value={fit.undergradEnrollment !== null ? fit.undergradEnrollment.toLocaleString() : null}
      />
      <Stat label="Setting" value={fit.setting} />
      <Stat label="Greek Life" value={fit.greekLifePercent !== null ? `${fit.greekLifePercent}%` : null} />
      <Stat
        label="Living On Campus"
        value={fit.percentLivingOnCampus !== null ? `${fit.percentLivingOnCampus}%` : null}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs font-semibold tracking-wide text-slate-600">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-navy-900">{value ?? "Not publicly reported"}</div>
    </div>
  );
}
