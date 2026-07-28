// ─── UNFILLED PLACEHOLDERS ──────────────────────────────────────────────────
// These two are placeholders in the design and stay placeholders here. Do not
// invent copy for them — this is a real person's portfolio and either would be
// a false claim about their work. Render both with the design's dashed
// placeholder styling until Bhumil supplies the real text.


// UNFILLED — one dated paragraph on this month's work.
export const NOW_PARAGRAPH =
  "Currently building — one short paragraph on this month's work, updated monthly.";

// ─── desktop backdrop (design lines 43–64) ─────────────────────────────────
export const BACKDROP = {
  monogram: "BM",
  eyebrow: "bhumil modi · forward deployed ai engineer · ankleshwar, in",
  headline: "Most recently in clinical systems, where wrong output reaches patients.",
  stats: [
    "~ uptime ......... 10+ greenfield engagements",
    "~ mounted ........ /clients (nda) · /open-source ★503",
    "~ pipeline ....... fact → plan → write → verify",
    "~ fallback ....... override → G2P → LLM",
  ],
  note: {
    label: "note to self",
    body: "Put the model where determinism runs out — not where the work starts.",
  },
  hints: [
    "click the dock to open a file",
    "drag by the title bar · resize from the corner",
    "cases 01 + 02 are runnable — open Case files",
  ],
} as const;

// ─── menu bar + window chrome (design lines 67–85, title bars) ─────────────
export const MENU = {
  brand: "Bhumil Modi",
  tabs: [
    { id: "readme", label: "Start here" },
    { id: "oss", label: "Open source" },
    { id: "cases", label: "Case files" },
    { id: "how", label: "Principles" },
    { id: "contact", label: "Contact" },
  ],
} as const;

/** Title-bar strings. `cases` is dynamic — see `caseWindowTitle`. */
export const WINDOW_TITLES = {
  readme: "Start here — Bhumil Modi, FDE",
  oss: "Open source — 2 public agent platforms",
  cases: "Case files — 4 engineering decisions",
  how: "How I work — six principles & toolkit",
  contact: "Contact — forward-deployed work",
} as const;

/** Dock labels, in WINDOWS order (design lines 495–559). */
export const DOCK_LABELS = {
  readme: "Start here",
  oss: "Open source",
  cases: "Case files",
  how: "Principles",
  contact: "Contact",
} as const;

// ─── Start here (design lines 93–124) ──────────────────────────────────────
export const START = {
  badge: "Forward Deployed AI Engineer",
  h1: "I take AI products from an empty repository to production.",
  lede:
    "On weekly calls with your stakeholders — writing the pipelines, the services, the frontend, and the deploys myself.",
  pitchLead: "Most recently in clinical systems,",
  pitchHighlight: "where wrong output reaches patients.",
  stats: [
    { value: "503+", caption: "GitHub stars, OSS agent platforms" },
    { value: "10+", caption: "greenfield engagements, zero to release" },
    { value: "6", caption: "products led end to end" },
    { value: "4", caption: "engineers led, 2–5 person pods" },
  ],
  ndaNote:
    "Client engagements are under NDA. Architecture and decisions are in the case files; names omitted.",
  ctaPrimary: "Run the clinical pipeline →",
  ctaSecondary: "Get in touch",
} as const;

// ─── Open source (design lines 135–160) ────────────────────────────────────
export const OSS = {
  intro:
    "I led open-source UI development on TheAgentic's public agent platforms — starred over 500 times, forked more than 90.",
  repos: [
    {
      name: "CortexON",
      url: "https://github.com/TheAgenticAI/CortexON",
      badge: "★ 453 · 77 forks",
      badgeHighlight: true,
      description: "Open-source generalized AI agent for everyday task automation.",
      contribution: "Led the open-source UI development for the platform. Python.",
    },
    {
      name: "TheAgenticBench",
      url: "https://github.com/TheAgenticAI/TheAgenticBench",
      badge: "★ 50 · 15 forks",
      badgeHighlight: false,
      description:
        "Digital Worker framework for agent-driven research. Led the open-source UI for the benchmarking suite.",
      contribution: null,
    },
  ],
} as const;

