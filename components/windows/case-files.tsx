"use client";

import { Case01 } from "@/components/cases/case-01";
import { Case02 } from "@/components/cases/case-02";
import { Case03 } from "@/components/cases/case-03";
import { Case04 } from "@/components/cases/case-04";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CASES, caseCrumb } from "@/lib/content";

/** Cases 03 and 04 lift to an ink shadow instead of orange (design lines 197, 206). */
const INK_HOVER = new Set([3, 4]);

export function CaseFiles({
  caseId,
  onOpenCase,
  onCloseCase,
}: {
  caseId: number | null;
  onOpenCase: (n: number) => void;
  onCloseCase: () => void;
}) {
  const onList = caseId === null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* fixed breadcrumb bar — outside the scroll region, unlike every other
          window (design lines 171–174) */}
      <div className="flex items-center gap-2.5 border-b-2 border-ink bg-paper px-3 py-[7px] font-mono text-[11px]">
        <Button
          variant="brutalTab"
          data-active={!onList}
          disabled={onList}
          aria-disabled={onList}
          onClick={onCloseCase}
          className="px-[9px] py-1 text-[11px] shadow-none hover:shadow-none disabled:opacity-40"
        >
          {CASES.backLabel}
        </Button>
        <span className="min-w-0 truncate opacity-[0.55]">
          {caseCrumb(caseId)}
        </span>
      </div>

      {/* each case owns its own scroll region: the padding and the ground
          colour differ (case 01 inverts to ink) */}
      {onList ? (
        <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
          <div className="grid max-w-[940px] auto-rows-min content-start gap-[13px] p-5">
            <p className="m-0 mb-0.5 max-w-[68ch] text-[0.97rem] leading-[1.55] opacity-80">
              {CASES.intro}
            </p>
            {CASES.list.map((row) => (
              <Button
                key={row.id}
                variant="brutalCard"
                data-hover-shadow={INK_HOVER.has(row.id) ? "ink" : undefined}
                onClick={() => onOpenCase(row.id)}
                className="grid-cols-[42px_minmax(0,1fr)_auto] gap-[15px]"
              >
                <span className="grid h-[42px] w-[38px] place-items-center border-2 border-ink bg-window font-mono text-[13px] font-bold">
                  {row.number}
                </span>
                <span className="grid min-w-0 gap-1">
                  <span className="font-mono text-[10px] tracking-[0.12em] uppercase opacity-[0.55]">
                    {row.meta}
                  </span>
                  <span className="text-[1.1rem] leading-[1.15] font-bold tracking-[-0.025em] whitespace-normal">
                    {row.title}
                  </span>
                  <span className="text-[0.9rem] leading-[1.45] whitespace-normal opacity-[0.72]">
                    {row.summary}
                  </span>
                </span>
                <span className="font-mono text-xs">{CASES.openLabel}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      ) : caseId === 1 ? (
        <Case01 />
      ) : caseId === 2 ? (
        <Case02 />
      ) : caseId === 3 ? (
        <Case03 />
      ) : (
        <Case04 />
      )}
    </div>
  );
}
