// Dev-time: prints an @font-face with a base64 League Gothic subset for the profile SVGs.
// Run: node scripts/build-profile-font.mjs > .profile-font.css
const TEXT = "BHUMILODFRWAEPYNTGCKSV·—0123456789+";
const css = await (
  await fetch(`https://fonts.googleapis.com/css2?family=League+Gothic&text=${encodeURIComponent(TEXT)}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/128 Safari/537.36" },
  })
).text();
const url = css.match(/url\(([^)]+)\)/)[1];
const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
console.log(`@font-face{font-family:"LG";src:url(data:font/woff2;base64,${bytes.toString("base64")}) format("woff2");}`);
