"use client";

import { DockIcon } from "@/components/os/dock-icons";
import { DOCK_LABELS } from "@/lib/content";
import { WINDOW_ORDER } from "@/lib/windows";
import type { DesktopWindows } from "@/hooks/use-desktop";

export type DockProps = {
  w: DesktopWindows;
  /** `useDesktop().clearHover` — the design's `dockLeave` (line 786). */
  clearHover: () => void;
};

/** Design lines 493–561.
 *
 *  The mobile narrowing (64px dock, no labels) is done with `md:` variants
 *  rather than the `isMobile` flag: the flag is false on the first paint
 *  (SSR falls back to vw 1280) so a phone would flash the wide dock before
 *  hydration. Tailwind's `md` and `MOBILE_BREAKPOINT` are both 768px. */
export function Dock({ w, clearHover }: DockProps) {
  return (
    <div className="pointer-events-none absolute top-[46px] bottom-3 left-0 z-[300] flex w-[78px] items-center pl-1.5 md:w-[150px] md:pl-3.5">
      <div
        onPointerLeave={clearHover}
        className="pointer-events-auto grid w-[64px] auto-rows-min justify-items-center gap-[clamp(2px,0.7vh,7px)] border-[3px] border-ink bg-window px-1.5 py-[9px] shadow-[7px_7px_0_var(--color-ink)] md:w-[118px]"
      >
        {WINDOW_ORDER.map((id) => {
          const win = w[id];
          return (
            <button
              key={id}
              type="button"
              aria-label={DOCK_LABELS[id]}
              aria-pressed={win.open}
              onClick={win.onOpen}
              onPointerEnter={win.onEnter}
              className="grid w-full cursor-pointer justify-items-center gap-0.5 border-none bg-transparent p-0 text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
            >
              <span
                className="flex items-center justify-center"
                style={{
                  height: win.slotH,
                  transform: `scale(${win.scale})`,
                  transformOrigin: "center",
                  transition: "transform .18s cubic-bezier(.2,.9,.2,1)",
                }}
              >
                <DockIcon id={id} />
              </span>
              <span
                className="flex items-center gap-1 font-mono leading-[1.15] whitespace-nowrap"
                style={{
                  fontSize: "clamp(9.5px, 1.2vh, 10.5px)",
                  opacity: win.labelOpacity,
                  transition: "opacity .18s ease",
                }}
              >
                <span
                  className="block size-1 flex-none"
                  style={{ background: win.dotVisible ? "#E33F00" : "transparent" }}
                />
                {/* the label text goes away on narrow screens; the icon and the
                    open-state dot stay */}
                <span className="max-md:hidden">{DOCK_LABELS[id]}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