// ─── Case files list (design lines 177–215) ────────────────────────────────
export const CASES = {
  intro:
    "Four engineering decisions from client engagements. The clients are confidential; the architecture and the reasoning are mine to describe. Two of them you can run yourself.",
  openLabel: "open →",
  backLabel: "← Case files",
  list: [
    {
      id: 1,
      number: "01",
      meta: "clinical communications · llm orchestration · python",
      title: "Shipping generative output where wrong reaches patients",
      summary:
        "A fact → plan → write → verify orchestrator with graduated human fallback. Runnable.",
    },
    {
      id: 2,
      number: "02",
      meta: "text-to-speech · multilingual · espeak-ng, ipa",
      title: "Why the model goes last",
      summary: "A deterministic override → G2P → LLM precedence chain. Runnable.",
    },
    {
      id: 3,
      number: "03",
      meta: "production data · live clinical system · python cli",
      title: "Honest failure states",
      summary: "A backfill CLI that tells you when it broke, and what it left behind.",
    },
    {
      id: 4,
      number: "04",
      meta: "llm infrastructure · provider abstraction",
      title: "A migration that deleted code",
      summary:
        "A provider abstraction that removed 480 lines net instead of adding indirection.",
    },
  ],
} as const;

/** Breadcrumb strings (design lines 770–775). */
export const CASE_TITLES: Record<number, string> = {
  1: "Case 01 — Shipping generative output where wrong reaches patients",
  2: "Case 02 — Why the model goes last",
  3: "Case 03 — Honest failure states",
  4: "Case 04 — A migration that deleted code",
};

/** Design line 792. */
export function caseWindowTitle(caseId: number | null): string {
  return caseId ? "Case files — case 0" + caseId : WINDOW_TITLES.cases;
}

/** Design line 793. */
export function caseCrumb(caseId: number | null): string {
  return caseId ? CASE_TITLES[caseId] : "4 files · 2 runnable";
}

// ─── Case 01 (design lines 218–294) ────────────────────────────────────────
export const CASE01 = {
  h2: "Shipping generative output into a system where wrong reaches patients",
  situationLabel: "situation",
  situation:
    "A US clinical-communications platform needed patient-facing content at volume. I built the pipeline that produced it, and the layer that decided whether it was allowed to ship.",
  constraintLabel: "constraint",
  constraint:
    "Content reaching a patient cannot be approximately correct. There's no acceptable error rate — so the problem was never generation quality, it was knowing reliably when generation had failed.",
  runLabel: "run the orchestrator",
  buttons: {
    clean: "▶ grounded draft",
    risky: "▶ hallucinated dosage",
    reset: "reset",
  },
  stages: [
    { number: "01", name: "fact", note: "ground truth" },
    { number: "02", name: "plan", note: "focus gated" },
    { number: "03", name: "write", note: "deduped" },
    { number: "04", name: "verify", note: "gate before ship" },
  ],
  forkLabel: "the fork",
  fork: [
    "Two obvious designs, both wrong. Full automation ships errors at the rate the model fails, which is not zero. Routing everything to a human works and doesn't scale past a pilot.",
    "So: a graduated fallback. Automated verification first; on failure a retry with structured feedback describing what specifically failed; if that fails, segment-level human review through a reviewer-facing retry UI — a human intervenes at the failing segment rather than rejecting the document.",
  ],
  rejectedLabel: "what I rejected",
  rejected:
    "A single-pass generate-then-check design. It couldn't localise which claim failed, so every failure escalated the whole document. Focus gating keeps the blast radius of a bad generation small enough for a human to act on in seconds.",
  quote:
    "Verification isn't a test suite. It's a product surface — somebody has to see the failure and be able to fix it.",
} as const;

// ─── Case 01 simulation scripts (design lines 688–713) ─────────────────────
export type SimStep = {
  /** ms to wait *before* applying this step, exactly as the design accumulates. */
  delay: number;
  stage?: number;
  log?: readonly string[];
  status?: string;
};

export const SIM_IDLE_LOG = ["› idle — pick a run above"] as const;
export const SIM_IDLE_STATUS = "idle";
export const SIM_RUNNING_STATUS = "running";

const SIM_COMMON: readonly SimStep[] = [
  { delay: 200, stage: 0, log: ["› fact — 14 claims grounded against the record"] },
  { delay: 700, stage: 1, log: ["› plan — focus gate: episode #4812 only"] },
  { delay: 700, stage: 2, log: ["› write — 6 segments · 2 duplicate claims dropped"] },
  { delay: 700, stage: 3, log: ["› verify — checking every claim against facts…"] },
];

