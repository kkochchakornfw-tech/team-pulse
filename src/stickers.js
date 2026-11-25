// Hand-drawn sticker set: ink outline, pastel marker fill, a white die-cut edge and a felt-pen wobble.
// They mark sections, teams and empty states — the world's signature, never a stand-in for icons.
const I = "#26221e";
const C = { mint: "#a8d5c2", pink: "#f6b7c3", sky: "#bfddf0", butter: "#f7e48b", peach: "#f9c9a6", aqua: "#9fdbd6", paper: "#fffdf8", red: "#ef8a8a" };
const s = `stroke="${I}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;

const ART = {
  cat: `<path d="M16 50c-2-12 2-24 10-28l-2-12 9 7c3-1 7-1 10 0l9-7-2 12c8 5 11 16 9 28Z" fill="${C.paper}" ${s}/><path d="M24 33c1-1 3-1 4 0M38 33c1-1 3-1 4 0" fill="none" ${s}/><path d="M31 38h4l-2 2.5Z" fill="${C.pink}" ${s}/><path d="M33 40.5c0 3-3 4-5 2.5M33 40.5c0 3 3 4 5 2.5" fill="none" ${s}/><ellipse cx="22" cy="40" rx="3" ry="1.8" fill="${C.pink}"/><ellipse cx="44" cy="40" rx="3" ry="1.8" fill="${C.pink}"/><path d="M50 46c6-1 8 4 5 8" fill="none" ${s}/>`,
  mug: `<path d="M14 22h30l-3 30c0 3-3 5-6 5H23c-3 0-6-2-6-5Z" fill="${C.butter}" ${s}/><path d="M43 28c8-1 10 10 1 13" fill="none" ${s}/><path d="M24 36c1 2 3 2 4 0M32 36c1 2 3 2 4 0" fill="none" ${s}/><circle cx="30" cy="42" r="1.6" fill="${I}"/><path d="M23 16c-2-3 2-5 0-8M31 16c-2-3 2-5 0-8M39 16c-2-3 2-5 0-8" fill="none" ${s}/>`,
  sparkle: `<path d="M32 6c2 14 6 18 20 20-14 2-18 6-20 20-2-14-6-18-20-20 14-2 18-6 20-20Z" fill="${C.butter}" ${s}/><path d="M50 42c1 5 2 6 7 7-5 1-6 2-7 7-1-5-2-6-7-7 5-1 6-2 7-7Z" fill="${C.pink}" ${s}/>`,
  pencil: `<path d="M44 8l12 12-30 30-15 3 3-15Z" fill="${C.butter}" ${s}/><path d="M38 14l12 12" fill="none" ${s}/><path d="M14 38l12 12" fill="none" ${s}/><path d="M11 53l3-6 3 3Z" fill="${I}"/><path d="M44 8l12 12 3-3c2-2 2-5 0-7l-5-5c-2-2-5-2-7 0Z" fill="${C.pink}" ${s}/>`,
  clip: `<rect x="12" y="14" width="30" height="40" rx="4" fill="${C.paper}" ${s} transform="rotate(-6 27 34)"/><path d="M19 28h16M19 35h16M19 42h10" fill="none" ${s} transform="rotate(-6 27 34)"/><path d="M44 10v28a7 7 0 0 1-14 0V16a4.5 4.5 0 0 1 9 0v20" fill="none" stroke="${I}" stroke-width="3" stroke-linecap="round"/><path d="M44 10v28a7 7 0 0 1-14 0V16a4.5 4.5 0 0 1 9 0v20" fill="none" stroke="${C.sky}" stroke-width="1.2" stroke-linecap="round"/>`,
  folder: `<path d="M8 18c0-2 2-4 4-4h12l5 5h23c2 0 4 2 4 4v24c0 2-2 4-4 4H12c-2 0-4-2-4-4Z" fill="${C.mint}" ${s}/><path d="M8 26h48" fill="none" ${s}/><rect x="18" y="8" width="20" height="14" rx="2" fill="${C.paper}" ${s} transform="rotate(8 28 15)"/>`,
  calendar: `<rect x="10" y="14" width="44" height="40" rx="6" fill="${C.paper}" ${s}/><path d="M10 26h44" fill="none" ${s}/><path d="M10 20c0-3 3-6 6-6h32c3 0 6 3 6 6v6H10Z" fill="${C.pink}" ${s}/><path d="M22 9v9M42 9v9" fill="none" ${s}/><circle cx="32" cy="40" r="7" fill="${C.butter}" ${s}/><path d="M20 34h.1M44 34h.1M20 46h.1M44 46h.1" fill="none" ${s}/>`,
  plant: `<path d="M18 38h28l-4 18H22Z" fill="${C.peach}" ${s}/><path d="M16 38h32" fill="none" ${s}/><path d="M32 38V20" fill="none" ${s}/><path d="M32 26c-8 0-14-5-14-13 8 0 14 5 14 13ZM32 22c0-8 6-13 14-13 0 8-6 13-14 13Z" fill="${C.mint}" ${s}/>`,
  heart: `<path d="M32 54C14 42 8 32 10 22c2-9 14-12 22-2 8-10 20-7 22 2 2 10-4 20-22 32Z" fill="${C.pink}" ${s}/><path d="M18 24c1-3 4-5 7-4" fill="none" stroke="${C.paper}" stroke-width="3" stroke-linecap="round"/>`,
  plane: `<path d="M6 30 56 10 44 54 32 38Z" fill="${C.sky}" ${s}/><path d="M56 10 32 38l-2 12 8-9" fill="${C.paper}" ${s}/><path d="M10 50c4-2 8 0 10-3" fill="none" ${s} stroke-dasharray="2 5"/>`,
  frame: `<rect x="8" y="12" width="48" height="40" rx="5" fill="${C.sky}" ${s}/><circle cx="22" cy="25" r="5" fill="${C.butter}" ${s}/><path d="M9 46l14-13 10 9 8-6 14 11" fill="${C.mint}" ${s}/>`,
  bulb: `<path d="M32 8a16 16 0 0 0-9 29c2 2 3 4 3 7v2h12v-2c0-3 1-5 3-7a16 16 0 0 0-9-29Z" fill="${C.butter}" ${s}/><path d="M26 52h12M28 57h8" fill="none" ${s}/><path d="M27 30l5 5 5-5" fill="none" ${s}/><path d="M10 18l-4-2M54 18l4-2M32 3v-1" fill="none" ${s}/>`,
  books: `<rect x="10" y="40" width="44" height="12" rx="3" fill="${C.mint}" ${s}/><rect x="14" y="28" width="38" height="12" rx="3" fill="${C.pink}" ${s} transform="rotate(-4 33 34)"/><rect x="12" y="16" width="40" height="12" rx="3" fill="${C.sky}" ${s} transform="rotate(3 32 22)"/><path d="M40 44h10M38 32h10M38 20h10" fill="none" ${s}/>`,
};
export const STICKERS = Object.keys(ART);

/** Inline SVG sticker. size in px (default 56). */
export function sticker(name, size = 56, cls = "") {
  const art = ART[name] || ART.sparkle;
  return `<svg class="stk${cls ? " " + cls : ""}" viewBox="-4 -4 72 72" width="${size}" height="${size}" aria-hidden="true"><g class="stk-edge">${art}</g><g filter="url(#pen)">${art}</g></svg>`;
}
