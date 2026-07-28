"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MENU } from "@/lib/content";
import type { DesktopWindows } from "@/hooks/use-desktop";

export type MenuBarProps = {
  w: DesktopWindows;
  /** `HH:MM` from `useClock` — empty until mounted. */
  clock: string;
};

/** Design lines 67–85. */
export function MenuBar({ w, clock }: MenuBarProps) {
  return (
    <div className="absolute inset-x-0 top-0 z-[500] flex h-[42px] items-center justify-between gap-[18px] border-b-2 border-ink bg-window px-3.5 font-mono text-xs">
      <div className="flex min-w-0 flex-auto items-center gap-3">
        <span className="flex items-center gap-2 font-bold whitespace-nowrap">
          <span className="inline-block size-3 border-2 border-ink bg-orange" />
          {MENU.brand}
        </span>
        {/* the design's 2px spacer span (line 73) */}
        <Separator
          orientation="vertical"
          className="flex-none bg-[#16130F22]"
          style={{ width: 2, height: 18 }}
        />
        <div className="flex min-w-0 flex-auto items-center gap-[5px] overflow-x-auto pb-px">
          {MENU.tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="brutalTab"
              data-active={w[tab.id].tabActive}
              aria-pressed={w[tab.id].tabActive}
              onClick={w[tab.id].onToggle}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-none items-center gap-3 whitespace-nowrap">
        <span className="opacity-50">{clock}</span>
      </div>
    </div>
  );
}