export const SIM_SCRIPTS: Record<"clean" | "risky", readonly SimStep[]> = {
  clean: [
    ...SIM_COMMON,
    { delay: 800, log: ["✓ verify passed — shipped"], status: "shipped" },
  ],
  risky: [
    ...SIM_COMMON,
    { delay: 800, log: ["✗ verify failed — segment 3: dosage not in facts"] },
    { delay: 600, log: ["↻ retry with structured feedback (not a blind regenerate)"] },
    { delay: 900, log: ["✗ retry failed — same claim unsupported"] },
    {
      delay: 600,
      log: [
        "⚑ escalated: segment 3 → human reviewer, retry UI",
        "  5 of 6 segments shipped · blast radius = 1 segment",
      ],
      status: "human review",
    },
  ],
};

// ─── Case 02 (design lines 297–351) ────────────────────────────────────────
export const CASE02 = {
  meta: "case 02 · text-to-speech · multilingual · espeak-ng, IPA",
  h2: "Why the model goes last",
  situationLabel: "situation",
  situation:
    "A text-to-speech system needed equal pronunciation quality across English, Spanish and Portuguese — not English-first with the others degraded.",
  constraintLabel: "constraint",
  constraint:
    "Pronunciation has to be reproducible. The same word cannot be said two ways on two runs, and audio defects are unreviewable at scale — nobody listens to every clip.",
  builtLabel: "what I built",
  built:
    "espeak-ng grapheme-to-phoneme conversion into IPA, an ARPABET→IPA normalisation layer, and a three-tier precedence chain. Try it on the right.",
  forkLabel: "the fork",
  forkLead: "The obvious 2026 answer is to ask a model. Here the model is the last resort, behind a human override and a deterministic engine. A model right 97% of the time is wrong ",
  forkEmphasis: "differently every run",
  forkTail:
    "; a deterministic engine right 90% of the time is strictly better, because its 10% is a finite list you fix once with an override.",
  quote: "Put the model where determinism runs out — not where the work starts.",
  resolverLabel: "resolve a word",
  inputLabel: "input",
  resolvedLabel: "resolved",
  resolvingText: "resolving…",
  emptyText: "—",
  words: [
    { key: "ibiza", label: "Ibiza" },
    { key: "photo", label: "photograph" },
    { key: "cortexon", label: "CortexON" },
  ],
  tiers: [
    {
      eyebrow: "tier 1 · authoritative",
      name: "override",
      defaultNote: "human-curated IPA",
    },
    {
      eyebrow: "tier 2 · deterministic",
      name: "G2P",
      defaultNote: "espeak-ng · ARPABET→IPA",
    },
    {
      eyebrow: "tier 3 · last resort",
      name: "LLM",
      defaultNote: "non-deterministic · logged for override",
    },
  ],
  tierGaps: ["↓ no entry", "↓ out of coverage"],
} as const;

/** Design lines 566–570, verbatim. */
export type PronKey = "ibiza" | "photo" | "cortexon";
export const PRON: Record<
  PronKey,
  { word: string; tier: number; result: string; notes: readonly [string, string, string] }
> = {
  ibiza: {
    word: "Ibiza",
    tier: 0,
    result: "/ɪˈβiθa/",
    notes: ["hit — curated entry (es-ES)", "not reached", "not reached"],
  },
  photo: {
    word: "photograph",
    tier: 1,
    result: "/ˈfoʊ.tə.ɡɹæf/",
    notes: ["miss — no override", "hit — espeak-ng, reproducible", "not reached"],
  },
  cortexon: {
    word: "CortexON",
    tier: 2,
    result: "/ˈkɔɹ.tɛks.ɒn/ ⚠ logged",
    notes: [
      "miss — no override",
      "miss — out of lexicon",
      "guess returned · queued for an override",
    ],
  },
};

// ─── Case 03 (design lines 353–379) ────────────────────────────────────────
export type TerminalLine = {
  text: string;
  color?: string;
  opacity?: number;
  bold?: boolean;
};

