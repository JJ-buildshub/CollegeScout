#!/usr/bin/env python3
"""
Turns the approved expansion candidates (expansion/candidates.csv) into college records
and appends a batch of them to data/colleges.json.

Every filled value comes from a named public source, and every field with no public
bulk source is left empty rather than guessed:
  IPEDS 2023 (HD, ADM, EF)  name, location, website, campus setting, undergraduates, applicants/admitted, SAT range
  College Scorecard API     admit rate, cost of attendance, tuition, net price, graduation rate, net price calculator link
Left empty until researched from the school's own pages: test policy ("Not verified"),
application plans, GPA range, essays, written descriptions, career outcomes.

    SCORECARD_API_KEY=<free key from api.data.gov/signup> python scripts/build-expansion-records.py <ipeds folder> --offset 0 --count 50 [--apply]

Without --apply it only prints what it would add. Schools with no reported admit rate are
held back (listed at the end) until the interface handles a missing rate.
"""
import csv
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
TODAY = "2026-09-20"
API = "https://api.data.gov/ed/collegescorecard/v1/schools.json"
YEARS = [2024, 2023, 2022, 2021]
BASE = [
    "admissions.admission_rate.overall", "cost.attendance.academic_year", "cost.tuition.in_state", "cost.tuition.out_of_state",
    "cost.avg_net_price.overall", "cost.avg_net_price.public", "cost.avg_net_price.private",
    "cost.net_price.public.by_income_level.0-30000", "cost.net_price.public.by_income_level.30001-48000",
    "cost.net_price.public.by_income_level.48001-75000", "cost.net_price.public.by_income_level.75001-110000",
    "cost.net_price.public.by_income_level.110001-plus", "cost.net_price.private.by_income_level.0-30000",
    "cost.net_price.private.by_income_level.30001-48000", "cost.net_price.private.by_income_level.48001-75000",
    "cost.net_price.private.by_income_level.75001-110000", "cost.net_price.private.by_income_level.110001-plus",
    "completion.completion_rate_4yr_150nt", "student.size", "school.price_calculator_url",
]
BANDS = ["0-30000", "30001-48000", "48001-75000", "75001-110000", "110001-plus"]
SETTING = {"1": "Urban", "2": "Suburban", "3": "Small City", "4": "Rural"}  # IPEDS locale 11-13 city, 21-23 suburb, 31-33 town, 41-43 rural


def fetch_scorecard(ids, cache_path):
    cache = json.load(open(cache_path, encoding="utf-8")) if os.path.exists(cache_path) else {}
    need = [i for i in ids if i not in cache]
    fields = ["id"] + [f"latest.{f}" for f in BASE] + [f"{y}.{f}" for y in YEARS for f in BASE]
    for i in range(0, len(need), 12):
        chunk = need[i:i + 12]
        url = f"{API}?api_key={os.environ.get('SCORECARD_API_KEY', 'DEMO_KEY')}&id={','.join(chunk)}&fields={','.join(fields)}&per_page=100"
        for attempt in range(40):
            try:
                with urllib.request.urlopen(url, timeout=90) as r:
                    for row in json.load(r)["results"]:
                        cache[str(row["id"])] = row
                break
            except urllib.error.HTTPError as e:
                # The shared demo key allows only a few requests an hour: wait and try again.
                if e.code != 429 or attempt == 39:
                    raise
                json.dump(cache, open(cache_path, "w", encoding="utf-8"))
                time.sleep(300)
        for c in chunk:
            cache.setdefault(c, None)
    json.dump(cache, open(cache_path, "w", encoding="utf-8"))
    return cache


def year_of(row, field):
    v = row.get(f"latest.{field}")
    if v is None:
        return None
    for y in YEARS:
        if row.get(f"{y}.{field}") == v:
            return str(y)
    return "award year not identified"


def metric(row, field, value=None, label=None):
    v = row.get(f"latest.{field}") if value is None else value
    if v is None:
        return {"value": None, "provenance": None}
    return {"value": v, "provenance": {"source": f"College Scorecard (latest.{label or field})", "year": year_of(row, field) or "award year not identified"}}


