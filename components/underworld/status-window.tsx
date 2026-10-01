"use client";
import type { ReactNode } from "react";
import { ARENA, STATUS, SYSTEM } from "@/lib/content";
import { rankFor } from "@/lib/rank";
import { useQuest } from "@/components/quest/use-quest";
import RyumaMark, { HalftoneWord } from "./ryuma-mark";
import SystemWindow from "./system-window";

const CELLS = 20; // a stat of 100 lights every cell; one cell per 5 points

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-mono text-xs uppercase tracking-[0.18em] text-spirit">{label}</dt>
      <dd className="text-right font-serif text-xl text-bone">{children}</dd>
    </div>
  );
}

/** A stat as a row of halftone dots, the mark's own screen, lit in spirit teal up to its value. */
function Meter({ k, v }: { k: string; v: number }) {
  const lit = Math.round(v / (100 / CELLS));
  return (
    <div className="grid grid-cols-[3rem_auto_2.5rem] items-center justify-start gap-4">
      <dt className="font-mono text-xs tracking-[0.18em] text-spirit">{k}</dt>
      <dd className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: CELLS }, (_, i) => (
          <span key={i} className={`size-[7px] rounded-full ${i < lit ? "bg-spirit" : "bg-spirit/15"}`} />
        ))}
      </dd>
      <dd className="text-right font-display text-2xl leading-none tabular-nums text-bone">{v}</dd>
    </div>
  );
}

function Line({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
      <h3 className="w-44 shrink-0 font-mono text-xs uppercase tracking-[0.22em] text-spirit">
        <span aria-hidden>[ </span>
        {heading}
        <span aria-hidden> ]</span>
      </h3>
      {children}
    </div>
  );
}

/** The spirit dossier (spirit spec §8): Ryuma's sheet, the visitor's record and a party invite. Locked until the Gate is cleared or skipped. */
export default function StatusWindow() {
  const { tried, best } = useQuest();
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SystemWindow id="status" heading={STATUS.heading} className="mx-auto max-w-[52rem] scroll-mt-8">
        {!tried ? (
          <div className="flex flex-col items-start gap-5 py-4">
            <p className="font-mono text-sm uppercase tracking-[0.16em] text-spirit">{STATUS.locked}</p>
            <a href="#trial" className="sys-btn">
              {STATUS.toGate}
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="grid items-center gap-6 sm:grid-cols-[12rem_1fr]">
              <RyumaMark className="w-48 text-bone" pitch={16} />
              <dl className="flex flex-col gap-3">
                <Row label={STATUS.labels.job}>{STATUS.job}</Row>
                <Row label={STATUS.labels.title}>{STATUS.title}</Row>
                <Row label={STATUS.labels.level}>
                  <span className="font-display text-4xl leading-none tabular-nums">{STATUS.level}</span>
                </Row>
              </dl>
            </div>
            <dl className="flex flex-col gap-2.5 border-y border-spirit/20 py-5">
              {STATUS.stats.map((s) => (
                <Meter key={s.k} k={s.k} v={s.v} />
              ))}
            </dl>
            <Line heading={STATUS.skills.heading}>
              <ul className="flex flex-wrap gap-x-8 gap-y-2 font-serif text-lg text-bone">
                {STATUS.skills.list.map((s) => (
                  <li key={s.name}>
                    <span className="font-mono text-xs uppercase tracking-[0.16em] text-bone/60">{s.kind}</span> · {s.name}
                  </li>
                ))}
              </ul>
            </Line>
            <Line heading={STATUS.equipment.heading}>
              <p className="font-serif text-lg text-bone">{STATUS.equipment.list.join(" · ")}</p>
            </Line>
            <Line heading={STATUS.recordHeading}>
              {best ? (
                <p className="flex items-center gap-4 font-serif text-lg text-bone">
                  <span className="rank-seal">
                    <HalftoneWord text={rankFor(best.score, ARENA.ryumaBest)} width={100} height={120} className="block h-12 w-10" />
                  </span>
                  <span className="tabular-nums">{best.score.toLocaleString()}</span>
                </p>
              ) : (
                <p className="font-serif text-lg text-bone">{STATUS.unranked}</p>
              )}
            </Line>
            <div className="flex flex-col items-start gap-4 border-t border-spirit/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="sys-notice p-0">
                <span className="sys-tag">{SYSTEM.tag}</span> {STATUS.invite.text}
              </p>
              <a href={STATUS.invite.href} className="sys-btn sys-btn-primary">
                {STATUS.invite.accept}
              </a>
            </div>
          </div>
        )}
      </SystemWindow>
    </div>
  );
}
