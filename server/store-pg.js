// Production store: Neon Postgres (DATABASE_URL) for data, Vercel Blob (BLOB_READ_WRITE_TOKEN) for files.
import { neon } from "@neondatabase/serverless";

let sql = null, ready = null;
export const kind = "postgres";

export function init() {
  if (ready) return ready;
  sql = neon(process.env.DATABASE_URL);
  ready = (async () => {
    await sql`create table if not exists users (id text primary key, email text unique not null, name text, role text not null default 'member', prefs jsonb not null default '{}'::jsonb, invited_by text, created_at timestamptz not null default now())`;
    await sql`create table if not exists login_tokens (hash text primary key, email text not null, exp bigint not null)`;
    await sql`create table if not exists docs (col text not null, id text not null, data jsonb, deleted boolean not null default false, updated_at timestamptz not null default clock_timestamp(), primary key (col, id))`;
    await sql`create index if not exists docs_updated on docs (updated_at)`;
    await sql`create table if not exists notifications (id text primary key, user_id text not null, kind text, title text, body text, link text, read boolean not null default false, created_at timestamptz not null default now())`;
    await sql`create index if not exists notif_user on notifications (user_id, created_at desc)`;
    await sql`create table if not exists kv (k text primary key, v jsonb)`;
  })();
  return ready;
}
const user = (r) => r && { id: r.id, email: r.email, name: r.name, role: r.role, prefs: r.prefs || {}, invitedBy: r.invited_by, createdAt: r.created_at };

export async function countUsers() { const [r] = await sql`select count(*)::int as n from users`; return r.n; }
export async function getUser(id) { const [r] = await sql`select * from users where id=${id}`; return user(r); }
export async function getUserByEmail(email) { const [r] = await sql`select * from users where email=${email}`; return user(r); }
export async function listUsers() { return (await sql`select * from users order by created_at`).map(user); }
export async function createUser(u) {
  const [r] = await sql`insert into users (id,email,name,role,prefs,invited_by) values (${u.id},${u.email},${u.name || ""},${u.role},${JSON.stringify(u.prefs || {})}::jsonb,${u.invitedBy || null}) returning *`;
  return user(r);
}
export async function updateUser(id, p) {
  const cur = await getUser(id); if (!cur) return null;
  const n = { ...cur, ...p };
  const [r] = await sql`update users set name=${n.name || ""}, role=${n.role}, prefs=${JSON.stringify(n.prefs || {})}::jsonb where id=${id} returning *`;
  return user(r);
}
export async function deleteUser(id) { await sql`delete from users where id=${id}`; }

export async function putToken(hash, email, exp) { await sql`insert into login_tokens (hash,email,exp) values (${hash},${email},${exp}) on conflict (hash) do update set email=excluded.email, exp=excluded.exp`; }
export async function takeToken(hash) {
  const [r] = await sql`delete from login_tokens where hash=${hash} returning email, exp`;
  return r && Number(r.exp) > Date.now() ? r.email : null;
}

export async function listDocs(since) {
  const rows = since ? await sql`select * from docs where updated_at > ${since}` : await sql`select * from docs`;
  return rows.map((r) => ({ col: r.col, id: r.id, data: r.data, deleted: r.deleted, updatedAt: new Date(r.updated_at).toISOString() }));
}
export async function getDoc(col, id) { const [r] = await sql`select data from docs where col=${col} and id=${id} and not deleted`; return r ? r.data : null; }
export async function putDoc(col, id, data, deleted = false) {
  const [r] = await sql`insert into docs (col,id,data,deleted,updated_at) values (${col},${id},${deleted ? null : JSON.stringify(data)}::jsonb,${deleted},clock_timestamp())
    on conflict (col,id) do update set data=excluded.data, deleted=excluded.deleted, updated_at=clock_timestamp() returning *`;
  return { col, id, data: r.data, deleted: r.deleted, updatedAt: new Date(r.updated_at).toISOString() };
}

export async function addNotif(n) { await sql`insert into notifications (id,user_id,kind,title,body,link) values (${n.id},${n.userId},${n.kind},${n.title},${n.body || ""},${n.link || ""})`; }
export async function listNotifs(userId, limit = 40) {
  return (await sql`select * from notifications where user_id=${userId} order by created_at desc limit ${limit}`)
    .map((r) => ({ id: r.id, userId: r.user_id, kind: r.kind, title: r.title, body: r.body, link: r.link, read: r.read, createdAt: new Date(r.created_at).toISOString() }));
}
export async function markRead(userId, ids) {
  if (ids === "all") await sql`update notifications set read=true where user_id=${userId}`;
  else await sql`update notifications set read=true where user_id=${userId} and id = any(${ids})`;
}

export async function getKV(k) { const [r] = await sql`select v from kv where k=${k}`; return r ? r.v : null; }
export async function setKV(k, v) { await sql`insert into kv (k,v) values (${k},${JSON.stringify(v)}::jsonb) on conflict (k) do update set v=excluded.v`; }

export async function putFile(buf, name, type) {
  const { put } = await import("@vercel/blob");
  const r = await put("team-pulse/" + Date.now().toString(36) + "-" + (name || "file"), buf, { access: "public", contentType: type || "application/octet-stream", addRandomSuffix: true });
  return r.url;
}
export async function getFile() { return null; }
