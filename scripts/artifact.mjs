// Bundles the Vite build (dist/) into one self-contained page for the claude.ai artifact.
// Usage: npm run build && node scripts/artifact.mjs  → writes ../team-pulse.html
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const dist = path.join(root, "dist");
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const asset = (re) => { const m = html.match(re); if (!m) throw new Error("missing asset " + re); return fs.readFileSync(path.join(dist, m[1].replace(/^\//, "")), "utf8"); };
const css = asset(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"/);
const js = asset(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"/);
const fonts = html.match(/<link rel="preconnect"[\s\S]*?display=swap">/)[0];
const body = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"))
  .replace(/<script type="module"[^>]*><\/script>/g, "").trim();

// inline the cut-out stickers so the single-file artifact needs no other files
const cutDir = path.join(dist, "stickers", "cut");
const cut = Object.fromEntries(fs.readdirSync(cutDir).filter((f) => f.endsWith(".webp"))
  .map((f) => [f.replace(".webp", ""), "data:image/webp;base64," + fs.readFileSync(path.join(cutDir, f)).toString("base64")]));
if (Object.keys(cut).length < 44) throw new Error("expected 44 cut stickers, found " + Object.keys(cut).length);
// stickerUrl() in src/stickerset.js reads globalThis.__STK first
const jsOut = "globalThis.__STK=" + JSON.stringify(cut) + ";\n" + js;
const out = `<title>Team Pulse</title>
<meta name="claude:viewport-fit-sides" content="cover">
${fonts}
<style>
${css.replace(/<\/style/gi, "<\\/style")}
</style>
${body}
<script type="module">
${jsOut.replace(/<\/script/gi, "<\\/script")}
</script>
`;
const target = path.resolve(root, "..", "team-pulse.html");
fs.writeFileSync(target, out);
console.log("wrote", target, (out.length / 1024).toFixed(1) + " KB");
