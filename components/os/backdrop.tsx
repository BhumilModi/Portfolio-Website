import { BACKDROP } from "@/lib/content";

/** The desktop dot grid (design line 32). Applied on this component's own root,
 *  which is `inset-0` of the desktop element, so the paint is identical to the
 *  design putting it on the root. Exported in case Phase C wants it there. */
export const DOT_GRID = {
  backgroundImage: "radial-gradient(#16130F26 1.5px, transparent 1.5px)",
  backgroundSize: "22px 22px",
} as const;

/** Design lines 34–65. Purely decorative — never takes a pointer event. */
export function Backdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={DOT_GRID}
    >
      {/* rotated band + its rule (lines 35–36) */}
      <div
        className="absolute"
        style={{
          left: "-10%",
          top: "30%",
          width: "130%",
          height: 210,
          background: "#E33F0014",
          transform: "rotate(-9deg)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "-10%",
          top: "30%",
          width: "130%",
          height: 3,
          background: "#E33F0033",
          transform: "rotate(-9deg)",
        }}
      />

      {/* outlined monogram (line 37) */}
      <div
        className="absolute font-bold"
        style={{
          right: "2vw",
          top: "4vh",
          fontSize: "40vh",
          lineHeight: 0.8,
          letterSpacing: "-0.07em",
          color: "transparent",
          WebkitTextStroke: "3px #16130F1a",
        }}
      >
        {BACKDROP.monogram}
      </div>

      {/* shapes (lines 38–41) */}
      <div
        className="absolute"
        style={{
          right: "6vw",
          bottom: "6vh",
          width: 260,
          height: 260,
          border: "3px solid #16130F14",
          transform: "rotate(12deg)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "12vw",
          bottom: "12vh",
          width: 160,
          height: 160,
          background: "#F2C23033",
          transform: "rotate(-6deg)",
        }}
      />
      <div
        className="absolute"
        style={{ left: "24%", bottom: "16%", width: 66, height: 66, background: "#16130F12" }}
      />
      <div
        className="absolute"
        style={{ left: "46%", top: "18%", width: 22, height: 22, background: "#E33F0033" }}
      />

      {/* eyebrow + faded headline (lines 43–46). Hidden below the mobile
          breakpoint, where `left: 240px` would sit under the dock. */}
      <div
        className="absolute hidden md:block"
        style={{ left: 240, top: 74, maxWidth: "40vw" }}
      >
        <div
          className="font-mono uppercase"
          style={{
            fontSize: "10.5px",
            letterSpacing: "0.22em",
            color: "#16130F5c",
            marginBottom: 12,
          }}
        >
          {BACKDROP.eyebrow}
        </div>
        <div
          className="font-bold text-pretty"
          style={{
            fontSize: "clamp(1.4rem, 2.8vw, 2.6rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            color: "#16130F2b",
            maxWidth: "24ch",
          }}
        >
          {BACKDROP.headline}
        </div>
      </div>

      {/* `~ uptime` stats (lines 48–53) — same collision, same treatment. */}
      <div
        className="absolute hidden font-mono md:block"
        style={{ left: 240, bottom: 60, fontSize: 11, lineHeight: 2, color: "#16130F4a" }}
      >
        {BACKDROP.stats.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>

      {/* note-to-self card (lines 55–58) */}
      <div
        className="absolute font-mono"
        style={{
          right: "5vw",
          top: "22vh",
          border: "2px solid #16130F",
          background: "#F2C230",
          boxShadow: "6px 6px 0 #16130F1f",
          padding: "15px 17px 18px",
          width: 216,
          transform: "rotate(2.5deg)",
          fontSize: "11.5px",
          lineHeight: 1.65,
        }}
      >
        <div
          className="uppercase"
          style={{
            letterSpacing: "0.15em",
            fontSize: "9.5px",
            opacity: 0.6,
            marginBottom: 8,
          }}
        >
          {BACKDROP.note.label}
        </div>
        {BACKDROP.note.body}
      </div>

      {/* hints (lines 60–64) */}
      <div
        className="absolute text-right font-mono"
        style={{
          right: 26,
          bottom: 26,
          fontSize: "10.5px",
          lineHeight: 1.9,
          color: "#16130F52",
        }}
      >
        {BACKDROP.hints.map((hint) => (
          <div key={hint}>{hint}</div>
        ))}
      </div>
    </div>
  );
}
