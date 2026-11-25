// Development store: one JSON file under .data/ and uploaded files beside it.
// Same interface as store-pg.js so the API code does not care which one runs.
import fs from "node:fs";
import path from "node:path";

const DIR = process.env.TP_DATA_DIR ? path.resolve(process.env.TP_DATA_DIR) : path.resolve(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");
let db = null, timer = null;

function load() {
  if (db) return db;
  try { db = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { db = {}; }
  db.users ||= {}; db.tokens ||= {}; db.docs ||= {}; db.notifs ||= []; db.kv ||= {};
  return db;
}
function save() { clearTimeout(timer); timer = setTimeout(() => { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db, null, 1)); }, 120); }
const now = () => new Date().toISOString();

export const kind = "file";
export async function init() { load(); }
export async function countUsers() { return Object.keys(load().users).length; }
export async function getUser(id) { return load().users[id] || null; }
export async function getUserByEmail(email) { return Object.values(load().users).find((u) => u.email === email) || null; }
export async function listUsers() { return Object.values(load().users); }
export async function createUser(u) { load().users[u.id] = { prefs: {}, ...u, createdAt: now() }; save(); return load().users[u.id]; }
export async function updateUser(id, patch) { const u = load().users[id]; if (!u) return null; Object.assign(u, patch); save(); return u; }
export async function deleteUser(id) { delete load().users[id]; save(); }

export async function putToken(hash, email, exp) { load().tokens[hash] = { email, exp }; save(); }
export async function takeToken(hash) {
  const t = load().tokens[hash]; delete load().tokens[hash]; save();
  return t && t.exp > Date.now() ? t.email : null;
}

export async function listDocs(since) {
  const s = since ? new Date(since).getTime() : 0;
  return Object.values(load().docs).filter((d) => new Date(d.updatedAt).getTime() > s);
}
export async function getDoc(col, id) { const d = load().docs[col + "/" + id]; return d && !d.deleted ? d.data : null; }
export async function putDoc(col, id, data, deleted = false) {
  const d = { col, id, data: deleted ? null : data, deleted, updatedAt: now() };
  load().docs[col + "/" + id] = d; save(); return d;
}

export async function addNotif(n) { load().notifs.unshift({ ...n, read: false, createdAt: now() }); load().notifs.length = Math.min(load().notifs.length, 2000); save(); }
export async function listNotifs(userId, limit = 40) { return load().notifs.filter((n) => n.userId === userId).slice(0, limit); }
export async function markRead(userId, ids) { load().notifs.forEach((n) => { if (n.userId === userId && (ids === "all" || ids.includes(n.id))) n.read = true; }); save(); }

export async function getKV(k) { return load().kv[k] ?? null; }
export async function setKV(k, v) { load().kv[k] = v; save(); }

export async function putFile(buf, name, type) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  fs.mkdirSync(path.join(DIR, "files"), { recursive: true });
  fs.writeFileSync(path.join(DIR, "files", id), buf);
  load().kv["file:" + id] = { name, type }; save();
  return "/api/files/" + id + "/" + encodeURIComponent(name || "file");
}
export async function getFile(id) {
  const meta = load().kv["file:" + id]; if (!meta) return null;
  try { return { ...meta, buf: fs.readFileSync(path.join(DIR, "files", id)) }; } catch { return null; }
}
