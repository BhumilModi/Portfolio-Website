"use client";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { quest } from "@/lib/quest";
import { SOUND } from "@/lib/content";

export type Realm = "olympus" | "underworld";
const SRC: Record<Realm, string> = { olympus: "/audio/olympus.mp3", underworld: "/audio/underworld.mp3" };
const REALMS: Realm[] = ["olympus", "underworld"];
const LEVEL = 0.35; // calibration knob: music level, 0–1
const FADE_IN_S = 1;

// ponytail: one module-level engine, no context provider — there is exactly one soundtrack.
// Fades run through GainNodes because iOS Safari ignores HTMLMediaElement.volume.
type Track = { el: HTMLAudioElement; gain: GainNode };
let engine: { ctx: AudioContext; tracks: Record<Realm, Track> } | null = null;
let realm: Realm = "olympus";
let state = { on: false, available: true };
const listeners = new Set<() => void>();
const emit = (next: Partial<typeof state>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

function build() {
  const ctx = new AudioContext();
  const make = (r: Realm): Track => {
    const el = new Audio(SRC[r]);
    el.loop = true;
    el.preload = "auto";
    el.addEventListener("error", () => emit({ on: false, available: false }));
    const gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
    return { el, gain };
  };
  return { ctx, tracks: { olympus: make("olympus"), underworld: make("underworld") } };
}

function ramp(g: GainNode, to: number, seconds: number) {
  const now = g.context.currentTime;
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(g.gain.value, now);
  g.gain.linearRampToValueAtTime(to, now + seconds);
}

/** Must run inside a user gesture the first time: it creates the AudioContext. */
export function setSound(on: boolean) {
  if (!state.available) return;
  emit({ on });
  quest.setSound(on);
  if (on) {
    engine ??= build();
    void engine.ctx.resume();
    const t = engine.tracks[realm];
    t.el.play().catch(() => emit({ on: false }));
    ramp(t.gain, LEVEL, FADE_IN_S);
  } else if (engine) {
    for (const r of REALMS) {
      const t = engine.tracks[r];
      ramp(t.gain, 0, 0.4);
      setTimeout(() => {
        if (!state.on) t.el.pause();
      }, 450);
    }
  }
}

/** Crossfades to the other realm's track. Always records the realm, so turning sound on later picks the right one. */
export function setRealm(next: Realm, seconds = 2.5) {
  if (next === realm) return;
  const prev = realm;
  realm = next;
  if (!engine || !state.on) return;
  const a = engine.tracks[prev];
  const b = engine.tracks[next];
  b.el.play().catch(() => {});
  ramp(b.gain, LEVEL, seconds);
  ramp(a.gain, 0, seconds);
  setTimeout(() => {
    if (realm !== prev) a.el.pause();
  }, seconds * 1000 + 50);
}

/** A short plucked blip for a trial hit. */
export function playHit() {
  if (!engine || !state.on) return;
  const { ctx } = engine;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
  g.gain.setValueAtTime(0.15, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.13);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const SERVER = { on: false, available: true };
export const useSound = () => useSyncExternalStore(subscribe, () => state, () => SERVER);

/** Matches the track to the route, pauses with the tab, and honours a saved "on" at the visitor's first gesture. */
export function SoundSync() {
  const pathname = usePathname();
  useEffect(() => {
    setRealm(pathname.startsWith("/underworld") ? "underworld" : "olympus", 1.5);
  }, [pathname]);
  useEffect(() => {
    const onVisibility = () => {
      if (!engine) return;
      if (document.hidden) void engine.ctx.suspend();
      else if (state.on) void engine.ctx.resume();
    };
    // Browsers block autoplay, so a saved "on" resumes at the first gesture — unless that gesture is the toggle itself.
    const resume = (e: Event) => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      if ((e.target as Element | null)?.closest?.("[data-sound-toggle]")) return;
      if (quest.get().sound && !state.on) setSound(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, []);
  return null;
}

export function SoundToggle({ className = "" }: { className?: string }) {
  const { on, available } = useSound();
  if (!available) return null;
  return (
    <button
      type="button"
      data-sound-toggle
      aria-label={SOUND.label}
      aria-pressed={on}
      onClick={() => setSound(!on)}
      className={`font-mono text-xs uppercase tracking-[0.16em] transition-colors duration-150 active:scale-[0.97] ${className}`}
    >
      {on ? SOUND.on : SOUND.off}
    </button>
  );
}
