// Email through Resend's HTTP API. Without RESEND_API_KEY (local development) mail is kept in an
// outbox you can read at /api/dev/outbox and printed to the terminal.
export const outbox = [];
// Resend (own domain), or a Google Apps Script web app that sends from a Gmail account (GAS_MAIL_URL + GAS_MAIL_SECRET).
export const mailMode = () => (process.env.RESEND_API_KEY ? "resend" : process.env.GAS_MAIL_URL && process.env.GAS_MAIL_SECRET ? "gas" : "dev");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export async function sendMail({ to, subject, html, text }) {
  if (!to) return { skipped: true };
  if (mailMode() === "gas") {
    try {
      // Apps Script answers a POST with a redirect to the script's output; fetch follows it
      const r = await fetch(process.env.GAS_MAIL_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow",
        body: JSON.stringify({ secret: process.env.GAS_MAIL_SECRET, to, subject, html, text, name: process.env.MAIL_NAME || "Team Pulse" }) });
      const out = await r.text(); let j = null; try { j = JSON.parse(out); } catch (e) {}
      if (!r.ok || !j || !j.ok) console.error("[mail] Apps Script error", r.status, String(out).slice(0, 300));
      return { ok: !!(j && j.ok) };
    } catch (e) { console.error("[mail] Apps Script send failed", e); return { ok: false }; }
  }
  if (!process.env.RESEND_API_KEY) {
    outbox.unshift({ to, subject, text, html, at: new Date().toISOString() }); outbox.length = Math.min(outbox.length, 50);
    console.log(`[mail:dev] → ${to} · ${subject}${text ? "\n  " + text.split("\n").join("\n  ") : ""}`);
    return { dev: true };
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "Team Pulse <onboarding@resend.dev>", to: [to], subject, html, text }),
    });
    if (!r.ok) console.error("[mail] Resend error", r.status, await r.text());
    return { ok: r.ok };
  } catch (e) { console.error("[mail] send failed", e); return { ok: false }; }
}

/** Pastel card email that matches the app. rows: [label, value][]; cta: {label, url}. */
export function layout({ title, intro, rows = [], list = [], cta, foot }) {
  const html = `<!doctype html><html><body style="margin:0;background:#f8f3ea;font-family:'IBM Plex Sans Thai',Tahoma,sans-serif;color:#26221e">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border:1.5px solid #d7cab5;border-radius:22px;overflow:hidden">
    <tr><td style="background:#f7e48b;padding:16px 22px;border-bottom:1.5px solid #d7cab5;font-weight:700;font-size:15px">Team Pulse</td></tr>
    <tr><td style="padding:22px">
      <h1 style="margin:0 0 8px;font-size:21px;line-height:1.3">${esc(title)}</h1>
      ${intro ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4d463d">${esc(intro)}</p>` : ""}
      ${rows.length ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 14px;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:5px 0;color:#6e665b;width:120px;vertical-align:top">${esc(k)}</td><td style="padding:5px 0;font-weight:600">${esc(v)}</td></tr>`).join("")}</table>` : ""}
      ${list.length ? `<ul style="margin:0 0 14px;padding-left:18px;font-size:14px;line-height:1.7">${list.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}
      ${cta ? `<a href="${esc(cta.url)}" style="display:inline-block;background:#26221e;color:#f8f3ea;text-decoration:none;padding:10px 20px;border-radius:999px;font-weight:600;font-size:14px">${esc(cta.label)}</a>` : ""}
      ${foot ? `<p style="margin:18px 0 0;font-size:12px;color:#8a8073">${esc(foot)}</p>` : ""}
    </td></tr></table></td></tr></table></body></html>`;
  const text = [title, intro, ...rows.map(([k, v]) => `${k}: ${v}`), ...list.map((l) => "- " + l), cta ? `${cta.label}: ${cta.url}` : "", foot].filter(Boolean).join("\n");
  return { html, text };
}
