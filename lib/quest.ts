// Side-quest progress (spec §2): obols found, the crossing, the trial, the sound preference.
// Storage is optional — every access is guarded, and a failure leaves a working in-memory store.
export type ObolId = "approach" | "record" | "footer";
export const OBOLS: readonly ObolId[] = ["approach", "record", "footer"];

export type Best = { score: number; hits: number; accuracy: number; reactionMs: number };
export type QuestState = { obols: ObolId[]; crossed: boolean; tried: boolean; best: Best | null; sound: boolean };
export type KeyValue = Pick<Storage, "getItem" | "setItem">;

export const INITIAL: QuestState = { obols: [], crossed: false, tried: false, best: null, sound: false };
const KEY = "bm.quest.v1";

const isBest = (b: unknown): b is Best =>
  typeof b === "object" &&
  b !== null &&
  (["score", "hits", "accuracy", "reactionMs"] as const).every((k) => Number.isFinite((b as Record<string, unknown>)[k]));

export function parse(raw: string | null): QuestState {
  if (!raw) return INITIAL;
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    const obols = Array.isArray(v.obols) ? v.obols : [];
    return {
      obols: OBOLS.filter((id) => obols.includes(id)),
      crossed: v.crossed === true,
      tried: v.tried === true,
      best: isBest(v.best) ? v.best : null,
      sound: v.sound === true,
    };
  } catch {
    return INITIAL;
  }
}

export function createQuest(storage: KeyValue | null) {
  let state = INITIAL;
  try {
    state = parse(storage?.getItem(KEY) ?? null);
  } catch {
    // blocked storage: stay in memory
  }
  const listeners = new Set<() => void>();
  const set = (next: QuestState) => {
    state = next;
    try {
      storage?.setItem(KEY, JSON.stringify(state));
    } catch {
      // quota or blocked: memory still holds it
    }
    listeners.forEach((l) => l());
  };
  return {
    get: () => state,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    pick(id: ObolId) {
      if (!state.obols.includes(id)) set({ ...state, obols: OBOLS.filter((o) => o === id || state.obols.includes(o)) });
    },
    cross() {
      if (!state.crossed) set({ ...state, crossed: true });
    },
    /** Records a finished run. Returns true when it beats the stored best. */
    record(run: Best): boolean {
      const better = !state.best || run.score > state.best.score;
      set({ ...state, tried: true, best: better ? run : state.best });
      return better;
    },
    skipTrial() {
      if (!state.tried) set({ ...state, tried: true });
    },
    setSound(on: boolean) {
      if (state.sound !== on) set({ ...state, sound: on });
    },
  };
}

export type Quest = ReturnType<typeof createQuest>;
export const paid = (s: QuestState) => s.obols.length === OBOLS.length;

function browserStorage(): KeyValue | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const quest = createQuest(browserStorage());
