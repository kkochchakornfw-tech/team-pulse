// In-app notifications + email for: project status changes, work assigned, meeting reminders,
// and a daily / weekly summary. Every notification respects the person's preferences.
import { newId } from "./auth.js";
import { sendMail, layout } from "./mail.js";
import { isAdmin } from "./access.js";

export const STATUS = { idea: "รอเริ่ม", doing: "กำลังทำ", stuck: "ค้าง / ติดปัญหา", review: "รอรีวิว", live: "รันอยู่ / เสร็จ" };
const TZ = "Asia/Bangkok";
const fmt = (iso, o) => new Date(iso).toLocaleString("th-TH", { timeZone: TZ, ...o });
export const DEFAULT_PREFS = { mailStatus: true, mailAssigned: true, mailMeeting: true, mailUpdates: true, mailMention: true, digest: "daily" };
const pref = (u, k) => ({ ...DEFAULT_PREFS, ...(u.prefs || {}) })[k];

async function deliver(store, appUrl, userId, n, mailKey) {
  const u = await store.getUser(userId); if (!u) return;
  await store.addNotif({ id: newId(), userId, kind: n.kind, title: n.title, body: n.body || "", link: n.link || "" });
  if (mailKey && pref(u, mailKey)) {
    const m = layout({ title: n.title, intro: n.body, rows: n.rows, cta: { label: n.cta || "เปิดใน Team Pulse", url: appUrl + "/" + (n.link || "") }, foot: "ปิดการแจ้งเตือนทางอีเมลได้ที่หน้าตั้งค่าในแอป" });
    await sendMail({ to: u.email, subject: n.title, ...m });
  }
}

/** Called after a project write. actor = user who made the change. */
export async function onProjectWrite(store, appUrl, actor, id, prev, next) {
  if (!next) return;
  const title = next.title || "โปรเจกต์ไม่มีชื่อ";
  const actorName = (await store.getDoc("members", actor.id))?.name || actor.email;
  const link = (next.requestedBy ? "#req-" : "#project-") + id;
  if (prev && prev.status !== next.status) {
    await store.putDoc("activity", newId(), { kind: "status", projectId: id, title, from: prev.status, to: next.status, actorId: actor.id, teamId: next.teamId || "", requestedBy: next.requestedBy || "", at: new Date().toISOString() });
    const to = new Set([next.ownerId, next.requestedBy, next.createdBy, ...(next.guestIds || [])].filter(Boolean)); to.delete(actor.id);
    for (const uid of to) await deliver(store, appUrl, uid, { kind: "status", title: `“${title}” เปลี่ยนเป็น ${STATUS[next.status] || next.status}`, body: `${actorName} เลื่อนสถานะจาก ${STATUS[prev.status] || prev.status} เป็น ${STATUS[next.status] || next.status}`, link: (next.guestIds || []).includes(uid) ? "#req-" + id : link, rows: [["โปรเจกต์", title], ["สถานะใหม่", STATUS[next.status] || next.status], ["โดย", actorName]] }, "mailStatus");
  }
  if (prev && (next.statusNote || "") !== (prev.statusNote || "") && next.statusNote) for (const uid of new Set([next.requestedBy, ...(next.guestIds || [])].filter((x) => x && x !== actor.id))) {
    await deliver(store, appUrl, uid, { kind: "update", title: `${actorName} อัปเดตว่ากำลังทำอะไรใน “${title}”`, body: next.statusNote, link: "#req-" + id, rows: [["งาน", title], ["ตอนนี้กำลังทำ", next.statusNote], ["สถานะ", STATUS[next.status] || next.status]], cta: "เปิดห้องงาน" }, "mailUpdates");
  }
  const assigned = next.ownerId &&(!prev || prev.ownerId !== next.ownerId) && next.ownerId !== actor.id;
  if (assigned) {
    const byGuest = actor.role === "guest";
    await deliver(store, appUrl, next.ownerId, { kind: "assigned", title: byGuest ? `${actorName} สั่งงานใหม่: ${title}` : `มีงานมอบหมายให้คุณ: ${title}`, body: (next.notes || "").slice(0, 280), link, rows: [["งาน", title], ["มอบหมายโดย", actorName], ...(next.due ? [["กำหนดส่ง", fmt(next.due + "T00:00:00+07:00", { day: "numeric", month: "long", year: "numeric" })]] : [])] }, "mailAssigned");
  }
  if (!prev && actor.role === "guest" && !next.ownerId) {
    for (const u of (await store.listUsers()).filter(isAdmin)) await deliver(store, appUrl, u.id, { kind: "assigned", title: `${actorName} ส่งคำของานใหม่: ${title}`, body: "ยังไม่ได้ระบุคนรับผิดชอบ เปิดเพื่อมอบหมายงาน", link }, "mailAssigned");
  }
}

