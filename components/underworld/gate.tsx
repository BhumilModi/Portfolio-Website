import Link from "next/link";
import { UNDERWORLD } from "@/lib/content";
import RyumaMark from "./ryuma-mark";

/** No fare, no crossing (spirit spec §10): the broadcast's black screen, the mark dimmed, the copy as a terminal slip. */
export default function Gate({ count }: { count: number }) {
  return (
    <section className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="flex w-full max-w-[34rem] flex-col items-center gap-8">
        <div aria-hidden className="w-[min(80vw,560px)] text-bone opacity-40">
          <RyumaMark className="block w-full" pitch={9} />
        </div>
        <div className="sys-window w-full text-left" data-phase="still">
          <h1 className="sys-head">{UNDERWORLD.gate.title}</h1>
          <p className="sys-notice p-0">{UNDERWORLD.gate.body.replace("{n}", String(count))}</p>
        </div>
        <Link href="/#hero" className="sys-btn">
          {UNDERWORLD.gate.back}
        </Link>
      </div>
    </section>
  );
}
