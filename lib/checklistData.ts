import type { ChecklistCategory, Grade } from "./types";

export const GRADE_LABELS: Record<Grade, string> = {
  9: "9th Grade — Freshman",
  10: "10th Grade — Sophomore",
  11: "11th Grade — Junior",
  12: "12th Grade — Senior",
};

export const GRADE_TAGLINES: Record<Grade, string> = {
  9: "Build strong habits and explore widely. Nothing here counts toward UC GPA yet, but the transcript starts now.",
  10: "This is where the UC-capped GPA clock starts. Course rigor and consistency matter more than exploration.",
  11: "The most heavily weighted year for admissions. Testing, rigor, and early research all converge here.",
  12: "Execution year: submit strong applications, finish strong academically, and choose confidently once decisions arrive.",
};

export const checklistData: Record<Grade, ChecklistCategory[]> = {
  9: [
    {
      id: "academics",
      title: "Academics & Coursework",
      icon: "book-open",
      items: [
        { id: "9-a1", label: "Meet with your counselor to map a 4-year A-G course plan" },
        { id: "9-a2", label: "Enroll in the highest math/English track you can sustain successfully" },
        { id: "9-a3", label: "Confirm which freshman courses satisfy UC/CSU A-G subject requirements" },
        { id: "9-a4", label: "Establish a consistent study routine and grade-tracking habit" },
      ],
    },
    {
      id: "testing",
      title: "Testing",
      icon: "pencil-line",
      items: [
        { id: "9-t1", label: "Take the PSAT 8/9 for early baseline scoring (if offered)" },
        { id: "9-t2", label: "No SAT/ACT prep needed yet — focus on reading volume and math fluency" },
      ],
    },
    {
      id: "extracurriculars",
      title: "Extracurriculars & Leadership",
      icon: "users",
      items: [
        { id: "9-e1", label: "Try 2-3 clubs, sports, or arts programs to find genuine interests" },
        { id: "9-e2", label: "Start a simple activity log (dates, hours, role, impact)" },
        { id: "9-e3", label: "Look for a low-stakes leadership role (committee, team captain-in-training)" },
      ],
    },
    {
      id: "research",
      title: "College & Career Exploration",
      icon: "compass",
      items: [
        { id: "9-r1", label: "Explore broad career interest areas (job shadowing, YouTube, career days)" },
        { id: "9-r2", label: "Create a folder/spreadsheet to start saving college names that interest you" },
      ],
    },
    {
      id: "financial",
      title: "Financial Planning",
      icon: "piggy-bank",
      items: [
        { id: "9-f1", label: "Have a family conversation about general college budget expectations" },
        { id: "9-f2", label: "If applicable, open a dedicated college savings account" },
      ],
    },
  ],
  10: [
    {
      id: "academics",
      title: "Academics & Coursework",
      icon: "book-open",
      items: [
        {
          id: "10-a1",
          label: "Grades this year count toward your UC-capped GPA — treat every semester seriously",
        },
        { id: "10-a2", label: "Add 1-2 Honors/AP courses if you're ready for the rigor step-up" },
        { id: "10-a3", label: "Check in with your counselor on A-G progress at least once this year" },
        { id: "10-a4", label: "Maintain or improve your GPA trend — an upward trend is noticed by admissions" },
      ],
    },
    {
      id: "testing",
      title: "Testing",
      icon: "pencil-line",
      items: [
        { id: "10-t1", label: "Take the PSAT/NMSQT in October (National Merit qualifying year for juniors, good practice now)" },
        { id: "10-t2", label: "Take a full-length diagnostic SAT and ACT to see which format fits you better" },
        { id: "10-t3", label: "Research whether your target schools are test-optional, test-required, or test-free" },
      ],
    },
    {
      id: "extracurriculars",
      title: "Extracurriculars & Leadership",
      icon: "users",
      items: [
        { id: "10-e1", label: "Narrow down to 3-5 activities and go deeper rather than wider" },
        { id: "10-e2", label: "Seek your first real leadership title (officer, section lead, project lead)" },
        { id: "10-e3", label: "Start or join a summer program, internship, or research opportunity" },
        { id: "10-e4", label: "Log community service hours if relevant to your target schools" },
      ],
    },
    {
      id: "research",
      title: "College & Career Exploration",
      icon: "compass",
      items: [
        { id: "10-r1", label: "Build an initial college list across Safety/Target/Reach categories" },
        { id: "10-r2", label: "Visit 2-3 nearby college campuses (UC/CSU campuses are great low-cost options)" },
        { id: "10-r3", label: "Identify 1-2 potential majors or flagship programs of interest" },
      ],
    },
    {
      id: "financial",
      title: "Financial Planning",
      icon: "piggy-bank",
      items: [
        { id: "10-f1", label: "Research the general cost of attendance for UC, CSU, and private schools" },
        { id: "10-f2", label: "Learn the basics of the FAFSA and California Dream Act Application timelines" },
      ],
    },
  ],
  11: [
    {
      id: "academics",
      title: "Academics & Coursework",
      icon: "book-open",
      items: [
        { id: "11-a1", label: "Take your most rigorous course load this year — junior year GPA matters most" },
        { id: "11-a2", label: "Confirm all A-G subject requirements will be completed by senior year" },
        { id: "11-a3", label: "Identify 1-2 teachers you could ask for strong letters of recommendation" },
      ],
    },
    {
      id: "testing",
      title: "Testing",
      icon: "pencil-line",
      items: [
        { id: "11-t1", label: "Take the PSAT/NMSQT in October (National Merit qualifying)" },
        { id: "11-t2", label: "Take the SAT and/or ACT at least once this year, twice if targeting test-optional/required schools" },
        { id: "11-t3", label: "Take AP exams for all AP courses completed this year" },
        { id: "11-t4", label: "Schedule test prep (self-study, tutor, or course) at least 2 months before test dates" },
      ],
    },
    {
      id: "extracurriculars",
      title: "Extracurriculars & Leadership",
      icon: "users",
      items: [
        { id: "11-e1", label: "Hold or work toward your most senior leadership positions this year" },
        { id: "11-e2", label: "Pursue a signature project, research paper, internship, or competition (your 'spike')" },
        { id: "11-e3", label: "Plan a productive summer: research program, internship, job, or intensive project" },
      ],
    },
    {
      id: "research",
      title: "College & Career Exploration",
      icon: "compass",
      items: [
        { id: "11-r1", label: "Finalize a balanced college list (Safety/Target/Reach) using the Admissions Matcher" },
        { id: "11-r2", label: "Visit or virtually tour every school on your finalized list" },
        { id: "11-r3", label: "Draft your Common App / UC Personal Insight Question essays over the summer" },
        { id: "11-r4", label: "Request letters of recommendation before the school year ends" },
      ],
    },
    {
      id: "financial",
      title: "Financial Planning",
      icon: "piggy-bank",
      items: [
        { id: "11-f1", label: "Run the Net Price Calculator for each school on your list" },
        { id: "11-f2", label: "Research merit scholarships specific to your target schools" },
        { id: "11-f3", label: "Prepare financial documents needed for FAFSA/CSS Profile ahead of senior fall" },
      ],
    },
  ],
  12: [
    {
      id: "academics",
      title: "Academics & Coursework",
      icon: "book-open",
      items: [
        { id: "12-a1", label: "Maintain your grades — many colleges rescind offers for a significant senior-year drop" },
        { id: "12-a2", label: "Send first-semester/mid-year transcript updates if a school requests them" },
        { id: "12-a3", label: "Finish any remaining graduation and A-G course requirements" },
      ],
    },
    {
      id: "applications",
      title: "Applications & Essays",
      icon: "pencil-line",
      items: [
        { id: "12-p1", label: "Confirm every application deadline (EA/ED/RD) is met" },
        { id: "12-p2", label: "Finalize and proofread every supplemental essay before submitting" },
        { id: "12-p3", label: "Submit any remaining SAT/ACT scores for test-required or test-optional consideration" },
        { id: "12-p4", label: "Confirm recommendation letters were submitted before each deadline" },
      ],
    },
    {
      id: "financial",
      title: "Financial Aid & Scholarships",
      icon: "piggy-bank",
      items: [
        { id: "12-f1", label: "Submit the FAFSA and/or CSS Profile as soon as they open" },
        { id: "12-f2", label: "Apply to outside and local scholarships on a rolling basis" },
        { id: "12-f3", label: "Compare financial aid award letters side-by-side once they arrive" },
        { id: "12-f4", label: "Re-run the Net Price Calculator for any school whose aid offer is unclear" },
      ],
    },
    {
      id: "decisions",
      title: "Decisions & Enrollment",
      icon: "users",
      items: [
        { id: "12-d1", label: "Compare admitted schools on cost, fit, and career outcomes — not just prestige" },
        { id: "12-d2", label: "Submit your enrollment deposit before May 1 for regular-decision schools" },
        { id: "12-d3", label: "Decline offers you won't use so waitlisted students can move up" },
        { id: "12-d4", label: "If waitlisted, follow that school's specific waitlist instructions" },
      ],
    },
    {
      id: "afterDecision",
      title: "Life After Decision",
      icon: "compass",
      items: [
        { id: "12-l1", label: "Complete housing forms for your enrolling school" },
        { id: "12-l2", label: "Sign up for orientation and any required placement testing" },
        { id: "12-l3", label: "Request final transcripts be sent after graduation" },
      ],
    },
  ],
};