/** Meetings starting in the next 15 minutes: remind each attendee once. */
export async function runReminders(store, appUrl) {
  const nowMs = Date.now(), soon = nowMs + 15 * 60000;
  const evs = (await store.listDocs(null)).filter((d) => d.col === "events" && !d.deleted && d.data && d.data.start && new Date(d.data.start).getTime() > nowMs && new Date(d.data.start).getTime() <= soon);
  let n = 0;
  for (const e of evs) {
    for (const uid of e.data.memberIds || []) {
      const key = `rem:${e.id}:${e.data.start}:${uid}`;
      if (await store.getKV(key)) continue;
      await store.setKV(key, 1); n++;
      const mins = Math.max(1, Math.round((new Date(e.data.start).getTime() - nowMs) / 60000));
      await deliver(store, appUrl, uid, { kind: "meeting", title: `อีก ${mins} นาทีประชุม: ${e.data.title || "ประชุม"}`, body: e.data.place ? "ที่ " + e.data.place : "", link: "#calendar", rows: [["เวลา", fmt(e.data.start, { hour: "2-digit", minute: "2-digit" }) + "–" + fmt(e.data.end, { hour: "2-digit", minute: "2-digit" })], ...(e.data.place ? [["ที่", e.data.place]] : [])] }, "mailMeeting");
    }
  }
  return n;
}

/** Daily or weekly summary email per person. */
export async function runDigest(store, appUrl, period) {
  const docs = (await store.listDocs(null)).filter((d) => !d.deleted && d.data);
  const projects = docs.filter((d) => d.col === "projects"), events = docs.filter((d) => d.col === "events"), acts = docs.filter((d) => d.col === "activity");
  const since = Date.now() - (period === "weekly" ? 7 : 1) * 86400000;
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  let sent = 0;
  for (const u of await store.listUsers()) {
    const d = pref(u, "digest"); if (d === "off" || (d !== "both" && d !== period)) continue;
    let list = [], rows = [];
    if (u.role === "guest") {
      const mine = projects.filter((p) => p.data.requestedBy === u.id);
      if (!mine.length) continue;
      list = mine.map((p) => `${p.data.title || "ไม่มีชื่อ"} — ${STATUS[p.data.status] || p.data.status}`);
    } else {
      const mine = projects.filter((p) => p.data.ownerId === u.id);
      const doing = mine.filter((p) => p.data.status === "doing"), stuck = mine.filter((p) => p.data.status === "stuck");
      const done = acts.filter((a) => a.data.to === "live" && new Date(a.data.at).getTime() > since && (isAdmin(u) || mine.some((p) => p.id === a.data.projectId)));
      const meets = events.filter((e) => (e.data.memberIds || []).includes(u.id) && new Date(e.data.start).toLocaleDateString("en-CA", { timeZone: TZ }) === todayKey);
      rows = [["งานที่ทำอยู่", doing.length + " โปรเจกต์"], ["ค้าง / ติดปัญหา", stuck.length + " โปรเจกต์"], [period === "weekly" ? "เสร็จสัปดาห์นี้" : "เสร็จเมื่อวาน–วันนี้", done.length + " โปรเจกต์"], ["ประชุมวันนี้", meets.length + " นัด"]];
      list = [...stuck.map((p) => "ค้าง: " + (p.data.title || "ไม่มีชื่อ")), ...doing.slice(0, 6).map((p) => "กำลังทำ: " + (p.data.title || "ไม่มีชื่อ")), ...meets.map((e) => `ประชุม ${fmt(e.data.start, { hour: "2-digit", minute: "2-digit" })} ${e.data.title || ""}`)];
      if (!mine.length && !meets.length && !done.length) continue;
    }
    const m = layout({ title: period === "weekly" ? "สรุปงานประจำสัปดาห์" : "สรุปงานวันนี้", intro: u.role === "guest" ? "สถานะงานที่คุณสั่งไว้" : "งานของคุณใน Team Pulse", rows, list, cta: { label: "เปิดแดชบอร์ด", url: appUrl + "/#dashboard" }, foot: "เปลี่ยนความถี่ของสรุปงานได้ที่หน้าตั้งค่าในแอป" });
    await sendMail({ to: u.email, subject: (period === "weekly" ? "สรุปประจำสัปดาห์" : "สรุปวันนี้") + " · Team Pulse", ...m }); sent++;
  }
  return sent;
}

