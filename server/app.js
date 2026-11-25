// Team Pulse API. One handler for Vercel (api/index.js) and the Vite dev server (vite.config.js).
import * as fileStore from "./store-file.js";
import { COOKIE, sessionUid, sessionCookie, clearCookie, newToken, hashToken, newId } from "./auth.js";
import { ROLES, COLS, isAdmin, canRead, canWrite, shape, pageRole } from "./access.js";
import { sendMail, layout, outbox, mailMode } from "./mail.js";
import { onProjectWrite, onClaim, onUpdate, onComment, onFollow, onShare, runReminders, runDigest, lazyJobs, DEFAULT_PREFS } from "./notify.js";
void COOKIE;

let storeP = null;
async function getStore() {
  if (!storeP) storeP = (async () => {
    const s = process.env.DATABASE_URL ? await import("./store-pg.js") : fileStore;
    await s.init(); return s;
  })();
  return storeP;
}

const COLORS = ["pink", "orange", "yellow", "green", "teal", "blue"];
const validEmail = (e) => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length < 200;
const appUrl = (req) => (process.env.APP_URL || `${req.headers["x-forwarded-proto"] || (String(req.headers.host).startsWith("localhost") ? "http" : "https")}://${req.headers.host}`).replace(/\/$/, "");

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  if (body === undefined) return res.end();
  if (Buffer.isBuffer(body)) return res.end(body);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
async function readBody(req, raw = false) {
  if (req.body !== undefined && req.body !== null) {
    if (raw) return Buffer.isBuffer(req.body) ? req.body : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString() || "{}");
    return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  }
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 20 * 1048576) throw Object.assign(new Error("too large"), { status: 413 }); chunks.push(c); }
  const buf = Buffer.concat(chunks);
  return raw ? buf : (buf.length ? JSON.parse(buf.toString()) : {});
}

async function teamsMap(store) {
  const m = {}; for (const d of await store.listDocs(null)) if (d.col === "teams" && !d.deleted && d.data) m[d.id] = d.data; return m;
}
async function ensureMember(store, u) {
  const cur = await store.getDoc("members", u.id);
  const base = cur || { name: u.name || u.email.split("@")[0], role: "", color: COLORS[Math.floor(Math.random() * COLORS.length)], avatar: "a:" + Math.floor(Math.random() * 16), busyUntil: "", busyNote: "" };
  const next = { ...base, access: u.role, email: u.email, guest: u.role === "guest" };
  if (!cur || cur.access !== next.access || cur.email !== next.email || cur.guest !== next.guest) await store.putDoc("members", u.id, next);
}
const publicUser = (u) => u && { id: u.id, email: u.email, name: u.name, role: u.role, prefs: { ...DEFAULT_PREFS, ...(u.prefs || {}) } };

async function sendLoginLink(store, req, email, { invite = false, inviter = "", project = "" } = {}) {
  const token = newToken();
  await store.putToken(hashToken(token), email, Date.now() + (invite ? 7 * 86400000 : 20 * 60000));
  const url = `${appUrl(req)}/api/auth/verify?token=${token}`;
  const m = invite
    ? project ? layout({ title: `${inviter || "ทีม"} เชิญคุณติดตามโปรเจกต์ “${project}”`, intro: "คุณจะเห็นว่างานถึงขั้นไหนแล้ว ทีมกำลังทำอะไรอยู่ และได้แจ้งเตือนทุกครั้งที่สถานะเปลี่ยน กดปุ่มด้านล่างเพื่อเข้าดู ลิงก์ใช้ได้ 7 วันและใช้ได้ครั้งเดียว", cta: { label: "ดูความคืบหน้า", url }, foot: "ถ้าคุณไม่ได้คาดว่าจะได้รับอีเมลนี้ ปล่อยผ่านได้เลย" })
    : layout({ title: "คุณได้รับคำเชิญเข้า Team Pulse", intro: `${inviter || "ทีม"} เชิญคุณเข้าใช้สมุดของทีม กดปุ่มด้านล่างเพื่อเข้าสู่ระบบ ลิงก์ใช้ได้ 7 วันและใช้ได้ครั้งเดียว`, cta: { label: "เข้าสู่ Team Pulse", url }, foot: "ถ้าคุณไม่ได้คาดว่าจะได้รับอีเมลนี้ ปล่อยผ่านได้เลย" })
    : layout({ title: "ลิงก์เข้าสู่ระบบ Team Pulse", intro: "กดปุ่มด้านล่างเพื่อเข้าสู่ระบบ ลิงก์ใช้ได้ 20 นาทีและใช้ได้ครั้งเดียว", cta: { label: "เข้าสู่ระบบ", url }, foot: "ถ้าคุณไม่ได้ขอลิงก์นี้ ปล่อยผ่านได้เลย" });
  await sendMail({ to: email, subject: project ? `คำเชิญติดตามโปรเจกต์: ${project}` : invite ? "คำเชิญเข้า Team Pulse" : "ลิงก์เข้าสู่ระบบ Team Pulse", ...m });
  return url;
}

