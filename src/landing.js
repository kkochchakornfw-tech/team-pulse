// Logged-out front door: a short tour of Team Pulse, the projects the team chose to show off,
// and the email magic-link sign-in in a dialog. Shown only in API mode when /api/me says 401.
import "./landing.css";
import { icon } from "./icons.js";
import { avatarSVG } from "./avatars.js";
import { stickerArt } from "./stickerset.js";

const NE = `<svg class="ne" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SPARK = (c, s, cls = "") => `<svg class="lp-spark ${cls}" data-c="${c}" width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2c1.6 10.6 6.4 15.4 18 18-11.6 2.6-16.4 7.4-18 18-1.6-10.6-6.4-15.4-18-18C13.6 17.4 18.4 12.6 20 2Z"/></svg>`;
const LOGO = `<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><rect x="2.5" y="2.5" width="27" height="27" rx="9" fill="#f7e48b" stroke="#26221e" stroke-width="2"/><path d="M7.5 17h4l2.2-6.2 4.2 12.4 2.1-6.2h4.5" fill="none" stroke="#26221e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const FEATURES = [
  { c: "green", t: "บอร์ดโปรเจกต์", d: "ลากการ์ดข้ามคอลัมน์ รู้ทันทีว่างานไหนกำลังทำ งานไหนค้าง และรันอยู่ที่ไหน", art: "d15" },
  { c: "pink", t: "ใครติดประชุม", d: "ปฏิทินของทีมกับปุ่ม “ติดประชุม 30 นาที” ทุกคนเห็นสถานะกันแบบสด ๆ", art: "d3", fill: true },
  { c: "blue", t: "หน้าเอกสาร", d: "จดโน้ตแบบ Notion พิมพ์ / เพื่อใส่ To-do หัวข้อ รูป หรือโค้ด", art: "d19" },
  { c: "yellow", t: "รับงานจากคนนอก", d: "คนนอกทีมส่งงานเข้ามาได้ ติดตามสถานะเองได้ ไม่ต้องทักถามซ้ำ", art: "d11" },
];
const ART_BY_STATUS = { idea: "p15", doing: "d7", stuck: "d9", review: "d6", live: "d13" };
const TILES = [["pink", "d1"], ["blue", "p4"], ["teal", "d14"], ["yellow", "p7"], ["green", "d22"]];

export function showLanding({ api, esc, statusOf }) {
  const q = new URLSearchParams(location.search).get("login");
  document.body.classList.add("logged-out", "on-landing");
  document.getElementById("modalRoot").innerHTML = "";
  const av = (n, c) => `<span class="lp-av" data-c="${c}">${avatarSVG(n)}</span>`;

  const root = document.createElement("div");
  root.className = "lp"; root.id = "login";
  root.innerHTML = `
  <header class="lp-nav">
    <nav class="lp-links" aria-label="ส่วนของหน้า"><a href="#lp-features">ทำอะไรได้บ้าง</a><a href="#lp-work" class="lp-work-link" hidden>ผลงานทีม</a><a href="#lp-join">เริ่มใช้</a></nav>
    <a class="lp-brand" href="#top" aria-label="Team Pulse หน้าแรก">${LOGO}<b>Team Pulse</b></a>
    <div class="lp-nav-r"><button class="lp-btn ghost" data-lp="login">เข้าสู่ระบบ ${NE}</button></div>
  </header>

  <main id="top">
    <section class="lp-hero" aria-labelledby="lp-h1">
      <div class="lp-tags" aria-hidden="true"><span data-c="pink">สมุดของทีม</span><span data-c="blue">${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}</span></div>
      ${SPARK("yellow", 34, "s1")}${SPARK("pink", 22, "s2")}${SPARK("blue", 28, "s3")}${SPARK("green", 20, "s4")}
      <h1 id="lp-h1" class="lp-h1">
        <span class="ln l1">รู้ว่าใคร<span class="lp-chip toggle" aria-hidden="true"><span class="knob"></span><span class="tx a">ว่าง</span><span class="tx b">ติดประชุม</span></span>ว่าง</span>
        <span class="ln l2"><span class="lp-chip stk" data-c="pink" aria-hidden="true">${stickerArt("d9", 84)}</span>งานไหนติด</span>
        <span class="ln l3">ในหน้า<span class="lp-chip faces" aria-hidden="true">${av(1, "yellow")}${av(6, "teal")}${av(11, "pink")}</span>เดียว</span>
      </h1>
      <svg class="lp-path" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true"><path d="M120 200c-40 60-10 150 70 160s130-20 170-20" /><path d="M820 80c70 0 110 40 100 90s-40 60-70 60" /></svg>
      <p class="lp-sub">Team Pulse คือสมุดของทีม รวมบอร์ดโปรเจกต์ ปฏิทินประชุม และหน้าเอกสารไว้ที่เดียว เปิดมาก็รู้ว่าใครว่าง งานไหนค้าง และแต่ละงานรันอยู่ที่ไหน</p>
      <div class="lp-cta"><button class="lp-btn primary" data-lp="login">เข้าสู่ระบบด้วยอีเมล</button><a class="lp-more" href="#lp-features">ดูว่าทำอะไรได้บ้าง</a></div>
    </section>

    <section class="lp-tiles" aria-label="สติกเกอร์ของทีม">
      ${TILES.map(([c, id], i) => `<span class="lp-tile" data-c="${c}" style="--i:${i}">${stickerArt(id, 120)}</span>`).join("")}
    </section>

    <section class="lp-box" id="lp-features" aria-labelledby="lp-f-h">
      ${SPARK("blue", 46, "s5")}
      <div class="lp-box-h"><h2 id="lp-f-h">ในสมุดเล่มนี้มีอะไร</h2><p>สี่อย่างที่ทีมใช้ทุกวัน ออกแบบให้คนที่ไม่ใช่สายเทคก็ใช้ได้ทันที</p></div>
      <div class="lp-cards" id="lp-cards" tabindex="0" aria-label="ฟีเจอร์ เลื่อนดูได้">
        ${FEATURES.map((f) => `<article class="lp-card${f.fill ? " fill" : ""}" data-c="${f.c}">
          <div class="lp-card-h"><h3>${esc(f.t)}</h3><span class="lp-arrow" aria-hidden="true">${NE}</span></div>
          <p>${esc(f.d)}</p>
          <div class="lp-card-art">${stickerArt(f.art, 132)}</div>
        </article>`).join("")}
      </div>
      <div class="lp-scroll-btns"><button class="lp-round" data-lp="prev" aria-label="ฟีเจอร์ก่อนหน้า">${icon("chevron-left")}</button><button class="lp-round" data-lp="next" aria-label="ฟีเจอร์ถัดไป">${icon("chevron")}</button></div>
    </section>

    <section class="lp-work" id="lp-work" aria-labelledby="lp-w-h" hidden>
      <div class="lp-box-h"><h2 id="lp-w-h">ผลงานที่ทีม dev ทำ</h2><p>บางส่วนของโปรเจกต์ที่ทีมเราสร้างและดูแลอยู่ใน Team Pulse</p></div>
      <div class="lp-gal" id="lp-gal"></div>
    </section>

    <section class="lp-box lp-join" id="lp-join" aria-labelledby="lp-j-h">
      ${SPARK("yellow", 40, "s6")}${SPARK("pink", 26, "s7")}
      <p class="lp-eyebrow">— Team Pulse —</p>
      <h2 id="lp-j-h">เลิกทักถามว่า “ว่างไหม” แล้วมา<mark>ทำงานด้วยกัน</mark>ในที่เดียว</h2>
      <p class="lp-join-sub">เข้าได้ด้วยอีเมลที่ทีมเชิญ ไม่ต้องจำรหัสผ่าน ถ้ายังไม่ได้รับเชิญ บอกผู้ดูแลทีมได้เลย</p>
      <div class="lp-join-art">${stickerArt("p16", 190)}</div>
      <button class="lp-btn primary" data-lp="login">เข้าสู่ Team Pulse</button>
      <footer class="lp-foot"><span>สมุดของทีม · Team Pulse</span><span>${new Date().getFullYear()}</span></footer>
    </section>
  </main>

  <dialog class="lp-dlg" id="lp-dlg" aria-labelledby="lg-h">
    <form class="login-card" id="lgForm" method="dialog">
      <button type="button" class="lp-x icon-btn" data-lp="close" aria-label="ปิด">${icon("x")}</button>
      <div class="login-stk" aria-hidden="true">${stickerArt("p0", 96)}</div>
      <h2 id="lg-h">เข้าสู่ Team Pulse</h2><p class="muted">ใส่อีเมลที่ได้รับเชิญ เราจะส่งลิงก์เข้าสู่ระบบให้ ไม่ต้องจำรหัสผ่าน</p>
      ${q === "expired" ? `<p class="banner soft" data-c="yellow">ลิงก์หมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่ได้เลย</p>` : q === "denied" ? `<p class="banner soft" data-c="pink">อีเมลนี้ยังไม่ได้รับเชิญ ติดต่อผู้ดูแลทีมให้เชิญก่อน</p>` : ""}
      <div class="f"><label for="lg-email">อีเมล</label><input id="lg-email" class="inp" type="email" required autocomplete="email" placeholder="name@example.com"></div>
      <button class="btn primary" id="lg-btn">ส่งลิงก์เข้าสู่ระบบ ${NE}</button><div id="lg-msg" aria-live="polite"></div>
    </form>
  </dialog>`;
  document.body.appendChild(root);

  const $ = (s) => root.querySelector(s);
  const dlg = $("#lp-dlg");
  const open = () => { if (!dlg.open) dlg.showModal(); setTimeout(() => $("#lg-email").focus(), 30); };
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lp]");
    if (e.target === dlg) { dlg.close(); return; } // click on the backdrop
    if (!b) return;
    const k = b.dataset.lp, cards = $("#lp-cards");
    if (k === "login") open();
    else if (k === "close") dlg.close();
    else if (k === "prev" || k === "next") cards.scrollBy({ left: (k === "next" ? 1 : -1) * (cards.querySelector(".lp-card").offsetWidth + 16), behavior: "smooth" });
  });
  $("#lgForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const b = $("#lg-btn"), msg = $("#lg-msg"); b.disabled = true;
    try {
      const j = await api("/auth/request", { method: "POST", body: { email: $("#lg-email").value.trim() } });
      msg.innerHTML = `<p class="banner soft" data-c="green">${j.first ? "คุณเป็นคนแรก จะได้เป็นเจ้าของแอปนี้ " : ""}ถ้าอีเมลนี้มีสิทธิ์ใช้งาน ลิงก์จะไปถึงในไม่กี่วินาที เปิดอีเมลแล้วกดลิงก์ได้เลย</p>${j.devLink ? `<p class="dev-note">โหมดพัฒนา: ยังไม่ได้ต่อระบบส่งเมล <a class="btn small" href="${esc(j.devLink)}">เปิดลิงก์เข้าสู่ระบบ</a></p>` : j.devNote ? `<p class="dev-note">โหมดพัฒนา: ${esc(j.devNote)}</p>` : ""}`;
    } catch (err) { msg.innerHTML = `<p class="banner soft" data-c="pink">${esc(err.msg || "ส่งลิงก์ไม่สำเร็จ ลองอีกครั้ง")}</p>`; }
    b.disabled = false;
  });
  if (q) open();

  // the team's chosen work; the section stays hidden until there is something to show
  fetch("/api/public/showcase").then((r) => (r.ok ? r.json() : null)).then((j) => {
    const list = (j && j.projects) || []; if (!list.length) return;
    $("#lp-gal").innerHTML = list.map((p) => {
      const st = statusOf(p.status), tag = p.url ? "a" : "div";
      return `<${tag} class="lp-g" data-c="${esc(p.cover || st.c)}"${p.url ? ` href="${esc(p.url)}" target="_blank" rel="noopener"` : ""}>
        <span class="lp-g-img${p.coverImg ? "" : " art"}">${p.coverImg ? `<img src="${esc(p.coverImg)}" alt="" loading="lazy">` : stickerArt(ART_BY_STATUS[p.status] || "d21", 110)}</span>
        <span class="lp-g-bd"><span class="pill soft" data-c="${st.c}"><span class="d"></span><span class="tx">${esc(st.label)}</span></span>
          <b>${esc(p.title || "ไม่มีชื่อ")}</b>${p.note ? `<small>${esc(p.note)}</small>` : ""}${p.url ? `<span class="lp-g-go">เปิดดู ${NE}</span>` : ""}</span>
      </${tag}>`;
    }).join("");
    $("#lp-work").hidden = false; $(".lp-work-link").hidden = false;
  }).catch((e) => console.warn("[showcase]", e));
}
