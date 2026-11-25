// File storage for images and attachments.
// - Local mode (npm run dev): IndexedDB in this browser ("idb:<id>").
// - claude.ai artifact: the `assets` capability for types it accepts (shared URL), otherwise the file is
//   split into base64 chunks in the shared db ("db:<id>"), so every teammate can open it.
// Swap these functions for Supabase Storage when the app moves to Vercel.
const DB = "team-pulse-files", ST = "files";
let assets = null, sharedDb = null, apiUpload = null;
export function setAssets(a) { assets = a; }
/** API mode (Vercel / npm run dev): fn(blob, name, type) → url */
export function setApiUpload(fn) { apiUpload = fn; }
export function setSharedDb(d) { sharedDb = d; }
export const LIMITS = { local: 50, asset: 20, chunked: 8 }; // MB

let dbp = null;
function open() {
  if (!dbp) dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
function req(db, mode, fn) {
  return new Promise((res, rej) => {
    const t = db.transaction(ST, mode); const q = fn(t.objectStore(ST));
    t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error);
  });
}
const newKey = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Downscale to at most `max` px on the long side; keeps GIF and SVG untouched. */
export async function shrink(file, max = 1600, q = 0.86) {
  if (/gif|svg/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const out = await new Promise((r) => c.toBlob(r, "image/webp", q));
    return out || file;
  } catch (e) { return file; }
}

const ASSET_OK = /^(image\/|video\/|font\/|application\/pdf$|text\/(csv|markdown|plain|css|javascript)$|application\/json$)/;
function assetOk(type, name) { return ASSET_OK.test(type || "") || /\.(pdf|csv|md|txt|json)$/i.test(name || ""); }

async function toB64(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer()); let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromB64(b64, type) {
  const bin = atob(b64); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type: type || "application/octet-stream" });
}

/** Store any file. Returns its src string. Throws {code:"too_large", limit} when over the limit. */
export async function putFile(file, { image = false } = {}) {
  const blob = image ? await shrink(file) : file;
  const mb = blob.size / 1048576;
  if (apiUpload) return apiUpload(blob, file.name || "file", blob.type || file.type || "");
  if (assets &&assetOk(blob.type || file.type, file.name)) {
    if (mb > LIMITS.asset) throw { code: "too_large", limit: LIMITS.asset };
    const r = await assets.upload(blob); return r.url;
  }
  if (sharedDb) {
    if (mb > LIMITS.chunked) throw { code: "too_large", limit: LIMITS.chunked };
    const id = newKey(), b64 = await toB64(blob), size = 190000, n = Math.max(1, Math.ceil(b64.length / size));
    for (let i = 0; i < n; i++) await sharedDb.doc(`blobs/${id}-${i}`).set({ i, n, type: blob.type || file.type || "", data: b64.slice(i * size, (i + 1) * size) });
    return "db:" + id + ":" + n;
  }
  if (mb > LIMITS.local) throw { code: "too_large", limit: LIMITS.local };
  const id = newKey(); const db = await open();
  await req(db, "readwrite", (s) => s.put(blob, id));
  return "idb:" + id;
}
export const putImage = (file) => putFile(file, { image: true });

const cache = new Map();
/** A Blob for any stored src (null when it is not reachable from this browser). */
export async function blobFor(src) {
  if (!src) return null;
  try {
    if (src.startsWith("idb:")) { const db = await open(); return (await req(db, "readonly", (s) => s.get(src.slice(4)))) || null; }
    if (src.startsWith("db:")) {
      if (!sharedDb) return null;
      const [, id, n] = src.split(":"); let type = "", parts = [];
      for (let i = 0; i < +n; i++) { const d = await sharedDb.doc(`blobs/${id}-${i}`).get(); if (!d.exists) return null; const v = d.data(); type = v.type; parts.push(v.data); }
      return fromB64(parts.join(""), type);
    }
    const r = await fetch(src); return r.ok ? await r.blob() : null;
  } catch (e) { return null; }
}
export async function urlFor(src) {
  if (!src) return "";
  if (!/^(idb|db):/.test(src)) return src;
  if (cache.has(src)) return cache.get(src);
  const b = await blobFor(src); if (!b) return "";
  const u = URL.createObjectURL(b); cache.set(src, u); return u;
}
/** Remove a stored file's bytes (best effort). */
export async function dropFile(src) {
  try {
    if (src && src.startsWith("idb:")) { const db = await open(); await req(db, "readwrite", (s) => s.delete(src.slice(4))); }
    if (src && src.startsWith("db:") && sharedDb) { const [, id, n] = src.split(":"); for (let i = 0; i < +n; i++) await sharedDb.doc(`blobs/${id}-${i}`).delete(); }
  } catch (e) { /* ignore */ }
}

/** Square-crop to 256px and return a small data URL for a profile picture. */
export async function avatarDataUrl(file) {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas"); c.width = c.height = 256;
  c.getContext("2d").drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 256, 256);
  return c.toDataURL("image/webp", 0.82);
}

export function fmtSize(b) { if (!b && b !== 0) return ""; if (b < 1024) return b + " B"; if (b < 1048576) return (b / 1024).toFixed(0) + " KB"; return (b / 1048576).toFixed(1) + " MB"; }
