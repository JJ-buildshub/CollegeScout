import { MapPin } from "lucide-react";
import type { CampusFitAttributes } from "@/lib/types";

/**
 * Location leads, because "where is it" is the first thing anyone asks about a
 * campus and it was previously only in the page banner — never in the Campus
 * section itself, which is where a visitor goes looking for it.
 *
 * Setting (Urban / Suburban / Small City / Rural) is the closest thing we hold
 * to how reachable a campus is. We do not store travel, transit or disability
 * accessibility for any school, so none is shown or implied.
 */
export default function CampusFitStats({
  fit,
  location,
}: {
  fit: CampusFitAttributes;
  location?: string | null;
}) {
  return (
    <div className="space-y-4">
      {location && (
        <div className="border-b border-slate-100 pb-4">
          <div className="text-xs font-semibold tracking-wide text-slate-600">Location</div>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-navy-900">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-600" />
            {location}
            {fit.setting && <span className="font-medium text-slate-500">&middot; {fit.setting}</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Undergraduates"
          value={fit.undergradEnrollment !== null ? fit.undergradEnrollment.toLocaleString() : null}
        />
        <Stat label="Setting" value={fit.setting} />
        <Stat
          label="In a fraternity or sorority"
          value={fit.greekLifePercent !== null ? `${fit.greekLifePercent}% of students` : null}
        />
        <Stat
          label="Living on campus"
          value={fit.percentLivingOnCampus !== null ? `${fit.percentLivingOnCampus}% of students` : null}
        />
      </div>
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
