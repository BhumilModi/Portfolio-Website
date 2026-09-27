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
// `on` is the preference (on unless muted), so the toggle reads On before the first gesture starts playback.
let state = { on: typeof window !== "undefined" && !quest.get().muted, available: true };
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

function ramp(g: GainNode, to: number, seconds: number, delay = 0) {
  const now = g.context.currentTime;
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(g.gain.value, now);
  if (delay) g.gain.setValueAtTime(g.gain.value, now + delay);
  g.gain.linearRampToValueAtTime(to, now + delay + seconds);
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

/** Hands over to the other realm's track: the old one fades out, then the new one fades in, so the two never play
 * together. Always records the realm, so turning sound on later picks the right one. */
export function setRealm(next: Realm, seconds = 3) {
  if (next === realm) return;
  const prev = realm;
  realm = next;
  if (!engine || !state.on) return;
  const a = engine.tracks[prev];
  const b = engine.tracks[next];
  const out = seconds * 0.4; // calibration knob: share of the handover spent fading out, before the new track enters
  b.el.play().catch(() => {});
  ramp(a.gain, 0, out);
  ramp(b.gain, LEVEL, seconds - out, out);
  setTimeout(() => {
    if (realm !== prev) a.el.pause();
  }, out * 1000 + 50);
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

/** A short synthesized System chime: two sine partials a sixth apart, the upper one entering 60ms late. No audio file. */
export function playChime() {
  if (!engine || !state.on) return;
  const { ctx } = engine;
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, now);
  out.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  out.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  out.connect(ctx.destination);
  for (const [freq, delay] of [[880, 0], [1480, 0.06]] as const) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + delay);
    osc.connect(out);
    osc.start(now + delay);
    osc.stop(now + 0.65);
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const SERVER = { on: false, available: true };
export const useSound = () => useSyncExternalStore(subscribe, () => state, () => SERVER);

/** Matches the track to the route, pauses with the tab, and starts the music at the visitor's first gesture unless muted. */
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
    // Browsers block audible autoplay, so the music starts at the first gesture — unless that gesture is the toggle
    // itself. pointerup, not pointerdown: a touch only grants activation when it lifts. Wheel and Escape never do.
    const resume = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key === "Escape") return;
      window.removeEventListener("pointerup", resume);
      window.removeEventListener("keydown", resume);
      if ((e.target as Element | null)?.closest?.("[data-sound-toggle]")) return;
      if (state.on && !engine) setSound(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerup", resume);
    window.addEventListener("keydown", resume);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerup", resume);
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
