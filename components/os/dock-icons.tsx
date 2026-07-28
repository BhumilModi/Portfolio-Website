import type { WindowId } from "@/lib/windows";

/** Design lines 497–553. Every icon is a pure CSS composition; the clamp()
 *  sizes make the dock shrink with viewport height, so they stay inline. */

const DOC = {
  width: "clamp(24px, 3.3vh, 32px)",
  height: "clamp(29px, 4vh, 38px)",
  border: "2px solid #16130F",
  background: "#FBFBF7",
  boxShadow: "3px 3px 0 #16130F",
  display: "grid",
  alignContent: "start",
  gap: 3,
  padding: "5px 4px",
} as const;

const FOLDER = {
  width: "clamp(28px, 3.8vh, 36px)",
  height: "clamp(24px, 3.3vh, 31px)",
  display: "block",
  position: "relative",
} as const;

/** readme (lines 497–501) and how (lines 534–538) differ only in the first
 *  rule's colour. */
function Document({ firstRule }: { firstRule: string }) {
  return (
    <span style={DOC}>
      <span style={{ height: 3, background: firstRule }} />
      <span style={{ height: 3, background: "#16130F55" }} />
      <span style={{ height: 3, background: "#16130F55", width: "65%" }} />
    </span>
  );
}

/** oss (lines 510–513) and cases (lines 522–525) differ only in fill. */
function Folder({ fill }: { fill: string }) {
  return (
    <span style={FOLDER}>
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "40%",
          height: 6,
          border: "2px solid #16130F",
          background: fill,
        }}
      />
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 4,
          bottom: 0,
          border: "2px solid #16130F",
          background: fill,
          boxShadow: "3px 3px 0 #16130F",
        }}
      />
    </span>
  );
}

/** contact (lines 547–553) */
function Envelope() {
  return (
    <span
      style={{
        width: "clamp(28px, 3.8vh, 36px)",
        height: "clamp(24px, 3.3vh, 31px)",
        border: "2px solid #16130F",
        background: "#FBFBF7",
        boxShadow: "3px 3px 0 #16130F",
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: 4,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          border: "2px solid #16130F",
          background: "#F2C230",
          display: "block",
        }}
      />
      <span style={{ display: "grid", gap: 3, flex: 1 }}>
        <span style={{ height: 3, background: "#16130F66" }} />
        <span style={{ height: 3, background: "#16130F66", width: "70%" }} />
      </span>
    </span>
  );
}

export function DockIcon({ id }: { id: WindowId }) {
  switch (id) {
    case "readme":
      return <Document firstRule="#E33F00" />;
    case "how":
      return <Document firstRule="#16130F" />;
    case "oss":
      return <Folder fill="#F2C230" />;
    case "cases":
      return <Folder fill="#FBFBF7" />;
    case "contact":
      return <Envelope />;
  }
}