/** Runs reminders every minute and digests once a day/week, whenever any signed-in person is using the app.
 *  The cron endpoint does the same on a schedule, so mail still goes out when nobody has the app open. */
export async function lazyJobs(store, appUrl) {
  const now = Date.now();
  const last = Number(await store.getKV("job:reminders")) || 0;
  if (now - last > 60000) { await store.setKV("job:reminders", now); await runReminders(store, appUrl); }
  const bkk = new Date(now + 7 * 3600000); // Asia/Bangkok, no DST
  if (bkk.getUTCHours() >= 8) {
    const day = bkk.toISOString().slice(0, 10);
    if ((await store.getKV("job:daily")) !== day) { await store.setKV("job:daily", day); await runDigest(store, appUrl, "daily"); }
    if (bkk.getUTCDay() === 1 && (await store.getKV("job:weekly")) !== day) { await store.setKV("job:weekly", day); await runDigest(store, appUrl, "weekly"); }
  }
}

const contactRows = (who, m, u) => [[who, (m && m.name) || (u && u.email) || "-"], ["อีเมล", (u && u.email) || (m && m.email) || "-"], ...(m && m.line ? [["Line", m.line]] : [])];

/** A team member took a request: introduce the two people to each other by email. */
export async function onClaim(store, appUrl, dev, projectId, project) {
  const devM = await store.getDoc("members", dev.id);
  const reqU = project.requestedBy ? await store.getUser(project.requestedBy) : null;
  const reqM = reqU ? await store.getDoc("members", reqU.id) : null;
  const title = project.title || "งานไม่มีชื่อ", link = "#req-" + projectId;
  await store.putDoc("activity", newId(), { kind: "claim", projectId, title, to: project.status || "idea", actorId: dev.id, teamId: project.teamId || "", requestedBy: project.requestedBy || "", at: new Date().toISOString() });
  if (reqU) {
    await store.addNotif({ id: newId(), userId: reqU.id, kind: "claim", title: `${(devM && devM.name) || dev.email} รับงาน “${title}” แล้ว`, body: "ติดต่อกันได้โดยตรง และติดตามความคืบหน้าได้ในห้องงาน", link });
    if (pref(reqU, "mailAssigned")) {
      const m = layout({ title: `มีคนรับงาน “${title}” แล้ว`, intro: "ต่อจากนี้คุณจะได้แจ้งเตือนทุกครั้งที่มีความคืบหน้า ติดต่อผู้รับงานได้โดยตรงตามช่องทางนี้", rows: contactRows("ผู้รับงาน", devM, dev), cta: { label: "เปิดห้องงาน", url: appUrl + "/" + link } });
      await sendMail({ to: reqU.email, subject: `รับงานแล้ว: ${title}`, ...m });
    }
  }
  if (pref(dev, "mailAssigned")) {
    const m = layout({ title: `คุณรับงาน “${title}” แล้ว`, intro: reqU ? "นี่คือช่องทางติดต่อผู้สั่งงาน โพสต์อัปเดตในห้องงานเพื่อให้ผู้สั่งงานเห็นความคืบหน้า" : "", rows: reqU ? contactRows("ผู้สั่งงาน", reqM, reqU) : [["งาน", title]], cta: { label: "เปิดห้องงาน", url: appUrl + "/" + link } });
    await sendMail({ to: dev.email, subject: `คุณรับงาน: ${title}`, ...m });
  }
}

