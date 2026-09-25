// All site copy. Facts only — sources: resume, Linear, work repos (spec §4). No client names.

export type ArtId = "horse" | "orb" | "eye" | "vase" | "lion" | "bust";
export type Link = { label: string; href: string; external?: boolean };
export type Platform = { name: string; meta: string; body: string; role: string; href?: string };
export type CaseItem = {
  numeral: string;
  figure: string;
  meta: string;
  title: string;
  situation: string;
  decision: string;
  result: string;
  demo?: "argus" | "daedalus";
};

export const SITE = {
  name: "Bhumil Modi",
  role: "Forward Deployed AI Engineer",
  url: "https://bhumil-modi-portfolio.vercel.app",
  email: "bhumilmodi2002@gmail.com",
  location: "Ankleshwar, Gujarat, India",
  resume: "/Bhumil-Modi-Resume-FDE.pdf",
  linkedin: "https://www.linkedin.com/in/bhumil-modi-430148190",
  github: "https://github.com/BhumilModi",
  description:
    "Forward Deployed AI Engineer. I deploy agentic systems inside the customer — working POC in two weeks, live beta inside five months.",
};

export const ONBOARDING = {
  mark: "ΒΜ",
  whisperIn: "From the customer's first call —",
  name: "Bhumil Modi",
  role: "Forward Deployed AI Engineer",
  whisperOut: "— to agents in production.",
  skip: "Enter ↵",
};

export const NAV = {
  brand: "BM",
  links: [
    { label: "Approach", href: "#approach" },
    { label: "Work", href: "#work" },
    { label: "Cases", href: "#cases" },
    { label: "Record", href: "#record" },
    { label: "FAQ", href: "#faq" },
  ] as Link[],
  cta: { label: "Get in touch", href: `mailto:${SITE.email}` } as Link,
};

export const HERO = {
  eyebrow: "Forward Deployed AI Engineer · Agentic systems",
  title: "I deploy agentic systems inside the customer.",
  lede:
    "On the weekly call with your stakeholders, then building the agent pipelines, services and frontends myself — working POC in two weeks, live beta inside five months.",
  actions: [
    { label: "See the cases", href: "#cases" },
    { label: "Resume ↓", href: SITE.resume, external: true },
  ] as Link[],
  command: `mail ${SITE.email}`,
  copyText: SITE.email,
};

export const ENGAGEMENT = {
  label: "How an engagement runs",
  phases: [
    { name: "Embed", when: "Kickoff", body: "Weekly calls with the stakeholders and the product manager. Ambiguity becomes an agent design." },
    { name: "Prototype", when: "Week 2", body: "A working proof of concept on the customer's real inputs." },
    { name: "Build", when: "Month 2–2.5", body: "A functional application: the agent, its guardrails, the product around it." },
    { name: "Beta", when: "Month 4–5", body: "Live with users the customer chooses." },
  ],
  stats: [
    { value: "20+", label: "client products" },
    { value: "10+", label: "from empty repository to live beta" },
    { value: "10", label: "domains" },
    { value: "6", label: "products as project lead" },
    { value: "3,792", label: "commits since Feb 2025" },
  ],
};

export const APPROACH = {
  label: "Approach",
  title: "How the agent gets built",
  items: [
    { n: 1, label: "Embed", title: "Start on the call", body: "Requirements arrive ambiguous. I sit with the people who own the problem and turn it into an agent design.", art: "horse" },
    { n: 2, label: "Design", title: "Structure first, model second", body: "Planners, tools and staged pipelines give the agent a shape. The model works inside it, not instead of it.", art: "orb" },
    { n: 3, label: "Guard", title: "Gates before output", body: "Verification gates, bounded repair and fail-closed steps. A bad draft stops at the gate, not at the user.", art: "eye" },
    { n: 4, label: "Measure", title: "Evals, not vibes", body: "Deterministic checks plus model judges, run against fixed datasets, so a prompt change is measured rather than eyeballed.", art: "vase" },
    { n: 5, label: "Integrate", title: "Into their stack", body: "Auth, tenancy, provider abstraction, rate limits and concurrency — what an agent needs to survive a real customer.", art: "lion" },
    { n: 6, label: "Ship", title: "Past the demo", body: "Beta with real users, release pipelines, and an SDK so other teams can embed the agent.", art: "bust" },
  ] as { n: number; label: string; title: string; body: string; art: ArtId }[],
};

export const WORK = {
  label: "Work",
  title: "Agents in the field",
  intro: "A selection of what I've deployed. Clients stay unnamed.",
  agents: [
    { title: "Clinical content agent", body: "Turns protocol documents into patient-facing scripts, speech and video." },
    { title: "Listing-video planner", body: "Plans, narrates and renders property videos from listing photos." },
    { title: "Kitchen vision pipeline", body: "Reads photos of a room and draws plan, elevation and axonometric sheets." },
    { title: "Embeddable avatar assistant", body: "An AI video-avatar SDK other products drop into their app." },
    { title: "Sales-outreach agents", body: "Campaigns, lead handling and automated appointment setting." },
    { title: "Meeting intelligence", body: "Pre-call briefs and live-call analysis." },
    { title: "Grant discovery", body: "Search, match and apply." },
    { title: "Biopharma agent fleet", body: "Regulatory gap analysis ahead of a submission." },
  ],
  platformsLabel: "TheAgentic's own platforms",
  platforms: [
    { name: "CortexON", meta: "★ 450+ · open source", body: "Open-source generalised agent for everyday task automation.", role: "Frontend contributor", href: "https://github.com/TheAgenticAI/CortexON" },
    { name: "TheAgenticBench", meta: "★ 50+ · open source", body: "Open-source digital-worker framework for agent-driven research and process automation.", role: "Frontend contributor", href: "https://github.com/TheAgenticAI/TheAgenticBench" },
    { name: "TheAgentic Console", meta: "in-house", body: "Developer console for TheAgentic's AI infrastructure.", role: "Built the entire UI" },
  ] as Platform[],
};

