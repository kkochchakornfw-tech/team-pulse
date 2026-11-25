# ขึ้น Vercel

แอปนี้มีทั้งหน้าเว็บ (Vite) และหลังบ้าน (`/api`) อยู่ในโปรเจกต์เดียว ทั้งสองอย่าง deploy ขึ้น Vercel พร้อมกัน

## สิ่งที่ใช้

| ส่วน | บริการ | ใช้ทำอะไร |
|---|---|---|
| ฐานข้อมูล | Neon Postgres (ผ่าน Vercel Marketplace) | ผู้ใช้ สิทธิ์ หน้า โปรเจกต์ ประชุม แจ้งเตือน |
| ไฟล์ | Vercel Blob | รูปและไฟล์แนบ |
| อีเมล | Resend | ลิงก์เข้าสู่ระบบ, แจ้งเตือน, สรุปงาน |
| ตั้งเวลา | Vercel Cron | ส่งสรุปงานรายวัน/รายสัปดาห์ |

## ขั้นตอน

1. push โฟลเดอร์ `team-pulse` ขึ้น GitHub แล้ว Import ใน Vercel (Framework: Vite)
2. ใน Vercel → **Storage**: สร้าง **Neon** (Postgres) และ **Blob** แล้วเชื่อมกับโปรเจกต์ จะได้ `DATABASE_URL` และ `BLOB_READ_WRITE_TOKEN` อัตโนมัติ
3. สมัคร **Resend** ยืนยันโดเมนที่จะใช้ส่งเมล สร้าง API key
   - **ไม่มีโดเมน?** ใช้ Gmail ส่งแทนได้: วาง `scripts/gmail-relay.gs` ใน script.google.com แล้ว deploy เป็น Web app (Execute as: Me, Who has access: Anyone) ตั้ง Script Property `SECRET` แล้วใส่ `GAS_MAIL_URL` + `GAS_MAIL_SECRET` (ค่าเดียวกับ SECRET) ใน Vercel ส่งได้ประมาณวันละ 100 คน
4. ใส่ Environment Variables ตาม `.env.example`: `RESEND_API_KEY`, `MAIL_FROM`, `AUTH_SECRET`, `APP_URL`, `CRON_SECRET`
5. Deploy แล้วเปิดเว็บ ใส่อีเมลของคุณ **คนแรกที่ล็อกอินจะเป็นเจ้าของ** หลังจากนั้นเชิญคนอื่นได้ที่เมนู “คนและสิทธิ์”

ตารางในฐานข้อมูลถูกสร้างเองตอนเรียก API ครั้งแรก

## ข้อจำกัดที่ควรรู้

- **เตือนก่อนประชุม 15 นาที**: แอปเช็กทุกนาทีขณะที่มีคนเปิดแอปอยู่ ถ้าอยากให้เตือนแม้ไม่มีใครเปิดแอป ให้ตั้ง cron ทุก 5 นาทีเรียก `GET /api/cron?job=reminders` พร้อม header `Authorization: Bearer <CRON_SECRET>` (Vercel แพ็กเกจ Hobby ตั้ง cron ได้วันละครั้ง ใช้บริการอย่าง cron-job.org แทน หรืออัปเป็น Pro)
- **สรุปงาน**: Vercel Cron ส่งทุกวัน 08:00 (เวลาไทย) และวันจันทร์สำหรับรายสัปดาห์ ตั้งไว้ใน `vercel.json`
- **ขนาดไฟล์แนบ**: สูงสุดประมาณ 4 MB ต่อไฟล์ (ข้อจำกัดของ Vercel Functions)
- **ลิงก์ไฟล์ใน Blob**: เป็นลิงก์สุ่มยาว คนที่มีลิงก์เปิดไฟล์ได้ ไม่ได้ผ่านการเช็กสิทธิ์
- **Resend**: ก่อนยืนยันโดเมน ส่งได้เฉพาะอีเมลเจ้าของบัญชี Resend เท่านั้น

## รันในเครื่อง

```
npm install
npm run dev
```

ไม่ต้องตั้งค่าอะไร หลังบ้านใช้ไฟล์ `.data/db.json` และอีเมลจะแสดงใน terminal / หน้า `http://localhost:5180/api/dev/outbox` แทนการส่งจริง หน้าล็อกอินจะมีปุ่ม “เปิดลิงก์เข้าสู่ระบบ” ให้กดได้เลย
ถ้าจะต่อฐานข้อมูลจริงตอนรันในเครื่อง ใส่ค่าใน `.env.local` แล้วรัน `vercel dev`