def slug(name, taken):
    s = re.sub(r"[^a-z0-9]+", "-", name.lower().replace("&", "and")).strip("-")
    base, n = s, 2
    while s in taken:
        s, n = f"{base}-{n}", n + 1
    return s


def clean_name(n):
    return re.sub(r"[- ]Main Campus$", "", n).strip()


def build(cand, hd, row, taken):
    own_public = cand["control"] == "Public"
    a = float(cand["admit_rate"]) if cand["admit_rate"] else None
    sc_rate = row.get("latest.admissions.admission_rate.overall") if row else None
    rate = sc_rate if sc_rate is not None else a
    row = row or {}
    ownership_prefix = "public" if own_public else "private"
    bands, byears = {}, set()
    for b in BANDS:
        f = f"cost.net_price.{ownership_prefix}.by_income_level.{b}"
        if row.get(f"latest.{f}") is not None:
            bands[b] = row[f"latest.{f}"]
            byears.add(year_of(row, f))
    npo_field = "cost.avg_net_price.public" if own_public else "cost.avg_net_price.private"
    npo = row.get("latest.cost.avg_net_price.overall")
    npo_f = "cost.avg_net_price.overall"
    if npo is None:
        npo, npo_f = row.get(f"latest.{npo_field}"), npo_field
    grad = row.get("latest.completion.completion_rate_4yr_150nt")
    coa = row.get("latest.cost.attendance.academic_year")
    t_in, t_out = row.get("latest.cost.tuition.in_state"), row.get("latest.cost.tuition.out_of_state")
    # Cost of attendance is published for one price; for a public school the out-of-state figure adds the tuition difference.
    coa_out = coa
    coa_note = "Cost of attendance from College Scorecard (academic-year cost)."
    if own_public and coa is not None and t_in is not None and t_out is not None:
        coa_out = coa + (t_out - t_in)
        coa_note = "Cost of attendance from College Scorecard; the out-of-state figure adds the published tuition difference (out-of-state minus in-state tuition)."
    sat = f"{cand['sat25']}-{cand['sat75']} (SAT evidence-based reading + math, 25th-75th percentile)" if cand["sat25"] and cand["sat75"] else "N/A (Not reported)"
    web = (hd.get("WEBADDR") or "").strip().rstrip("/")
    if web and not web.lower().startswith("http"):
        web = "https://" + web
    name = clean_name(cand["name"])
    rec = {
        "id": slug(name, taken),
        "name": name,
        # California State University campuses keep the CSU label so the CSU admission rules and GPA method apply to them.
        "system": "CSU" if re.match(r"California State University|California Maritime|California Polytechnic State", name) else cand["control"],
        "location": f"{cand['city']}, {cand['state']}",
        "state": cand["state"],
        "website": web or None,
        "admitRateOverall": rate,
        "inStateAdmitRate": None,
        "outOfStateAdmitRate": None,
        "testingPolicy": "Not verified",
        "mid50_GPA_Unweighted": "N/A (Not reported)",
        "mid50_GPA_UCCapped": "N/A (Not reported)",
        "mid50_SAT": sat,
        "impactedMajors": [],
        "flagshipPrograms": [],
        "careerOutcomes": {"placementRate": None, "medianStartingSalary": None, "topRecruiters": []},
        "campusCultureAndVibe": "",
        "idealStudentArchetype": {"profileSummary": "", "highSchoolCoursePrereqs": [], "highImpactSpikes": []},
        "applicationPlans": [],
        "financials": {
            "coaInState": coa, "coaOutOfState": coa_out,
            "netPriceCalculatorUrl": row.get("latest.school.price_calculator_url") and (row["latest.school.price_calculator_url"] if row["latest.school.price_calculator_url"].startswith("http") else "https://" + row["latest.school.price_calculator_url"]),
            "meritAidNote": None,
        },
        "campusFit": {
            "undergradEnrollment": int(cand["ug"]) if cand["ug"] else None,
            "setting": SETTING.get(str(hd.get("LOCALE", "")).strip()[:1]),
            "greekLifePercent": None, "percentLivingOnCampus": None,
        },
        "careerMajorTags": {"primaryDisciplines": [], "interdisciplinaryPathways": []},
        "dataProvenance": {"sourcedFrom": ["IPEDS", "College Scorecard"], "lastVerified": TODAY},
        "admissionsProvenance": {"source": "IPEDS 2023-24 Admissions (applicants and admitted) and College Scorecard admit rate", "year": "2023"},
        "gpaSatProvenance": {"source": "IPEDS 2023-24 Admissions (SAT 25th and 75th percentiles)", "year": "2023"} if cand["sat25"] else None,
        "costProvenance": {"source": "College Scorecard (latest.cost.attendance.academic_year)", "year": year_of(row, "cost.attendance.academic_year") or "award year not identified", "note": coa_note} if coa is not None else None,
        "ipedsUnitId": int(cand["unitid"]),
        "scorecard": {
            "netPriceOverall": metric(row, npo_f, npo),
            "netPriceByIncomeBand": {"value": bands or None, "provenance": {"source": f"College Scorecard (latest.cost.net_price.{ownership_prefix}.by_income_level.*)", "year": " / ".join(sorted(byears))} if bands else None},
            "graduationRate": metric(row, "completion.completion_rate_4yr_150nt", grad),
            "undergradEnrollment": metric(row, "student.size"),
            "tuitionInState": metric(row, "cost.tuition.in_state"),
            "tuitionOutOfState": metric(row, "cost.tuition.out_of_state"),
            "admitRateOverall": metric(row, "admissions.admission_rate.overall", sc_rate),
        },
        "admitRateOverallSuperseded": sc_rate is not None,
    }
    rec = {k: v for k, v in rec.items() if v is not None or k in ("website", "inStateAdmitRate", "outOfStateAdmitRate")}
    return rec


