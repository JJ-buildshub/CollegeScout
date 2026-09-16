# CollegeScout

A California high school college planning portal built with Next.js (App Router), TypeScript, Tailwind CSS, and Lucide icons.

## Views

1. **College Intelligence Directory** (`/directory`) — search and filter 35 benchmark schools (UC, CSU, Private, Out-of-State Public) by system, testing policy, and admit rate; click into a full profile page for flagship programs, career outcomes, ideal-student archetype, and deadlines.
2. **Admissions Fit & Matcher** (`/matcher`) — enter your unweighted GPA plus honors/AP/IB coursework to calculate your official UC-capped weighted GPA (bonus points capped at 8 semesters), then see every school sorted into Safety / Target / Reach based on GPA position within the school's mid-50% band and its overall admit rate.
3. **High School Runway Checklist** (`/checklist`) — a grade-specific (9/10/11) action plan across Academics, Testing, Extracurriculars, College Research, and Financial Planning, with progress saved locally in your browser.

## Getting started

Requires Node.js 18.18+ (LTS recommended).

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Data

School benchmark data lives in `data/colleges.json`, sourced from the project's `colleges.json`.