export const CASES = {
  label: "Cases",
  title: "Four decisions",
  intro: "Four decisions from client work.",
  items: [
    {
      numeral: "I", figure: "Argus", meta: "clinical · content agent",
      title: "Coverage by construction",
      situation: "Generated content had to reach patients without a reviewer reading every word.",
      decision: "A fact → plan → write → verify pipeline. The planner guarantees each fact is used exactly once; a deterministic gate checks coverage; the model only judges faithfulness.",
      result: "Engineered to need no manual review.",
      demo: "argus",
    },
    {
      numeral: "II", figure: "Ariadne", meta: "generative video · planning agent",
      title: "Same brief, same cut",
      situation: "A model-written video plan could invent assets and quietly drop scenes.",
      decision: "A deterministic planner owns the plan; the model may only patch it, and invented references are rejected.",
      result: "The same brief now produces the same video.",
    },
    {
      numeral: "III", figure: "Daedalus", meta: "vision · drawing pipeline",
      title: "The pipeline I built, then retired",
      situation: "Turn photographs of a room into dimensioned drawing sheets.",
      decision: "I built a measured geometry pipeline — then, when image-model rendering beat it, replaced it with a model call per view behind a content-addressed cache.",
      result: "Keep what wins, even when you built the loser.",
      demo: "daedalus",
    },
    {
      numeral: "IV", figure: "Hermes", meta: "agent SDK · release",
      title: "An agent other teams can embed",
      situation: "An AI avatar assistant had to live inside other companies' products.",
      decision: "A framework-free SDK core with a React-free transport, shipped through a gated CI pipeline with dev and stable channels.",
      result: "v1.0 to public release.",
    },
  ] as CaseItem[],
};

export const RECORD = {
  label: "Record",
  title: "Record",
  roles: [
    { when: "May 2025 – now", where: "TheAgentic", role: "Forward Deployed AI Engineer", line: "20+ client products across ten domains; project lead on six." },
    { when: "Nov 2024 – May 2025", where: "TheAgentic", role: "Software Engineer", line: "Built the entire UI for TheAgentic Console; frontends across seven concurrent engagements." },
    { when: "Feb – Oct 2024", where: "ScaleGenAI", role: "Senior Software Engineer", line: "Sole owner of the flagship product's frontend architecture." },
    { when: "Oct 2023 – Jan 2024", where: "Tally Group", role: "Software Engineer", line: "Billing-simulation app for Australian utility clients." },
    { when: "Mar – Aug 2023", where: "SleevesUp", role: "Software Engineer Intern", line: "Full-stack on two products." },
    { when: "2019 – 2023", where: "Vellore Institute of Technology", role: "B.Tech CSE, AI & ML", line: "GPA 9.08 / 10" },
  ],
  toolkit: [
    { group: "Agentic", items: ["Workflow design", "LLM orchestration", "Provider abstraction", "Verification & repair loops", "Evals"] },
    { group: "Languages", items: ["Python", "TypeScript", "Go", "SQL"] },
    { group: "Backend", items: ["FastAPI", "Node.js"] },
    { group: "Frontend", items: ["React", "Next.js", "Tailwind CSS"] },
    { group: "Platform", items: ["PostgreSQL", "Redis", "Docker", "AWS", "Auth0"] },
  ],
};

export const FAQ = {
  label: "FAQ",
  title: "Questions",
  items: [
    { q: "What does a forward deployed engineer do?", a: "Sits with the customer. I'm on the weekly call with the stakeholders, then I build the agent and the product around it, from an empty repository to beta." },
    { q: "Where does the model go in your designs?", a: "Inside a structure. Planners, gates and deterministic checks carry what must be exact; the model does the part only a model can." },
    { q: "How do you know an agent works?", a: "Evals: deterministic checks plus model judges on fixed datasets, run whenever a prompt or model changes." },
    { q: "How fast is a first version?", a: "A working POC within two weeks; a functional application by month 2–2.5; a beta with users you choose by month 4–5." },
    { q: "Which domains?", a: "Ten, including clinical communications, insurance, generative media, CAD and manufacturing, sales, grants, equity research and biopharma." },
    { q: "Can I see the client work?", a: "The cases describe decisions, not clients. Names stay out." },
    { q: "Where are you based?", a: `Ankleshwar, Gujarat, India. Reach me at ${SITE.email}.` },
  ],
};

export const FOOTER = {
  wordmark: "Bhumil Modi",
  line: "Send word.",
  links: [
    { label: SITE.email, href: `mailto:${SITE.email}` },
    { label: "LinkedIn", href: SITE.linkedin, external: true },
    { label: "GitHub", href: SITE.github, external: true },
    { label: "Resume (PDF)", href: SITE.resume, external: true },
  ] as Link[],
  meta: [SITE.location, "© 2026"] as const,
};