export async function handle(req, res) {
  try {
    const store = await getStore();
    const url = new URL(req.originalUrl || req.url, "http://x");
    let p = url.pathname.replace(/^\/api/, "") || "/";
    if (url.searchParams.get("path") && p === "/index") p = "/" + url.searchParams.get("path");
    const m = req.method;
    const dev = mailMode() === "dev";
    const prod = !!process.env.VERCEL; // on the real site, never hand out login links in the page

    if (p === "/health") return send(res, 200, { ok: true, mode: "api", storage: store.kind, mail: mailMode() });

    /* ---------- auth ---------- */
    if (p === "/auth/request" && m === "POST") {
      const { email: raw } = await readBody(req); const email = String(raw || "").trim().toLowerCase();
      if (!validEmail(email)) return send(res, 400, { error: "อีเมลไม่ถูกต้อง" });
      const last = Number(await store.getKV("loginmail:" + email)) || 0;
      if (Date.now() - last < 45000) return send(res, 429, { error: "เพิ่งส่งลิงก์ไปเมื่อสักครู่ รอ 1 นาทีแล้วลองใหม่" });
      const known = await store.getUserByEmail(email); const first = (await store.countUsers()) === 0;
      let link = null;
      if (known || first || process.env.ALLOW_SIGNUP === "1") { await store.setKV("loginmail:" + email, Date.now()); link = await sendLoginLink(store, req, email); }
      // without email set up on the real site, only the very first sign-in (the owner) gets its link on screen
      const showLink = dev && (!prod || first);
      return send(res, 200, { ok: true, first, devLink: showLink ? link : undefined, devNote: dev && !link ? "อีเมลนี้ยังไม่ได้รับเชิญ ให้ผู้ดูแลเชิญก่อน" : dev && !showLink ? "ยังไม่ได้ตั้งค่าส่งอีเมล ขอลิงก์เข้าสู่ระบบจากผู้ดูแลแอป" : undefined });
    }
    if (p === "/auth/verify" && m === "GET") {
      const email = await store.takeToken(hashToken(url.searchParams.get("token") || ""));
      if (!email) return send(res, 302, undefined, { Location: "/?login=expired" });
      let u = await store.getUserByEmail(email);
      if (!u) {
        const first = (await store.countUsers()) === 0;
        if (!first && process.env.ALLOW_SIGNUP !== "1") return send(res, 302, undefined, { Location: "/?login=denied" });
        u = await store.createUser({ id: newId(), email, name: email.split("@")[0], role: first ? "owner" : "member" });
      }
      await ensureMember(store, u);
      return send(res, 302, undefined, { Location: "/", "Set-Cookie": sessionCookie(req, u.id) });
    }
    if (p === "/auth/logout" && m === "POST") return send(res, 200, { ok: true }, { "Set-Cookie": clearCookie(req) });

    /* ---------- cron (Vercel Cron sends Authorization: Bearer CRON_SECRET) ---------- */
    if (p === "/cron") {
      const ok = process.env.CRON_SECRET ? req.headers.authorization === "Bearer " + process.env.CRON_SECRET : !prod;
      if (!ok) return send(res, 401, { error: "unauthorized" });
      const job = url.searchParams.get("job");
      if (job === "reminders") return send(res, 200, { sent: await runReminders(store, appUrl(req)) });
      if (job === "digest") {
        const period = url.searchParams.get("period") === "weekly" ? "weekly" : "daily";
        const day = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
        if ((await store.getKV("job:" + period)) === day) return send(res, 200, { sent: 0, note: "already sent today" });
        await store.setKV("job:" + period, day);
        return send(res, 200, { sent: await runDigest(store, appUrl(req), period) });
      }
      return send(res, 400, { error: "unknown job" });
    }
    if (p === "/dev/outbox" && dev && !prod) return send(res, 200, outbox.map(({ html, ...r }) => r));

    const fm = p.match(/^\/files\/([a-z0-9]+)/i);
    if (fm && m === "GET") { const f = await store.getFile(fm[1]); return f ? send(res, 200, f.buf, { "Content-Type": f.type || "application/octet-stream", "Cache-Control": "private, max-age=3600" }) : send(res, 404, { error: "not found" }); }

    /* ---------- public showcase for the landing page: only projects an admin marked "showcase" ---------- */
    if (p === "/public/showcase" && m === "GET") {
      const out = [];
      for (const d of await store.listDocs(null)) {
        if (d.col !== "projects" || d.deleted || !d.data || d.data.showcase !== true) continue;
        const x = d.data;
        out.push({ id: d.id, title: String(x.title || "").slice(0, 120), status: x.status || "idea", note: String(x.statusNote || "").slice(0, 200), cover: x.cover || "", coverImg: /^(\/api\/files\/[a-z0-9]+(\/[^/]*)?|https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\/\S+)$/i.test(x.coverImg || "") ? x.coverImg : "", url: x.status === "live" && /^https?:\/\//.test(x.url || "") ? x.url : "", updatedAt: d.updatedAt });
      }
      out.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      return send(res, 200, { projects: out.slice(0, 9) }, { "Cache-Control": "no-cache" });
    }

    /* ---------- everything below needs a session ---------- */
    const uid = sessionUid(req); const me = uid && (await store.getUser(uid));
    if (!me) return send(res, 401, { error: "ต้องเข้าสู่ระบบก่อน" }, uid ? { "Set-Cookie": clearCookie(req) } : {});

    if (p === "/me" && m === "GET") return send(res, 200, { user: publicUser(me), mode: "api", storage: store.kind, mail: mailMode() });
    if (p === "/me" && m === "PATCH") {
      const b = await readBody(req); const patch = {};
      if (b.prefs && typeof b.prefs === "object") patch.prefs = { ...(me.prefs || {}), ...b.prefs };
      if (typeof b.name === "string") patch.name = b.name.slice(0, 60);
      return send(res, 200, { user: publicUser(await store.updateUser(me.id, patch)) });
    }

    if (p === "/sync" && m === "GET") {
      await lazyJobs(store, appUrl(req)).catch((e) => console.error("[jobs]", e));
      const since = url.searchParams.get("since");
      const teams = await teamsMap(store);
      const all = await store.listDocs(since ? new Date(new Date(since).getTime() - 3000).toISOString() : null);
      const docs = [], ctx = { contacts: new Set() };
      const follows = new Set(); // projects this guest was invited to watch
      if (me.role === "guest") for (const d of await store.listDocs(null)) if (d.col === "projects" && !d.deleted && d.data) {
        if (d.data.requestedBy === me.id && d.data.ownerId) ctx.contacts.add(d.data.ownerId);
        if ((d.data.guestIds || []).includes(me.id)) follows.add(d.id);
      }
      // a follower also sees the project's timeline and its comments
      const followed = (d) => {
        const t = String(d.data.target || "");
        const pid = d.col === "comments" ? (t.startsWith("project:") ? t.slice(8) : "") : (d.col === "activity" || d.col === "updates") ? d.data.projectId : "";
        return !!pid && follows.has(pid);
      };
      const sinceMs = since ? new Date(since).getTime() : 0;
      const pages = {}; for (const d of await store.listDocs(null)) if (d.col === "pages" && !d.deleted && d.data) pages[d.id] = d.data;
      const onPage = (d) => { const t = String((d.col === "comments" ? d.data.target : d.col === "stickers" ? d.data.surface : "") || ""); return t.startsWith("page:") ? t.slice(5) : null; };
      for (const d of all) {
        if (!COLS.includes(d.col)) continue;
        if (d.deleted) { docs.push({ col: d.col, id: d.id, deleted: true, updatedAt: d.updatedAt }); continue; }
        const pg = onPage(d);
        if (pg !== null ? pageRole(me, pages[pg], teams) !== "none" : canRead(me, d.col, d.id, d.data, teams) || (me.role === "guest" && followed(d))) docs.push({ col: d.col, id: d.id, data: shape(me, d.col, d.data, d.id, ctx), updatedAt: d.updatedAt });
        else if (since) docs.push({ col: d.col, id: d.id, deleted: true, updatedAt: d.updatedAt });
      }
      void sinceMs;
      // a guest's contact set changes when someone claims their request: resend the members it unlocks
      if (since && me.role === "guest") for (const d of await store.listDocs(null)) if (d.col === "members" && ctx.contacts.has(d.id) && !docs.some((x) => x.col === "members" && x.id === d.id) && d.data) docs.push({ col: "members", id: d.id, data: shape(me, "members", d.data, d.id, ctx), updatedAt: d.updatedAt });
      const notifs = await store.listNotifs(me.id, 40);
      return send(res, 200, { now: new Date().toISOString(), full: !since, docs, notifications: notifs });
    }

    const dm = p.match(/^\/docs\/([a-z]+)\/([A-Za-z0-9_\-.:]{1,80})$/);
    if (dm) {
      const [, col, id] = dm; if (!COLS.includes(col)) return send(res, 404, { error: "ไม่รู้จักข้อมูลชนิดนี้" });
      const teams = await teamsMap(store); const prev = await store.getDoc(col, id);
      let next = null;
      if (m === "PUT") next = await readBody(req);
      else if (m === "PATCH") { if (!prev) return send(res, 404, { error: "ไม่พบข้อมูลนี้" }); next = { ...prev, ...(await readBody(req)) }; }
      else if (m !== "DELETE") return send(res, 405, { error: "method" });
      if (next && (typeof next !== "object" || Array.isArray(next))) return send(res, 400, { error: "ข้อมูลไม่ถูกต้อง" });
      if (next && JSON.stringify(next).length > 900000) return send(res, 413, { error: "ข้อมูลใหญ่เกินไป" });
      if (prev && !canRead(me, col, id, prev, teams)) return send(res, 404, { error: "ไม่พบข้อมูลนี้" });
      let parent = null;
      if (col === "stickers" && next && !prev) {
        // fill visibility from what the sticker is stuck on
        const [kind, tid] = String(next.surface || "").split(":");
        const sid = String(next.sid || "");
        if (!/^[dp]\d{1,2}$/.test(sid)) return send(res, 400, { error: "ไม่รู้จักสติกเกอร์นี้" });
        let teamId = "", requestedBy = "";
        if (kind === "view") { if (me.role === "guest" || !/^[a-z]{2,20}$/.test(tid || "")) return send(res, 403, { error: "ติดสติกเกอร์ตรงนี้ไม่ได้" }); }
        else {
          const tcol = kind === "page" ? "pages" : (kind === "project" || kind === "req") ? "projects" : null;
          const target = tcol && (await store.getDoc(tcol, tid || ""));
          if (!target || !canRead(me, tcol, tid, target, teams)) return send(res, 404, { error: "ไม่พบที่ที่จะติด" });
          teamId = target.teamId || ""; requestedBy = target.requestedBy || "";
          if (me.role === "guest" && requestedBy !== me.id) return send(res, 403, { error: "ติดสติกเกอร์ตรงนี้ไม่ได้" });
        }
        const num = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || 0));
        next = { surface: `${kind}:${tid}`, sid, x: num(next.x, 0, 1), y: num(next.y, 0, 20000), rot: num(next.rot, -20, 20), by: me.id, at: new Date().toISOString(), teamId, requestedBy, view: kind === "view" };
      } else if (col === "stickers" && next && prev) {
        next = { ...prev, x: Math.min(1, Math.max(0, Number(next.x) || 0)), y: Math.min(20000, Math.max(0, Number(next.y) || 0)), rot: Number(next.rot) || 0 };
      }
      if (col === "updates" && next) {
        parent = await store.getDoc("projects", String(next.projectId || ""));
        if (!parent || !canRead(me, "projects", next.projectId, parent, teams)) return send(res, 404, { error: "ไม่พบงานนี้" });
        const text = String(next.text || "").trim().slice(0, 4000);
        const stk = /^[dp]\d{1,2}$/.test(String(next.sticker || "")) ? String(next.sticker) : "";
        if (!text && !(next.files || []).length && !stk) return send(res, 400, { error: "เขียนข้อความก่อนส่ง" });
        next = { projectId: next.projectId, text, sticker: stk, files: Array.isArray(next.files) ? next.files.slice(0, 10) : [], kind: me.role === "guest" ? "comment" : "update", authorId: me.id, requestedBy: parent.requestedBy || "", teamId: parent.teamId || "", at: new Date().toISOString() };
      }
      if (col === "comments" && next) {
        // where the comment lives decides who sees it; mentions only of people who can see that place
        const [kind, tid] = String((prev || next).target || "").split(":");
        const tcol = kind === "page" ? "pages" : kind === "project" ? "projects" : null;
        parent = tcol && (await store.getDoc(tcol, tid || ""));
        if (!parent || !canRead(me, tcol, tid, parent, teams)) return send(res, 404, { error: "ไม่พบหน้าที่จะคอมเมนต์" });
        const text = String(next.text || "").trim().slice(0, 4000);
        if (!text) return send(res, 400, { error: "เขียนข้อความก่อนส่ง" });
        const vis = { teamId: parent.teamId || "", requestedBy: parent.requestedBy || "", guestIds: parent.guestIds || [] };
        const mentions = [];
        for (const uid of new Set(Array.isArray(next.mentions) ? next.mentions.map(String).slice(0, 20) : [])) {
          const mu = uid !== me.id && text.includes("@{" + uid + "}") && (await store.getUser(uid));
          if (mu && (tcol === "pages" ? pageRole(mu, parent, teams) !== "none" : canRead(mu, "comments", "", vis, teams))) mentions.push(uid);
        }
        next = prev ? { ...prev, text, mentions, editedAt: new Date().toISOString() }
          : { target: `${kind}:${tid}`, text, mentions, authorId: me.id, ...vis, at: new Date().toISOString() };
        parent = { ...parent, _col: tcol, _id: tid };
      }
      if (col === "pages" && next) {
        // whoever first sets the sharing of a page that has no recorded owner becomes its owner
        const shareOf = (x) => JSON.stringify([x.share === "private" ? "private" : "team", x.teamAccess === "view" ? "view" : "edit", x.people || {}, x.guestIds || []]);
        const shareChanged = !!prev && (shareOf(prev) !== shareOf(next) || next.claimOwner === true);
        delete next.claimOwner;
        next.createdBy = prev ? prev.createdBy || (shareChanged ? me.id : "") : me.id;
        if (next.share !== "private") next.share = "team";
        if (next.teamAccess !== "view") next.teamAccess = "edit";
        const ppl = {};
        for (const [uid, r] of Object.entries(next.people && typeof next.people === "object" ? next.people : {}).slice(0, 200)) {
          const pu = /^[A-Za-z0-9]{4,40}$/.test(uid) && uid !== next.createdBy && (await store.getUser(uid));
          if (pu) ppl[uid] = pu.role === "guest" ? "view" : r === "edit" ? "edit" : "view";
        }
        next.people = ppl;
        // never lock yourself out: whoever saves a private page keeps edit access
        if (next.share === "private" && next.createdBy !== me.id && !ppl[me.id] && !(isAdmin(me) && !next.createdBy)) ppl[me.id] = "edit";
      }
      if (col === "members" && next) { const u = await store.getUser(id); next.access = u ? u.role : (prev && prev.access) || ""; next.email = u ? u.email : prev?.email || ""; next.guest = next.access === "guest"; }
      if (col === "projects" && next) {
        if (!prev) { next.createdBy = me.id; if (me.role === "guest") next.requestedBy = me.id; }
        else { next.createdBy = prev.createdBy; next.requestedBy = prev.requestedBy || ""; }
        if (next.status === "live" && (!prev || prev.status !== "live")) next.doneAt = new Date().toISOString();
        next.updatedBy = me.id;
        if (!isAdmin(me)) next.showcase = !!(prev && prev.showcase); // only admins choose what goes public
      }
      if (!canWrite(me, col, id, prev, next, teams)) return send(res, 403, { error: me.role === "guest" ? "คนนอกแก้ข้อมูลนี้ไม่ได้" : "คุณไม่มีสิทธิ์แก้ข้อมูลนี้" });
      const saved = await store.putDoc(col, id, next, next === null);
      if (col === "projects") await onProjectWrite(store, appUrl(req), me, id, prev, next).catch((e) => console.error("[notify]", e));
      if (col === "pages" && next) await onShare(store, appUrl(req), me, id, prev, next).catch((e) => console.error("[notify]", e));
      if (col === "comments" && next) await onComment(store, appUrl(req), me, parent, next, prev).catch((e) => console.error("[notify]", e));
      if (col === "updates" && next) await onUpdate(store, appUrl(req), me, parent, next.projectId, next.text || (next.sticker ? "ส่งสติกเกอร์มา" : "")).catch((e) => console.error("[notify]", e));
      return send(res, 200, { doc: { col, id, data: saved.data, deleted: saved.deleted, updatedAt: saved.updatedAt } });
    }

    /* ---------- requests: claim + team load ---------- */
    const cm = p.match(/^\/requests\/([A-Za-z0-9_\-.:]{1,80})\/claim$/);
    if (cm && m === "POST") {
      if (me.role === "guest") return send(res, 403, { error: "คนนอกรับงานไม่ได้" });
      const teams = await teamsMap(store); const proj = await store.getDoc("projects", cm[1]);
      if (!proj || !canRead(me, "projects", cm[1], proj, teams)) return send(res, 404, { error: "ไม่พบงานนี้" });
      if (proj.ownerId && proj.ownerId !== me.id) { const o = await store.getDoc("members", proj.ownerId); return send(res, 409, { error: `${(o && o.name) || "คนอื่น"} รับงานนี้ไปแล้ว` }); }
      const next = { ...proj, ownerId: me.id, claimedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), updatedBy: me.id };
      const saved = await store.putDoc("projects", cm[1], next);
      await onClaim(store, appUrl(req), me, cm[1], next).catch((e) => console.error("[notify]", e));
      return send(res, 200, { doc: { col: "projects", id: cm[1], data: saved.data, updatedAt: saved.updatedAt } });
    }
    if (p === "/stats" && m === "GET") {
      // aggregate counts only, safe to show anyone signed in (no titles of internal work)
      const projects = (await store.listDocs(null)).filter((d) => d.col === "projects" && !d.deleted && d.data);
      const open = projects.filter((d) => d.data.status !== "live");
      const queue = open.filter((d) => d.data.requestedBy && !d.data.ownerId).sort((a, b) => String(a.data.createdAt || a.updatedAt).localeCompare(String(b.data.createdAt || b.updatedAt)));
      if (me.role === "guest") return send(res, 200, { open: open.length });
      const mine = {};
      const staff = (await store.listUsers()).filter((u) => u.role !== "guest").length;
      return send(res, 200, { open: open.length, doing: open.filter((d) => d.data.status === "doing").length, stuck: open.filter((d) => d.data.status === "stuck").length, waiting: queue.length, done30: projects.filter((d) => d.data.doneAt && Date.now() - new Date(d.data.doneAt).getTime() < 30 * 86400000).length, staff, queuePos: mine });
    }

    if (p === "/notifications/read" && m === "POST") { const b = await readBody(req); await store.markRead(me.id, b.all ? "all" : (b.ids || []).map(String)); return send(res, 200, { ok: true }); }

    if (p === "/files" && m === "POST") {
      const buf = await readBody(req, true);
      const limit = process.env.DATABASE_URL ? 4.4 : 20;
      if (buf.length > limit * 1048576) return send(res, 413, { error: `ไฟล์ใหญ่เกิน ${Math.floor(limit)} MB`, limit: Math.floor(limit) });
      if (me.role === "guest" && buf.length > 10 * 1048576) return send(res, 413, { error: "ไฟล์ใหญ่เกินไป" });
      const name = String(url.searchParams.get("name") || "file").slice(0, 120), type = String(url.searchParams.get("type") || req.headers["content-type"] || "application/octet-stream");
      return send(res, 200, { url: await store.putFile(buf, name, type) });
    }

    /* ---------- people & roles (owner / admin) ---------- */
    /* ---------- backup: export everything / restore from a backup file (admins) ---------- */
    if (p === "/admin/export" && m === "GET") {
      if (!isAdmin(me)) return send(res, 403, { error: "เฉพาะผู้ดูแล" });
      const docs = (await store.listDocs(null)).filter((d) => COLS.includes(d.col) && !d.deleted && d.data).map(({ col, id, data, updatedAt }) => ({ col, id, data, updatedAt }));
      const users = (await store.listUsers()).map((u) => ({ id: u.id, email: u.email, name: u.name || "", role: u.role }));
      // files kept on this server (dev store) go inside the backup; Vercel Blob files keep their public URLs
      const files = {};
      for (const fid of new Set(JSON.stringify(docs).match(/\/api\/files\/[a-z0-9]+/gi) || [])) {
        const id = fid.split("/").pop(), f = await store.getFile(id);
        if (f) files[id] = { name: f.name || "file", type: f.type || "", b64: f.buf.toString("base64") };
      }
      const day = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
      return send(res, 200, { app: "team-pulse", version: 1, exportedAt: new Date().toISOString(), exportedBy: me.email, users, docs, files },
        { "Content-Disposition": `attachment; filename="team-pulse-backup-${day}.json"` });
    }
    if (p === "/admin/import" && m === "POST") {
      // the browser sends a backup in batches (users first, then docs); file references are already rewritten
      if (!isAdmin(me)) return send(res, 403, { error: "เฉพาะผู้ดูแล" });
      const b = await readBody(req);
      let users = 0, docs = 0, skipped = 0;
      const idMap = {}; // backup user id → id on this server (same email already here, or id taken)
      const hasOwner = (await store.listUsers()).some((u) => u.role === "owner");
      for (const u of Array.isArray(b.users) ? b.users : []) {
        const email = String(u.email || "").trim().toLowerCase();
        if (!validEmail(email)) { skipped++; continue; }
        const have = await store.getUserByEmail(email);
        if (have) { if (u.id && u.id !== have.id) idMap[u.id] = have.id; skipped++; continue; }
        const id = /^[A-Za-z0-9]{4,40}$/.test(u.id || "") && !(await store.getUser(u.id)) ? u.id : newId();
        if (u.id && u.id !== id) idMap[u.id] = id;
        let role = ROLES.includes(u.role) ? u.role : "member";
        if (role === "owner" && hasOwner) role = "admin";
        await store.createUser({ id, email, name: String(u.name || email.split("@")[0]).slice(0, 60), role, invitedBy: me.id });
        users++;
      }
      for (const d of Array.isArray(b.docs) ? b.docs : []) {
        if (!COLS.includes(d.col) || !/^[A-Za-z0-9_\-.:]{1,80}$/.test(d.id || "") || !d.data || typeof d.data !== "object" || Array.isArray(d.data)) { skipped++; continue; }
        await store.putDoc(d.col, d.id, d.data); docs++;
      }
      return send(res, 200, { ok: true, users, docs, skipped, idMap });
    }

    /* ---------- invite an outside person to follow one project ---------- */
    const pi = p.match(/^\/projects\/([A-Za-z0-9_\-.:]{1,80})\/invite$/);
    if (pi && m === "POST") {
      const teams = await teamsMap(store), proj = await store.getDoc("projects", pi[1]);
      if (!proj || !canRead(me, "projects", pi[1], proj, teams)) return send(res, 404, { error: "ไม่พบโปรเจกต์นี้" });
      if (me.role === "guest" || !canWrite(me, "projects", pi[1], proj, { ...proj, guestIds: [] }, teams)) return send(res, 403, { error: "คุณไม่มีสิทธิ์เชิญคนเข้าโปรเจกต์นี้" });
      const b = await readBody(req); const email = String(b.email || "").trim().toLowerCase();
      if (!validEmail(email)) return send(res, 400, { error: "อีเมลไม่ถูกต้อง" });
      let u = await store.getUserByEmail(email), created = false;
      if (u && u.role !== "guest") return send(res, 409, { error: "คนนี้เป็นคนในทีมอยู่แล้ว เห็นโปรเจกต์ได้ตามทีมที่อยู่" });
      if (!u) { u = await store.createUser({ id: newId(), email, name: String(b.name || email.split("@")[0]).slice(0, 60), role: "guest", invitedBy: me.id }); created = true; }
      await ensureMember(store, u);
      const ids = new Set(proj.guestIds || []); const already = ids.has(u.id); ids.add(u.id);
      await store.putDoc("projects", pi[1], { ...proj, guestIds: [...ids], updatedAt: new Date().toISOString(), updatedBy: me.id });
      const inviter = (await store.getDoc("members", me.id))?.name || me.email, title = proj.title || "โปรเจกต์ไม่มีชื่อ";
      let link = null;
      if (created) link = await sendLoginLink(store, req, email, { invite: true, inviter, project: title });
      else if (!already) await onFollow(store, appUrl(req), u.id, inviter, pi[1], title);
      return send(res, 200, { ok: true, user: { id: u.id, email: u.email, name: u.name }, created, already, devLink: dev ? link : undefined });
    }

    if (p === "/users" && m === "GET") {
      if (!isAdmin(me)) return send(res, 403, { error: "เฉพาะผู้ดูแล" });
      return send(res, 200, { users: (await store.listUsers()).map(publicUser) });
    }
    if (p === "/users/invite" && m === "POST") {
      if (!isAdmin(me)) return send(res, 403, { error: "เฉพาะผู้ดูแลเชิญคนได้" });
      const b = await readBody(req); const email = String(b.email || "").trim().toLowerCase(); const role = ROLES.includes(b.role) ? b.role : "member";
      if (!validEmail(email)) return send(res, 400, { error: "อีเมลไม่ถูกต้อง" });
      if (role === "owner" && me.role !== "owner") return send(res, 403, { error: "เฉพาะเจ้าของตั้งเจ้าของคนอื่นได้" });
      let u = await store.getUserByEmail(email);
      if (!u) u = await store.createUser({ id: newId(), email, name: String(b.name || email.split("@")[0]).slice(0, 60), role, invitedBy: me.id });
      await ensureMember(store, u);
      const inviter = (await store.getDoc("members", me.id))?.name || me.email;
      const link = await sendLoginLink(store, req, email, { invite: true, inviter });
      return send(res, 200, { user: publicUser(u), devLink: dev ? link : undefined });
    }
    const um = p.match(/^\/users\/([A-Za-z0-9]+)$/);
    if (um) {
      if (!isAdmin(me)) return send(res, 403, { error: "เฉพาะผู้ดูแล" });
      const target = await store.getUser(um[1]); if (!target) return send(res, 404, { error: "ไม่พบผู้ใช้" });
      const owners = (await store.listUsers()).filter((u) => u.role === "owner");
      if (m === "PATCH") {
        const b = await readBody(req); if (!ROLES.includes(b.role)) return send(res, 400, { error: "role ไม่ถูกต้อง" });
        if ((b.role === "owner" || target.role === "owner") && me.role !== "owner") return send(res, 403, { error: "เฉพาะเจ้าของเปลี่ยนสิทธิ์เจ้าของได้" });
        if (target.role === "owner" && b.role !== "owner" && owners.length < 2) return send(res, 400, { error: "ต้องมีเจ้าของอย่างน้อย 1 คน" });
        const u = await store.updateUser(target.id, { role: b.role }); await ensureMember(store, u);
        return send(res, 200, { user: publicUser(u) });
      }
      if (m === "DELETE") {
        if (target.id === me.id) return send(res, 400, { error: "ลบบัญชีตัวเองไม่ได้" });
        if (target.role === "owner" && me.role !== "owner") return send(res, 403, { error: "เฉพาะเจ้าของลบเจ้าของได้" });
        await store.deleteUser(target.id); await store.putDoc("members", target.id, null, true);
        return send(res, 200, { ok: true });
      }
    }
    return send(res, 404, { error: "ไม่พบเส้นทางนี้" });
  } catch (e) {
    console.error("[api]", e);
    return send(res, e.status || 500, { error: e.status === 413 ? "ข้อมูลใหญ่เกินไป" : "เซิร์ฟเวอร์มีปัญหา ลองอีกครั้ง" });
  }
}