def main():
    args = sys.argv[1:]
    folder = args[0]
    off = int(args[args.index("--offset") + 1]) if "--offset" in args else 0
    count = int(args[args.index("--count") + 1]) if "--count" in args else 50
    apply = "--apply" in args
    cands = list(csv.DictReader(open(os.path.join(ROOT, "expansion", "candidates.csv"), encoding="utf-8-sig")))
    hd = {r["UNITID"]: r for r in csv.DictReader(open(os.path.join(folder, "hd2023.csv"), encoding="utf-8-sig", errors="replace"))}
    path = os.path.join(ROOT, "data", "colleges.json")
    raw = open(path, encoding="utf-8", newline="").read()
    colleges = json.loads(raw)
    have = {str(c.get("ipedsUnitId")) for c in colleges}
    taken = {c["id"] for c in colleges}
    todo = [c for c in cands if c["unitid"] not in have]
    held = [c for c in todo if not c["admit_rate"]]
    ready = [c for c in todo if c["admit_rate"]]
    batch = ready[off:off + count]
    cache = fetch_scorecard([c["unitid"] for c in batch], os.path.join(ROOT, "expansion", "scorecard-cache.json"))
    added = []
    for c in batch:
        row = cache.get(c["unitid"])
        rec = build(c, hd[c["unitid"]], row, taken)
        if rec["admitRateOverall"] is None:
            held.append(c)
            continue
        taken.add(rec["id"])
        added.append(rec)
    for r in added:
        print(f"{r['id']:55s} {r['system']:8s} {r['state']} admit {r['admitRateOverall']:.2f} COA {r['financials']['coaInState']} SAT {r['mid50_SAT'][:12]} calc {'yes' if r['financials']['netPriceCalculatorUrl'] else 'no'}")
    print(f"\n{len(added)} records ready; {len(held)} held back for no admit rate; {len(ready) - off - len(batch) if len(ready) - off - len(batch) > 0 else 0} not yet processed")
    if apply:
        colleges.extend(added)
        out = json.dumps(colleges, indent=2, ensure_ascii=False) + ("\n" if raw.endswith("\n") else "")
        open(path, "w", encoding="utf-8", newline="").write(out)
        print(f"Wrote {len(added)} schools; the directory now has {len(colleges)}.")
    else:
        print("Dry run: nothing written.")


if __name__ == "__main__":
    main()
