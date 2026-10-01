"use client";
import type { ReactNode } from "react";
import { ARENA, STATUS, SYSTEM } from "@/lib/content";
import { rankFor } from "@/lib/rank";
import { useQuest } from "@/components/quest/use-quest";
import SystemWindow from "./system-window";

function Row({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-spirit/15 pb-2">
      <dt className="font-mono text-xs uppercase tracking-[0.18em] text-spirit">{label}</dt>
      <dd className={big ? "font-display text-4xl leading-none tabular-nums" : "text-right font-serif text-xl"}>{value}</dd>
    </div>
  );
}

function Block({ heading, children }: { heading: string; children: ReactNode }) {
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

/** The Status Window (redesign spec §6): Ryuma's sheet, the visitor's record and a party invite. Locked until the Gate is cleared or skipped. */
export default function StatusWindow() {
  const { tried, best } = useQuest();
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SystemWindow id="status" heading={STATUS.heading} className="mx-auto max-w-[56rem] scroll-mt-8">
        {!tried ? (
          <div className="flex flex-col items-start gap-5 py-4">
            <p className="font-serif text-2xl italic text-bone/85">{STATUS.locked}</p>
            <a href="#trial" className="sys-btn">
              {STATUS.toGate}
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <dl className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
              <Row label={STATUS.labels.name} value={STATUS.name} />
              <Row label={STATUS.labels.level} value={String(STATUS.level)} big />
              <Row label={STATUS.labels.job} value={STATUS.job} />
              <Row label={STATUS.labels.title} value={STATUS.title} />
            </dl>
            <dl className="grid grid-cols-5 gap-2 border-y border-spirit/20 py-4">
              {STATUS.stats.map((s) => (
                <div key={s.k} className="flex flex-col items-center gap-1">
                  <dt className="font-mono text-xs tracking-[0.18em] text-spirit">{s.k}</dt>
                  <dd className="font-display text-4xl leading-none tabular-nums md:text-5xl">{s.v}</dd>
                </div>
              ))}
            </dl>
            <Block heading={STATUS.skills.heading}>
              <ul className="flex flex-wrap gap-x-8 gap-y-2 font-serif text-lg">
                {STATUS.skills.list.map((s) => (
                  <li key={s.name}>
                    <span className="font-mono text-xs uppercase tracking-[0.16em] text-bone/60">{s.kind}</span> · {s.name}
                  </li>
                ))}
              </ul>
            </Block>
            <Block heading={STATUS.equipment.heading}>
              <p className="font-serif text-lg">{STATUS.equipment.list.join(" · ")}</p>
            </Block>
            <Block heading={STATUS.recordHeading}>
              <p className="font-serif text-lg">
                {best ? (
                  <>
                    {STATUS.rankLabel} <span className="font-display text-3xl leading-none text-spirit">{rankFor(best.score, ARENA.ryumaBest)}</span> ·{" "}
                    <span className="tabular-nums">{best.score.toLocaleString()}</span>
                  </>
                ) : (
                  STATUS.unranked
                )}
              </p>
            </Block>
            <div className="flex flex-col items-start gap-4 border-t border-spirit/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-serif text-lg">
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
