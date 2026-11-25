// Hand-drawn avatar set. Each face is assembled from parts, outlined in felt-pen ink,
// filled with slightly mis-registered marker colour, and run through a wobble filter.

const INK = "#2a2420";
const SKIN = ["#ffdcbf", "#f3c39c", "#dca27a", "#b87952", "#8a573a", "#ffe8d2"];
const HAIR = ["#2a2420", "#5c3a28", "#c9853b", "#ebc35c", "#a4a29c", "#c43d32", "#3c5c86", "#e86a9a"];

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** A closed, slightly lumpy ellipse — the way a pen actually draws a face. */
function blob(cx, cy, rx, ry, r, n = 14, jit = 0.045) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 2 * jit;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = "";
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    d += i === 0 ? `M${((pts[n - 1][0] + p[0]) / 2).toFixed(1)} ${((pts[n - 1][1] + p[1]) / 2).toFixed(1)}` : "";
    d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return d + "Z";
}

const S = `stroke="${INK}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"`;

const HAIRS = {
  short: (c) => `<path d="M26 54C23 32 38 21 53 22c16 1 25 13 21 32-3-9-9-14-16-13-5-6-15-1-21-1-5 3-8 8-11 14Z" fill="${c}" ${S}/>`,
  bob: (c) => `<path d="M23 74C17 42 31 21 51 21s34 21 27 53c-4-9-4-19-8-26-12 1-24-5-32-12-4 9-8 17-8 32-2 3-4 4-7 6Z" fill="${c}" ${S}/>`,
  bun: (c) => `<circle cx="50" cy="17" r="8.5" fill="${c}" ${S}/><path d="M26 52c-2-20 11-30 25-30s27 10 24 30c-6-8-14-12-24-12s-19 4-25 12Z" fill="${c}" ${S}/>`,
  curly: (c) => [[29, 45], [31, 35], [38, 28], [47, 24], [56, 24], [64, 28], [70, 35], [72, 45]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${c}" ${S}/>`).join(""),
  long: (c) => `<path d="M21 90C15 52 27 21 50 21s35 31 29 69Z" fill="${c}" ${S}/>`,
  longFringe: (c) => `<path d="M28 47c5-15 34-18 45 0-9-6-28-8-45 0Z" fill="${c}" ${S}/>`,
  cap: (c) => `<path d="M25 46c0-19 50-22 50 0Z" fill="${c}" ${S}/><path d="M49 45c12-1 26 0 36 3-3 5-18 4-28 2" fill="${c}" ${S}/>`,
  beanie: (c) => `<path d="M25 47c0-27 50-27 50 0Z" fill="${c}" ${S}/><path d="M23 48c17-3 37-3 54 0l-1-8c-17-3-35-3-52 0Z" fill="${c}" ${S}/><circle cx="50" cy="19" r="5" fill="${c}" ${S}/>`,
  tufts: () => `<path d="M27 50c-4-4-3-9 1-11M30 44c-2-4 0-8 3-9M73 50c4-4 3-9-1-11M70 44c2-4 0-8-3-9" fill="none" ${S}/>`,
  spiky: (c) => `<path d="M26 52 24 34l8 4 2-11 8 6 6-10 6 9 7-7 3 11 8-4-2 18c-6-7-14-10-24-10s-18 3-24 12Z" fill="${c}" ${S}/>`,
};
const EYES = {
  dots: `<circle cx="41" cy="56" r="2.6" fill="${INK}"/><circle cx="59" cy="56" r="2.6" fill="${INK}"/>`,
  happy: `<path d="M37 57c2-4 6-4 8 0M55 57c2-4 6-4 8 0" fill="none" ${S}/>`,
  round: `<circle cx="41" cy="56" r="4.6" fill="#fff" ${S}/><circle cx="42" cy="56.5" r="2" fill="${INK}"/><circle cx="59" cy="56" r="4.6" fill="#fff" ${S}/><circle cx="60" cy="56.5" r="2" fill="${INK}"/>`,
  wink: `<circle cx="41" cy="56" r="2.6" fill="${INK}"/><path d="M55 56.5c2 1.5 6 1.5 8 0" fill="none" ${S}/>`,
  sleepy: `<path d="M37 56c2 2 6 2 8 0M55 56c2 2 6 2 8 0" fill="none" ${S}/>`,
};
const MOUTH = {
  smile: `<path d="M43 68c4 4 10 4 14 0" fill="none" ${S}/>`,
  grin: `<path d="M41 66c3 9 15 9 18 0Z" fill="#fff" ${S}/>`,
  o: `<ellipse cx="50" cy="69" rx="3" ry="3.6" fill="#7a2f2a" ${S}/>`,
  smirk: `<path d="M44 69c4 1 9 0 13-3" fill="none" ${S}/>`,
  tongue: `<path d="M42 66c3 7 13 7 16 0Z" fill="#fff" ${S}/><path d="M47 70c0 4 6 4 6 0" fill="#f07c86" ${S}/>`,
};
const EXTRA = {
  glasses: `<g fill="none" ${S}><circle cx="41" cy="56" r="7.5"/><circle cx="59" cy="56" r="7.5"/><path d="M48.5 55.5c1-1 2-1 3 0M33.5 54 27 52M66.5 54l6.5-2"/></g>`,
  blush: `<ellipse cx="35" cy="65" rx="4.5" ry="2.6" fill="#ff8fa3" opacity=".7"/><ellipse cx="65" cy="65" rx="4.5" ry="2.6" fill="#ff8fa3" opacity=".7"/>`,
  freckles: `<g fill="${INK}" opacity=".55"><circle cx="35" cy="63" r=".9"/><circle cx="38" cy="65.5" r=".9"/><circle cx="33" cy="66" r=".9"/><circle cx="65" cy="63" r=".9"/><circle cx="62" cy="65.5" r=".9"/><circle cx="67" cy="66" r=".9"/></g>`,
  beard: (c) => `<path d="M27 62c2 25 44 25 46 0-5 9-13 13-23 13s-18-4-23-13Z" fill="${c}" ${S}/>`,
  earring: `<circle cx="26" cy="66" r="2.6" fill="#ffd04a" ${S}/>`,
  mole: `<circle cx="61" cy="70" r="1.1" fill="${INK}"/>`,
};

// 16 presets: [hair, eyes, mouth, skin, hairColour, extras]
export const AVATARS = [
  ["short", "dots", "smile", 0, 0, ["blush"]],
  ["bob", "happy", "grin", 1, 1, []],
  ["bun", "round", "smile", 2, 2, ["earring"]],
  ["curly", "dots", "grin", 4, 0, ["glasses"]],
  ["long", "wink", "tongue", 0, 3, ["blush"]],
  ["cap", "dots", "smirk", 3, 0, []],
  ["beanie", "sleepy", "smile", 1, 5, ["freckles"]],
  ["tufts", "round", "o", 5, 4, ["glasses", "beard"]],
  ["spiky", "happy", "grin", 2, 7, []],
  ["short", "round", "smile", 4, 1, ["glasses"]],
  ["long", "dots", "smile", 3, 0, ["mole"]],
  ["curly", "happy", "tongue", 0, 2, ["freckles"]],
  ["bob", "sleepy", "smirk", 5, 6, ["earring"]],
  ["short", "wink", "grin", 1, 0, ["beard"]],
  ["bun", "dots", "o", 3, 3, ["blush"]],
  ["cap", "happy", "smile", 0, 4, ["freckles"]],
];
const CAP_COLOURS = ["#3c7be8", "#e8467c", "#1f9d5c", "#f0782a"];

/** SVG for avatar n. The ground circle uses var(--c) so it follows the person's colour. */
export function avatarSVG(n) {
  const i = ((n % AVATARS.length) + AVATARS.length) % AVATARS.length;
  const [hair, eyes, mouth, skinI, hairI, extras] = AVATARS[i];
  const r = rng(1009 * (i + 1));
  const skin = SKIN[skinI], hc = HAIR[hairI];
  const hatC = CAP_COLOURS[i % CAP_COLOURS.length];
  const hairFill = hair === "cap" || hair === "beanie" ? hatC : hc;
  const back = hair === "long" ? HAIRS.long(hc) : "";
  const front = hair === "long" ? HAIRS.longFringe(hc) : HAIRS[hair](hairFill);
  const face = blob(50, 57, 24, 27, r);
  const fillShift = blob(51.6, 58.4, 23, 26, r, 12, 0.06);
  const ground = blob(50, 50, 47, 47, r, 16, 0.03);
  const ex = extras.map((e) => (typeof EXTRA[e] === "function" ? EXTRA[e](hc) : EXTRA[e])).join("");
  const neck = `<path d="M40 80c0 6-2 9-10 12M60 80c0 6 2 9 10 12" fill="none" ${S}/>`;
  return `<svg viewBox="0 0 100 100" class="av-svg" aria-hidden="true"><defs><filter id="wob${i}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="${i + 3}"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter><clipPath id="avc${i}"><circle cx="50" cy="50" r="49"/></clipPath></defs>`
    + `<path d="${ground}" style="fill:var(--av-bg,var(--c))"/>`
    + `<g clip-path="url(#avc${i})"><g filter="url(#wob${i})">${back}${neck}<path d="${fillShift}" fill="${skin}"/><path d="${face}" fill="none" ${S}/>${front}${eyes in EYES ? EYES[eyes] : ""}${MOUTH[mouth]}${ex}</g></g></svg>`;
}
export const AVATAR_COUNT = AVATARS.length;
