// The team's stickers, cut one by one from the two sheets into public/stickers/cut/<id>.webp
// (transparent background, die-cut white edge kept). SIZE is each file's pixel size.
export const SHEETS = {
  d: { name: "ทีม dev" },
  p: { name: "เพื่อนสัตว์" },
};
const DEV = [
  "สู้ๆ นะ!", "Good Job!", "พักก่อนนะ", "ตารางแน่นจัดไป!", "ง่วงแล้ว zzz", "งานเสร็จแล้ว!",
  "เช็กแล้ว!", "กำลังทำอยู่...", "กำลังดำเนินการ...", "มีปัญหาแล้วนะ!", "ไอเดียมาแล้ว!", "ขอช่วยหน่อยค่า~",
  "อัปเดตโค้ดแล้ว", "Deploy แล้วนะ!", "ทีมเวิร์ค!", "โปรเจกต์ไปได้สวย!", "ขอบคุณนะค้าบ", "พักเบรกสักแป๊บ~",
  "ประกาศสำคัญ!", "Todo List", "รับทราบครับ!", "Dev Team", "เติบโตไปด้วยกัน", "Let's Build Something Great!",
];
const PETS = [
  "สู้ ๆ นะ!", "Good Job!", "กำลังทำอยู่~", "พักก่อนนะ", "โฟกัสอยู่นะ!",
  "เติมพลังก่อนนะ!", "งานเสร็จแล้ว!", "Deploy แล้วนะ!", "มีปัญหาแล้วนะ!", "ขอบคุณนะค้าบ",
  "นอนก่อนนะ ฝันดีนะ", "พักเบรกสักแป๊บ~", "Let's Build!", "ไอเดียมาแล้ว!", "แก้โค้ดอยู่เด้อ~",
  "Go Go!", "Team Pulse", "Task Updated!", "หมดแรงแย้ว...", "Have a great day!",
];
const SIZE = {"d0":[239,251],"d1":[232,265],"d2":[180,260],"d3":[205,257],"d4":[236,215],"d5":[271,208],"d6":[243,249],"d7":[244,236],"d8":[213,222],"d9":[187,226],"d10":[213,205],"d11":[234,235],"d12":[220,223],"d13":[214,235],"d14":[257,229],"d15":[194,219],"d16":[200,239],"d17":[229,223],"d18":[271,202],"d19":[211,174],"d20":[246,192],"d21":[211,211],"d22":[263,161],"d23":[218,205],"p0":[273,269],"p1":[264,257],"p2":[258,257],"p3":[298,227],"p4":[259,247],"p5":[243,259],"p6":[271,251],"p7":[254,248],"p8":[258,261],"p9":[271,245],"p10":[310,223],"p11":[277,225],"p12":[272,244],"p13":[273,241],"p14":[246,236],"p15":[268,205],"p16":[310,205],"p17":[253,213],"p18":[268,190],"p19":[266,203]};
export const STICKER_SET = [
  ...DEV.map((label, i) => ({ id: "d" + i, sheet: "d", i, label })),
  ...PETS.map((label, i) => ({ id: "p" + i, sheet: "p", i, label })),
];
export const stickerById = (id) => STICKER_SET.find((s) => s.id === id);
// the single-file artifact build inlines every sticker into globalThis.__STK
export const stickerUrl = (id) => (globalThis.__STK && globalThis.__STK[id]) || "/stickers/cut/" + id + ".webp";

/** A sticker image that fits inside a size×size box, keeping its own shape. */
export function stickerArt(id, size = 96, cls = "") {
  const s = stickerById(id); if (!s) return "";
  const [w, h] = SIZE[id] || [1, 1], k = size / Math.max(w, h);
  return `<img class="spr${cls ? " " + cls : ""}" src="${stickerUrl(id)}" width="${Math.round(w * k)}" height="${Math.round(h * k)}" alt="สติกเกอร์ ${s.label.replace(/"/g, "&quot;")}" draggable="false" decoding="async">`;
}
