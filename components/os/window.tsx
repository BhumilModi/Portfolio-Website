"use client";

import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DesktopWindow } from "@/hooks/use-desktop";
import type { WindowId } from "@/lib/windows";

/** Title-bar treatment. `orange` is readme (line 89), `inverted` is contact —
 *  ink body, light bar, light bottom border (lines 470–471) — `light` is
 *  everything else (lines 131, 167, 404). */
export type WindowChrome = "orange" | "light" | "inverted";

export type WindowProps = {
  id: WindowId;
  title: string;
  chrome: WindowChrome;
  children: ReactNode;
} & DesktopWindow;

const CHROME: Record<WindowChrome, { root: string; bar: string }> = {
  orange: { root: "bg-window text-ink", bar: "border-ink bg-orange text-window" },
  light: { root: "bg-window text-ink", bar: "border-ink bg-window text-ink" },
  inverted: { root: "bg-ink text-window", bar: "border-window bg-window text-ink" },
};

/** Generic window chrome — design lines 88–92 (frame + title bar) and 125–126
 *  (resize grip). The body is a clipping `flex-col` slot — children are written
 *  as `flex-1 min-h-0` scroll regions and need a flex parent to size against —
 *  but padding and scrolling stay with the children: window contents
 *  differ enough (grid vs block vs the cases breadcrumb bar sitting outside the
 *  scroll region) that padding and scrolling belong to the children. */
export function Window({
  id,
  title,
  chrome,
  children,
  x,
  y,
  z,
  w,
  h,
  maxH,
  shadow,
  onClose,
  onFocus,
  onDrag,
  onResize,
}: WindowProps) {
  const skin = CHROME[chrome];
  return (
    <TooltipProvider delayDuration={400}>
      <section
        aria-label={title}
        data-window={id}
        onPointerDown={onFocus}
        className={`absolute flex max-w-[calc(100vw-92px)] flex-col border-[3px] border-ink md:max-w-[calc(100vw-206px)] ${skin.root}`}
        style={{
          left: x,
          top: y,
          zIndex: z,
          width: w,
          height: h,
          maxHeight: maxH,
          boxShadow: shadow,
          animation: "winIn .28s ease-out both",
        }}
      >
        <div
          onPointerDown={onDrag}
          style={{ touchAction: "none" }}
          className={`flex cursor-grab items-center justify-between gap-3 border-b-2 px-3 py-2 font-mono text-[11.5px] tracking-[0.08em] uppercase ${skin.bar}`}
        >
          <span>{title}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`Close ${title}`}
                onClick={onClose}
                // aiming for the × must not also start a window drag
                onPointerDown={(e) => e.stopPropagation()}
                className="grid size-5 flex-none cursor-pointer place-items-center border-2 border-current font-mono text-[13px] leading-none font-bold outline-none hover:border-orange hover:bg-orange hover:text-window focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
              >
                ×
              </button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div
              role="separator"
              aria-label="Resize window"
              onPointerDown={onResize}
              style={{ touchAction: "none" }}
              className="absolute right-0 bottom-0 grid size-5 cursor-nwse-resize place-items-center border-2 border-ink bg-yellow font-mono text-[10px] leading-none text-ink"
            >
              ⇲
            </div>
          </TooltipTrigger>
          <TooltipContent>Resize</TooltipContent>
        </Tooltip>
      </section>
    </TooltipProvider>
  );
}
