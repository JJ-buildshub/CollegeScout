# Verification brief: CollegeScout school data

Paste this whole file into ChatGPT, then attach or paste 10 to 15 rows at a time from
`schools-to-verify.csv`. Each row is one school, with what CollegeScout currently
stores for it.

## What this is for

CollegeScout is a free college-planning site for US high school students and parents
who don't have paid guidance. Its one rule is **never show a fact without a real
source**. When we don't know something, we say so. So the goal here is not to fill
gaps quickly. It is to confirm or correct each fact against **the school's own
official admissions pages**, and to prove it with an exact quote.

## The rules (these matter more than speed)

1. **The school's official page decides.** If the Common App requirements grid, a
   ranking site, or a forum disagrees with the school's own current admissions page,
   the school's page wins. Say so when they conflict.
2. **Only use official sources:** the school's own domain (usually `admissions.<school>.edu`
   or `<school>.edu/admissions`). Do **not** use Niche, PrepScholar, Reddit, College
   Confidential, CollegeVine, Wikipedia, or news articles as evidence.
3. **Check the right thing:** first-year (freshman) applicants, the **fall 2027**
   entering class (2026-27 application cycle), and the correct campus. Many
   universities have regional campuses or separate programs with different rules.
4. **Quote exactly.** For every fact, give the exact sentence from the page, copied
   character for character. Do not paraphrase, shorten, fix grammar, or combine
   sentences. I will check each quote against the live page with a script, and
   anything that doesn't match is rejected.
5. **Never guess.** If you can't open the page, or it doesn't say, answer
   `"status": "could_not_verify"` with the reason. A wrong answer is far worse than
   a missing one.
6. **Give the direct URL** of the page you used (not the homepage), and today's date
   as the access date.
7. **Check exceptions** and mention them in `note`: international, homeschooled,
   transfer, hardship-waiver, or "two years out of high school" rules.

## What to verify for each school

### A. Testing policy (first-year applicants)
Choose exactly one value, using the school's own wording:

| Value | Use when the school says... |
|---|---|
| `Test-Required` | Applicants must submit SAT or ACT scores (a hardship waiver may exist). |
| `Test-Optional` | Applicants choose whether to submit; scores are considered if sent. |
| `Test-Blind` | Scores are **not viewed or considered at all**, even if submitted. |
| `Test-Free` | The school calls itself "test-free" and doesn't consider scores. |
| `Test-Flexible` | The school accepts alternatives (for example AP or IB) in place of SAT/ACT. |

Watch the terminology. The Common App grid's "Never required" does **not** mean
test-blind: a school can be never-required and still consider scores you send (that's
test-optional). "Ignored" means the school doesn't consider scores.

### B. Application plans and deadlines (fall 2027 first-year)
For each plan the school offers, give the type and date:

| Type | Meaning |
|---|---|
| `ED` / `ED2` | Early Decision I / II. **Binding.** |
| `EA` / `EA2` | Early Action I / II. Non-binding. |
| `REA` | Restrictive (single-choice) Early Action. Non-binding. |
| `RD` | Regular Decision. |
| `Rolling` | Rolling admission with no fixed date. Put any priority date in `note`. |

- Give the **application** deadline, not the date documents are due or a decision date.
- If a date is a **priority** date and not a final deadline, say so in `note`.
- **Scholarship, honors, FAFSA and housing dates are not admission deadlines.** Put
  them in `note`, never in `deadline`.
- If the page describes rolling admission with no final application deadline, use
  type `Rolling` and set `deadline` to `null`. Never infer an RD deadline from a
  scholarship, honors, housing or financial-aid priority date.
- Only list a plan if the page says the school offers it. If the page doesn't
  mention a plan, don't add one.

### C. (Lower priority) Common App facts
Only if the school's page states them: application fee, whether the Common App fee
waiver is accepted, number of teacher recommendations, counselor recommendation,
mid-year report, portfolio or audition requirements.

## How to research each school (in this order)

1. Open the school's official first-year application requirements page.
2. Confirm it is for the correct entering class and campus.
3. Find whether scores are required, optional, flexible or not considered.
4. Check exceptions (international, homeschooled, hardship, out of school 2+ years).
5. Open the school's official application deadlines page for the same class.
6. Save the direct URL and the access date.
7. Use the Common App or any other source **only** when the school gives no current
   answer, and label it clearly as a fallback.

## What to send back

Return **only JSON**, one object per school, in this shape. Use `null` for anything
you could_not_verify, and explain in `note`.

```json
{
  "id": "the id from the CSV",
  "testing": {
    "status": "confirmed | conflict | could_not_verify",
    "policy": "Test-Required | Test-Optional | Test-Blind | Test-Free | Test-Flexible | null",
    "note": "scope or exceptions, or null",
    "url": "direct official page URL",
    "quote": "exact sentence from the page",
    "accessed": "YYYY-MM-DD"
  },
  "plans": {
    "status": "confirmed | conflict | could_not_verify",
    "items": [
      { "type": "ED | ED2 | EA | EA2 | REA | RD | Rolling", "binding": true, "deadline": "Month D or null", "note": "or null" }
    ],
    "url": "direct official page URL",
    "quotes": ["exact sentence or table row for each plan", "..."],
    "accessed": "YYYY-MM-DD"
  },
  "differs_from_ours": "one line: what is different from the CSV, or 'matches'"
}
```

`status` meanings: `confirmed` means the school's page matches what we store,
`conflict` means it differs (say how in `differs_from_ours`), and `could_not_verify`
means the page was unavailable or silent.

## Before you answer, check yourself

- Is every quote a real, exact sentence you saw on the page?
- Is the URL the page you actually read?
- Is it fall 2027, first-year, and the right campus?
- Did any scholarship or FAFSA date sneak into a `deadline`?
- Did you say `could_not_verify` instead of guessing where you weren't sure?

## Known sources and pitfalls

- Some university sites block automated tools. If a page won't load, say so.
- Some schools publish dates in a table, so quote the full row.
- Public universities often have both a **priority** and a **final** date.
- Regional or branch campuses (Penn State, Ohio State, Indiana, Purdue and others)
  have different rules from the flagship campus.