export const CASE03 = {
  meta: "case 03 · production data · live clinical system",
  h2: "Honest failure states",
  body:
    "Backfilling and rewriting records in a clinical system that was live and in use: no downtime, no partial writes, no silent corruption. A backfill CLI with dry-run previews of the real before/after state, an atomic two-phase apply, and idempotent rewrites so re-running is always safe.",
  terminals: [
    {
      label: "the old tool",
      inverted: true,
      lines: [
        { text: "$ backfill --apply" },
        { text: "writing 1,204 records…", opacity: 0.75 },
        { text: "✓ done — success", color: "#7FD18B" },
        { text: "(311 silently unwritten)", opacity: 0.5 },
      ] as readonly TerminalLine[],
    },
    {
      label: "mine",
      inverted: false,
      lines: [
        { text: "$ backfill --apply" },
        { text: "phase 1/2 staged 1,204", opacity: 0.75 },
        { text: "✗ aborted at 893 — rolled back", color: "#B0300A", bold: true },
        { text: "nothing written · safe to re-run", opacity: 0.7 },
      ] as readonly TerminalLine[],
    },
  ],
  quote:
    "False success costs more than failure. A tool that reports a lie is worse than one that crashes.",
} as const;

// ─── Case 04 (design lines 381–396) ────────────────────────────────────────
export const CASE04 = {
  meta: "case 04 · llm infrastructure",
  h2: "A migration that deleted code",
  body:
    "Migrated a set of LLM services to Claude via OpenRouter behind a provider abstraction — the change removed 480 lines net. Most abstractions are a tax; this one collapsed provider-specific handling that was already duplicated across services.",
  metric: { value: "−480", caption: "LINES NET" },
  quote:
    "A good abstraction removes more than it adds. If it only adds indirection, it isn't paying rent.",
} as const;

// ─── Principles (design lines 408–464) ─────────────────────────────────────
export const PRINCIPLES = {
  intro:
    "Six things I've come to believe from shipping AI systems where the output matters.",
  items: [
    {
      heading: "Put the model where determinism runs out.",
      body: "Non-determinism is a cost, not a feature. If a deterministic engine, a lookup table or a human override can answer the question, use that and keep the model for what nothing else covers. A model that's usually right is harder to operate than a rule that's sometimes wrong, because the rule fails the same way twice.",
    },
    {
      heading: "Verification is a product surface, not a test.",
      body: "Every AI system that matters eventually needs a human to correct it. Treat that as an afterthought and the human gets a log file and a rejected document. Design the intervention path as part of the product and failures become cheap.",
    },
    {
      heading: "False success costs more than failure.",
      body: "A tool that crashes tells you the truth. A tool that reports success on a partial failure poisons every number downstream of it, and the cost isn't the bug — it's the audit you now have to run to work out what's real.",
    },
    {
      heading: "A good abstraction removes code.",
      body: "If a layer only adds indirection in exchange for optionality you might use later, it isn't paying rent. The abstractions worth building collapse duplication you already have.",
    },
    {
      heading: "Embedded beats specced.",
      body: "Ten greenfield engagements have made me confident about this one. A weekly call with the person who owns the problem beats any requirements document, because the requirement was never what they wrote down — it was the constraint they didn't think to mention.",
    },
    {
      heading: "Dry-run against real state.",
      body: "A preview built on mocked data is a preview of nothing. If the tool is going to touch production, its rehearsal has to read production.",
    },
  ],
  toolkitLabel: "toolkit",
  toolkit: [
    {
      tier: "daily",
      // the daily-tier chips carry the 2px offset shadow; the others are flat
      raised: true,
      dimmed: false,
      chips: ["Python", "TypeScript", "FastAPI", "React", "PostgreSQL", "Docker"],
    },
    {
      tier: "shipped",
      raised: false,
      dimmed: false,
      chips: [
        "LLM orchestration",
        "Claude / OpenRouter",
        "espeak-ng G2P",
        "GitHub Actions",
        "DigitalOcean",
        "Auth0 · SuperTokens",
        "AWS S3 / Cognito",
      ],
    },
    {
      tier: "prior",
      raised: false,
      dimmed: true,
      chips: ["Kotlin / Spring Boot", ".NET", "Material UI"],
    },
  ],
} as const;

// ─── Contact (design lines 475–488) ────────────────────────────────────────
export const CONTACT = {
  h2: "Let's talk",
  body:
    "I'm interested in forward-deployed work on AI systems where output quality is the hard part.",
  email: "bhumilmodi2002@gmail.com",
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/bhumilmodi/" },
    { label: "GitHub", href: "https://github.com/BhumilModi" },
  ],
  nowLabel: "now · july 2026",
  now: NOW_PARAGRAPH,
  footer: "Bhumil Modi · Ankleshwar, Gujarat, India · ",
  resume: { label: "Resume (PDF)", href: "#" },
} as const;
