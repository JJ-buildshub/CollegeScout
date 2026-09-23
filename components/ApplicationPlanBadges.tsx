import clsx from "clsx";
import type { ApplicationPlan, ApplicationPlanType } from "@/lib/types";

const LABELS: Record<ApplicationPlanType, string> = {
  ED: "Early Decision",
  ED2: "Early Decision II",
  EA: "Early Action",
  EA2: "Early Action II",
  REA: "Restrictive Early Action",
  RD: "Regular Decision",
  Rolling: "Rolling Admission",
  Unspecified: "Early Plan",
};

function styleFor(plan: ApplicationPlan): string {
  if (plan.binding === true) return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
  if (plan.binding === false) return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
  return "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200";
}

function bindingLabel(plan: ApplicationPlan): string {
  if (plan.binding === true) return "Binding";
  if (plan.binding === false) return "Non-binding";
  return "Binding status not yet verified";
}

export default function ApplicationPlanBadges({ plans }: { plans: ApplicationPlan[] }) {
  if (plans.length === 0) {
    return <p className="text-sm text-slate-500">Not publicly reported.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {plans.map((plan, i) => (
        <div key={i} className={clsx("rounded-xl px-3 py-2 text-xs", styleFor(plan))}>
          <div className="font-bold">{LABELS[plan.type]}</div>
          <div className="mt-0.5">
            {plan.deadline ?? "Not publicly reported"} &middot; {bindingLabel(plan)}
          </div>
          {plan.note && <div className="mt-1 max-w-xs text-[11px] leading-snug opacity-80">{plan.note}</div>}
        </div>
      ))}
    </div>
  );
}