/** An update or a comment was posted in a request room: tell the other side. */
export async function onUpdate(store, appUrl, author, project, projectId, text) {
  const authorName = (await store.getDoc("members", author.id))?.name || author.email;
  const title = project.title || "งานไม่มีชื่อ", link = "#req-" + projectId;
  const to = new Set([project.ownerId, project.requestedBy, project.createdBy, ...(project.guestIds || [])].filter(Boolean)); to.delete(author.id);
  for (const uid of to) await deliver(store, appUrl, uid, { kind: "update", title: `${authorName} ${author.role === "guest" ? "คอมเมนต์ใน" : "อัปเดต"} “${title}”`, body: String(text).slice(0, 280), link, cta: "เปิดห้องงาน" }, "mailUpdates");
}

/** Someone was @mentioned in a comment: tell only the newly mentioned people. */
export async function onComment(store, appUrl, author, parent, c, prev) {
  const fresh = (c.mentions || []).filter((u) => !(prev && (prev.mentions || []).includes(u)));
  if (!fresh.length) return;
  const authorName = (await store.getDoc("members", author.id))?.name || author.email;
  const title = parent.title || (parent._col === "pages" ? "หน้าไม่มีชื่อ" : "โปรเจกต์ไม่มีชื่อ");
  const link = parent._col === "pages" ? "#page-" + parent._id : (parent.requestedBy ? "#req-" : "#project-") + parent._id;
  // turn @{id} back into @name for the notification text
  let text = c.text;
  for (const id of new Set((c.text.match(/@\{([A-Za-z0-9]+)\}/g) || []).map((m) => m.slice(2, -1)))) {
    const m = await store.getDoc("members", id), u = m ? null : await store.getUser(id);
    text = text.split("@{" + id + "}").join("@" + ((m && m.name) || (u && (u.name || u.email)) || "ใครบางคน"));
  }
  for (const uid of fresh) await deliver(store, appUrl, uid, { kind: "mention", title: `${authorName} พูดถึงคุณใน “${title}”`, body: text.slice(0, 400), link, cta: "เปิดดูคอมเมนต์" }, "mailMention");
}

/** An existing outside person was added to a project's followers. */
export async function onFollow(store, appUrl, uid, inviter, projectId, title) {
  await deliver(store, appUrl, uid, { kind: "assigned", title: `${inviter} เชิญคุณติดตามโปรเจกต์ “${title}”`, body: "ดูได้ว่างานถึงขั้นไหนแล้ว และจะได้แจ้งเตือนทุกครั้งที่สถานะเปลี่ยน", link: "#req-" + projectId, cta: "ดูความคืบหน้า" }, "mailAssigned");
}

/** A page was shared with new people (or someone got edit rights): tell them. */
export async function onShare(store, appUrl, actor, id, prev, next) {
  const before = (prev && prev.people) || {}, now = next.people || {};
  const fresh = Object.keys(now).filter((u) => u !== actor.id && (!before[u] || (before[u] === "view" && now[u] === "edit")));
  if (!fresh.length) return;
  const actorName = (await store.getDoc("members", actor.id))?.name || actor.email, title = next.title || "หน้าไม่มีชื่อ";
  for (const uid of fresh) await deliver(store, appUrl, uid, { kind: "share", title: `${actorName} แชร์หน้า “${title}” ให้คุณ`, body: now[uid] === "edit" ? "คุณดูและแก้หน้านี้ได้" : "คุณดูหน้านี้ได้", link: "#page-" + id, cta: "เปิดหน้า" }, "mailMention");
}
