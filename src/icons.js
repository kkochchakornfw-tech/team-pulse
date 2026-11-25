// One authored icon set: 24px grid, 1.8 stroke, round caps — a felt-pen line that matches the sketchbook world.
const P = {
  menu: '<path d="M4 7h16M4 12h16M4 17h11"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.2 4.2"/>',
  home: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/><path d="M10 19v-5h4v5"/>',
  board: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.2 4.8v14.4M14.8 4.8v14.4"/><path d="M5.8 8h1.4M11.3 8h1.4M16.8 8h1.4"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.8 10h16.4M8 3v4M16 3v4"/><path d="M8 14h.01M12 14h.01M16 14h.01"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.8h5V7"/><path d="M6.5 7l.9 12.2h9.2L17.5 7"/><path d="M10 11v5M14 11v5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  more: '<circle cx="6" cy="12" r=".9"/><circle cx="12" cy="12" r=".9"/><circle cx="18" cy="12" r=".9"/>',
  star: '<path d="m12 4 2.4 5 5.4.7-4 3.7 1.1 5.4L12 16.1l-4.9 2.7 1.1-5.4-4-3.7 5.4-.7z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevron: '<path d="m9.5 6.5 5.5 5.5-5.5 5.5"/>',
  "chevron-left": '<path d="M14.5 6.5 9 12l5.5 5.5"/>',
  grip: '<circle cx="9" cy="6.5" r=".9"/><circle cx="15" cy="6.5" r=".9"/><circle cx="9" cy="12" r=".9"/><circle cx="15" cy="12" r=".9"/><circle cx="9" cy="17.5" r=".9"/><circle cx="15" cy="17.5" r=".9"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z"/>',
  monitor: '<rect x="3.5" y="4.5" width="17" height="11.5" rx="2"/><path d="M9 20h6M12 16v4"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="9.5" r="1.6"/><path d="m4 17 4.8-4.6 3.6 3.4 2.6-2.4L20 18"/>',
  check: '<path d="m5.5 12.5 4 4 9-9.5"/>',
  todo: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="m8 12.2 2.7 2.7L16.2 9"/>',
  list: '<path d="M10 7h10M10 12h10M10 17h10"/><circle cx="5" cy="7" r=".9"/><circle cx="5" cy="12" r=".9"/><circle cx="5" cy="17" r=".9"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M3.5 14.5h17M10 9.5v10"/>',
  "list-ordered": '<path d="M11 7h9M11 12h9M11 17h9"/><path d="M4.5 5.5 6 5v4M4.5 14.2c.3-.8 2-.9 2 .2 0 .9-2 1.6-2 2.6h2.2"/>',
  toggle: '<path d="m9 6.5 6.5 5.5L9 17.5z"/>',
  quote: '<path d="M8.5 17c-2.5 0-3.5-1.8-3.5-4 0-3.4 2.2-5.6 5-6.5M17.5 17c-2.5 0-3.5-1.8-3.5-4 0-3.4 2.2-5.6 5-6.5"/>',
  callout: '<path d="M9.5 17.5h5M10.5 20.5h3"/><path d="M12 3.5a5.5 5.5 0 0 0-3.4 9.8c.6.5.9 1.2.9 2v.7h5v-.7c0-.8.3-1.5.9-2A5.5 5.5 0 0 0 12 3.5Z"/>',
  code: '<path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13"/>',
  divider: '<path d="M4 12h16"/><path d="M8 7h8M8 17h8" opacity=".35"/>',
  file: '<path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4M9 12h6M9 15.5h6"/>',
  text: '<path d="M5 6.5V5h14v1.5M12 5v14M9.5 19h5"/>',
  heading: '<path d="M6 5v14M18 5v14M6 12h12"/>',
  upload: '<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15"/>',
  download: '<path d="M12 4.5v11M7.5 11l4.5 4.5 4.5-4.5"/><path d="M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
  "arrow-up": '<path d="M12 19V5M6.5 10.5 12 5l5.5 5.5"/>',
  "arrow-down": '<path d="M12 5v14M6.5 13.5 12 19l5.5-5.5"/>',
  user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20c1-3.8 4-5.5 7.5-5.5s6.5 1.7 7.5 5.5"/>',
  users: '<circle cx="9" cy="9" r="3.5"/><path d="M3 19.5c.8-3.2 3.2-4.7 6-4.7s5.2 1.5 6 4.7"/><path d="M15.5 5.6a3.5 3.5 0 0 1 0 6.8M17.5 14.9c1.8.6 3 2.2 3.5 4.6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  note: '<path d="M14.5 4.5 19.5 9.5 9 20H4v-5z"/><path d="m12.5 6.5 5 5"/>',
  width: '<path d="M4 12h16M7.5 8.5 4 12l3.5 3.5M16.5 8.5 20 12l-3.5 3.5"/>',
  diamond: '<path d="M12 3.5 20.5 12 12 20.5 3.5 12z"/>',
  restore: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"/><path d="M4.5 4.5V9H9"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  clip: '<path d="m19 11.5-7.4 7.4a4.8 4.8 0 0 1-6.8-6.8l7.7-7.7a3.2 3.2 0 0 1 4.5 4.5l-7.6 7.6a1.6 1.6 0 0 1-2.3-2.3l6.9-6.9"/>',
  team: '<rect x="3.5" y="5" width="7.5" height="6.5" rx="2"/><rect x="13" y="5" width="7.5" height="6.5" rx="2"/><rect x="8.2" y="13.5" width="7.5" height="6.5" rx="2"/>',
  eye: '<path d="M2.8 12S6 5.8 12 5.8 21.2 12 21.2 12 18 18.2 12 18.2 2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5Z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  chart: '<path d="M4 20h16"/><rect x="5.5" y="11" width="3.2" height="7" rx="1"/><rect x="10.4" y="6" width="3.2" height="12" rx="1"/><rect x="15.3" y="13.5" width="3.2" height="4.5" rx="1"/>',
  chat: '<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.2 3.4V16H7.5A2.5 2.5 0 0 1 5 13.5Z"/><path d="M9 9h6M9 12h4"/>',
  sparkle:'<path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.6 6.6l2.2 2.2M15.2 15.2l2.2 2.2M6.6 17.4l2.2-2.2M15.2 8.8l2.2-2.2"/>',
};

export function icon(name, cls) {
  const p = P[name] || P.file;
  return `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

/** Replace every <i data-ic="name"> in root with its SVG. */
export function paintIcons(root) {
  (root || document).querySelectorAll("i[data-ic]").forEach((el) => {
    el.outerHTML = icon(el.dataset.ic, el.className || "");
  });
}
