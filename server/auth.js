// Sessions are HMAC-signed cookies; login links carry a one-time random token whose hash is stored.
import crypto from "node:crypto";

const secret = () => {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.VERCEL) throw new Error("AUTH_SECRET is not set"); // never sign real sessions with the public dev key
  return "dev-only-secret-change-me";
};
export const COOKIE = "tp_session";
const DAY = 86400000;

export function sign(obj) {
  const p = Buffer.from(JSON.stringify(obj)).toString("base64url");
  const s = crypto.createHmac("sha256", secret()).update(p).digest("base64url");
  return p + "." + s;
}
export function verify(tok) {
  if (!tok || typeof tok !== "string") return null;
  const [p, s] = tok.split(".");
  if (!p || !s) return null;
  const e = crypto.createHmac("sha256", secret()).update(p).digest("base64url");
  if (s.length !== e.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(e))) return null;
  try { const o = JSON.parse(Buffer.from(p, "base64url").toString()); return o.exp > Date.now() ? o : null; } catch { return null; }
}
export const newToken = () => crypto.randomBytes(32).toString("base64url");
export const hashToken = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
export const newId = () => Date.now().toString(36) + crypto.randomBytes(5).toString("hex");

export function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) { const [k, ...v] = part.trim().split("="); if (k === name) return decodeURIComponent(v.join("=")); }
  return null;
}
function secureFlag(req) { const host = String(req.headers.host || ""); return /^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "" : "; Secure"; }
export function sessionCookie(req, uid) {
  const tok = sign({ uid, exp: Date.now() + 30 * DAY });
  return `${COOKIE}=${encodeURIComponent(tok)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${30 * 86400}${secureFlag(req)}`;
}
export function clearCookie(req) { return `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secureFlag(req)}`; }
export function sessionUid(req) { const s = verify(readCookie(req, COOKIE)); return s ? s.uid : null; }
