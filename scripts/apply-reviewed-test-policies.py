#!/usr/bin/env python3
"""
Applies data/reviewed-test-policies.json to data/colleges.json: sets each listed
school's testingPolicy, testingPolicyNote and testingPolicyProvenance (the
school's own page URL and the date it was accessed).

DRY RUN by default (prints before/after and writes nothing). Pass --apply to
write data/colleges.json. Only those three fields of the listed schools are ever
changed; every other byte of the file is preserved. Run
scripts/check-reviewed-test-policies.mjs first.

    python scripts/apply-reviewed-test-policies.py            # show the diff
    python scripts/apply-reviewed-test-policies.py --apply    # write it
"""
import io
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


def main():
    apply = "--apply" in sys.argv
    path = os.path.join(ROOT, "data", "colleges.json")
    raw = open(path, encoding="utf-8", newline="").read()
    trailing_newline = raw.endswith("\n")
    colleges = json.loads(raw)
    reviewed = json.load(open(os.path.join(ROOT, "data", "reviewed-test-policies.json"), encoding="utf-8"))
    by_id = {c["id"]: c for c in colleges}

    for cid, entry in reviewed["schools"].items():
        c = by_id.get(cid)
        if c is None:
            print(f"!! {cid} is not in colleges.json")
            continue
        print(f"{c['name']}")
        print(f"  testingPolicy: {c['testingPolicy']}  ->  {entry['policy']}")
        print(f"  note:          {entry.get('note', '(none)')}")
        print(f"  source:        {entry['url']}  (accessed {reviewed['accessed']})")
        c["testingPolicy"] = entry["policy"]
        if entry.get("note"):
            c["testingPolicyNote"] = entry["note"]
        else:
            c.pop("testingPolicyNote", None)
        c["testingPolicyProvenance"] = {
            "source": f"{entry['label']} ({entry['url']})",
            "year": reviewed["cycle"],
            "accessed": reviewed["accessed"],
        }
        if entry.get("provenanceNote"):
            c["testingPolicyProvenance"]["note"] = entry["provenanceNote"]

    print(f"\n{len(reviewed['schools'])} schools.")
    if apply:
        out = json.dumps(colleges, indent=2, ensure_ascii=False) + ("\n" if trailing_newline else "")
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(out)
        print("Wrote data/colleges.json.")
    else:
        print("Dry run: nothing written. Re-run with --apply to write.")


if __name__ == "__main__":
    main()
