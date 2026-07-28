"use client";

import { Backdrop } from "@/components/os/backdrop";
import { Dock } from "@/components/os/dock";
import { MenuBar } from "@/components/os/menu-bar";
import { Window, type WindowChrome } from "@/components/os/window";
import { CaseFiles } from "@/components/windows/case-files";
import { Contact } from "@/components/windows/contact";
import { OpenSource } from "@/components/windows/open-source";
import { Principles } from "@/components/windows/principles";
import { StartHere } from "@/components/windows/start-here";
import { useClock } from "@/hooks/use-clock";
import { useDesktop } from "@/hooks/use-desktop";
import { WINDOW_TITLES, caseWindowTitle } from "@/lib/content";
import { WINDOW_ORDER, type WindowId } from "@/lib/windows";

/** Title-bar treatment per window — design lines 89 (readme, orange),
 *  131/167/404 (light), 470–471 (contact, inverted). */
const CHROME: Record<WindowId, WindowChrome> = {
  readme: "orange",
  oss: "light",
  cases: "light",
  how: "light",
  contact: "inverted",
};

export function Desktop() {
  const d = useDesktop();
  const clock = useClock();

  /** Window bodies. `cases` is the only one that needs desktop state — the two
   *  runnable sims keep their own state inside Case01/Case02. */
  const body = (id: WindowId) => {
    switch (id) {
      case "readme":
        return (
          <StartHere
            onRunCase01={() => d.openCase(1)}
            onOpenContact={d.w.contact.onOpen}
          />
        );
      case "oss":
        return <OpenSource />;
      case "cases":
        return (
          <CaseFiles
            caseId={d.caseId}
            onOpenCase={d.openCase}
            onCloseCase={d.closeCase}
          />
        );
      case "how":
        return <Principles />;
      case "contact":
        return <Contact />;
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-paper">
      <Backdrop />
      <MenuBar w={d.w} clock={clock} />

      {/* Windows render during SSR so the page's actual content is in the HTML —
          this is a portfolio, and an empty desktop is what crawlers and link
          previews would otherwise see. Positions derive from innerWidth/Height,
          which SSR falls back to 1280×800 for, so the first post-measure paint
          repositions them; the opacity mask covers that single frame. Server and
          first client render agree, so there is no hydration mismatch. */}
      <div
        className="transition-opacity duration-150"
        style={{ opacity: d.mounted ? 1 : 0 }}
      >
        {WINDOW_ORDER.filter((id) => d.w[id].open).map((id) => (
          <Window
            key={id}
            id={id}
            title={id === "cases" ? caseWindowTitle(d.caseId) : WINDOW_TITLES[id]}
            chrome={CHROME[id]}
            {...d.w[id]}
          >
            {body(id)}
          </Window>
        ))}
      </div>

      <Dock w={d.w} clearHover={d.clearHover} />
    </div>
  );
}
