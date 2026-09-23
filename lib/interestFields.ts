/**
 * Sub-areas offered under each top-level field of interest, for the student
 * profile's interest picker. This is our own organizing taxonomy for the
 * picker UI — not a claim about what any specific college offers — so unlike
 * lib/programs.ts or lib/commonapp.ts it carries no per-school source. The
 * top-level field ids match lib/interests.ts's INTEREST_TAXONOMY exactly, so
 * a field chosen in the profile is the same field used to filter Explore.
 */
export const INTEREST_SUB_AREAS: Record<string, string[]> = {
  engineering: ["Mechanical", "Electrical", "Civil", "Biomedical", "Aerospace", "Chemical", "Industrial"],
  "cs-ai": ["Software Engineering", "Artificial Intelligence / ML", "Cybersecurity", "Computer Engineering", "Game Development"],
  "data-science": ["Statistics", "Machine Learning", "Data Analytics", "Business Analytics"],
  business: ["Accounting", "Marketing", "Finance", "Management", "Entrepreneurship"],
  entrepreneurship: ["Startups", "Small Business", "Social Entrepreneurship", "Product"],
  "medicine-health": ["Pre-Med", "Public Health", "Physician Assistant", "Nursing", "Pharmacy"],
  psychology: ["Clinical", "Counseling", "Cognitive", "Developmental", "Social"],
  biology: ["Molecular Biology", "Ecology", "Neuroscience", "Biochemistry", "Genetics"],
  finance: ["Corporate Finance", "Investment Banking", "Financial Planning", "Actuarial Science"],
  nursing: ["Registered Nursing (BSN)", "Pediatric", "Public Health Nursing"],
  education: ["Elementary Education", "Secondary Education", "Special Education", "Educational Policy"],
  "sports-movement": ["Kinesiology", "Athletic Training", "Sports Management", "Exercise Science"],
  "social-sciences": ["Economics", "Sociology", "Anthropology", "Political Science"],
  "music-performing": ["Instrumental Performance", "Vocal Performance", "Composition", "Theatre", "Dance"],
  "visual-arts": ["Studio Art", "Graphic Design", "Film Production", "Photography", "Art History"],
  "design-architecture": ["Architecture", "Interior Design", "Industrial/Product Design", "Urban Planning"],
  "media-communication": ["Journalism", "Public Relations", "Broadcast Media", "Digital Media"],
  "games-interactive": ["Game Design", "Game Programming", "Interactive Media", "Animation"],
  "environment-climate": ["Environmental Science", "Sustainability", "Climate Policy", "Conservation"],
  "law-policy": ["Pre-Law", "Public Policy", "Criminal Justice", "International Relations"],
};
