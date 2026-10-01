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
  url: "https://bhumil-modi.vercel.app",
  email: "bhumilmodi2002@gmail.com",
  location: "Ankleshwar, Gujarat, India",
  resume: "/Bhumil-Modi-Resume-FDE.pdf",
  linkedin: "https://www.linkedin.com/in/bhumil-modi-430148190",
  github: "https://github.com/BhumilModi",
  description:
    "Forward Deployed AI Engineer. I deploy agentic systems inside the customer — working POC in two weeks, live beta inside five months.",
};

export const ONBOARDING = {
  whisperIn: "From the customer's first call —",
  name: "Bhumil Modi",
  role: "Forward Deployed AI Engineer",
  whisperOut: "— to agents in production.",
  skip: "Enter ↵",
  scroll: "Scroll",
};

export const NAV = {
  brand: "BM",
  links: [
    { label: "Approach", href: "#approach" },
    { label: "Work", href: "#work" },
    { label: "Cases", href: "#cases" },
    { label: "Record", href: "#record" },
    { label: "Hire", href: "#together" },
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
  cta: "View on GitHub ↗",
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

export const TOGETHER = {
  label: "Working together",
  title: "Bring me in on the first call.",
  facts: [
    { k: "Role", v: SITE.role },
    { k: "Based", v: "Ankleshwar, India · IST (UTC+5:30)" },
    { k: "Works", v: "Remote, alongside your stakeholders" },
    { k: "First version", v: "A working POC within two weeks" },
    { k: "Domains", v: "Ten so far, from clinical to CAD" },
  ],
  actions: [
    { label: "Get in touch", href: `mailto:${SITE.email}` },
    { label: "Resume ↓", href: SITE.resume, external: true },
  ] as Link[],
};

export const FOOTER = {
  wordmark: "Bhumil Modi",
  line: "Send word.",
  columns: [
    { title: "Contact", links: [{ label: SITE.email, href: `mailto:${SITE.email}` }] },
    { title: "Elsewhere", links: [{ label: "LinkedIn", href: SITE.linkedin, external: true }, { label: "GitHub", href: SITE.github, external: true }] },
    { title: "Site", links: NAV.links },
    { title: "Resume", links: [{ label: "Resume (PDF)", href: SITE.resume, external: true }] },
  ] as { title: string; links: Link[] }[],
  meta: [SITE.location, "The ferryman takes coin.", "Art: The Met, Open Access (CC0)", "Music: Kevin MacLeod (incompetech.com), CC BY 3.0", "© 2026"] as const,
};

// ── The Underworld side quest (spec: docs/superpowers/specs/2026-09-26-underworld-side-quest-design.md).
// Not a fact section: the facts-only rule does not apply here.

export const SOUND = { on: "♪ On", off: "♪ Off", label: "Background music" };

export const QUEST = {
  obol: "Obol",
  counter: "◇ Obols",
  pay: "Pay the ferryman →",
  enter: "◆ Underworld",
  console: "ΒΜ — three obols are hidden on this page. The ferryman takes coin.",
};

export const CROSSING = { skip: "Skip ↵", loading: "Opening the Gate" };

// The System (redesign spec §5). Evokes the genre only: no logos, names or exact in-show titles.
export const SYSTEM = {
  tag: "[SYSTEM]",
  entered: "You have entered the Gate.",
  levelUp: "LEVEL UP! A new personal best.",
  arise: "ARISE",
};

export const NOT_FOUND = {
  metaTitle: `Page not found — ${SITE.name}`,
  title: "Lost in the labyrinth.",
  body: "This page isn't on the map. Even Daedalus needed a thread to find his way out.",
  back: "← Back to the entrance",
  code: "404 · Page not found",
};

export const UNDERWORLD = {
  metaTitle: "Ryuma — The Underworld",
  metaDescription: "Off duty. A side quest beneath the portfolio of Bhumil Modi.",
  brand: "Ryuma",
  ascend: "Ascend ↑",
  name: "Ryuma",
  // The broadcast's subtitles, one at a time through the ride (spirit spec §5).
  whispers: ["By day, agents in production.", "By night,", "the one who holds the line."],
  cross: "Cross ↵",
  gate: {
    eyebrow: "The Sanzu",
    title: "No fare, no crossing.",
    body: "The ferryman counts {n} of 3 obols. They are hidden above.",
    back: "← Back to Olympus",
  },
  // No art credit: no figurative art remains on the Underworld (the Met credit stays on Olympus's footer).
  credit: ["Music: Kevin MacLeod (incompetech.com), CC BY 3.0", "© 2026"],
};

export const ARENA = {
  title: "Trial of Ryuma",
  briefing: { heading: "QUEST", lines: ["Clear the Gate.", "Banish the shades.", "Time limit: 30s."] },
  start: "Enter",
  skip: "Skip the trial",
  again: "Run it back",
  arise: "ARISE",
  resultHeading: "GATE CLEARED",
  rank: "Rank",
  you: "You",
  ryuma: "Ryuma",
  held: "Ryuma still holds the Gate.",
  taken: "You took the Gate.",
  yourBest: "Your best",
  stats: { hits: "Hits", accuracy: "Accuracy", reaction: "Avg reaction" },
  canvasLabel: "The Gate. Click or tap the sigils before they fade.",
  // Stand-in for Bhumil's own best until he plays a round. A simulated steady player (~520ms reactions, a stray
  // click 1 time in 12) scores a median of ~13.5k; 5300 was below a casual run, so almost everyone ranked S.
  ryumaBest: 13860,
};

// The Status Window (redesign spec §6). Replaces the old CARD.
export const STATUS = {
  heading: "STATUS",
  locked: "Clear the Gate to unlock.",
  toGate: "To the Gate ↑",
  name: "Ryuma",
  // Bhumil's own read on how he plays: leads the team, anchors it, fills whatever role is open.
  // The numbers are flavor, shaped to that (steady and aware over fast), not measured.
  level: 27,
  job: "Anchor",
  title: "One Who Holds the Line",
  labels: { name: "Name", level: "Level", job: "Job", title: "Title" },
  stats: [
    { k: "STR", v: 58 },
    { k: "AGI", v: 64 },
    { k: "PER", v: 90 },
    { k: "VIT", v: 88 },
    { k: "INT", v: 91 },
  ],
  skills: {
    heading: "SKILLS",
    list: [
      { kind: "Active", name: "Shotcall" },
      { kind: "Passive", name: "Hold the Line" },
      { kind: "Passive", name: "Fill Any Role" },
      { kind: "PvP", name: "Battle royale · FPS" },
    ],
  },
  equipment: { heading: "EQUIPMENT", list: ["PC", "Mobile"] },
  recordHeading: "YOUR RECORD",
  rankLabel: "Rank",
  unranked: "Unranked",
  invite: {
    text: "Ryuma has sent you a party invite.",
    accept: "[ Accept ]",
    href: `mailto:${SITE.email}?subject=${encodeURIComponent("Squad up — from the arena")}`,
  },
};
