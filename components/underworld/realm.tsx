"use client";
import { paid } from "@/lib/quest";
import { cross } from "@/lib/scene";
import { UNDERWORLD } from "@/lib/content";
import { useHydrated, useQuest } from "@/components/quest/use-quest";
import { SoundToggle } from "@/components/quest/sound";
import { StyxBackdrop } from "@/components/experience/styx";
import Gate from "./gate";
import Arrival from "./arrival";

export default function Realm() {
  const hydrated = useHydrated();
  const s = useQuest();
  return (
    <div className="realm-underworld min-h-dvh">
      <StyxBackdrop />
      {/* z-30: the fixed WebGL canvas sits at z-20, and realm content must stay above it. */}
      <main className="relative z-30">
        {!hydrated ? null : !paid(s) ? (
          <Gate count={s.obols.length} />
        ) : (
          <>
            <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-4 md:px-8">
              <span className="font-display text-3xl uppercase leading-none tracking-wide">{UNDERWORLD.brand}</span>
              <div className="flex items-center gap-5">
                <SoundToggle className="text-asphodel/80 hover:text-asphodel" />
                <button
                  type="button"
                  onClick={() => cross("up")}
                  className="border border-asphodel/60 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] transition-colors duration-150 hover:bg-asphodel hover:text-abyss active:scale-[0.97]"
                >
                  {UNDERWORLD.ascend}
                </button>
              </div>
            </header>
            <Arrival />
            <footer className="mx-auto flex w-full max-w-[1280px] flex-wrap justify-between gap-x-6 gap-y-2 px-4 pb-8 pt-16 font-mono text-xs uppercase tracking-[0.14em] text-asphodel/70 md:px-8">
              {UNDERWORLD.credit.map((c) => <span key={c}>{c}</span>)}
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
