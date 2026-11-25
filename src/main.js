import { icon, paintIcons } from "./icons.js";
import { avatarSVG, AVATAR_COUNT } from "./avatars.js";
import { putImage, putFile, urlFor, blobFor, avatarDataUrl, setAssets, setSharedDb, setApiUpload, fmtSize } from "./files.js";
import { sticker, STICKERS } from "./stickers.js";
import { SHEETS, STICKER_SET, stickerById, stickerArt } from "./stickerset.js";
import { showLanding } from "./landing.js";
(function(){
"use strict";
/* ================= constants ================= */
const COLORS=["pink","orange","yellow","green","teal","blue"];
const STATUSES=[
  {key:"idea",label:"รอเริ่ม",c:"teal"},{key:"doing",label:"กำลังทำ",c:"blue"},{key:"stuck",label:"ค้าง / ติดปัญหา",c:"pink"},
  {key:"review",label:"รอรีวิว",c:"yellow"},{key:"live",label:"รันอยู่ / เสร็จ",c:"green"}];
const WHERE_SUGGEST=["Vercel","Netlify","AWS","Google Cloud","Azure","Render","Railway","Firebase","Server ออฟฟิศ","Docker บน NAS","เครื่อง local","ยังไม่ deploy"];
const EMOJI="📄 📝 📌 📎 📊 📈 🗂️ 📁 🗓️ ⏰ ✅ 🧩 🚀 🔥 ⭐ 💡 🎯 🛠️ ⚙️ 🧪 🐞 🔒 🌐 💻 📱 🎨 📦 🏁 🧭 💬 📣 🤝 👥 🏠 ☕ 🌱 🍀 🌈 🎉 📚".split(" ");
const BT={
  p:{label:"ข้อความ",desc:"ย่อหน้าธรรมดา",ic:"text",ph:"พิมพ์ / เพื่อเลือกบล็อก",k:"text paragraph"},
  h1:{label:"หัวข้อ 1",desc:"หัวข้อใหญ่",g:"H1",ph:"หัวข้อ 1",k:"heading h1 #"},
  h2:{label:"หัวข้อ 2",desc:"หัวข้อรอง",g:"H2",ph:"หัวข้อ 2",k:"heading h2 ##"},
  h3:{label:"หัวข้อ 3",desc:"หัวข้อย่อย",g:"H3",ph:"หัวข้อ 3",k:"heading h3 ###"},
  todo:{label:"To-do",desc:"เช็กลิสต์ติ๊กได้",ic:"todo",ph:"สิ่งที่ต้องทำ",k:"todo check task"},
  ul:{label:"รายการจุด",desc:"ลิสต์แบบจุด",ic:"list",ph:"รายการ",k:"bullet list ul"},
  ol:{label:"รายการตัวเลข",desc:"ลิสต์มีลำดับ",ic:"list-ordered",ph:"รายการ",k:"number list ol"},
  toggle:{label:"Toggle",desc:"ซ่อน/แสดงเนื้อหาข้างใน",ic:"toggle",ph:"Toggle",k:"toggle collapse"},
  quote:{label:"คำพูด",desc:"ยกข้อความ",ic:"quote",ph:"คำพูด",k:"quote"},
  callout:{label:"Callout",desc:"กล่องเน้นข้อความ",ic:"callout",ph:"ข้อความที่อยากให้ทุกคนเห็น",k:"callout note info"},
  image:{label:"รูปภาพ",desc:"อัปโหลด วาง หรือลากรูปมาใส่",ic:"image",k:"image picture photo รูป ภาพ"},
  file:{label:"ไฟล์แนบ",desc:"PDF, Word, Excel, zip หรือไฟล์อื่น",ic:"clip",k:"file attach upload pdf ไฟล์ แนบ เอกสาร"},
  code:{label:"โค้ด",desc:"บล็อกโค้ด / คำสั่ง",ic:"code",ph:"โค้ดหรือคำสั่ง",k:"code snippet"},
  table:{label:"ตาราง",desc:"ตารางแถวและคอลัมน์ แก้ได้ทุกช่อง",ic:"table",k:"table grid ตาราง"},
  divider:{label:"เส้นคั่น",desc:"แบ่งส่วน",ic:"divider",k:"divider line hr"},
  page:{label:"หน้าย่อย",desc:"สร้างหน้าใหม่ไว้ข้างใน",ic:"file",k:"page subpage"},
};
const SLASH_ORDER=["p","h1","h2","h3","todo","ul","ol","toggle","quote","callout","table","image","file","code","divider","page"];
const glyph=o=>o.ic?icon(o.ic):`<b>${esc(o.g||"")}</b>`;
const THEMES=[["light","สว่าง","sun"],["dark","มืด","moon"],["system","ตามเครื่อง","monitor"]];
const H0=8,H1=20,HH=44;

const S={members:[],projects:[],events:[],pages:[],teams:[],loaded:{members:false,projects:false,events:false,pages:false,teams:false},space:"all",uid:null,isOwner:false,
  projMode:"board",projQ:"",projOwner:"",weekStart:null,openProject:null,readOnly:false,banners:{},mounted:null,
  expanded:new Set(),fav:new Set(),theme:"system",me:""};
let backend=null,pageEditor=null,projEditor=null;

/* ================= utils ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const bid=()=>"b"+Math.random().toString(36).slice(2,10);
const pad=n=>String(n).padStart(2,"0");
const toDateInput=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const toTimeInput=d=>pad(d.getHours())+":"+pad(d.getMinutes());
const fmtTime=d=>pad(d.getHours())+":"+pad(d.getMinutes());
const fmtDayLong=d=>d.toLocaleDateString("th-TH",{weekday:"long",day:"numeric",month:"long"});
const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
function startOfWeek(d){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-(x.getDay()+6)%7);return x}
function ago(iso){if(!iso) return "";const s=(Date.now()-new Date(iso))/1000;
  if(s<60) return "เมื่อกี้";if(s<3600) return Math.floor(s/60)+" นาทีก่อน";if(s<86400) return Math.floor(s/3600)+" ชม.ก่อน";
  const d=Math.floor(s/86400);return d<30?d+" วันก่อน":new Date(iso).toLocaleDateString("th-TH",{day:"numeric",month:"short"})}
const statusOf=k=>STATUSES.find(s=>s.key===k)||STATUSES[0];
const memberOf=id=>S.members.find(m=>m.id===id);
const pageOf=id=>S.pages.find(p=>p.id===id);
const initial=n=>([...String(n||"?").replace(/^[เแโใไ]/,"")][0]||"?").toUpperCase();
const byUpdated=(a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||""));
const byOrder=(a,b)=>(a.order||0)-(b.order||0);
const allLoaded=()=>Object.values(S.loaded).every(Boolean);
const nowIso=()=>new Date().toISOString();
function safeUrl(u){u=String(u||"").trim();if(!/^(https?:|mailto:)/i.test(u)) u="https://"+u;return u}
function shortUrl(u){return String(u).replace(/^https?:\/\//i,"").replace(/\/$/,"").slice(0,38)}
function loadLocal(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function saveLocal(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}

/* html sanitising: only simple inline marks survive */
const ALLOW={B:1,STRONG:1,I:1,EM:1,U:1,S:1,STRIKE:1,CODE:1,A:1,BR:1,MARK:1};
function clean(h){if(!h) return "";const t=document.createElement("template");t.innerHTML=String(h);walk(t.content);return t.innerHTML;
  function walk(n){[...n.childNodes].forEach(c=>{if(c.nodeType===3) return;if(c.nodeType!==1){c.remove();return}walk(c);
    if(!ALLOW[c.tagName]){if(/^(DIV|P|LI)$/.test(c.tagName)&&c.previousSibling) c.before(document.createElement("br"));c.replaceWith(...c.childNodes);return}
    [...c.attributes].forEach(a=>{if(!(c.tagName==="A"&&a.name==="href")) c.removeAttribute(a.name)});
    if(c.tagName==="A"){const h=c.getAttribute("href")||"";if(!/^(https?:|mailto:)/i.test(h)) c.removeAttribute("href");else{c.setAttribute("target","_blank");c.setAttribute("rel","noopener")}}})}}
function htmlText(h){const t=document.createElement("template");t.innerHTML=String(h||"").replace(/<br\s*\/?>/gi,"\n");return t.content.textContent}
const blockText=b=>b.t==="code"?String(b.h||""):b.t==="table"?(b.rows||[]).map(r=>r.map(htmlText).join(" · ")).join("\n"):htmlText(b.h);
/** A table block always has at least one row and one column, and every row the same width. */
function tableRows(b){let r=Array.isArray(b.rows)&&b.rows.length?b.rows.map(x=>Array.isArray(x)?x.map(c=>String(c||"")):[]):[["",""],["",""]];
  const w=Math.max(1,...r.map(x=>x.length));return r.map(x=>{x=x.slice(0,w);while(x.length<w) x.push("");return x})}
function blocksPlain(blocks){return (blocks||[]).map(b=>b.t==="page"?((pageOf(b.p)||{}).title||""):blockText(b)).filter(Boolean).join("\n")}

/* ================= storage ================= */
function localBackend(){
  let data={members:{},projects:{},events:{},pages:{},teams:{},stickers:{},comments:{}};
  try{const raw=localStorage.getItem("team-pulse-local");if(raw) data=Object.assign(data,JSON.parse(raw))}catch(e){}
  const subs={};const save=()=>{try{localStorage.setItem("team-pulse-local",JSON.stringify(data))}catch(e){}};
  const emit=c=>(subs[c]||[]).forEach(cb=>cb(Object.entries(data[c]||{}).map(([id,v])=>Object.assign({id},JSON.parse(JSON.stringify(v)))),null));
  return {local:true,watch(c,cb){(subs[c]=subs[c]||[]).push(cb);setTimeout(()=>emit(c),0)},
    async set(c,id,v){data[c][id]=JSON.parse(JSON.stringify(v));save();emit(c)},
    async update(c,id,v){if(!data[c][id]) throw {code:"invalid_argument"};Object.assign(data[c][id],JSON.parse(JSON.stringify(v)));save();emit(c)},
    async del(c,id){delete data[c][id];save();emit(c)}};
}
function dbBackend(db){
  return {watch:(c,cb,err)=>db.collection(c).onSnapshot(s=>cb(s.docs.map(d=>Object.assign({id:d.id},d.data())),s),err),
    set:(c,id,v)=>db.doc(c+"/"+id).set(v),update:(c,id,v)=>db.doc(c+"/"+id).update(v),del:(c,id)=>db.doc(c+"/"+id).delete()};
}
/* API mode (Vercel, npm run dev): email login, roles enforced on the server, polling sync. */
const API={on:false,user:null,mail:"",storage:""};
async function api(path,opt){opt=opt||{};const isRaw=opt.body instanceof Blob;
  const r=await fetch("/api"+path,{method:opt.method||"GET",credentials:"same-origin",headers:opt.headers||(opt.body&&!isRaw?{"content-type":"application/json"}:{}),body:opt.body==null?undefined:isRaw?opt.body:JSON.stringify(opt.body)});
  let j=null;try{j=await r.json()}catch(e){}
  if(!r.ok) throw {status:r.status,code:r.status===403||r.status===404?"forbidden":r.status===401?"auth":r.status===413?"too_large":"http",msg:j&&j.error,limit:j&&j.limit};
  return j}
function apiBackend(){
  const cache={members:{},teams:{},projects:{},events:{},pages:{},activity:{},updates:{},stickers:{},comments:{}},subs={};let since=null,timer=null,fullAt=0,busy=false;
  const emit=c=>(subs[c]||[]).forEach(cb=>cb(Object.entries(cache[c]).map(([id,v])=>Object.assign({id},v)),null));
  async function poll(){if(busy) return;busy=true;
    try{const full=!since||Date.now()-fullAt>60000;const j=await api("/sync"+(full?"":"?since="+encodeURIComponent(since)));
      const touched=new Set();if(j.full){Object.keys(cache).forEach(c=>{cache[c]={};touched.add(c)});fullAt=Date.now()}
      j.docs.forEach(d=>{if(!cache[d.col]) return;touched.add(d.col);if(d.deleted) delete cache[d.col][d.id];else cache[d.col][d.id]=d.data});
      since=j.now;S.notifs=j.notifications||[];if(touched.has("teams")&&!j.full) fullAt=0;touched.forEach(emit);renderBell();setBanner("off",null)}
    catch(e){if(e&&e.status===401){location.reload();return}setBanner("off",{c:"orange",t:"เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กำลังลองใหม่…"})}
    finally{busy=false;clearTimeout(timer);timer=setTimeout(poll,document.hidden?15000:4000)}}
  document.addEventListener("visibilitychange",()=>{if(!document.hidden){clearTimeout(timer);poll()}});
  setTimeout(poll,0);
  const write=async(c,id,method,body)=>{const j=await api(`/docs/${c}/${encodeURIComponent(id)}`,{method,body});if(j&&j.doc){if(j.doc.deleted) delete cache[c][id];else cache[c][id]=j.doc.data;emit(c)}};
  return {api:true,watch(c,cb){(subs[c]=subs[c]||[]).push(cb)},set:(c,id,v)=>write(c,id,"PUT",v),update:(c,id,v)=>write(c,id,"PATCH",v),del:(c,id)=>write(c,id,"DELETE"),poll:()=>{clearTimeout(timer);poll()}};
}
const chains={},pending={},timers={};
function run(key,fn){const p=(chains[key]||Promise.resolve()).then(fn);chains[key]=p.catch(()=>{});return p.catch(onWriteErr)}
function patch(c,id,fields,delay){const k=c+"/"+id;pending[k]=Object.assign(pending[k]||{},fields);clearTimeout(timers[k]);
  timers[k]=setTimeout(()=>flush(c,id),delay==null?500:delay)}
function flush(c,id){const k=c+"/"+id,p=pending[k];if(!p) return;delete pending[k];clearTimeout(timers[k]);return run(k,()=>backend.update(c,id,p))}
function put(c,id,v){return run(c+"/"+id,()=>backend.set(c,id,v))}
function remove(c,id){const k=c+"/"+id;delete pending[k];clearTimeout(timers[k]);return run(k,()=>backend.del(c,id))}
function onWriteErr(e){const code=e&&e.code;
  if(code==="forbidden"){toast(e.msg||"คุณไม่มีสิทธิ์แก้ข้อมูลนี้");backend&&backend.poll&&backend.poll();return}
  if(code==="auth"){location.reload();return}
  if(code==="invalid_argument"){setReadOnly(true);toast("บัญชีนี้ดูได้อย่างเดียว ขอสิทธิ์ Contributor จากเจ้าของบอร์ดเพื่อแก้ไข")}
  else if(code==="quota_exceeded") toast("พื้นที่เก็บข้อมูลเต็ม ลบหน้าเก่าในถังขยะแล้วลองใหม่");
  else if(code==="resource_exhausted") toast("บันทึกถี่เกินไป รอสักครู่แล้วลองใหม่");
  else toast("บันทึกไม่สำเร็จ เช็กอินเทอร์เน็ตแล้วลองอีกครั้ง")}
function setReadOnly(v){S.readOnly=v;document.body.classList.toggle("ro",v);
  setBanner("ro",v?{c:"yellow",t:"คุณดูบอร์ดนี้ได้อย่างเดียว การแก้ไขจะไม่ถูกบันทึก"}:null);
  document.querySelectorAll(".ce").forEach(ce=>ce.contentEditable="false")}
function setBanner(k,v){S.banners[k]=v;$("#banners").innerHTML=Object.values(S.banners).filter(Boolean).map(b=>`<div class="banner soft" data-c="${b.c}">${esc(b.t)}</div>`).join("")}

/* ================= caret helpers ================= */
function caretOffset(el){const s=getSelection();if(!s.rangeCount) return 0;const r=s.getRangeAt(0);if(!el.contains(r.startContainer)) return 0;
  const pre=document.createRange();pre.selectNodeContents(el);pre.setEnd(r.startContainer,r.startOffset);return pre.toString().length}
function textBefore(el){const s=getSelection();if(!s.rangeCount) return "";const r=s.getRangeAt(0);const pre=document.createRange();pre.selectNodeContents(el);pre.setEnd(r.startContainer,r.startOffset);return pre.toString()}
function rangeAt(el,a,z){const r=document.createRange();let n=0,node,sa=false;const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  r.selectNodeContents(el);r.collapse(true);
  while((node=w.nextNode())){const L=node.length;if(!sa&&n+L>=a){r.setStart(node,a-n);sa=true}if(sa&&n+L>=z){r.setEnd(node,z-n);return r}n+=L}
  if(!sa) r.collapse(false);return r}
function setCaret(el,off){if(!el) return;el.focus({preventScroll:false});const s=getSelection();let r;
  if(off==null||off==="end"){r=document.createRange();r.selectNodeContents(el);r.collapse(false)}else{r=rangeAt(el,off,off);r.collapse(true)}
  s.removeAllRanges();s.addRange(r)}
const selCollapsed=()=>{const s=getSelection();return !s.rangeCount||s.isCollapsed};
const caretAtStart=el=>selCollapsed()&&caretOffset(el)===0;
const caretAtEnd=el=>selCollapsed()&&caretOffset(el)>=el.textContent.length;
function caretRect(){const s=getSelection();if(!s.rangeCount) return null;const r=s.getRangeAt(0).cloneRange();let rc=r.getClientRects()[0];
  if(!rc){const n=r.startContainer.nodeType===1?r.startContainer:r.startContainer.parentElement;rc=n.getBoundingClientRect()}return rc}
function placeFloating(el,rect){el.hidden=false;const w=el.offsetWidth,h=el.offsetHeight;let top=rect.bottom+6;
  if(top+h>innerHeight-8) top=Math.max(8,rect.top-h-6);let left=Math.min(rect.left,innerWidth-w-8);left=Math.max(8,left);
  el.style.top=top+"px";el.style.left=left+"px";el.style.setProperty("--origin",(top<rect.top?"bottom ":"top ")+(left<rect.left-4?"right":"left"))}

/* ================= block editor ================= */
function normBlocks(bl){let a=Array.isArray(bl)?bl.filter(b=>b&&BT[b.t]).map(b=>Object.assign({},b,{id:b.id||bid(),i:Math.max(0,Math.min(6,+b.i||0)),h:b.h||""})):[];
  if(!a.length) a=[{id:bid(),t:"p",h:"",i:0}];return a}
function serBlocks(bl){return bl.map(b=>{const o={id:b.id,t:b.t,h:b.t==="code"?String(b.h||""):clean(b.h),i:b.i||0};
  if(b.c) o.c=true;if(b.x) o.x=true;if(b.col) o.col=b.col;if(b.p) o.p=b.p;if(b.src) o.src=b.src;if(b.w) o.w=b.w;if(b.t==="table"){o.rows=tableRows(b).map(r=>r.map(clean));if(b.hr===false) o.hr=false}if(b.alt) o.alt=b.alt;["name","size","mime","at"].forEach(k=>{if(b[k]!=null&&b[k]!=="") o[k]=b[k]});return o})}
function blocksEmpty(bl){return !bl||!bl.length||(bl.length===1&&bl[0].t==="p"&&!htmlText(bl[0].h).trim())}

class Editor{
  constructor(host,opt){this.host=host;this.opt=opt;this.blocks=[];this.lastLocal=0;this.dragId=null;
    host.classList.add("editor");
    host.addEventListener("input",e=>this.onInput(e));
    host.addEventListener("keydown",e=>this.onKey(e));
    host.addEventListener("click",e=>this.onClick(e));
    host.addEventListener("paste",e=>this.onPaste(e));
    // block selection (Notion-style): drag across lines or Shift+click to select whole blocks
    host.tabIndex=-1;this.sel=null;
    host.addEventListener("pointerdown",e=>this.selDown(e));
    document.addEventListener("pointerdown",e=>{if(this.sel&&!host.contains(e.target)) this.clearSel()});
    host.addEventListener("focusin",e=>{const td=e.target.closest&&e.target.closest("td.tc");if(td) this.tcell={id:td.closest(".blk").dataset.bid,r:+td.dataset.r,c:+td.dataset.ci}});
    host.addEventListener("dragstart",e=>{const g=e.target.closest&&e.target.closest(".g-drag");if(!g) return;this.dragId=g.closest(".blk").dataset.bid;try{e.dataTransfer.setData("text/plain","block");e.dataTransfer.effectAllowed="move"}catch(x){}});
    const hasFiles=e=>e.dataTransfer&&[...e.dataTransfer.types].includes("Files");
    host.addEventListener("dragover",e=>{if(!this.dragId&&!hasFiles(e)) return;if(this.isRO()) return;const blk=e.target.closest(".blk");if(!blk) return;e.preventDefault();
      host.querySelectorAll(".drop-before,.drop-after").forEach(x=>x.classList.remove("drop-before","drop-after"));
      const r=blk.getBoundingClientRect();blk.classList.add(e.clientY<r.top+r.height/2?"drop-before":"drop-after")});
    host.addEventListener("drop",e=>{
      if(!this.dragId&&hasFiles(e)){e.preventDefault();host.querySelectorAll(".drop-before,.drop-after").forEach(x=>x.classList.remove("drop-before","drop-after"));
        if(this.isRO()) return;const blk=e.target.closest(".blk");this.insertFiles([...e.dataTransfer.files],blk?blk.dataset.bid:null);return}
      if(!this.dragId) return;e.preventDefault();const blk=e.target.closest(".blk");
      const before=blk&&blk.classList.contains("drop-before");host.querySelectorAll(".drop-before,.drop-after").forEach(x=>x.classList.remove("drop-before","drop-after"));
      if(blk) this.move(this.dragId,blk.dataset.bid,before);this.dragId=null});
    host.addEventListener("dragend",()=>{this.dragId=null;host.querySelectorAll(".drop-before,.drop-after").forEach(x=>x.classList.remove("drop-before","drop-after"))});
  }
  isRO(){return S.readOnly||!!(this.opt.ro&&this.opt.ro())}
  key(){return this.opt.col+"/"+this.opt.id}
  get(id){return this.blocks.find(b=>b.id===id)}
  idx(id){return this.blocks.findIndex(b=>b.id===id)}
  load(bl){this.blocks=normBlocks(bl);this.render()}
  sync(bl){if(!bl) return;if(Date.now()-this.lastLocal<3000||pending[this.key()]) {this.refreshLinks();return}
    const nb=normBlocks(bl);if(JSON.stringify(serBlocks(nb))===JSON.stringify(serBlocks(this.blocks))){this.refreshLinks();return}
    const f=this.focusInfo();this.blocks=nb;this.render();if(f) this.focus(f.id,f.off)}
  focusInfo(){const a=document.activeElement;if(!a||!this.host.contains(a)) return null;const blk=a.closest(".blk");return blk?{id:blk.dataset.bid,off:caretOffset(a)}:null}
  changed(){if(this.isRO()) return;this.lastLocal=Date.now();this.opt.onChange(serBlocks(this.blocks))}
  group(k){const b=this.blocks[k];let e=k+1;while(e<this.blocks.length&&this.blocks[e].i>b.i) e++;return [k,e]}
  /* ---- block selection ---- */
  blkAt(y){const all=[...this.host.querySelectorAll(".blk")];if(!all.length) return null;
    for(const el of all){const r=el.getBoundingClientRect();if(y<r.bottom) return el}return all[all.length-1]}
  selectRange(a,b){const vis=this.visibleIds();let i=vis.indexOf(a),j=vis.indexOf(b);if(i<0||j<0) return;
    this.sel={anchor:a,head:b,ids:vis.slice(Math.min(i,j),Math.max(i,j)+1)};this.paintSel()}
  paintSel(){const on=new Set(this.sel?this.sel.ids:[]);
    this.host.querySelectorAll(".blk").forEach(el=>el.classList.toggle("bsel",on.has(el.dataset.bid)));
    this.host.classList.toggle("bsel-mode",!!this.sel)}
  enterSel(a,b){const s=getSelection();if(s.rangeCount) s.removeAllRanges();
    if(document.activeElement&&this.host.contains(document.activeElement)&&document.activeElement!==this.host) document.activeElement.blur();
    $("#tb").hidden=true;this.selectRange(a,b);this.host.focus({preventScroll:true})}
  clearSel(){if(!this.sel) return;this.sel=null;this.paintSel()}
  selDown(e){
    if(e.button!==0||e.pointerType==="touch") return;
    const t=e.target;if(t.closest(".gutter,button,a,input,.img-tools,.tbl-add")) return;
    const blk=t.closest(".blk")||this.blkAt(e.clientY);if(!blk) return;
    if(e.shiftKey){const a=this.sel?this.sel.anchor:(document.activeElement&&document.activeElement.closest&&document.activeElement.closest(".blk")||{}).dataset;
      const anchor=typeof a==="string"?a:a&&a.bid;
      if(anchor&&anchor!==blk.dataset.bid){e.preventDefault();this.enterSel(anchor,blk.dataset.bid);return}}
    this.clearSel();
    const start=blk.dataset.bid;let on=false;
    const move=ev=>{const el=document.elementFromPoint(ev.clientX,ev.clientY);const over=(el&&this.host.contains(el)&&el.closest(".blk"))||this.blkAt(ev.clientY);
      if(!over) return;const id=over.dataset.bid;
      if(!on&&id===start) return; // still inside one block: normal text selection
      if(!on){on=true;this.enterSel(start,id)}else if(id!==this.sel.head) this.selectRange(start,id)};
    const up=()=>{document.removeEventListener("pointermove",move);document.removeEventListener("pointerup",up);if(on) this.host.focus({preventScroll:true})};
    document.addEventListener("pointermove",move);document.addEventListener("pointerup",up)}
  selBlocks(){if(!this.sel) return [];const ids=new Set();
    for(const id of this.sel.ids){const k=this.idx(id);if(k<0) continue;const [a,z]=this.group(k);for(let j=a;j<z;j++) ids.add(this.blocks[j].id)}
    return this.blocks.filter(b=>ids.has(b.id))}
  selCopy(e,cut){if(!this.sel) return;e.preventDefault();const bl=this.selBlocks();
    const txt=bl.map(b=>{const pre=b.t==="ul"?"- ":b.t==="todo"?(b.c?"[x] ":"[ ] "):b.t==="h1"?"# ":b.t==="h2"?"## ":b.t==="h3"?"### ":b.t==="quote"?"> ":"";
      return "  ".repeat(b.i||0)+pre+(b.t==="page"?((pageOf(b.p)||{}).title||""):blockText(b))}).join("\n");
    const html=bl.map(b=>{const tag={h1:"h1",h2:"h2",h3:"h3",quote:"blockquote",code:"pre"}[b.t]||(b.t==="ul"||b.t==="todo"?"li":"p");
      return `<${tag}>${b.t==="code"?esc(b.h||""):b.t==="table"?esc(blockText(b)):clean(b.h||"")}</${tag}>`}).join("");
    try{e.clipboardData.setData("text/plain",txt);e.clipboardData.setData("text/html",html)}catch(x){}
    if(cut&&!this.isRO()) this.selDelete(true);else toast(`คัดลอก ${this.sel.ids.length} บรรทัดแล้ว`)}
  selDelete(cut){if(!this.sel||this.isRO()) return;const ids=new Set(this.selBlocks().map(b=>b.id));
    const before=JSON.parse(JSON.stringify(this.blocks)),first=this.idx(this.sel.ids[0]);
    this.blocks=this.blocks.filter(b=>!ids.has(b.id));if(!this.blocks.length) this.blocks.push({id:bid(),t:"p",h:"",i:0});
    this.sel=null;this.render();this.changed();
    const near=this.blocks[Math.max(0,Math.min(first,this.blocks.length)-1)]||this.blocks[0];if(near) this.focus(near.id,"end");
    toast(`${cut?"ตัด":"ลบ"} ${ids.size} บรรทัดแล้ว`,{label:"เลิกทำ",fn:()=>{this.blocks=before;this.render();this.changed()}})}
  selKey(e){const mod=e.metaKey||e.ctrlKey,k=e.key,vis=this.visibleIds();
    if(k==="Escape"){e.preventDefault();e.stopPropagation();this.clearSel();return}
    if(mod&&(k==="c"||k==="x"||k==="C"||k==="X")){e.preventDefault();
      // nothing is text-selected, so the copy event goes to the page: catch it once there
      const cut=k.toLowerCase()==="x",h=ev=>this.selCopy(ev,cut);document.addEventListener("copy",h,{once:true});
      if(!document.execCommand("copy")) document.removeEventListener("copy",h);return}
    if(mod&&(k==="a"||k==="A")){e.preventDefault();this.selectRange(vis[0],vis[vis.length-1]);return}
    if(k==="Backspace"||k==="Delete"){e.preventDefault();this.selDelete(false);return}
    if(k==="ArrowUp"||k==="ArrowDown"){e.preventDefault();const d=k==="ArrowDown"?1:-1,h=vis.indexOf(this.sel.head),n=vis[Math.max(0,Math.min(vis.length-1,h+d))];
      if(e.shiftKey) this.selectRange(this.sel.anchor,n);else this.selectRange(n,n);
      const el=this.host.querySelector(`[data-bid="${n}"]`);if(el) el.scrollIntoView({block:"nearest"});return}
    if(k==="Enter"){e.preventDefault();const h=this.sel.head;this.clearSel();this.focus(h,"end");return}
    if(k==="Tab"&&!this.isRO()){e.preventDefault();const keep=this.sel;
      for(const id of keep.ids){const b=this.get(id);if(!b) continue;if(e.shiftKey){if(b.i>0) b.i--}else if(b.i<6) b.i++}
      this.render();this.changed();this.sel=keep;this.paintSel();this.host.focus({preventScroll:true});return}
    if(k.length===1&&!mod){this.clearSel()}}
  render(){
    const ro=this.isRO();let html="",hideAt=-1;const nums={};
    this.host.classList.toggle("ro",ro);
    this.blocks.forEach(b=>{
      if(hideAt>=0){if(b.i>hideAt) return;hideAt=-1}
      Object.keys(nums).forEach(k=>{if(+k>b.i||(+k===b.i&&b.t!=="ol")) delete nums[k]});
      const t=b.t,ph=(BT[t]||BT.p).ph||"";let pre="",body;
      if(t==="ul") pre=`<span class="mk"><span class="dot${b.i%3?" d"+(b.i%3):""}"></span></span>`;
      else if(t==="ol"){nums[b.i]=(nums[b.i]||0)+1;const n=nums[b.i];pre=`<span class="mk num">${b.i%2?String.fromCharCode(96+((n-1)%26)+1):n}.</span>`}
      else if(t==="todo") pre=`<button class="chk" data-eact="check" aria-pressed="${!!b.c}" aria-label="ติ๊กว่าเสร็จ" ${ro?"disabled":""}>${icon("check")}</button>`;
      else if(t==="toggle") pre=`<button class="tog" data-eact="toggle" aria-expanded="${!b.x}" aria-label="ซ่อนหรือแสดง">${icon("toggle")}</button>`;
      else if(t==="callout") pre=`<button class="co" data-eact="menu" aria-label="เปลี่ยนสี" ${ro?"disabled":""}>${icon("callout")}</button>`;
      if(t==="divider") body=`<div class="hr"></div>`;
      else if(t==="table"){const rows=b.rows=tableRows(b),hr=b.hr!==false;
        body=`<div class="tbl-wrap"><table class="tbl-blk${hr?" has-hr":""}"><tbody>${rows.map((r,ri)=>`<tr>${r.map((c,ci)=>`<td class="tc" contenteditable="${ro?"false":"true"}" data-r="${ri}" data-ci="${ci}">${clean(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>${ro?"":`<button class="tbl-add col" data-eact="tbl-col" aria-label="เพิ่มคอลัมน์" title="เพิ่มคอลัมน์" tabindex="-1">${icon("plus")}</button>`}</div>${ro?"":`<button class="tbl-add row" data-eact="tbl-row" tabindex="-1">${icon("plus")}เพิ่มแถว</button>`}`}
      else if(t==="page"){const p=pageOf(b.p);body=`<button class="pagelink" data-eact="open-page"><span class="pl-ic">${p&&p.icon?esc(p.icon):icon("file")}</span><span class="t">${esc(p?(p.title||"ไม่มีชื่อ")+(p.trashed?" (อยู่ในถังขยะ)":""):"หน้าที่ถูกลบไปแล้ว")}</span></button>`}
      else if(t==="image") body=b.src?`<figure class="img-blk w-${b.w||"m"}"><img data-src="${esc(b.src)}" alt="${esc(b.alt||"รูปในหน้า")}" loading="lazy">${ro?"":`<div class="img-tools" contenteditable="false">${[["s","เล็ก"],["m","กลาง"],["f","เต็ม"]].map(([k,l])=>`<button data-eact="img-size" data-w="${k}" aria-pressed="${(b.w||"m")===k}">${l}</button>`).join("")}<button data-eact="img-pick" aria-label="เปลี่ยนรูป">${icon("restore")}</button></div>`}</figure>`
        :b.uploading?`<div class="img-drop busy" aria-live="polite">${icon("upload")}<span>กำลังอัปโหลด…</span></div>`
        :`<button class="img-drop" data-eact="img-pick" ${ro?"disabled":""}>${sticker("frame")}<span><b>เพิ่มรูปภาพ</b><small>คลิกเพื่อเลือกไฟล์ ลากรูปมาวาง หรือวางจากคลิปบอร์ด</small></span></button>`;
      else if(t==="file") body=b.src?`<div class="file-card"><span class="ft" data-c="${fileColor(b.name)}">${esc(fileExt(b.name))}</span><span class="fi"><b>${esc(b.name||"ไฟล์")}</b><small>${esc(fmtSize(b.size))}${b.size?" · ":""}${esc(ago(b.at))}</small></span><button class="btn small" data-eact="file-get">${icon("download")}ดาวน์โหลด</button>${ro?"":`<button class="icon-btn" data-eact="menu" aria-label="ตัวเลือกไฟล์">${icon("more")}</button>`}</div>`
        :b.uploading?`<div class="img-drop busy" aria-live="polite">${icon("upload")}<span>กำลังอัปโหลด ${esc(b.name||"")}…</span></div>`
        :`<button class="img-drop" data-eact="file-pick" ${ro?"disabled":""}>${sticker("clip")}<span><b>แนบไฟล์</b><small>PDF, Word, Excel, รูป, zip หรือไฟล์อะไรก็ได้ หรือลากไฟล์มาวางในหน้า</small></span></button>`;
      else body=`<div class="ce" contenteditable="${ro?"false":(t==="code"?"plaintext-only":"true")}" spellcheck="${t!=="code"}" data-ph="${esc(ph)}">${t==="code"?esc(b.h):clean(b.h)}</div>`;
      const g=ro?"":`<div class="gutter" contenteditable="false"><button class="g-add" data-eact="add" title="เพิ่มบล็อกด้านล่าง" tabindex="-1">${icon("plus")}</button><button class="g-drag" draggable="true" data-eact="menu" title="ลากเพื่อย้าย · คลิกเพื่อดูเมนู" tabindex="-1">${icon("grip")}</button></div>`;
      const col=b.col||(t==="callout"?"yellow":"");
      html+=`<div class="blk b-${t}${t==="todo"&&b.c?" done":""}" data-bid="${b.id}" style="--ind:${b.i}"${col?` data-c="${col}"`:""}>${g}${pre}${body}</div>`;
      if(t==="toggle"&&b.x) hideAt=b.i;
    });
    this.host.innerHTML=html;
    this.host.querySelectorAll("img[data-src]").forEach(img=>{urlFor(img.dataset.src).then(u=>{if(u) img.src=u;else img.closest("figure").classList.add("missing")})});
  }
  refreshLinks(){this.host.querySelectorAll(".b-page").forEach(el=>{const b=this.get(el.dataset.bid);const p=b&&pageOf(b.p);const t=el.querySelector(".t");if(!t) return;
    t.textContent=p?(p.title||"ไม่มีชื่อ")+(p.trashed?" (อยู่ในถังขยะ)":""):"หน้าที่ถูกลบไปแล้ว";el.querySelector(".pl-ic").innerHTML=p&&p.icon?esc(p.icon):icon("file")})}
  pick(b,accept){const inp=document.createElement("input");inp.type="file";if(accept) inp.accept=accept;inp.onchange=()=>{const f=inp.files&&inp.files[0];if(f) this.uploadInto(b,f)};inp.click()}
  pickImage(b){this.pick(b,"image/*")}
  /** Put dropped or pasted files after a block: images become image blocks, everything else file blocks. */
  insertFiles(files,afterId){if(!files.length) return;let after=afterId||this.blocks[this.blocks.length-1].id;
    const target=afterId&&this.get(afterId);const made=[];
    files.forEach((f,i)=>{const isImg=f.type.startsWith("image/");
      if(i===0&&target&&!target.src&&((target.t==="image"&&isImg)||target.t==="file")){made.push([target,f]);return}
      const nb=this.insertAfter(after,{id:bid(),t:isImg?"image":"file",h:"",i:target?target.i:0,w:"m",name:f.name});after=nb.id;made.push([nb,f])});
    this.render();made.forEach(([nb,f])=>this.uploadInto(nb,f))}
  async uploadInto(b,file){
    if(!file) return;
    if(b.t==="image"&&!file.type.startsWith("image/")){b.t="file"}
    b.uploading=true;b.name=file.name;this.render();
    try{const src=b.t==="image"?await putImage(file):await putFile(file);b.src=src;b.size=file.size;b.at=nowIso();
      if(b.t==="image"){b.alt=file.name.replace(/\.[^.]+$/,"");if(!b.w) b.w="m"}else b.mime=file.type||""}
    catch(e){toast(e&&e.code==="too_large"?`ไฟล์ใหญ่เกิน ${e.limit} MB ลองย่อหรือแยกไฟล์ก่อน`:"อัปโหลดไม่สำเร็จ ลองอีกครั้ง")}
    delete b.uploading;this.render();this.changed()}
  async download(b){const blob=await blobFor(b.src);if(!blob){toast("ไฟล์นี้เก็บอยู่ในเบราว์เซอร์เครื่องอื่น เปิดจากเครื่องนี้ไม่ได้");return}
    const name=b.name||"file";
    if(window.claude&&typeof window.claude.use==="function"){const dl=await window.claude.use("downloads");
      if(!dl){toast("หน้านี้ดาวน์โหลดไฟล์ไม่ได้");return}
      try{await dl.save({filename:name,data:blob})}catch(e){if(e&&e.code==="rejected_extension") toast("ไฟล์นามสกุลนี้ดาวน์โหลดจากลิงก์ claude.ai ไม่ได้");else if(e&&e.code!=="declined") toast("ดาวน์โหลดไม่สำเร็จ ลองอีกครั้ง")}return}
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}
  ce(id){return this.host.querySelector(`[data-bid="${id}"] .ce`)}
  focus(id,off){const el=this.ce(id);if(el) setCaret(el,off);else{const b=this.host.querySelector(`[data-bid="${id}"] button`);if(b) b.focus()}}
  focusFirst(){const b=this.blocks[0];if(b) this.focus(b.id,0)}
  visibleIds(){return [...this.host.querySelectorAll(".blk")].map(x=>x.dataset.bid)}
  insertAfter(id,nb){const k=this.idx(id);const b=this.blocks[k];let at=k+1;if(b&&b.t==="toggle"&&b.x) at=this.group(k)[1];this.blocks.splice(at,0,nb);return nb}
  readCe(ce,b){if(b.t==="code") b.h=ce.innerText.replace(/\n$/,"");else{if(ce.innerHTML==="<br>") ce.innerHTML="";b.h=ce.innerHTML}}
  cell(id,r,c){return this.host.querySelector(`[data-bid="${id}"] td[data-r="${r}"][data-ci="${c}"]`)}
  focusCell(id,r,c){const el=this.cell(id,r,c);if(el) setCaret(el,"end")}
  tableEdit(b,fn,focus){b.rows=tableRows(b);fn(b.rows);if(!b.rows.length) b.rows=[[""]];if(!b.rows[0].length) b.rows.forEach(r=>r.push(""));this.render();this.changed();if(focus) this.focusCell(b.id,Math.min(focus[0],b.rows.length-1),Math.min(focus[1],b.rows[0].length-1))}
  tableKey(e,td){const b=this.get(td.closest(".blk").dataset.bid);if(!b) return;const r=+td.dataset.r,c=+td.dataset.ci,rows=tableRows(b),R=rows.length,C=rows[0].length;
    if(e.key==="Tab"){e.preventDefault();let nr=r,nc=c+(e.shiftKey?-1:1);if(nc>=C){nc=0;nr++}if(nc<0){nc=C-1;nr--}
      if(nr<0) return;if(nr>=R){this.tableEdit(b,x=>x.push(Array(C).fill("")),[nr,nc]);return}this.focusCell(b.id,nr,nc);return}
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(r+1>=R) this.tableEdit(b,x=>x.push(Array(C).fill("")),[r+1,c]);else this.focusCell(b.id,r+1,c);return}
    if(e.key==="ArrowUp"&&caretAtStart(td)&&r>0){e.preventDefault();this.focusCell(b.id,r-1,c);return}
    if(e.key==="ArrowDown"&&caretAtEnd(td)&&r<R-1){e.preventDefault();this.focusCell(b.id,r+1,c);return}
    if(e.key==="ArrowLeft"&&caretAtStart(td)&&c>0){e.preventDefault();this.focusCell(b.id,r,c-1);return}
    if(e.key==="ArrowRight"&&caretAtEnd(td)&&c<C-1){e.preventDefault();this.focusCell(b.id,r,c+1)}}
  tablePaste(e,td){const b=this.get(td.closest(".blk").dataset.bid);const text=((e.clipboardData&&e.clipboardData.getData("text/plain"))||"").replace(/\r/g,"");e.preventDefault();
    if(!text.includes("\t")&&!text.includes("\n")){document.execCommand("insertText",false,text);return}
    // spreadsheet paste: fill cells from here, growing the table as needed
    const grid=text.replace(/\n$/,"").split("\n").map(l=>l.split("\t"));const r0=+td.dataset.r,c0=+td.dataset.ci;
    this.tableEdit(b,rows=>{const need=c0+Math.max(...grid.map(g=>g.length));while(rows[0].length<need) rows.forEach(x=>x.push(""));
      grid.forEach((g,i)=>{const ri=r0+i;while(rows.length<=ri) rows.push(Array(rows[0].length).fill(""));g.forEach((v,j)=>{rows[ri][c0+j]=esc(v)})})},[r0+grid.length-1,c0])}
  onInput(e){if(this.isRO()) return;
    const td=e.target.closest&&e.target.closest("td.tc");if(td){const b=this.get(td.closest(".blk").dataset.bid);if(!b) return;b.rows=tableRows(b);if(td.innerHTML==="<br>") td.innerHTML="";b.rows[+td.dataset.r][+td.dataset.ci]=td.innerHTML;this.changed();return}
    const ce=e.target.closest&&e.target.closest(".ce");if(!ce) return;const b=this.get(ce.closest(".blk").dataset.bid);if(!b) return;
    this.readCe(ce,b);
    if(b.t==="p"&&ce.textContent==="---"){b.t="divider";b.h="";const nb=this.insertAfter(b.id,{id:bid(),t:"p",h:"",i:b.i});this.render();this.focus(nb.id,0);this.changed();return}
    Slash.onInput(this,ce,b);this.changed()}
  onKey(e){
    if(this.sel&&(e.target===this.host)){this.selKey(e);return}
    if(this.sel) this.clearSel();
    if(Slash.isOpen()&&Slash.handleKey(e)) return;
    {const ce0=e.target.closest&&e.target.closest(".ce");
      if(ce0&&!e.isComposing){const id0=ce0.closest(".blk").dataset.bid,vis=this.visibleIds(),p=vis.indexOf(id0),s=getSelection(),r=s.rangeCount?s.getRangeAt(0):null;
        const edge=(atEnd)=>{if(!r) return false;const t=document.createRange();t.selectNodeContents(ce0);if(atEnd) t.setStart(r.endContainer,r.endOffset);else t.setEnd(r.startContainer,r.startOffset);return t.toString().length===0};
        if(e.shiftKey&&e.key==="ArrowDown"&&p<vis.length-1&&edge(true)){e.preventDefault();this.enterSel(id0,vis[p+1]);return}
        if(e.shiftKey&&e.key==="ArrowUp"&&p>0&&edge(false)){e.preventDefault();this.enterSel(id0,vis[p-1]);return}
        if(e.key==="Escape"&&!Slash.isOpen()){e.preventDefault();e.stopPropagation();this.enterSel(id0,id0);return}
        if((e.metaKey||e.ctrlKey)&&(e.key==="a"||e.key==="A")&&edge(false)&&edge(true)&&ce0.textContent.length===s.toString().length){e.preventDefault();this.enterSel(vis[0],vis[vis.length-1]);return}}}
    if(this.isRO()) return;
    const td=e.target.closest&&e.target.closest("td.tc");if(td){if(!e.isComposing) this.tableKey(e,td);return}
    const ce=e.target.closest&&e.target.closest(".ce");if(!ce||e.isComposing) return;
    const id=ce.closest(".blk").dataset.bid,b=this.get(id),k=this.idx(id),mod=e.metaKey||e.ctrlKey;
    if(e.key==="Enter"&&!e.shiftKey){
      if(b.t==="code"&&!mod){e.preventDefault();document.execCommand("insertText",false,"\n");return}
      e.preventDefault();this.split(ce,b,k);return}
    if(e.key==="Backspace"&&caretAtStart(ce)){
      if(b.t!=="p"&&!(b.t==="code"&&b.h)){e.preventDefault();b.t="p";this.render();this.focus(id,0);this.changed();return}
      if(b.t==="code") return;
      if(b.i>0){e.preventDefault();b.i--;this.render();this.focus(id,0);this.changed();return}
      const vis=this.visibleIds(),pi=vis.indexOf(id);if(pi<=0) return;
      e.preventDefault();const pb=this.get(vis[pi-1]);
      if(["divider","page","image","file","table"].includes(pb.t)){if(pb.t==="divider"||pb.t==="page"){this.blocks.splice(this.idx(pb.id),1);this.render();this.focus(id,0);this.changed()}return}
      const pce=this.ce(pb.id),plen=pce?pce.textContent.length:0;
      pb.h=pb.t==="code"?(pb.h||"")+blockText(b):(pb.h||"")+(b.t==="code"?esc(b.h):b.h);
      this.blocks.splice(this.idx(id),1);this.render();this.focus(pb.id,plen);this.changed();return}
    if(e.key==="Tab"){e.preventDefault();if(b.t==="code"&&!e.shiftKey){document.execCommand("insertText",false,"  ");return}
      const off=caretOffset(ce);const prev=this.blocks[k-1];
      if(e.shiftKey){if(b.i>0){const [s,en]=this.group(k);for(let j=s;j<en;j++) this.blocks[j].i--}}
      else if(prev&&b.i<=prev.i&&b.i<6){const [s,en]=this.group(k);for(let j=s;j<en;j++) this.blocks[j].i++}
      this.render();this.focus(id,off);this.changed();return}
    if(e.key==="ArrowUp"&&caretAtStart(ce)){const vis=this.visibleIds(),pi=vis.indexOf(id);if(pi>0){e.preventDefault();this.focus(vis[pi-1],"end")}return}
    if(e.key==="ArrowDown"&&caretAtEnd(ce)){const vis=this.visibleIds(),pi=vis.indexOf(id);if(pi<vis.length-1){e.preventDefault();this.focus(vis[pi+1],0)}return}
    if(e.key===" "&&b.t!=="code"&&selCollapsed()){
      const map={"#":"h1","##":"h2","###":"h3","-":"ul","*":"ul","1.":"ol","[]":"todo","[ ]":"todo",">":"toggle",'"':"quote","```":"code"};
      const tb=textBefore(ce);if(map[tb]){e.preventDefault();rangeAt(ce,0,tb.length).deleteContents();this.readCe(ce,b);b.t=map[tb];if(b.t==="code") b.h=htmlText(b.h);
        this.render();this.focus(id,0);this.changed()}return}
    if(mod&&e.key.toLowerCase()==="d"){e.preventDefault();this.duplicate(id)}
  }
  split(ce,b,k){
    const listy=["ul","ol","todo"];const txt=ce.textContent;
    if((listy.includes(b.t)||b.t==="quote"||b.t==="toggle")&&!txt.trim()){if(b.i>0) b.i--;else b.t="p";this.render();this.focus(b.id,0);this.changed();return}
    if(caretOffset(ce)===0&&txt.length){const nb={id:bid(),t:listy.includes(b.t)?b.t:"p",h:"",i:b.i};this.blocks.splice(k,0,nb);this.render();this.focus(b.id,0);this.changed();return}
    const s=getSelection();const r=s.getRangeAt(0);r.deleteContents();
    const tail=document.createRange();tail.setStart(r.endContainer,r.endOffset);tail.setEnd(ce,ce.childNodes.length);
    const div=document.createElement("div");div.appendChild(tail.extractContents());
    let after=b.t==="code"?div.textContent:(div.textContent?div.innerHTML:"");this.readCe(ce,b);
    let nt=listy.includes(b.t)?b.t:"p",ni=b.i;
    if(b.t==="toggle"){ni=b.i+1;b.x=false}
    const nb={id:bid(),t:nt,h:after,i:ni};
    if(b.t==="toggle") this.blocks.splice(k+1,0,nb);else this.insertAfter(b.id,nb);
    this.render();this.focus(nb.id,0);this.changed()}
  onPaste(e){
    if(this.isRO()) return;
    const td=e.target.closest&&e.target.closest("td.tc");if(td){this.tablePaste(e,td);return}
    const ce=e.target.closest&&e.target.closest(".ce");if(!ce) return;const b=this.get(ce.closest(".blk").dataset.bid);
    const files=[...((e.clipboardData&&e.clipboardData.files)||[])];
    if(files.length){e.preventDefault();const emptyP=b.t==="p"&&!blockText(b).trim();this.insertFiles(files,b.id);
      if(emptyP){this.blocks.splice(this.idx(b.id),1);this.render()}return}
    const text=(e.clipboardData&&e.clipboardData.getData("text/plain"))||"";e.preventDefault();
    if(b.t==="code"||!text.includes("\n")){document.execCommand("insertText",false,text);return}
    const lines=text.replace(/\r/g,"").split("\n");document.execCommand("insertText",false,lines.shift());
    let after=b.id;const mk=line=>{const m=line.match(/^(\s*)(#{1,3} |[-*] |\d+[.)] |\[[ xX]?\] |> )?(.*)$/);const ind=Math.min(6,Math.floor((m[1]||"").replace(/\t/g,"  ").length/2));const p=(m[2]||"").trim();
      const t=p==="#"?"h1":p==="##"?"h2":p==="###"?"h3":/^[-*]$/.test(p)?"ul":/^\d/.test(p)?"ol":p.startsWith("[")?"todo":p===">"?"quote":"p";
      return {id:bid(),t,h:esc(m[3]),i:t==="p"?0:ind,c:/^\[[xX]\]/.test(p)||undefined}};
    const nbs=lines.filter((l,i)=>l.trim()||i<lines.length-1).map(mk);
    nbs.forEach(nb=>{const k=this.idx(after);this.blocks.splice(k+1,0,nb);after=nb.id});
    this.readCe(ce,b);this.render();this.focus(after,"end");this.changed()}
  onClick(e){
    const a=e.target.closest&&e.target.closest(".ce a[href]");
    if(a&&(e.ctrlKey||e.metaKey||this.isRO())){e.preventDefault();const x=document.createElement("a");x.href=a.getAttribute("href");x.target="_blank";x.rel="noopener";document.body.appendChild(x);x.click();x.remove();return}
    const el=e.target.closest&&e.target.closest("[data-eact]");if(!el) return;const blk=el.closest(".blk"),id=blk.dataset.bid,b=this.get(id);if(!b) return;
    const act=el.dataset.eact;
    if(act==="open-page"){if(b.p&&pageOf(b.p)) go("page-"+b.p);return}
    if(act==="toggle"){b.x=!b.x;this.render();this.changed();return}
    if(act==="file-get"){this.download(b);return}
    if(this.isRO()) return;
    if(act==="check"){b.c=!b.c;this.render();this.changed()}
    else if(act==="add"){const nb=this.insertAfter(id,{id:bid(),t:"p",h:"/",i:b.t==="toggle"&&!b.x?b.i+1:b.i});this.render();this.focus(nb.id,1);const ce=this.ce(nb.id);Slash.openAt(this,ce,nb,0);this.changed()}
    else if(act==="menu") this.blockMenu(el,b);
    else if(act==="img-pick") this.pickImage(b);
    else if(act==="file-pick") this.pick(b);
    else if(act==="img-size"){b.w=el.dataset.w;this.render();this.changed()}
    else if(act==="tbl-row"){const R=tableRows(b).length;this.tableEdit(b,x=>x.push(Array(x[0].length).fill("")),[R,0])}
    else if(act==="tbl-col"){const C=tableRows(b)[0].length;this.tableEdit(b,x=>x.forEach(r=>r.push("")),[0,C])}
  }
  blockMenu(anchor,b){
    const turn=["p","h1","h2","h3","todo","ul","ol","toggle","quote","callout","code"].map(t=>({g:BT[t].g,ic:BT[t].ic,label:BT[t].label,on:b.t===t,onClick:()=>{
      if(b.t==="code"&&t!=="code") b.h=esc(b.h);else if(t==="code"&&b.t!=="code") b.h=blockText(b);b.t=t;this.render();this.focus(b.id,"end");this.changed()}}));
    const fixed=["divider","page","image","file","table"].includes(b.t);
    const tc=this.tcell&&this.tcell.id===b.id?this.tcell:null,rows=b.t==="table"?tableRows(b):null;
    const tbl=b.t==="table"?[{header:"ตาราง"},
      {ic:"plus",label:"เพิ่มแถวด้านล่าง",onClick:()=>{const at=tc?tc.r+1:rows.length;this.tableEdit(b,x=>x.splice(at,0,Array(x[0].length).fill("")),[at,tc?tc.c:0])}},
      {ic:"plus",label:"เพิ่มคอลัมน์ด้านขวา",onClick:()=>{const at=tc?tc.c+1:rows[0].length;this.tableEdit(b,x=>x.forEach(r=>r.splice(at,0,"")),[tc?tc.r:0,at])}},
      ...(rows.length>1?[{ic:"trash",label:tc?"ลบแถวที่ "+(tc.r+1):"ลบแถวสุดท้าย",onClick:()=>{const at=tc?tc.r:rows.length-1;this.tableEdit(b,x=>x.splice(at,1),[Math.max(0,at-1),tc?tc.c:0])}}]:[]),
      ...(rows[0].length>1?[{ic:"trash",label:tc?"ลบคอลัมน์ที่ "+(tc.c+1):"ลบคอลัมน์สุดท้าย",onClick:()=>{const at=tc?tc.c:rows[0].length-1;this.tableEdit(b,x=>x.forEach(r=>r.splice(at,1)),[tc?tc.r:0,Math.max(0,at-1)])}}]:[]),
      {ic:"check",label:"แถวแรกเป็นหัวตาราง",on:b.hr!==false,onClick:()=>{b.hr=b.hr===false?undefined:false;this.render();this.changed()}}]:[];
    const sizes=[["s","เล็ก"],["m","กลาง"],["f","เต็มความกว้าง"]].map(([k,l])=>({ic:"width",label:"ขนาด: "+l,on:(b.w||"m")===k,onClick:()=>{b.w=k;this.render();this.changed()}}));
    openMenu(anchor,[
      ...(b.t==="image"?[{header:"รูปภาพ"},{ic:"restore",label:b.src?"เปลี่ยนรูป":"เลือกรูป",onClick:()=>this.pickImage(b)},...sizes]
        :b.t==="file"?[{header:"ไฟล์แนบ"},...(b.src?[{ic:"download",label:"ดาวน์โหลด",onClick:()=>this.download(b)}]:[]),{ic:"restore",label:b.src?"เปลี่ยนไฟล์":"เลือกไฟล์",onClick:()=>this.pick(b)}]
        :b.t==="table"?tbl
        :[{header:"สี"},{swatches:true,current:b.col||"",onPick:c=>{b.col=c||undefined;this.render();this.changed()}}]),
      {header:"บล็อก"},
      {ic:"copy",label:"ทำสำเนา",hint:"Ctrl+D",onClick:()=>this.duplicate(b.id)},
      {ic:"arrow-up",label:"ย้ายขึ้น",onClick:()=>this.shift(b.id,-1)},{ic:"arrow-down",label:"ย้ายลง",onClick:()=>this.shift(b.id,1)},
      {ic:"trash",label:b.t==="file"?"ลบไฟล์นี้ออกจากหน้า":"ลบบล็อก",danger:true,onClick:()=>this.del(b.id)},
      ...(fixed?[]:[{header:"แปลงเป็น"},...turn])]);
  }
  duplicate(id){const k=this.idx(id);const [s,e]=this.group(k);const copy=this.blocks.slice(s,e).map(x=>Object.assign({},x,{id:bid()}));this.blocks.splice(e,0,...copy);this.render();this.focus(copy[0].id,"end");this.changed()}
  del(id){const k=this.idx(id);this.blocks.splice(k,1);if(!this.blocks.length) this.blocks.push({id:bid(),t:"p",h:"",i:0});this.render();const n=this.blocks[Math.max(0,k-1)];this.focus(n.id,"end");this.changed()}
  shift(id,dir){const k=this.idx(id);const [s,e]=this.group(k);const grp=this.blocks.splice(s,e-s);let at;
    if(dir<0){let j=s-1;while(j>0&&this.blocks[j].i>grp[0].i) j--;at=Math.max(0,j)}else{if(s>=this.blocks.length){this.blocks.splice(s,0,...grp);return}const [,ne]=this.group(s);at=ne}
    this.blocks.splice(at,0,...grp);this.render();this.focus(id,"end");this.changed()}
  move(fromId,toId,before){if(fromId===toId) return;const k=this.idx(fromId);const [s,e]=this.group(k);const grp=this.blocks.slice(s,e);if(grp.some(x=>x.id===toId)) return;
    this.blocks.splice(s,e-s);const tk=this.idx(toId);const t=this.blocks[tk];const delta=t.i-grp[0].i;grp.forEach(x=>x.i=Math.max(0,x.i+delta));
    const at=before?tk:(t.t==="toggle"&&t.x?this.group(tk)[1]:tk+1);this.blocks.splice(at,0,...grp);this.render();this.changed()}
  applyType(b,type){
    const empty=!blockText(b).trim();
    if(type==="page"){const parent=this.opt.col==="pages"?this.opt.id:"";const pid=createPage({parentId:parent,link:false,navigate:false,teamId:this.opt.teamId?this.opt.teamId():undefined});
      if(empty){b.t="page";b.p=pid;b.h=""}else this.insertAfter(b.id,{id:bid(),t:"page",p:pid,h:"",i:b.i});
      this.render();this.changed();flush(this.opt.col,this.opt.id);go("page-"+pid);return}
    if(type==="image"||type==="file"){let ib=b;if(empty&&b.t==="p"){b.t=type;b.h="";b.w="m"}else ib=this.insertAfter(b.id,{id:bid(),t:type,h:"",i:b.i,w:"m"});
      this.render();this.changed();this.pick(ib,type==="image"?"image/*":"");return}
    if(type==="table"){let tb=b;const fresh={rows:[["",""],["",""],["",""]]};if(empty&&b.t==="p"){b.t="table";b.h="";Object.assign(b,fresh)}else tb=this.insertAfter(b.id,Object.assign({id:bid(),t:"table",h:"",i:b.i},fresh));
      const k=this.idx(tb.id),nx=this.blocks[k+1];if(!nx) this.blocks.push({id:bid(),t:"p",h:"",i:tb.i});
      this.render();this.changed();this.focusCell(tb.id,0,0);return}
    if(type==="divider"){if(empty){b.t="divider";b.h=""}else this.insertAfter(b.id,{id:bid(),t:"divider",h:"",i:b.i});
      const nb=this.insertAfter(this.blocks[this.idx(b.id)+(empty?0:1)].id,{id:bid(),t:"p",h:"",i:b.i});this.render();this.focus(nb.id,0);this.changed();return}
    if(empty){b.t=type;if(type==="code") b.h="";this.render();this.focus(b.id,"end")}
    else{const nb=this.insertAfter(b.id,{id:bid(),t:type,h:"",i:b.i});this.render();this.focus(nb.id,0)}
    this.changed()}
}
const fileExt=n=>{const m=String(n||"").match(/\.([a-z0-9]{1,5})$/i);return m?m[1].toUpperCase():"FILE"};
function fileColor(n){const e=fileExt(n);return /PDF/.test(e)?"pink":/DOCX?|PAGES|TXT|MD/.test(e)?"blue":/XLSX?|CSV|NUMBERS/.test(e)?"green":/PPTX?|KEY/.test(e)?"orange":/ZIP|RAR|7Z/.test(e)?"yellow":"teal"}

/* slash command menu */
const Slash={el:null,ed:null,bid:null,start:0,q:"",sel:0,items:[],
  isOpen(){return !this.el.hidden},
  openAt(ed,ce,b,start){this.ed=ed;this.bid=b.id;this.start=start;this.q="";this.sel=0;this.filter();const r=caretRect()||ce.getBoundingClientRect();placeFloating(this.el,r)},
  close(){this.el.hidden=true;this.ed=null},
  filter(){const q=this.q.toLowerCase().trim();
    this.items=SLASH_ORDER.filter(t=>!q||BT[t].label.toLowerCase().includes(q)||BT[t].k.includes(q)||t.startsWith(q));
    if(this.sel>=this.items.length) this.sel=0;
    this.el.innerHTML=this.items.length?`<div class="m-h">บล็อกพื้นฐาน</div>`+this.items.map((t,i)=>`<button class="m-i${i===this.sel?" on":""}" data-si="${i}"><span class="m-g">${glyph(BT[t])}</span><span>${esc(BT[t].label)}<small>${esc(BT[t].desc)}</small></span></button>`).join("")
      :`<div class="m-h">ไม่พบบล็อก “${esc(this.q)}”</div>`;
    const on=this.el.querySelector(".m-i.on");if(on) on.scrollIntoView({block:"nearest"})},
  onInput(ed,ce,b){
    if(!this.isOpen()){const tb=textBefore(ce);if(tb.endsWith("/")&&(tb.length===1||/\s$/.test(tb.slice(0,-1)))) this.openAt(ed,ce,b,tb.length-1);return}
    if(this.ed!==ed||this.bid!==b.id) return this.close();
    const off=caretOffset(ce);if(off<=this.start||ce.textContent[this.start]!=="/") return this.close();
    const txt=ce.textContent.slice(this.start+1,off);if(/\n|\s{2}/.test(txt)||txt.length>24) return this.close();
    this.q=txt;this.filter();if(!this.items.length&&txt.length>6) this.close()},
  handleKey(e){
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();const n=this.items.length;if(n){this.sel=(this.sel+(e.key==="ArrowDown"?1:-1)+n)%n;this.filter()}return true}
    if(e.key==="Enter"||e.key==="Tab"){if(!this.items.length){this.close();return false}e.preventDefault();this.choose(this.items[this.sel]);return true}
    if(e.key==="Escape"){e.preventDefault();this.close();return true}
    return false},
  choose(type){const ed=this.ed,b=ed&&ed.get(this.bid);if(!b){this.close();return}const ce=ed.ce(b.id);
    if(ce){rangeAt(ce,this.start,this.start+1+this.q.length).deleteContents();ed.readCe(ce,b)}
    this.close();ed.applyType(b,type)}};

/* generic popover menu */
let menuItems=[];
function openMenu(anchor,items){const m=$("#menu");menuItems=items;m.classList.remove("wide-menu","stk-menu");
  m.innerHTML=items.map((it,i)=>it.header?`<div class="m-h">${esc(it.header)}</div>`
    :it.swatches?`<div class="m-sw">${["",...COLORS].map(c=>`<button class="sw${c?"":" none"}"${c?` data-c="${c}"`:""} data-mi="${i}" data-color="${c}" aria-pressed="${(it.current||"")===c}" aria-label="${c||"ไม่มีสี"}"></button>`).join("")}</div>`
    :it.emoji?`<div class="emoji-grid">${EMOJI.map(em=>`<button data-mi="${i}" data-emoji="${em}">${em}</button>`).join("")}</div>`
    :`<button class="m-i${it.danger?" danger":""}${it.on?" on":""}" data-mi="${i}">${it.ic||it.g?`<span class="m-g">${glyph(it)}</span>`:""}<span class="lb">${esc(it.label)}</span>${it.hint?`<span class="m-hint">${esc(it.hint)}</span>`:""}</button>`).join("");
  placeFloating(m,anchor.getBoundingClientRect())}
function closeMenu(){$("#menu").hidden=true;menuItems=[]}
$("#menu").addEventListener("click",e=>{const b=e.target.closest("[data-mi]");if(!b) return;const it=menuItems[+b.dataset.mi];if(!it) return;
  if(it.stickers){closeMenu();it.onPick(b.dataset.sid);return}
  if(it.swatches){it.onPick(b.dataset.color);closeMenu();return}
  if(it.emoji){it.onPick(b.dataset.emoji);closeMenu();return}
  if(it.confirm&&!it._armed){it._armed=true;b.classList.add("armed");b.querySelector(".lb").textContent=it.confirm;return}
  closeMenu();it.onClick()});
$("#slash").addEventListener("mousedown",e=>e.preventDefault());
$("#slash").addEventListener("click",e=>{const b=e.target.closest("[data-si]");if(b) Slash.choose(Slash.items[+b.dataset.si])});
Slash.el=$("#slash");

/* selection toolbar */
let tbRange=null;
document.addEventListener("selectionchange",()=>{const tb=$("#tb");if(document.activeElement===$("#tbLink")) return;
  const s=getSelection();if(!s.rangeCount||s.isCollapsed||S.readOnly){tb.hidden=true;return}
  const n=s.anchorNode&&(s.anchorNode.nodeType===1?s.anchorNode:s.anchorNode.parentElement);const ce=n&&n.closest&&n.closest(".editor .ce");
  if(!ce||ce.closest(".b-code")){tb.hidden=true;return}
  const r=s.getRangeAt(0).getBoundingClientRect();tb.hidden=false;$("#tbLink").hidden=true;
  const w=tb.offsetWidth;tb.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+"px";tb.style.top=Math.max(8,r.top-tb.offsetHeight-8)+"px"});
$("#tb").addEventListener("mousedown",e=>{if(e.target.id!=="tbLink") e.preventDefault()});
$("#tb").addEventListener("click",e=>{const b=e.target.closest("[data-cmd]");if(!b) return;const cmd=b.dataset.cmd;const s=getSelection();
  if(cmd==="code"||cmd==="mark"){if(!s.rangeCount) return;const txt=s.toString();document.execCommand("insertHTML",false,`<${cmd}>${esc(txt)}</${cmd}>`)}
  else if(cmd==="link"){tbRange=s.rangeCount?s.getRangeAt(0).cloneRange():null;const i=$("#tbLink");i.hidden=false;i.value="";i.focus()}
  else document.execCommand(cmd)});
$("#tbLink").addEventListener("keydown",e=>{if(e.key==="Escape"){$("#tb").hidden=true;return}if(e.key!=="Enter") return;e.preventDefault();const v=e.target.value.trim();
  if(tbRange){const n=tbRange.startContainer;const ce=(n.nodeType===1?n:n.parentElement).closest(".ce");if(ce){ce.focus();const s=getSelection();s.removeAllRanges();s.addRange(tbRange);
    if(v) document.execCommand("createLink",false,safeUrl(v));else document.execCommand("unlink")}}
  $("#tb").hidden=true;tbRange=null});

/* ================= pages ================= */
const livePages=()=>S.pages.filter(p=>!p.trashed);
function ancestors(p){const out=[];let cur=p,guard=0;while(cur&&cur.parentId&&guard++<20){cur=pageOf(cur.parentId);if(!cur||cur.trashed) break;out.unshift(cur)}return out}
function descendants(id){const out=[];const walk=pid=>S.pages.filter(p=>p.parentId===pid).forEach(c=>{if(!out.includes(c.id)){out.push(c.id);walk(c.id)}});walk(id);return out}
function createPage(o){o=o||{};const id=newId(),t=nowIso();
  const teamId=o.teamId!==undefined?o.teamId:(o.parentId?((pageOf(o.parentId)||{}).teamId||""):spaceTeam());
  const par=o.parentId?pageOf(o.parentId):null,shr=par&&par.share==="private"?{share:"private",people:Object.assign({},par.people||{},par.createdBy&&par.createdBy!==S.me?{[par.createdBy]:"edit"}:{}),teamAccess:par.teamAccess||"edit"}:par&&par.teamAccess==="view"?{teamAccess:"view",people:Object.assign({},par.people||{})}:{};
  const p={...shr,title:o.title||"",icon:o.icon||"",cover:o.cover||"",parentId:o.parentId||"",teamId,order:Date.now(),blocks:serBlocks(normBlocks(o.blocks)),trashed:false,trashRoot:"",wide:false,createdAt:t,updatedAt:t};
  if(o.example) p.example=true;
  S.pages.push(Object.assign({id},p));put("pages",id,p);
  if(o.parentId&&o.link!==false) addChildLink(o.parentId,id);
  if(o.parentId) {S.expanded.add(o.parentId);saveLocal("team-pulse-exp",[...S.expanded])}
  if(o.navigate!==false) go("page-"+id);return id}
function addChildLink(parentId,childId){
  if(pageEditor&&pageEditor.opt.id===parentId){pageEditor.blocks.push({id:bid(),t:"page",p:childId,h:"",i:0});pageEditor.render();pageEditor.changed();return}
  const par=pageOf(parentId);if(!par) return;const bl=normBlocks(par.blocks);if(blocksEmpty(bl)) bl.length=0;bl.push({id:bid(),t:"page",p:childId,h:"",i:0});
  par.blocks=serBlocks(bl);patch("pages",parentId,{blocks:par.blocks,updatedAt:nowIso()},0)}
function trashPage(id){const ids=[id,...descendants(id)].filter(x=>{const p=pageOf(x);return p&&!p.trashed});
  ids.forEach(x=>{const p=pageOf(x);p.trashed=true;p.trashRoot=id;patch("pages",x,{trashed:true,trashRoot:id},0)});
  const r=route();if(r.v==="page"&&ids.includes(r.id)) go("home");else render();
  toast("ย้าย “"+((pageOf(id)||{}).title||"ไม่มีชื่อ")+"” ไปถังขยะแล้ว",{label:"เลิกทำ",fn:()=>restorePage(id)})}
function restorePage(id){S.pages.filter(p=>p.trashRoot===id).forEach(p=>{p.trashed=false;p.trashRoot="";const f={trashed:false,trashRoot:""};
  if(p.id===id&&p.parentId){const par=pageOf(p.parentId);if(!par||par.trashed){p.parentId="";f.parentId=""}}patch("pages",p.id,f,0)});render();toast("กู้คืนแล้ว")}
function destroyPage(id){S.pages.filter(p=>p.trashRoot===id).forEach(p=>remove("pages",p.id));S.pages=S.pages.filter(p=>p.trashRoot!==id);render();toast("ลบถาวรแล้ว")}
function duplicatePage(id){const p=pageOf(id);if(!p) return;createPage({title:(p.title||"ไม่มีชื่อ")+" (สำเนา)",icon:p.icon,cover:p.cover,parentId:p.parentId,teamId:p.teamId||"",link:false,blocks:(p.blocks||[]).filter(b=>b.t!=="page").map(b=>Object.assign({},b,{id:bid()}))})}
function toggleFav(id){if(S.fav.has(id)) S.fav.delete(id);else S.fav.add(id);saveLocal("team-pulse-fav",[...S.fav]);render()}

function toMarkdown(p){const nums={};const inl=h=>{let s=clean(h).replace(/<br\s*\/?>/gi,"  \n").replace(/<\/?(b|strong)>/gi,"**").replace(/<\/?(i|em)>/gi,"*").replace(/<\/?(s|strike)>/gi,"~~").replace(/<\/?code>/gi,"`")
    .replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,"[$2]($1)").replace(/<[^>]+>/g,"");const t=document.createElement("textarea");t.innerHTML=s;return t.value};
  const lines=[`# ${p.title||"ไม่มีชื่อ"}`,""];
  (p.blocks||[]).forEach(b=>{const ind="  ".repeat(b.i||0);if(b.t!=="ol") Object.keys(nums).forEach(k=>delete nums[k]);
    const x=b.t==="code"?b.h:inl(b.h);
    switch(b.t){case "h1":lines.push("## "+x);break;case "h2":lines.push("### "+x);break;case "h3":lines.push("#### "+x);break;
      case "ul":case "toggle":lines.push(ind+"- "+x);break;case "ol":nums[b.i]=(nums[b.i]||0)+1;lines.push(ind+nums[b.i]+". "+x);break;
      case "todo":lines.push(ind+"- ["+(b.c?"x":" ")+"] "+x);break;case "quote":case "callout":lines.push("> "+x);break;
      case "code":lines.push("```",x,"```");break;case "divider":lines.push("---");break;
      case "page":lines.push("- "+((pageOf(b.p)||{}).title||"หน้าย่อย"));break;
      case "table":{const rows=tableRows(b).map(r=>"| "+r.map(c=>inl(c).replace(/\|/g,"\\|").replace(/\n/g," ")).join(" | ")+" |");if(rows.length){lines.push(rows[0],"|"+rows[0].split(" | ").map(()=>" --- ").join("|")+"|",...rows.slice(1))}break}
      case "image":lines.push(b.src&&!b.src.startsWith("idb:")?`![${b.alt||""}](${b.src})`:`[รูปภาพ${b.alt?": "+b.alt:""}]`);break;default:lines.push(x)}});
  return lines.join("\n")}
function copyText(text){const done=()=>toast("คัดลอกแล้ว");
  try{navigator.clipboard.writeText(text).then(done,()=>showText(text))}catch(e){showText(text)}}
function showText(text){$("#modalRoot").innerHTML=`<div class="modal-wrap" data-act="modal-bg"><div class="modal" role="dialog" aria-modal="true"><h2>คัดลอกข้อความนี้</h2><textarea id="cpTxt" class="inp mono" rows="12">${esc(text)}</textarea><div class="modal-foot"><span></span><button class="btn" data-act="close-modal">ปิด</button></div></div></div>`;const t=$("#cpTxt");t.focus();t.select()}

/* templates */
function tpl(kind,ctx){const B=(t,h,i,x)=>Object.assign({id:bid(),t,h:h||"",i:i||0},x||{});ctx=ctx||{};
  const today=new Date().toLocaleDateString("th-TH",{day:"numeric",month:"long",year:"numeric"});
  switch(kind){
    case "meeting":return {title:ctx.title||"บันทึกประชุม "+today,icon:"📝",blocks:[
      B("callout",`<b>วันที่</b> ${esc(ctx.date||today)}${ctx.people?` · <b>ผู้เข้าร่วม</b> ${esc(ctx.people)}`:""}`,0,{col:"blue"}),
      B("h2","วาระ"),B("ol",""),B("h2","สรุปและสิ่งที่ตัดสินใจ"),B("ul",""),B("h2","Action items"),B("todo",""),B("h2","โน้ตเพิ่มเติม"),B("p","")]};
    case "sprint":return {title:"แผนสปรินต์",icon:"🚀",blocks:[
      B("callout","เป้าหมายของสปรินต์นี้ในประโยคเดียว",0,{col:"blue"}),B("h2","งานที่จะทำ"),B("todo",""),B("todo",""),B("todo",""),
      B("h2","ใครทำอะไร"),B("ul",""),B("h2","ความเสี่ยง / สิ่งที่อาจทำให้ช้า"),B("ul",""),B("h2","วันสำคัญ"),B("ul","")]};
    case "retro":return {title:"Retro",icon:"🧭",blocks:[
      B("h2","อะไรไปได้ดี",0,{col:"green"}),B("ul",""),B("h2","อะไรควรปรับ",0,{col:"pink"}),B("ul",""),B("h2","รอบหน้าจะลองอะไร",0,{col:"blue"}),B("todo","")]};
    case "doc":return {title:"เอกสารโปรเจกต์",icon:"📚",blocks:[
      B("callout","สรุปสั้น ๆ ว่าโปรเจกต์นี้คืออะไร ทำให้ใคร",0,{col:"teal"}),B("h2","ปัญหาที่แก้"),B("p",""),B("h2","แนวทาง"),B("p",""),
      B("h2","รันอยู่ที่ไหน / วิธี deploy"),B("code","# เช่น\nnpm run build && npm run deploy"),B("h2","ลิงก์ที่เกี่ยวข้อง"),B("ul","")]};
    case "todo":return {title:"To-do ของทีม",icon:"✅",blocks:[B("h2","สัปดาห์นี้"),B("todo",""),B("todo",""),B("h2","รอคนอื่น"),B("todo","")]};
  }}
const TEMPLATES=[["meeting","บันทึกประชุม","pink","note"],["sprint","แผนสปรินต์","blue","sparkle"],["retro","Retro","green","restore"],["doc","เอกสารโปรเจกต์","teal","file"],["todo","To-do list","orange","todo"]];

/* ================= people, avatars, theme ================= */
function avatar(m,size){const cls="av"+(size?" "+size:"");if(!m) return `<span class="${cls} none" data-c="blue">${icon("user")}</span>`;
  const c=esc(m.color||"blue");const a=m.avatar||"";
  if(a.startsWith("a:")) return `<span class="${cls} drawn" data-c="${c}" title="${esc(m.name)}">${avatarSVG(+a.slice(2))}</span>`;
  if(a.startsWith("data:image/")||/^https?:/.test(a)) return `<span class="${cls} photo" data-c="${c}" title="${esc(m.name)}"><img src="${esc(a)}" alt=""></span>`;
  return `<span class="${cls}" data-c="${c}" title="${esc(m.name)}">${esc(initial(m.name))}</span>`}
function applyTheme(t){S.theme=t;const r=document.documentElement;if(t==="system") r.removeAttribute("data-theme");else r.setAttribute("data-theme",t);
  const dark=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);
  const mc=document.querySelector('meta[name="theme-color"]');if(mc) mc.content=dark?"#161614":"#f7f7f4"}
const meMember=()=>memberOf(S.me);

/* ================= teams & access =================
   A team has members (see + edit) and viewers (see only). Content without a team belongs to everyone.
   Admins (the artifact owner, or a member marked ผู้ดูแล) see every team.
   This is enforced by the app, not by the database: anyone with database access could read raw rows. */
const teamOf=id=>S.teams.find(t=>t.id===id);
function isAdmin(){if(API.on) return S.role==="owner"||S.role==="admin";const m=meMember();return !!(S.isOwner||(m&&m.admin))}
const isGuest=()=>API.on&&S.role==="guest";
const ROLE_LABEL={owner:"เจ้าของ",admin:"ผู้ดูแล",member:"สมาชิก",guest:"คนนอก"};
function teamRole(tid){if(isGuest()) return "view";if(!tid) return "edit";const t=teamOf(tid);if(!t) return S.loaded.teams?"edit":"none";
  if(isAdmin()||(t.memberIds||[]).includes(S.me)) return "edit";if((t.viewerIds||[]).includes(S.me)) return "view";return "none"}
const canSee=tid=>teamRole(tid)!=="none";
const canEditT=tid=>!S.readOnly&&teamRole(tid)==="edit";
// pages: same rules as the server (share: team | private, teamAccess, people: {id: view|edit})
function pageRole(p){if(!p) return "none";if(!API.on) return teamRole(p.teamId);
  if(p.createdBy&&p.createdBy===S.me) return "edit";if(isAdmin()&&(p.share!=="private"||!p.createdBy)) return "edit";
  const pr=(p.people||{})[S.me];if(isGuest()) return pr||(p.guestIds||[]).includes(S.me)?"view":"none";
  let r=p.share==="private"?"none":teamRole(p.teamId);if(r==="edit"&&p.teamAccess==="view") r="view";
  if(pr==="edit") r="edit";else if(pr==="view"&&r==="none") r="view";return r}
const canEditPage=p=>!S.readOnly&&pageRole(p)==="edit";
const canSharePage=p=>API.on&&!S.readOnly&&!isGuest()&&!!p&&(p.createdBy===S.me||(isAdmin()&&(p.share!=="private"||!p.createdBy))||(!p.createdBy&&canEditPage(p)));
const canEditProject=p=>isGuest()?!!p&&p.requestedBy===S.me:canEditT(p&&p.teamId);
const myTeams=()=>S.teams.filter(t=>canSee(t.id)).sort(byOrder);
const editTeams=()=>S.teams.filter(t=>canEditT(t.id)).sort(byOrder);
const spaceTeam=()=>S.space&&S.space!=="all"&&S.space!=="general"&&canEditT(S.space)?S.space:"";
function inSpace(x){if(!canSee(x.teamId)) return false;if(S.space==="all") return true;return (x.teamId||"")===(S.space==="general"?"":S.space)}
const vPages=()=>livePages().filter(inSpace);
const vProjects=()=>S.projects.filter(inSpace);
const vEvents=()=>S.events.filter(inSpace);
function spaceLabel(){if(S.space==="all") return "ทุกพื้นที่ที่ฉันเห็น";if(S.space==="general") return "ทั้งองค์กร";const t=teamOf(S.space);return t?t.name:"ทุกพื้นที่ที่ฉันเห็น"}
function teamChip(tid,small){if(!tid) return `<span class="tchip${small?" sm":""}" data-c="sand">${icon("users")}ทั้งองค์กร</span>`;const t=teamOf(tid);if(!t) return "";
  const role=teamRole(tid);return `<span class="tchip${small?" sm":""}" data-c="${esc(t.color||"blue")}">${icon(role==="view"?"eye":"team")}${esc(t.name)}${role==="view"?'<span class="tchip-ro">ดูอย่างเดียว</span>':""}</span>`}
function teamOptions(cur){return `<option value=""${!cur?" selected":""}>ทั้งองค์กร (ทุกคนเห็น)</option>`+editTeams().map(t=>`<option value="${esc(t.id)}"${cur===t.id?" selected":""}>${esc(t.name)}</option>`).join("")}
function setSpace(s){S.space=s;saveLocal("team-pulse-space",s);closeNav();const r=route();if(r.v==="page"||r.v==="preferences"||r.v==="trash") go("home");else render()}
/** Move a page and its sub-pages to another team. */
function movePageTeam(id,tid){[id,...descendants(id)].forEach(x=>{const p=pageOf(x);if(!p) return;p.teamId=tid;patch("pages",x,{teamId:tid},0)});render(true);toast("ย้ายไป "+(tid?(teamOf(tid)||{}).name:"ทั้งองค์กร")+" แล้ว")}

/* ================= routing ================= */
function route(){const h=location.hash.slice(1);if(h.startsWith("page-")) return {v:"page",id:h.slice(5)};
  if(h.startsWith("req-")) return {v:"req",id:h.slice(4)};
  let v=["gallery","projects","calendar","trash","preferences","teams","dashboard","requests","people","intake"].includes(h)?h:"home";
  if(isGuest()&&!["requests","calendar","preferences"].includes(v)) v="requests";
  if(!isGuest()&&v==="requests") v="home";
  if(v==="people"&&!(API.on&&isAdmin())) v="home";
  return {v}}
function go(h){if(location.hash==="#"+h) render(true);else location.hash=h}
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1);
  if(h.startsWith("project-")){const id=h.slice(8);history.replaceState(null,"",location.pathname+(isGuest()?"#requests":"#projects"));render(true);setTimeout(()=>{if(S.projects.some(p=>p.id===id)) openProject(id);else toast("ไม่พบโปรเจกต์นี้ หรือคุณไม่มีสิทธิ์ดู")},30);return}
  closePanel();closeNav();closeMenu();Slash.close();render(true);window.scrollTo(0,0)});

/* ================= status logic ================= */
function memberStatus(m,now){const evs=S.events.filter(e=>(e.memberIds||[]).includes(m.id));
  const cur=evs.filter(e=>new Date(e.start)<=now&&now<new Date(e.end)).sort((a,b)=>new Date(a.end)-new Date(b.end));
  const quick=m.busyUntil&&new Date(m.busyUntil)>now;const next=evs.filter(e=>new Date(e.start)>now).sort((a,b)=>new Date(a.start)-new Date(b.start))[0];
  if(cur.length) return {busy:true,label:canSee(cur[0].teamId)?cur[0].title||"ประชุม":"ประชุมของทีมอื่น",until:new Date(cur[0].end),quick,next:next&&canSee(next.teamId)?next:null};
  if(next&&!canSee(next.teamId)) return quick?{busy:true,label:m.busyNote||"ติดประชุม",until:new Date(m.busyUntil),quick:true,next:null}:{busy:false,next:null};
  if(quick) return {busy:true,label:m.busyNote||"ติดประชุม",until:new Date(m.busyUntil),quick:true,next};
  return {busy:false,next}}
function evColor(e){const m=memberOf((e.memberIds||[])[0]);return (m&&m.color)||"teal"}

/* ================= render ================= */
function render(full){
  const now=new Date(),r=route();
  $("#clock").textContent=fmtDayLong(now)+" · "+fmtTime(now);
  document.querySelectorAll('.nav [data-act="go"]').forEach(b=>b.setAttribute("aria-current",b.dataset.h===r.v?"page":"false"));
  renderSide(now,r);
  const key=r.v+":"+(r.id||"");
  if(r.v==="page"){if(full||S.mounted!==key) mountPage(r.id);else updatePage(r.id)}
  else{S.mounted=key;pageEditor=null;const v=$("#view");
    const keepScroll=full===false||full===undefined?window.scrollY:0;
    const ae=document.activeElement,aid=ae&&ae.id&&v.contains(ae)?ae.id:null;let sel=null;try{if(aid&&ae.selectionStart!=null) sel=[ae.selectionStart,ae.selectionEnd]}catch(e){}
    const drafts={};v.querySelectorAll("textarea[id],input[id^='inv-'],select[id^='inv-'],#wipe-word").forEach(x=>{drafts[x.id]=x.value});
    const keepFiles=$("#up-files")&&$("#up-files").files.length?$("#up-files"):null;
    v.innerHTML=r.v==="gallery"?viewGallery():r.v==="projects"?viewProjects():r.v==="calendar"?viewCalendar(now):r.v==="trash"?viewTrash():r.v==="preferences"?viewPreferences():r.v==="teams"?viewTeams()
      :r.v==="dashboard"?viewDashboard(now):r.v==="requests"?viewRequests():r.v==="people"?viewPeople():r.v==="intake"?viewIntake():r.v==="req"?viewReqRoom(r.id):viewHome(now);
    if(r.v==="people") loadPeople();
    if(isGuest()&&(r.v==="requests"||r.v==="req")) loadStats();
    Object.entries(drafts).forEach(([k,val])=>{const n=document.getElementById(k);if(n&&val) n.value=val});
    {const w=$("#wipe-word"),b=$("#wipe-go");if(w&&b) b.disabled=wiping||w.value.trim()!=="ล้าง"}
    v.querySelectorAll("img[data-src]:not([src])").forEach(img=>urlFor(img.dataset.src).then(u=>{if(u) img.src=u}));
    if(keepFiles){const n=$("#up-files");if(n){n.replaceWith(keepFiles);$("#up-fn").textContent=keepFiles.files.length+" ไฟล์"}}
    if(aid){const n=document.getElementById(aid);if(n){n.focus({preventScroll:true});if(sel) try{n.setSelectionRange(sel[0],sel[1])}catch(e){}}}
    if(keepScroll) window.scrollTo(0,keepScroll);
    $("#topTitle").textContent={projects:"โปรเจกต์",calendar:"ปฏิทินประชุม",trash:"ถังขยะ",preferences:"ตั้งค่า",teams:"ทีมย่อย",dashboard:"แดชบอร์ด",requests:"งานที่ฉันสั่ง",people:"คนและสิทธิ์",intake:"รับงาน",req:"ห้องงาน"}[r.v]||"Team Pulse";
    const ib=$("#intakeN");if(ib){const n=S.projects.filter(p=>p.requestedBy&&!p.ownerId&&p.status!=="live"&&canSee(p.teamId)).length;ib.hidden=!n;ib.textContent=n}
    if(r.v==="projects"){const q=$("#projQ");if(q&&full!==false&&document.activeElement!==q) q.value=S.projQ}}
  $("#whereList").innerHTML=[...new Set([...S.projects.map(p=>p.where).filter(Boolean),...WHERE_SUGGEST])].map(w=>`<option value="${esc(w)}">`).join("");
  if(S.openProject) fillPanel();
  placeStickers();refreshComments();
}
function treeHTML(parentId,depth,cur){const live=vPages(),ids=new Set(live.map(p=>p.id));
  const kids=live.filter(p=>parentId?p.parentId===parentId:(!p.parentId||!ids.has(p.parentId))).sort(byOrder);
  return kids.map(p=>{const has=live.some(c=>c.parentId===p.id),open=S.expanded.has(p.id);
    return `<div class="tr-row${cur===p.id?" on":""}" style="--d:${depth}"><button class="tr-car${has?"":" leaf"}" data-act="expand" data-id="${esc(p.id)}" aria-expanded="${open}" aria-label="ขยาย">${icon("chevron")}</button><button class="tr-main" data-act="go-page" data-id="${esc(p.id)}"><span class="tr-ic">${pageIcon(p)}</span><span class="t">${esc(p.title||"ไม่มีชื่อ")}</span>${API.on&&p.share==="private"?`<span class="tr-lock" title="ส่วนตัว">${icon("lock")}</span>`:""}</button><span class="tr-acts w-only"><button class="icon-btn" data-act="tree-menu" data-id="${esc(p.id)}" aria-label="ตัวเลือกของหน้า">${icon("more")}</button><button class="icon-btn" data-act="add-child" data-id="${esc(p.id)}" aria-label="เพิ่มหน้าย่อย">${icon("plus")}</button></span></div>${open&&has&&depth<8?treeHTML(p.id,depth+1,cur):""}`}).join("")}
const pageIcon=p=>p&&p.icon?esc(p.icon):icon("file");
function renderSide(now,r){
  const cur=r.v==="page"?r.id:null;
  $("#sideTree").innerHTML=vPages().length?treeHTML("",0,cur):`<div class="side-empty">${S.loaded.pages?"ยังไม่มีหน้าในพื้นที่นี้ กด + เพื่อสร้าง":"กำลังโหลด…"}</div>`;
  const sp=[["all","ทุกพื้นที่ที่ฉันเห็น","sand","layers"],["general","ทั้งองค์กร","sand","users"]];
  $("#sideSpaces").innerHTML=sp.map(([k,l,c,ic])=>`<button class="space-it${S.space===k?" on":""}" data-act="space" data-space="${k}" data-c="${c}" aria-pressed="${S.space===k}"><span class="sp-dot">${icon(ic==="layers"?"board":"users")}</span><span class="t">${l}</span></button>`).join("")
    +myTeams().map(t=>{const ro=teamRole(t.id)==="view";return `<button class="space-it${S.space===t.id?" on":""}" data-act="space" data-space="${esc(t.id)}" data-c="${esc(t.color||"blue")}" aria-pressed="${S.space===t.id}"><span class="sp-dot letter">${esc(initial(t.name))}</span><span class="t">${esc(t.name)}</span>${ro?`<span class="sp-ro" title="ดูได้อย่างเดียว">${icon("eye")}</span>`:""}</button>`}).join("");
  $("#spaceNow").textContent=spaceLabel();
  const favs=[...S.fav].map(pageOf).filter(p=>p&&!p.trashed&&canSee(p.teamId));$("#favSec").hidden=!favs.length;
  $("#sideFav").innerHTML=favs.map(p=>`<div class="tr-row${cur===p.id?" on":""}"><span class="tr-car leaf"></span><button class="tr-main" data-act="go-page" data-id="${esc(p.id)}"><span class="tr-ic">${pageIcon(p)}</span><span class="t">${esc(p.title||"ไม่มีชื่อ")}</span></button></div>`).join("");
  $("#sideTeam").innerHTML=S.members.length?S.members.filter(m=>!m.guest).map(m=>{const st=memberStatus(m,now);
    return `<button class="side-item" data-act="edit-member" data-id="${esc(m.id)}">${avatar(m,"sm")}<span class="t">${esc(m.name)}${m.id===S.me?' <span class="muted">(ฉัน)</span>':""}</span><span class="busy-dot${st.busy?" on":""}" title="${st.busy?"ติดประชุม":"ว่าง"}"></span></button>`}).join("")
    :`<div class="side-empty">${S.loaded.members?"ยังไม่มีคนในทีม":"กำลังโหลด…"}</div>`;
  const me=meMember(),st=me&&memberStatus(me,now);
  $("#meCard").innerHTML=me?`${avatar(me)}<span class="me-tx"><b>${esc(me.name)}</b><small>${st.busy?"ติดประชุมถึง "+fmtTime(st.until):"ว่าง"}</small></span>${icon("settings")}`
    :`<span class="av none" data-c="blue">${icon("user")}</span><span class="me-tx"><b>ตั้งค่าโปรไฟล์</b><small>เลือกว่าคุณคือใคร</small></span>${icon("settings")}`;
  $("#meCard").setAttribute("aria-current",r.v==="preferences"?"page":"false");
  const roots=S.pages.filter(p=>p.trashed&&p.trashRoot===p.id&&canSee(p.teamId)).length;const tc=$("#trashCount");tc.hidden=!roots;tc.textContent=roots;
}
function whoCell(id){const m=memberOf(id);
  return m?`<span class="cell-who">${avatar(m,"sm")}<span>${esc(m.name)}</span></span>`:`<span class="cell-who muted">ยังไม่มีคนรับ</span>`}
function whereTag(w){return w?`<span class="where">${icon("pin")}<span>${esc(w)}</span></span>`:`<span class="muted" style="font-size:12px">ไม่ระบุ</span>`}

/* ---- home ---- */
function pageHead(title,sub,actions,c,stk){return `<div class="page-head"><div class="ph-l">${stk?`<span class="ph-stk">${sticker(stk,68)}</span>`:""}<div class="ph-tx"><h1 class="title"><span class="swash" data-c="${c||"yellow"}">${esc(title)}</span></h1>${sub?`<p class="sub">${sub}</p>`:""}</div></div>${actions?`<div class="row">${actions}</div>`:""}</div>`}
function card(c,stk,title,actions,body,cls){return `<section class="card${cls?" "+cls:""}" data-c="${c}"><div class="card-h">${stk?`<span class="ch-stk">${sticker(stk,46)}</span>`:""}<h2>${title}</h2>${actions?`<div class="ch-act">${actions}</div>`:""}</div><div class="card-b">${body}</div></section>`}
function viewHome(now){
  const loading=!allLoaded();
  const empty=!loading&&!S.members.length&&!S.projects.length&&!S.events.length&&!livePages().length;
  const hasExample=[...S.members,...S.projects,...S.events,...S.pages,...S.teams].some(x=>x.example);
  const head=pageHead("ตอนนี้ทีมเป็นยังไงบ้าง",`${esc(fmtDayLong(now))} · ${fmtTime(now)} น. · ${esc(spaceLabel())}`,
    `<span class="row w-only">${hasExample?`<button class="btn ghost small" data-act="clear-examples">ลบข้อมูลตัวอย่าง</button>`:""}<button class="btn" data-act="quick-meeting">${icon("clock")}ติดประชุมอยู่</button><button class="btn" data-act="new-page">${icon("file")}หน้าใหม่</button><button class="btn primary" data-act="new-project">${icon("plus")}โปรเจกต์</button></span>`,"yellow","mug");
  if(loading) return head+`<div class="empty">${sticker("cat",72)}<h3>กำลังโหลดสมุดของทีม…</h3></div>`;
  if(empty) return head+`<div class="hero-empty"><div><h2>เริ่มสมุดของทีม</h2>
      <p>เขียนหน้าเอกสารแบบ Notion แนบไฟล์ เก็บบันทึกประชุม ใส่โปรเจกต์ที่ค้างพร้อมบอกว่ารันอยู่ที่ไหน แยกงานเป็นทีมย่อย แล้วลงเวลาประชุมในปฏิทิน ทั้งทีมจะรู้ทันทีว่าใครว่าง ใครติดประชุม</p>
      <div class="row w-only" style="margin-top:18px"><button class="btn primary" data-act="new-member-me">${icon("user")}เพิ่มตัวฉัน</button><button class="btn" data-act="new-team">${icon("team")}สร้างทีมย่อย</button><button class="btn" data-act="new-page">${icon("file")}หน้าแรก</button><button class="btn ghost" data-act="seed">ลองด้วยข้อมูลตัวอย่าง</button></div></div>
      <div class="sticker-pile" aria-hidden="true">${sticker("cat",96)}${sticker("mug",78)}${sticker("sparkle",64)}${sticker("plant",84)}${sticker("pencil",70)}</div></div>`;

  const P=vProjects(),E=vEvents();
  const counts=STATUSES.map(s=>({s,n:P.filter(p=>(p.status||"idea")===s.key).length}));
  const status=card("sky","folder","สถานะโปรเจกต์",`<button class="btn ghost small" data-act="go" data-h="projects">ดูบอร์ด${icon("chevron")}</button>`,
    `${P.length?`<div class="stack" role="img" aria-label="${esc(counts.map(c=>c.s.label+" "+c.n).join(", "))}">${counts.filter(c=>c.n).map(c=>`<span data-c="${c.s.c}" style="flex:${c.n}"></span>`).join("")}</div>`:`<div class="stack none"></div>`}
    <div class="legend">${counts.map(c=>`<button class="lg" data-act="go" data-h="projects" data-c="${c.s.c}"><span class="d"></span><span class="lb">${esc(c.s.label)}</span><b>${c.n}</b></button>`).join("")}</div>`);

  const people=S.members.some(m=>!m.guest)?`<div class="people">${S.members.filter(m=>!m.guest).map(m=>{const st=memberStatus(m,now);
    const pill=st.busy?`<span class="pill soft" data-c="pink"><span class="d"></span><span class="tx">ติดประชุมถึง ${fmtTime(st.until)}</span></span>`:`<span class="pill soft" data-c="green"><span class="d"></span><span class="tx">ว่าง</span></span>`;
    const ns=st.next&&new Date(st.next.start);
    const line=st.busy?esc(st.label):st.next?`ถัดไป ${sameDay(ns,now)?"":ns.toLocaleDateString("th-TH",{weekday:"short"})+" "}${fmtTime(ns)} · ${esc(st.next.title)}`:"ไม่มีประชุมที่นัดไว้";
    return `<div class="person${st.busy?" busy":""}">${m.mood?`<span class="p-mood" title="${esc((stickerById(m.mood)||{}).label||"")}">${stickerArt(m.mood,68)}</span>`:""}<div class="p-top">${avatar(m,"lg")}<div class="p-id"><button class="p-name" data-act="edit-member" data-id="${esc(m.id)}">${esc(m.name)}${m.id===S.me?' <span class="muted">(ฉัน)</span>':""}</button><div class="p-role">${esc(m.role||"")}</div></div></div>
      <div class="p-st">${pill}<span class="p-next">${line}</span></div>
      <div class="quick w-only">${st.quick?`<button class="btn small" data-act="free" data-id="${esc(m.id)}">${icon("check")}ว่างแล้ว</button>`
        :`<button class="btn small" data-act="busy" data-min="30" data-id="${esc(m.id)}">ติดประชุม 30 นาที</button><button class="btn small" data-act="busy" data-min="60" data-id="${esc(m.id)}">1 ชม.</button>`}</div></div>`}).join("")}</div>`
    :`<div class="empty slim">${sticker("cat",56)}<span>ยังไม่มีคนในทีม เพิ่มชื่อเพื่อน ๆ เพื่อดูว่าใครติดประชุมอยู่</span><button class="btn w-only" data-act="new-member">${icon("user")}เพิ่มคนในทีม</button></div>`;

  const today=E.filter(e=>sameDay(new Date(e.start),now)).sort((a,b)=>new Date(a.start)-new Date(b.start));
  const agenda=today.length?`<div class="agenda">${today.map(e=>{const s=new Date(e.start),en=new Date(e.end),cls=now>=en?"past":(now>=s?"now":"");
    const ms=(e.memberIds||[]).map(memberOf).filter(Boolean);
    return `<button class="ag ${cls}" data-act="edit-event" data-id="${esc(e.id)}" data-c="${evColor(e)}"><time>${fmtTime(s)}<small>${fmtTime(en)}</small></time><span class="tt"><span class="ag-h"><span class="d"></span><b>${esc(e.title||"ประชุม")}</b>${cls==="now"?'<span class="pill soft tiny" data-c="pink">กำลังประชุม</span>':""}${e.pageId&&pageOf(e.pageId)?`<span class="pill soft tiny" data-c="blue">${icon("note")}มีบันทึก</span>`:""}</span><small>${e.place?esc(e.place):"ไม่ระบุสถานที่"}${e.teamId?" · "+esc((teamOf(e.teamId)||{}).name||""):""}</small></span><span class="faces">${ms.slice(0,4).map(m=>avatar(m,"xs")).join("")}</span></button>`}).join("")}</div>`
    :`<div class="empty slim">${sticker("calendar",52)}<span>วันนี้ยังไม่มีประชุม</span></div>`;

  const rank={stuck:0,review:1,doing:2};
  const active=P.filter(p=>p.status in rank).sort((a,b)=>rank[a.status]-rank[b.status]||byUpdated(a,b));
  const pendList=active.length?`<div class="list">${active.map(p=>{const st=statusOf(p.status);
    return `<button class="li" data-act="open-project" data-id="${esc(p.id)}"><span class="t" data-c="${st.c}"><span class="sq"></span><span>${esc(p.title||"ไม่มีชื่อ")}</span></span>${whoCell(p.ownerId)}<span class="where-c">${whereTag(p.where)}</span><span class="pill soft" data-c="${st.c}"><span class="tx">${esc(st.label)}</span></span></button>`}).join("")}</div>`
    :`<div class="empty slim">${sticker("sparkle",52)}<span>ไม่มีงานค้าง ทุกโปรเจกต์รอเริ่มหรือเสร็จแล้ว</span></div>`;
  const runRows=P.filter(p=>p.where||p.url).sort((a,b)=>String(a.where||"").localeCompare(String(b.where||"")));
  const runs=runRows.length?`<div class="table-scroll flat"><table style="min-width:560px"><thead><tr><th>โปรเจกต์</th><th>รันอยู่ที่</th><th>ลิงก์</th><th>สถานะ</th></tr></thead><tbody>${runRows.map(p=>{const st=statusOf(p.status);
    return `<tr data-act="open-project" data-id="${esc(p.id)}"><td><b style="font-weight:500">${esc(p.title||"ไม่มีชื่อ")}</b></td><td>${whereTag(p.where)}</td><td>${p.url?`<a class="lnk" href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener">${esc(shortUrl(p.url))}</a>`:'<span class="muted">—</span>'}</td><td><span class="pill soft" data-c="${st.c}"><span class="d"></span><span class="tx">${esc(st.label)}</span></span></td></tr>`}).join("")}</tbody></table></div>`
    :`<div class="empty slim">${sticker("plane",52)}<span>ใส่ช่อง “รันอยู่ที่” ในหน้าโปรเจกต์ แล้วรายการจะมาโชว์ตรงนี้</span></div>`;
  const rec=vPages().sort(byUpdated).slice(0,7);
  const recent=`<div class="recent">${rec.map(p=>`<button class="rc" data-act="go-page" data-id="${esc(p.id)}" data-c="${esc(p.cover||"sand")}"><span class="cv"></span><span class="bd"><span class="ic">${pageIcon(p)}</span><span class="tt">${esc(p.title||"ไม่มีชื่อ")}</span><span class="wh">แก้ไข ${esc(ago(p.updatedAt))}</span></span></button>`).join("")}<button class="rc add w-only" data-act="new-page">${icon("plus")}หน้าใหม่</button></div>`;
  return head+`<div class="grid2">
    ${card("pink","cat","ใครติดประชุมอยู่ตอนนี้",`<span class="muted small-tx">อัปเดตทุก 30 วินาที</span>`,people)}
    <div class="col-stack">${status}${card("green","calendar","ประชุมวันนี้",`<button class="btn small w-only" data-act="new-event">${icon("plus")}นัดประชุม</button>`,agenda)}</div></div>
    ${card("yellow","books","หน้าที่แก้ล่าสุด","",recent)}
    ${card("orange","pencil","งานที่ค้างอยู่",`<span class="muted small-tx">${active.length} โปรเจกต์</span>`,pendList)}
    ${card("teal","plane","โปรเจกต์ไหนรันอยู่ที่ไหน","",runs)}`;
}

/* ---- teams ---- */
function viewTeams(){
  const ts=myTeams();const others=S.teams.length-ts.length;
  const blocks=ts.map(t=>{const role=teamRole(t.id),mem=(t.memberIds||[]).map(memberOf).filter(Boolean),vw=(t.viewerIds||[]).map(memberOf).filter(Boolean);
    const nP=S.pages.filter(p=>!p.trashed&&p.teamId===t.id).length,nJ=S.projects.filter(p=>p.teamId===t.id).length;
    return `<article class="tblock" data-c="${esc(t.color||"blue")}">
      <div class="tb-top"><span class="tb-letter">${esc(initial(t.name))}</span><span class="tb-name">${esc(t.name)}</span>${role==="view"?`<span class="tchip sm" data-c="sand">${icon("eye")}ดูได้อย่างเดียว</span>`:""}</div>
      <div class="tb-stk">${sticker(t.sticker||"folder",104)}</div>
      <dl class="tb-meta"><div><dt>สมาชิก</dt><dd class="faces">${mem.map(m=>avatar(m,"sm")).join("")||'<span class="muted">ยังไม่มี</span>'}</dd></div>
        <div><dt>ดูงานได้</dt><dd class="faces">${vw.map(m=>avatar(m,"sm")).join("")||'<span class="muted">—</span>'}</dd></div>
        <div><dt>งานในทีม</dt><dd>${nP} หน้า · ${nJ} โปรเจกต์</dd></div></dl>
      <div class="tb-act"><button class="btn small" data-act="space" data-space="${esc(t.id)}">${icon("chevron")}เข้าไปดูงาน</button>${role==="edit"&&!S.readOnly?`<button class="btn small ghost" data-act="edit-team" data-id="${esc(t.id)}">แก้ไขทีม</button>`:""}</div></article>`}).join("");
  return pageHead("ทีมย่อย","แยกงานเป็นกลุ่ม แล้วเลือกได้ว่าใครเป็นสมาชิก ใครดูงานได้อย่างเดียว",`<button class="btn primary w-only" data-act="new-team">${icon("plus")}สร้างทีมย่อย</button>`,"blue","folder")
    +(ts.length?`<div class="tblocks">${blocks}</div>`:`<div class="empty">${sticker("folder",80)}<h3>ยังไม่มีทีมย่อยที่คุณเห็น</h3><span>${S.me?"สร้างทีมแรก เช่น “ฉันกับหัวหน้า” หรือ “ฉันกับเด็กฝึกงาน”":"เลือกก่อนว่าคุณคือใครในหน้าตั้งค่า แล้วจะเห็นทีมที่คุณอยู่"}</span><button class="btn w-only" data-act="new-team">${icon("team")}สร้างทีมย่อย</button></div>`)
    +(others>0?`<p class="muted small-tx">มีอีก ${others} ทีมที่คุณไม่ได้อยู่และไม่ได้รับสิทธิ์ดู</p>`:"")
    +`<section class="card note" data-c="sand"><div class="card-h"><span class="ch-stk">${sticker("bulb",42)}</span><h2>สิทธิ์ในทีมทำงานยังไง</h2></div><div class="card-b"><ul class="plain">
      <li><b>สมาชิก</b> เห็นและแก้หน้า โปรเจกต์ และประชุมของทีมได้</li>
      <li><b>ดูงานได้</b> เห็นทุกอย่างในทีม แต่แก้ไม่ได้ เช่น หัวหน้าที่อยากดูงานของทีมเด็กฝึกงาน</li>
      <li><b>ผู้ดูแล</b> (ตั้งในหน้าแก้ไขคนในทีม) เห็นทุกทีม</li>
      <li>งานที่ไม่ได้อยู่ในทีมไหน อยู่ใน “ทั้งองค์กร” ทุกคนเห็น</li></ul></div></section>`;
}
function openTeamModal(t){
  let color=t?t.color||"blue":COLORS[S.teams.length%COLORS.length],stk=t?t.sticker||"folder":STICKERS[S.teams.length%STICKERS.length];
  let mem=t?[...(t.memberIds||[])]:(S.me?[S.me]:[]),vw=t?[...(t.viewerIds||[])]:[];
  const chips=(sel,role)=>S.members.map(m=>`<button type="button" class="chip" data-c="${esc(m.color||"blue")}" data-role="${role}" data-id="${esc(m.id)}" aria-pressed="${sel.includes(m.id)}">${avatar(m,"sm")}${esc(m.name)}</button>`).join("")||`<span class="muted">ยังไม่มีคนในทีม เพิ่มได้ที่แถบซ้าย</span>`;
  $("#modalRoot").innerHTML=`<div class="modal-wrap" data-act="modal-bg"><form class="modal wide" id="tForm" role="dialog" aria-modal="true" aria-label="ทีมย่อย">
    <div class="m-head"><span id="t-prev" class="t-prev" data-c="${color}">${sticker(stk,64)}</span><div><h2>${t?"แก้ไขทีมย่อย":"สร้างทีมย่อย"}</h2><p class="muted small-tx" style="margin:2px 0 0">หน้า โปรเจกต์ และประชุมที่อยู่ในทีมนี้ จะเห็นเฉพาะสมาชิกและคนที่ดูงานได้</p></div></div>
    <div class="f"><label for="t-name">ชื่อทีม</label><input id="t-name" class="inp" required maxlength="40" value="${esc(t?t.name:"")}" placeholder="เช่น ฉันกับเด็กฝึกงาน"></div>
    <div class="f2"><div class="f"><label>สีทีม</label><div class="swatches" id="t-sw">${COLORS.map(c=>`<button type="button" class="sw" data-c="${c}" data-color="${c}" aria-pressed="${c===color}" aria-label="สี ${c}"></button>`).join("")}</div></div>
    <div class="f"><label>สติกเกอร์</label><div class="stk-pick" id="t-stk">${STICKERS.map(n=>`<button type="button" data-stk="${n}" aria-pressed="${n===stk}" aria-label="${n}">${sticker(n,34)}</button>`).join("")}</div></div></div>
    <div class="f"><label>สมาชิก <span class="muted">เห็นและแก้งานได้</span></label><div class="chips" id="t-mem">${chips(mem,"m")}</div></div>
    <div class="f"><label>ดูงานได้อย่างเดียว <span class="muted">เช่น หัวหน้าที่อยากเห็นงานของทีมนี้</span></label><div class="chips" id="t-vw">${chips(vw,"v")}</div></div>
    <p id="t-err" style="margin:0;color:var(--ci-pink)" hidden></p>
    <div class="modal-foot">${t?`<button type="button" class="btn danger" id="t-del">${icon("trash")}ลบทีม</button>`:"<span></span>"}<div class="row"><button type="button" class="btn" data-act="close-modal">ยกเลิก</button><button class="btn primary">${t?"บันทึก":"สร้างทีม"}</button></div></div>
  </form></div>`;
  $("#t-name").focus();
  const prev=()=>{const p=$("#t-prev");p.dataset.c=color;p.innerHTML=sticker(stk,64)};
  $("#t-sw").addEventListener("click",e=>{const b=e.target.closest(".sw");if(!b) return;color=b.dataset.color;$("#t-sw").querySelectorAll(".sw").forEach(x=>x.setAttribute("aria-pressed",x===b));prev()});
  $("#t-stk").addEventListener("click",e=>{const b=e.target.closest("[data-stk]");if(!b) return;stk=b.dataset.stk;$("#t-stk").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));prev()});
  ["#t-mem","#t-vw"].forEach(sel=>$(sel).addEventListener("click",e=>{const b=e.target.closest(".chip");if(!b) return;const id=b.dataset.id,on=b.getAttribute("aria-pressed")!=="true";
    const own=b.dataset.role==="m"?mem:vw,other=b.dataset.role==="m"?vw:mem;
    if(on){if(!own.includes(id)) own.push(id);const i=other.indexOf(id);if(i>=0){other.splice(i,1);const ob=$((b.dataset.role==="m"?"#t-vw":"#t-mem")+` .chip[data-id="${CSS.escape(id)}"]`);if(ob) ob.setAttribute("aria-pressed","false")}}
    else{const i=own.indexOf(id);if(i>=0) own.splice(i,1)}
    b.setAttribute("aria-pressed",on)}));
  $("#tForm").addEventListener("submit",x=>{x.preventDefault();if(S.readOnly) return;const name=$("#t-name").value.trim();
    if(!name){const er=$("#t-err");er.hidden=false;er.textContent="ใส่ชื่อทีมก่อน";return}
    if(!mem.length){const er=$("#t-err");er.hidden=false;er.textContent="ทีมต้องมีสมาชิกอย่างน้อย 1 คน";return}
    const body={name,color,sticker:stk,memberIds:mem,viewerIds:vw};
    if(t){Object.assign(t,body);const k=Object.assign({},t);delete k.id;put("teams",t.id,k)}
    else{const id=newId(),doc=Object.assign(body,{order:Date.now(),createdAt:nowIso()});S.teams.push(Object.assign({id},doc));put("teams",id,doc)}
    closeModal();render();toast(t?"บันทึกทีมแล้ว":"สร้างทีม “"+name+"” แล้ว")});
  if(t) armDelete($("#t-del"),"ยืนยันลบ “"+t.name+"” (งานจะย้ายไปทั้งองค์กร)",()=>{
    ["pages","projects","events"].forEach(c=>S[c].filter(x=>x.teamId===t.id).forEach(x=>{x.teamId="";patch(c,x.id,{teamId:""},0)}));
    remove("teams",t.id);S.teams=S.teams.filter(x=>x.id!==t.id);if(S.space===t.id) S.space="all";closeModal();render();toast("ลบทีมแล้ว งานย้ายไปทั้งองค์กร")});
}

/* ---- dashboard ---- */
const doneAtOf=p=>p.doneAt||(p.status==="live"?p.updatedAt:null);
function weekStart(d){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-(x.getDay()+6)%7);return x}
function doneChart(P,now){
  const weeks=[...Array(8)].map((_,i)=>{const s=weekStart(now);s.setDate(s.getDate()-7*(7-i));return s});
  const counts=weeks.map((s,i)=>{const e=new Date(s);e.setDate(e.getDate()+7);return P.filter(p=>{const d=doneAtOf(p);return d&&new Date(d)>=s&&new Date(d)<e}).length});
  const W=560,H=200,L=34,R=8,T=18,B=34,pw=W-L-R,ph=H-T-B,max=Math.max(2,...counts),top=Math.ceil(max/2)*2,slot=pw/weeks.length,bw=Math.min(36,slot*.56);
  const y=v=>T+ph-(v/top)*ph;const lab=d=>d.toLocaleDateString("th-TH",{day:"numeric",month:"short"});
  const peak=counts.indexOf(Math.max(...counts)),last=counts.length-1;
  const bars=counts.map((v,i)=>{const x=L+slot*i+(slot-bw)/2,y0=y(0),y1=y(v),r=Math.min(4,(y0-y1)/2);
    const path=v?`M${x} ${y0}V${y1+r}Q${x} ${y1} ${x+r} ${y1}H${x+bw-r}Q${x+bw} ${y1} ${x+bw} ${y1+r}V${y0}Z`:"";
    const showVal=v&&(i===peak||i===last);
    return `<g class="bar" data-tip="สัปดาห์ ${esc(lab(weeks[i]))}: เสร็จ ${v} โปรเจกต์"><rect class="hit" x="${L+slot*i}" y="${T}" width="${slot}" height="${ph}"/>${path?`<path d="${path}"/>`:`<rect class="zero" x="${x}" y="${y0-2}" width="${bw}" height="2" rx="1"/>`}${showVal?`<text class="val" x="${x+bw/2}" y="${y1-6}">${v}</text>`:""}<text class="xl" x="${x+bw/2}" y="${H-12}">${esc(lab(weeks[i]))}</text></g>`}).join("");
  const grid=[0,top/2,top].map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text class="yl" x="${L-8}" y="${y(v)+4}">${v}</text>`).join("");
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="จำนวนโปรเจกต์ที่เสร็จต่อสัปดาห์ 8 สัปดาห์ล่าสุด"><g class="grid">${grid}</g>${bars}</svg></div>
    <details class="tbl-view"><summary>ดูเป็นตาราง</summary><table><thead><tr><th>สัปดาห์เริ่ม</th><th>เสร็จ</th></tr></thead><tbody>${weeks.map((w,i)=>`<tr><td>${esc(lab(w))}</td><td>${counts[i]}</td></tr>`).join("")}</tbody></table></details>`}
function viewDashboard(now){
  const P=vProjects(),by=k=>P.filter(p=>(p.status||"idea")===k);
  const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
  const doneMonth=by("live").filter(p=>doneAtOf(p)&&new Date(doneAtOf(p))>=monthStart).length;
  const score=[["ทั้งหมด",P.length,"sand","board"],["กำลังทำ",by("doing").length,"blue","clock"],["ค้าง / ติดปัญหา",by("stuck").length,"pink","callout"],["รอรีวิว",by("review").length,"yellow","eye"],["เสร็จแล้ว",by("live").length,"green","check"],["เสร็จเดือนนี้",doneMonth,"teal","sparkle"]];
  const scoreHTML=`<div class="score">${score.map(([l,n,c,ic])=>`<button class="sc" data-c="${c}" data-act="go" data-h="projects"><span class="sc-ic">${icon(ic)}</span><b>${n}</b><span>${l}</span></button>`).join("")}</div>`;
  const people=S.members.filter(m=>!m.guest).map(m=>{const st=memberStatus(m,now);const mine=P.filter(p=>p.ownerId===m.id);const doing=mine.filter(p=>p.status==="doing"||p.status==="stuck"||p.status==="review");
    return `<div class="now-row"><div class="nr-who">${avatar(m,"md")}${m.mood?`<span class="nr-mood" title="${esc((stickerById(m.mood)||{}).label||"")}">${stickerArt(m.mood,44)}</span>`:""}<div><b>${esc(m.name)}</b><small>${esc([m.role,API.on&&m.access?ROLE_LABEL[m.access]:""].filter(Boolean).join(" · "))}</small></div></div>
      <div class="nr-st">${st.busy?`<span class="pill soft" data-c="pink"><span class="d"></span><span class="tx">ประชุมถึง ${fmtTime(st.until)}</span></span>`:`<span class="pill soft" data-c="green"><span class="d"></span><span class="tx">ว่าง</span></span>`}</div>
      <div class="nr-work">${doing.length?doing.slice(0,3).map(p=>`<button class="wchip" data-act="open-project" data-id="${esc(p.id)}" data-c="${statusOf(p.status).c}"><span class="d"></span>${esc(p.title||"ไม่มีชื่อ")}</button>`).join("")+(doing.length>3?`<span class="muted small-tx">+${doing.length-3}</span>`:""):`<span class="muted small-tx">ไม่มีงานที่ทำอยู่</span>`}</div>
      <div class="nr-n"><b>${mine.filter(p=>p.status==="live").length}</b><small>เสร็จ</small></div></div>`}).join("")||`<div class="empty slim"><span>ยังไม่มีคนในทีม</span></div>`;
  const rows=[["",(S.space==="all"||S.space==="general")?"ทั้งองค์กร":null],...myTeams().filter(t=>S.space==="all"||S.space===t.id).map(t=>[t.id,t.name])].filter(r=>r[1]);
  const teamTable=`<div class="table-scroll flat"><table class="nums"><thead><tr><th>พื้นที่</th>${STATUSES.map(s=>`<th><span class="th-st" data-c="${s.c}"><span class="sq"></span>${esc(s.label)}</span></th>`).join("")}<th>รวม</th></tr></thead><tbody>${rows.map(([tid,name])=>{const tp=S.projects.filter(p=>(p.teamId||"")===tid&&canSee(p.teamId));
    return `<tr data-act="space" data-space="${tid||"general"}"><td><b style="font-weight:600">${esc(name)}</b></td>${STATUSES.map(s=>{const n=tp.filter(p=>(p.status||"idea")===s.key).length;return `<td class="${n?"":"zero"}">${n}</td>`}).join("")}<td><b>${tp.length}</b></td></tr>`}).join("")}</tbody></table></div>`;
  const reqs=P.filter(p=>p.requestedBy&&p.status!=="live").sort(byUpdated);
  const reqHTML=reqs.length?`<div class="list">${reqs.map(p=>{const g=memberOf(p.requestedBy),st=statusOf(p.status);return `<button class="li" data-act="go" data-h="req-${esc(p.id)}"><span class="t" data-c="${st.c}"><span class="sq"></span><span>${esc(p.title||"ไม่มีชื่อ")}</span></span><span class="cell-who">${g?avatar(g,"sm"):""}<span>สั่งโดย ${esc(g?g.name:"คนนอก")}</span></span>${whoCell(p.ownerId)}<span class="pill soft" data-c="${st.c}"><span class="tx">${esc(st.label)}</span></span></button>`}).join("")}</div>`
    :`<div class="empty slim">${sticker("heart",44)}<span>ไม่มีงานจากคนนอกที่ยังไม่เสร็จ</span></div>`;
  const acts=(S.activity||[]).filter(a=>canSee(a.teamId)).sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,10);
  const feed=acts.length?`<ol class="feed">${acts.map(a=>{const m=memberOf(a.actorId);const to=statusOf(a.to);return `<li>${avatar(m,"xs")}<span><b>${esc(m?m.name:"ใครบางคน")}</b> เลื่อน <button class="lnkbtn" data-act="open-project" data-id="${esc(a.projectId)}">${esc(a.title||"โปรเจกต์")}</button> เป็น <span class="pill soft tiny" data-c="${to.c}">${esc(to.label)}</span></span><time>${esc(ago(a.at))}</time></li>`}).join("")}</ol>`
    :`<div class="empty slim">${sticker("pencil",44)}<span>${API.on?"ยังไม่มีการเลื่อนสถานะ เมื่อมีคนเลื่อนสถานะโปรเจกต์ จะแสดงตรงนี้":"บันทึกการเลื่อนสถานะมีเฉพาะเวอร์ชันที่ล็อกอินด้วยอีเมล"}</span></div>`;
  return pageHead("แดชบอร์ด",`${esc(spaceLabel())} · อัปเดต ${fmtTime(now)} น.`,`<button class="btn" data-act="go" data-h="projects">${icon("board")}เปิดบอร์ด</button>`,"blue","books")
    +scoreHTML
    +`<div class="grid2">${card("pink","cat","ตอนนี้ใครทำอะไรอยู่","",`<div class="now-list">${people}</div>`)}
      <div class="col-stack">${card("blue","sparkle","เสร็จต่อสัปดาห์",`<span class="muted small-tx">8 สัปดาห์ล่าสุด</span>`,doneChart(P,now))}${card("yellow","pencil","ความเคลื่อนไหวล่าสุด","",feed)}</div></div>`
    +card("green","folder","งานแยกตามพื้นที่","",teamTable)
    +card("orange","heart","งานจากคนนอกที่ยังไม่เสร็จ",`<span class="muted small-tx">${reqs.length} งาน</span>`,reqHTML);
}

/* ---- guest: requests ---- */
const STEPS=["idea","doing","review","live"];
const SCOPES=[["org","งานขนาดใหญ่","ใช้ทั้งองค์กร","pink"],["dept","งานระดับแผนก","ใช้เฉพาะแผนก","blue"],["multi","ใช้ร่วมกันหลายแผนก","หลายแผนกใช้ร่วมกัน","green"]];
function scopeChip(k){const s=SCOPES.find(x=>x[0]===k);return s?`<span class="tchip sm" data-c="${s[3]}">${esc(s[1])} · ${esc(s[2])}</span>`:""}
function doingNote(p,cls){return p.statusNote?`<p class="doing-note${cls?" "+cls:""}">${icon("note")}<span><b>ตอนนี้กำลังทำ:</b> ${esc(p.statusNote)}</span></p>`:""}
function viewRequests(){
  const mine=S.projects.filter(p=>p.requestedBy===S.me).sort(byUpdated);
  const follow=S.projects.filter(followsOf).sort(byUpdated);
  const reqCard=p=>{const st=statusOf(p.status),o=memberOf(p.ownerId),k=STEPS.indexOf(p.status);
    return `<button class="req" data-act="go" data-h="req-${esc(p.id)}" data-c="${st.c}"><span class="req-h"><b>${esc(p.title||"ไม่มีชื่อ")}</b><span class="pill soft" data-c="${st.c}"><span class="d"></span><span class="tx">${esc(st.label)}</span></span></span>
      <span class="steps" aria-label="ความคืบหน้า">${STEPS.map((s,i)=>`<span class="step${i<=k?" on":""}${p.status==="stuck"&&i===1?" warn":""}"><i></i>${esc(statusOf(s).label.split(" /")[0])}</span>`).join("")}</span>
      ${doingNote(p,"sm")}<span class="req-f">${scopeChip(p.scope)}${o?`${avatar(o,"xs")}<span>${esc(o.name)} รับผิดชอบ</span>`:`<span class="muted">ยังไม่มีคนรับงาน</span>`}<span class="muted">· อัปเดต ${esc(ago(p.updatedAt))}</span></span></button>`};
  const items=mine.map(reqCard).join("");
  return pageHead("งานที่ฉันสั่ง","ส่งงานให้ทีม แล้วติดตามได้ว่าถึงขั้นไหน ทุกครั้งที่สถานะเปลี่ยนจะมีแจ้งเตือนและอีเมล",`<button class="btn primary" data-act="new-request">${icon("plus")}สั่งงานใหม่</button>`,"pink","clip")
    +teamLoadCard()
    +(follow.length?`<section class="follow-sec"><h2 class="sec-title">${icon("eye")}โปรเจกต์ที่คุณติดตาม</h2><div class="reqs">${follow.map(reqCard).join("")}</div></section>`:"")
    +(follow.length&&!mine.length?"":mine.length?`<div class="reqs">${items}</div>`:`<div class="empty">${sticker("plane",80)}<h3>ยังไม่ได้สั่งงาน</h3><span>กด “สั่งงานใหม่” เพื่อส่งงานให้ทีม แนบไฟล์ได้ และติดตามสถานะได้ที่หน้านี้</span><button class="btn primary" data-act="new-request">${icon("plus")}สั่งงานใหม่</button></div>`)
    +(vPages().length?card("sand","books","หน้าที่แชร์ให้คุณ","",`<div class="recent">${vPages().map(p=>`<button class="rc" data-act="go-page" data-id="${esc(p.id)}" data-c="${esc(p.cover||"sand")}"><span class="cv"></span><span class="bd"><span class="ic">${pageIcon(p)}</span><span class="tt">${esc(p.title||"ไม่มีชื่อ")}</span><span class="wh">แก้ไข ${esc(ago(p.updatedAt))}</span></span></button>`).join("")}</div>`):"");
}
function openRequestModal(){
  const staff=S.members.filter(m=>!m.guest);
  $("#modalRoot").innerHTML=`<div class="modal-wrap" data-act="modal-bg"><form class="modal wide" id="rqForm" role="dialog" aria-modal="true" aria-label="สั่งงานใหม่">
    <div class="m-head"><span class="t-prev" data-c="pink">${sticker("clip",60)}</span><div><h2>สั่งงานใหม่</h2><p class="muted small-tx" style="margin:2px 0 0">ทีมจะได้แจ้งเตือนทันที และคุณจะได้อีเมลทุกครั้งที่งานเลื่อนสถานะ</p></div></div>
    <div class="f"><label for="rq-title">ต้องการให้ทำอะไร</label><input id="rq-title" class="inp" required maxlength="120" placeholder="เช่น ทำป้ายฉลากยาใหม่ 3 แบบ"></div>
    <div class="f"><label for="rq-body">รายละเอียด</label><textarea id="rq-body" class="inp" rows="5" placeholder="บอกสิ่งที่ต้องการ ใช้ทำอะไร มีข้อกำหนดอะไรบ้าง"></textarea></div>
    <fieldset class="f scope-pick"><legend>งานนี้ใช้กับใคร</legend><div class="scopes">${SCOPES.map(([k,l,d,c],i)=>`<label class="scope" data-c="${c}"><input type="radio" name="rq-scope" value="${k}" ${i===1?"checked":""}><span><b>${esc(l)}</b><small>${esc(d)}</small></span></label>`).join("")}</div></fieldset>
    <div class="f"><label for="rq-owner">ส่งถึง</label><select id="rq-owner" class="inp"><option value="">ให้ทีมเลือกคนรับงาน</option>${staff.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join("")}</select></div>
    <div class="f"><label for="rq-files">แนบไฟล์ <span class="muted">ไม่บังคับ</span></label><input id="rq-files" type="file" multiple class="inp"></div>
    <p id="rq-err" style="margin:0;color:var(--ci-pink)" hidden></p>
    <div class="modal-foot"><span></span><div class="row"><button type="button" class="btn" data-act="close-modal">ยกเลิก</button><button class="btn primary" id="rq-send">ส่งงาน</button></div></div></form></div>`;
  $("#rq-title").focus();
  $("#rqForm").addEventListener("submit",async x=>{x.preventDefault();const btn=$("#rq-send");btn.disabled=true;btn.textContent="กำลังส่ง…";
    try{const title=$("#rq-title").value.trim(),body=$("#rq-body").value.trim(),files=[...$("#rq-files").files];
      const blocks=body?body.split("\n").map(l=>({id:bid(),t:"p",h:esc(l),i:0})):[{id:bid(),t:"p",h:"",i:0}];
      for(const f of files){const src=f.type.startsWith("image/")?await putImage(f):await putFile(f);blocks.push(f.type.startsWith("image/")?{id:bid(),t:"image",src,alt:f.name,w:"m",h:"",i:0}:{id:bid(),t:"file",src,name:f.name,size:f.size,mime:f.type,at:nowIso(),h:"",i:0})}
      const id=newId(),t=nowIso();const doc={title,status:"idea",ownerId:$("#rq-owner").value,where:"",url:"",repo:"",due:"",scope:(document.querySelector('input[name="rq-scope"]:checked')||{}).value||"dept",notes:body.slice(0,400),teamId:"",requestedBy:S.me,blocks,cover:"",createdAt:t,updatedAt:t};
      await backend.set("projects",id,doc);closeModal();toast("ส่งงานแล้ว ทีมได้รับแจ้งเตือน")}
    catch(e){const er=$("#rq-err");er.hidden=false;er.textContent=e&&e.code==="too_large"?`ไฟล์ใหญ่เกิน ${e.limit||4} MB`:(e&&e.msg)||"ส่งงานไม่สำเร็จ ลองอีกครั้ง";btn.disabled=false;btn.textContent="ส่งงาน"}});
}

/* ---- intake: incoming requests for the dev team ---- */
const isReq=p=>!!p.requestedBy;
const reqLink=id=>"req-"+id;
/* Line contact: the person picks one way — an ID, a phone number, or a QR code image */
const LINE_MODES=[["id","Line ID","@yourline"],["phone","เบอร์โทร","08x-xxx-xxxx"],["qr","รูป QR code",""]];
function lineContact(m){if(!m) return "";const mode=m.lineMode||"id";
  if(mode==="qr"&&m.lineQr) return `<span class="line-qr"><img data-src="${esc(m.lineQr)}" alt="QR code Line ของ ${esc(m.name||"")}"><small>สแกนเพื่อเพิ่มเพื่อนใน Line</small></span>`;
  if(mode!=="qr"&&m.line) return `<span>${mode==="phone"?"Line (เบอร์)":"Line"} : ${esc(m.line)}</span>`;return ""}
function lineEditor(me){const mode=me.lineMode||"id",ro=S.readOnly?"disabled":"";
  return `<div class="f"><label>ช่องทาง Line <span class="muted">แสดงให้คนที่ทำงานด้วยกันเห็น</span></label>
    <div class="seg line-seg" role="radiogroup" aria-label="รูปแบบช่องทาง Line">${LINE_MODES.map(([k,l])=>`<button role="radio" aria-checked="${mode===k}" aria-pressed="${mode===k}" data-act="line-mode" data-mode="${k}" ${ro}>${esc(l)}</button>`).join("")}</div>
    ${mode==="qr"?`<div class="qr-edit">${me.lineQr?`<span class="line-qr"><img data-src="${esc(me.lineQr)}" alt="QR code Line ของคุณ"></span>`:`<span class="qr-empty">${icon("image")}</span>`}
      <div class="row"><button class="btn small" data-act="line-qr-upload" ${ro}>${icon("upload")}${me.lineQr?"เปลี่ยนรูป QR":"อัปโหลดรูป QR"}</button>${me.lineQr?`<button class="btn small ghost" data-act="line-qr-remove" ${ro}>ลบรูป</button>`:""}</div></div>`
      :`<input id="pf-line" class="inp" maxlength="40" inputmode="${mode==="phone"?"tel":"text"}" placeholder="${esc(LINE_MODES.find(x=>x[0]===mode)[2])}" value="${esc(me.line||"")}" ${S.readOnly?"readonly":""} aria-label="${esc(LINE_MODES.find(x=>x[0]===mode)[1])}">`}</div>`}
function personCard(m,label,c){
  const ring=c||(m&&m.color)||"sand";
  return `<div class="pp" data-c="${esc(ring)}">${m?avatar(m,"xl"):`<span class="av xl none">${icon("user")}</span>`}
    <span class="pp-name">${esc(m?m.name:"ยังไม่มีคนรับ")}</span>
    <div class="pp-contact">${m&&m.email?`<span>${esc(m.email)}</span>`:""}${lineContact(m)}${m&&!m.email&&!lineContact(m)?`<span class="muted">ยังไม่ได้ใส่ช่องทางติดต่อ</span>`:""}${!m?`<span class="muted">รอทีม dev กดรับงาน</span>`:""}</div>
    <small class="pp-role">${esc(label)}</small></div>`}
function pairCard(p){
  const g=memberOf(p.requestedBy),o=memberOf(p.ownerId);
  return `<div class="pair">${personCard(g,"ผู้สั่งงาน","blue")}
    <div class="pair-mid"><svg viewBox="0 0 200 24" aria-hidden="true"><path d="M4 12h186M180 5l10 7-10 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <b>${o?"รับงาน!":"รอรับงาน"}</b>${o&&p.claimedAt?`<small>${esc(ago(p.claimedAt))}</small>`:""}
      ${!o&&!isGuest()&&!S.readOnly?`<button class="btn primary" data-act="claim" data-id="${esc(p.id)}">${icon("check")}รับงานนี้</button>`:""}</div>
    ${personCard(o,"ผู้รับงาน","yellow")}</div>`}
function viewIntake(){
  const reqs=S.projects.filter(p=>isReq(p)&&canSee(p.teamId));
  const open=reqs.filter(p=>!p.ownerId&&p.status!=="live").sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
  const taken=reqs.filter(p=>p.ownerId&&p.status!=="live").sort(byUpdated);
  const doneN=reqs.filter(p=>p.status==="live").length;
  const openHTML=open.length?`<div class="intake">${open.map((p,i)=>{const g=memberOf(p.requestedBy);const files=(p.blocks||[]).filter(b=>b.t==="file"||b.t==="image").length;
    return `<article class="in-card"><div class="in-top"><span class="q">คิว ${i+1}</span>${scopeChip(p.scope)}<span class="when">${esc(ago(p.createdAt||p.updatedAt))}</span></div>
      <h3>${esc(p.title||"ไม่มีชื่อ")}</h3>${p.notes?`<p class="in-notes">${esc(p.notes)}</p>`:""}
      <div class="in-who">${g?avatar(g,"sm"):""}<span>จาก <b>${esc(g?g.name:"คนนอก")}</b></span>${files?`<span class="muted">· ไฟล์แนบ ${files}</span>`:""}</div>
      <div class="row"><button class="btn primary" data-act="claim" data-id="${esc(p.id)}">${icon("check")}รับงาน!</button><button class="btn ghost" data-act="go" data-h="${reqLink(p.id)}">ดูรายละเอียด</button></div></article>`}).join("")}</div>`
    :`<div class="empty">${sticker("sparkle",72)}<h3>ไม่มีงานรอรับ</h3><span>เมื่อคนนอกส่งงานเข้ามา จะแสดงตรงนี้ให้ทีมกดรับ</span></div>`;
  const takenHTML=taken.length?`<div class="list">${taken.map(p=>{const g=memberOf(p.requestedBy),o=memberOf(p.ownerId),st=statusOf(p.status);
    return `<button class="li pair-li" data-act="go" data-h="${reqLink(p.id)}"><span class="t" data-c="${st.c}"><span class="sq"></span><span>${esc(p.title||"ไม่มีชื่อ")}</span></span><span class="mini-pair">${avatar(g,"xs")}${icon("chevron")}${avatar(o,"xs")}<span>${esc(g?g.name:"คนนอก")} → ${esc(o?o.name:"")}</span></span><span class="pill soft" data-c="${st.c}"><span class="tx">${esc(st.label)}</span></span></button>`}).join("")}</div>`
    :`<div class="empty slim"><span>ยังไม่มีงานที่รับไปแล้ว</span></div>`;
  return pageHead("รับงาน",`งานจากคนนอก · รอรับ ${open.length} · กำลังทำ ${taken.length} · เสร็จแล้ว ${doneN}`,null,"pink","clip")
    +card("pink","plane","รอคนรับ",`<span class="muted small-tx">${open.length} งาน</span>`,openHTML)
    +card("blue","cat","รับไปแล้ว",`<span class="muted small-tx">${taken.length} งาน</span>`,takenHTML);
}
async function claimRequest(id){if(S.readOnly) return;
  try{const j=await api(`/requests/${encodeURIComponent(id)}/claim`,{method:"POST"});const p=S.projects.find(x=>x.id===id);if(p&&j.doc) Object.assign(p,j.doc.data);
    backend.poll&&backend.poll();toast("รับงานแล้ว ส่งอีเมลแนะนำตัวให้ทั้งสองฝั่งแล้ว");go(reqLink(id))}
  catch(e){toast(e.msg||"รับงานไม่สำเร็จ");backend.poll&&backend.poll()}}

/* ---- request room: shared by the requester and the dev who took it ---- */
function viewReqRoom(id){
  const p=S.projects.find(x=>x.id===id);
  if(!p) return `<div class="empty">${sticker("cat",72)}<h3>${allLoaded()?"ไม่พบงานนี้ หรือคุณไม่มีสิทธิ์ดู":"กำลังเปิดห้องงาน…"}</h3><button class="btn" data-act="go" data-h="${isGuest()?"requests":"intake"}">กลับ</button></div>`;
  const st=statusOf(p.status),k=STEPS.indexOf(p.status||"idea");
  const canMove=!isGuest()&&canEditProject(p);
  const steps=`<div class="steps big" aria-label="ความคืบหน้า">${STEPS.map((s,i)=>`<span class="step${i<=k?" on":""}${p.status==="stuck"&&i===1?" warn":""}"><i></i>${esc(statusOf(s).label)}</span>`).join("")}</div>
    ${p.status==="stuck"?`<p class="banner soft" data-c="pink">${icon("callout")}ตอนนี้งานติดปัญหาอยู่ ดูรายละเอียดในอัปเดตล่าสุด</p>`:""}
    ${canMove?`<form class="note-form" id="noteForm" data-id="${esc(p.id)}"><label for="sn-text">ตอนนี้กำลังทำอะไรอยู่ <span class="muted">ผู้สั่งงานเห็นข้อความนี้</span></label><div class="row nowrap"><input id="sn-text" class="inp" maxlength="200" value="${esc(p.statusNote||"")}" placeholder="เช่น กำลังออกแบบหน้าจองเวลา รอไฟล์โลโก้"><button class="btn primary">บันทึก</button></div></form>`
      :p.statusNote?doingNote(p):`<p class="muted small-tx" style="margin:0">ทีมยังไม่ได้เขียนว่ากำลังทำอะไรอยู่</p>`}
    ${canMove?`<div class="row move"><span class="muted small-tx">เลื่อนสถานะ:</span>${STATUSES.map(s=>`<button class="pill soft${(p.status||"idea")===s.key?" on":""}" data-c="${s.c}" data-act="room-status" data-id="${esc(p.id)}" data-status="${s.key}" aria-pressed="${(p.status||"idea")===s.key}"><span class="d"></span>${esc(s.label)}</button>`).join("")}</div>`:""}`;
  const ups=(S.updates||[]).filter(u=>u.projectId===id).map(u=>({...u,_t:"u"}));
  const acts=(S.activity||[]).filter(a=>a.projectId===id).map(a=>({...a,_t:"a"}));
  const items=[...ups,...acts,{_t:"c",at:p.createdAt||p.updatedAt}].sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  const tl=`<ol class="tl">${items.map(it=>{
    if(it._t==="c"){const g=memberOf(p.requestedBy||p.createdBy);return `<li class="tl-sys">${avatar(g,"xs")}<span><b>${esc(g?g.name:p.requestedBy?"คนนอก":"ทีม")}</b> ${p.requestedBy?"ส่งงานนี้เข้ามา":"เริ่มโปรเจกต์นี้"}</span><time>${esc(ago(it.at))}</time></li>`}
    if(it._t==="a"){const m=memberOf(it.actorId);return `<li class="tl-sys">${avatar(m,"xs")}<span><b>${esc(m?m.name:"")}</b> ${it.kind==="claim"?"กดรับงาน":`เลื่อนสถานะเป็น <span class="pill soft tiny" data-c="${statusOf(it.to).c}">${esc(statusOf(it.to).label)}</span>`}</span><time>${esc(ago(it.at))}</time></li>`}
    const m=memberOf(it.authorId),mine=it.authorId===S.me;return `<li class="tl-msg${mine?" mine":""}${it.kind==="comment"?" from-guest":""}">${avatar(m,"sm")}<div class="bubble"><div class="b-h"><b>${esc(m?m.name:"")}</b><span class="tchip sm" data-c="${it.kind==="comment"?"pink":"yellow"}">${it.kind==="comment"?"ผู้สั่งงาน":"อัปเดตจากทีม"}</span><time>${esc(ago(it.at))}</time></div>${it.text?`<p>${esc(it.text).replace(/\n/g,"<br>")}</p>`:""}${it.sticker?`<div class="b-stk">${stickerArt(it.sticker,136)}</div>`:""}${(it.files||[]).map(f=>`<button class="file-pill" data-act="dl-file" data-src="${esc(f.src)}" data-name="${esc(f.name)}">${icon("clip")}${esc(f.name)}</button>`).join("")}</div></li>`}).join("")}</ol>`;
  const watcher=followsOf(p);
  const canPost=!S.readOnly&&(isGuest()?p.requestedBy===S.me:canSee(p.teamId));
  const composer=canPost?`<form class="composer" id="upForm" data-id="${esc(p.id)}"><textarea id="up-text" class="inp" rows="3" placeholder="${isGuest()?"ถามหรือเพิ่มรายละเอียดให้ทีม…":"เล่าความคืบหน้าให้ผู้สั่งงานรู้ เช่น ทำหน้าแรกเสร็จแล้ว รอไฟล์โลโก้"}"></textarea>
    <div class="row"><label class="btn small ghost file-in">${icon("clip")}แนบไฟล์<input type="file" id="up-files" multiple hidden></label><button type="button" class="btn small ghost" data-act="room-sticker" data-id="${esc(p.id)}">${icon("sparkle")}สติกเกอร์</button><span id="up-fn" class="muted small-tx"></span><button class="btn primary" id="up-send">${icon("plane")}${isGuest()?"ส่งข้อความ":"โพสต์อัปเดต"}</button></div></form>`:"";
  const files=(p.blocks||[]).filter(b=>(b.t==="file"||b.t==="image")&&b.src);
  const details=`<div class="details">${p.notes?`<p>${esc(p.notes).replace(/\n/g,"<br>")}</p>`:`<p class="muted">ไม่มีรายละเอียดเพิ่มเติม</p>`}
    <dl class="kv">${p.scope?`<div><dt>ขนาดงาน</dt><dd>${scopeChip(p.scope)}</dd></div>`:""}${p.due?`<div><dt>ต้องการภายใน</dt><dd>${esc(new Date(p.due+"T00:00").toLocaleDateString("th-TH",{day:"numeric",month:"long",year:"numeric"}))}</dd></div>`:""}<div><dt>${p.requestedBy?"ส่งเข้ามา":"เริ่มเมื่อ"}</dt><dd>${esc(new Date(p.createdAt||p.updatedAt).toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"numeric"}))}</dd></div>${p.url?`<div><dt>ลิงก์</dt><dd><a class="lnk" href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener">${esc(shortUrl(p.url))}</a></dd></div>`:""}</dl>
    ${files.length?`<div class="row">${files.map(f=>`<button class="file-pill" data-act="dl-file" data-src="${esc(f.src)}" data-name="${esc(f.name||f.alt||"file")}">${icon(f.t==="image"?"image":"clip")}${esc(f.name||f.alt||"ไฟล์")}</button>`).join("")}</div>`:""}
    ${!isGuest()?`<button class="btn small" data-act="open-project" data-id="${esc(p.id)}">${icon("note")}เปิดโน้ตของทีม</button>`:""}</div>`;
  return `<div class="room-top"><button class="btn ghost small" data-act="go" data-h="${isGuest()?"requests":"intake"}">${icon("chevron-left")}${isGuest()?"งานที่ฉันสั่ง":"รับงาน"}</button></div>`
    +pageHead(p.title||"ไม่มีชื่อ",`<span class="pill soft" data-c="${st.c}"><span class="d"></span><span class="tx">${esc(st.label)}</span></span> · อัปเดต ${esc(ago(p.updatedAt))}`,null,st.c,"clip")
    +(watcher?`<p class="banner soft" data-c="blue">${icon("eye")}คุณได้รับเชิญให้ติดตามโปรเจกต์นี้ ดูความคืบหน้าและถามทีมได้ในคอมเมนต์ด้านล่าง</p>`:card("sand","","คุณคือทีม!","",pairCard(p),"pair-card"))
    +`<div class="grid2">${card("green","sparkle","ความคืบหน้า","",steps+composer+tl+(watcher?`<div class="cmts" data-target="project:${esc(p.id)}"></div>`:""))}<div class="col-stack">${card("yellow","folder","รายละเอียดงาน","",details)}${isGuest()?teamLoadCard(p.id):""}</div></div>`;
}
async function postUpdate(form){const id=form.dataset.id,t=$("#up-text"),btn=$("#up-send");const text=t.value.trim();const fl=[...$("#up-files").files];
  if(!text&&!fl.length){toast("เขียนข้อความก่อนส่ง");return}btn.disabled=true;
  try{const files=[];for(const f of fl){files.push({src:await putFile(f),name:f.name,size:f.size})}
    await backend.set("updates",newId(),{projectId:id,text,files});t.value="";$("#up-files").value="";$("#up-fn").textContent="";toast(isGuest()?"ส่งข้อความให้ทีมแล้ว":"โพสต์อัปเดตแล้ว ผู้สั่งงานได้รับแจ้งเตือน")}
  catch(e){toast(e&&e.code==="too_large"?`ไฟล์ใหญ่เกิน ${e.limit||4} MB`:(e&&e.msg)||"ส่งไม่สำเร็จ")}
  btn.disabled=false}
async function downloadSrc(src,name){const blob=await blobFor(src);if(!blob){toast("เปิดไฟล์นี้ไม่ได้");return}const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name||"file";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}

/* ---- team load for outside requesters: counts only ---- */
let statsAt=0;
async function loadStats(){if(!API.on||Date.now()-statsAt<20000) return;statsAt=Date.now();try{S.stats=await api("/stats");const r=route();if(r.v==="requests"||r.v==="req") render()}catch(e){}}
function teamLoadCard(){const s=S.stats;if(!s) return "";
  return card("blue","books","ทีม dev ตอนนี้","",`<div class="load one"><div class="ld"><b>${s.open}</b><span>In progress · โปรเจกต์ที่ทีมกำลังดูแลและยังไม่เสร็จ</span></div></div>`)}

/* ---- people & roles (API mode, owner/admin) ---- */
let peopleAt=0;
function viewPeople(){
  return pageHead("คนและสิทธิ์","เชิญคนด้วยอีเมล แล้วกำหนดว่าแต่ละคนทำอะไรได้",null,"teal","cat")
    +`<div class="grid2">${card("teal","plane","เชิญคนเข้าแอป","",`<form id="invForm" class="inv"><div class="f"><label for="inv-email">อีเมล</label><input id="inv-email" class="inp" type="email" required placeholder="name@example.com" autocomplete="off"></div>
      <div class="f2"><div class="f"><label for="inv-name">ชื่อที่แสดง</label><input id="inv-name" class="inp" maxlength="60" placeholder="เช่น ภก.สมชาย"></div>
      <div class="f"><label for="inv-role">สิทธิ์</label><select id="inv-role" class="inp"><option value="member">สมาชิก</option><option value="guest">คนนอก (สั่งงานได้)</option><option value="admin">ผู้ดูแล</option>${S.role==="owner"?'<option value="owner">เจ้าของ</option>':""}</select></div></div>
      <div class="row"><button class="btn primary">${icon("plane")}ส่งคำเชิญทางอีเมล</button><span id="inv-msg" class="muted small-tx"></span></div></form>`)}
      ${card("sand","bulb","แต่ละสิทธิ์ทำอะไรได้","",`<ul class="plain roles"><li><b>เจ้าของ</b> ทุกอย่าง รวมถึงตั้งเจ้าของคนอื่น</li><li><b>ผู้ดูแล</b> เห็นทุกทีม เชิญคน เปลี่ยนสิทธิ์</li><li><b>สมาชิก</b> ทำงานตามทีมย่อยที่อยู่ เห็นงานทั้งองค์กร</li><li><b>คนนอก</b> เช่นเภสัชที่มาให้งาน สั่งงาน แนบไฟล์ และติดตามเฉพาะงานที่ตัวเองสั่ง เห็นหน้าที่แชร์ให้และประชุมที่ถูกเชิญ ไม่เห็นงานภายในอื่น</li></ul>`)}</div>`
    +card("pink","cat","ทุกคนในแอป",`<span class="muted small-tx" id="ppl-n"></span>`,`<div id="peopleList"><div class="muted">กำลังโหลด…</div></div>`)
    +card("yellow","folder","สำรองข้อมูล","",`<div class="bk">
      <div class="bk-row"><div><b>ดาวน์โหลดข้อมูลทั้งหมด</b><p class="muted small-tx">หน้าเอกสาร โปรเจกต์ ปฏิทิน ทีม สติกเกอร์ และรายชื่อคน รวมเป็นไฟล์ .json ไฟล์เดียว เก็บไว้ที่ปลอดภัย</p></div><button class="btn" data-act="backup-export">${icon("arrow-down")}ดาวน์โหลด</button></div>
      <div class="bk-row"><div><b>กู้คืนจากไฟล์สำรอง</b><p class="muted small-tx">เขียนทับรายการที่มีอยู่ในไฟล์ รายการที่ไม่มีในไฟล์ยังอยู่เหมือนเดิม คนที่ยังไม่มีในแอปจะถูกเพิ่มโดยไม่ส่งอีเมล</p></div><button class="btn" data-act="backup-pick">${icon("arrow-up")}เลือกไฟล์</button></div>
      ${S.role==="owner"?`<div class="bk-row"><div><b>ล้างข้อมูลทั้งหมด</b><p class="muted small-tx">ลบหน้า โปรเจกต์ ปฏิทิน ทีม คอมเมนต์ และบัญชีทุกคนยกเว้นคุณ เริ่มใหม่หมด ระบบดาวน์โหลดไฟล์สำรองให้ก่อนล้าง</p></div><button class="btn danger" data-act="wipe-open">${icon("trash")}ล้างข้อมูล</button></div>
      <form class="bk-wipe" id="bk-wipe"${wipeOpen?"":" hidden"}><label for="wipe-word">พิมพ์คำว่า <b>ล้าง</b> เพื่อยืนยัน ลบแล้วย้อนกลับไม่ได้ นอกจากกู้คืนจากไฟล์สำรอง</label>
        <div class="row"><input id="wipe-word" class="inp" autocomplete="off"><button class="btn danger" id="wipe-go" disabled>ลบทั้งหมด</button><button type="button" class="btn ghost" data-act="wipe-close">ยกเลิก</button></div></form>`:""}
      <div id="bk-msg" aria-live="polite"></div></div>`);
}
/* ---- page sharing ---- */
function shareChip(p){if(!API.on) return teamChip(p.teamId,true);const n=Object.keys(p.people||{}).length+(p.guestIds||[]).length;
  const label=p.share==="private"?(n?`ส่วนตัว + ${n} คน`:"ส่วนตัว"):(teamOf(p.teamId)?teamOf(p.teamId).name:"ทั้งองค์กร")+(p.teamAccess==="view"?" · ดูได้":"")+(n?` + ${n} คน`:"");
  const cls=`tchip sm share-chip" data-c="${p.share==="private"?"pink":p.teamId?(teamOf(p.teamId)||{}).color||"blue":"sand"}`;
  return canSharePage(p)?`<button class="${cls}" data-act="share-page" data-id="${esc(p.id)}" title="แชร์ / สิทธิ์ดูและแก้">${icon(p.share==="private"?"lock":"users")}${esc(label)}</button>`
    :`<span class="${cls}">${icon(p.share==="private"?"lock":"users")}${esc(label)}${pageRole(p)==="view"?" · คุณดูได้อย่างเดียว":""}</span>`}
function openShareModal(id){const p=pageOf(id);if(!p||!canSharePage(p)) return;
  let share=p.share==="private"?"private":"team",ta=p.teamAccess==="view"?"view":"edit";
  const people=Object.assign({},p.people||{});(p.guestIds||[]).forEach(g=>{if(!people[g]) people[g]="view"});
  const owner=p.createdBy||S.me,space=teamOf(p.teamId)?`ทีม ${teamOf(p.teamId).name}`:"ทั้งองค์กร";
  const kids=descendants(id).filter(k=>{const c=pageOf(k);return c&&!c.trashed});
  const draw=()=>{const cand=S.members.filter(m=>m.id!==owner&&!people[m.id]).sort((a,b)=>(a.guest?1:0)-(b.guest?1:0)||String(a.name).localeCompare(String(b.name),"th"));
    $("#shBody").innerHTML=`
    <fieldset class="sh-who"><legend>ใครเห็นหน้านี้</legend>
      <label class="sh-opt${share==="team"?" on":""}"><input type="radio" name="sh" value="team" ${share==="team"?"checked":""}><span>${icon("users")}<b>ทุกคนใน${esc(space)}</b><small>${p.teamId?"สมาชิกทีมนี้":"ทุกคนในแอป ยกเว้นคนนอก"}</small></span>
        <select class="inp sh-ta" aria-label="สิทธิ์ของ${esc(space)}" ${share==="team"?"":"disabled"}><option value="edit"${ta==="edit"?" selected":""}>แก้ได้</option><option value="view"${ta==="view"?" selected":""}>ดูได้อย่างเดียว</option></select></label>
      <label class="sh-opt${share==="private"?" on":""}"><input type="radio" name="sh" value="private" ${share==="private"?"checked":""}><span>${icon("lock")}<b>เฉพาะคนที่เลือก</b><small>คนอื่นมองไม่เห็นหน้านี้เลย</small></span></label>
    </fieldset>
    <div class="sh-ppl"><div class="sh-h">คนที่แชร์ให้</div>
      ${owner?`<div class="sh-row">${avatar(memberOf(owner),"sm")}<span class="sh-n">${esc((memberOf(owner)||{}).name||"เจ้าของ")}${owner===S.me?" (คุณ)":""}</span><span class="muted small-tx">เจ้าของหน้า</span></div>`:""}
      ${Object.entries(people).map(([uid,r])=>{const m=memberOf(uid)||{name:"คนที่ถูกลบไปแล้ว"};return `<div class="sh-row">${avatar(m,"sm")}<span class="sh-n">${esc(m.name)}${m.guest?' <span class="tchip sm" data-c="pink">คนนอก</span>':""}</span>
        ${m.guest?`<span class="muted small-tx">ดูได้</span>`:`<select class="inp sh-r" data-uid="${esc(uid)}" aria-label="สิทธิ์ของ ${esc(m.name)}"><option value="edit"${r==="edit"?" selected":""}>แก้ได้</option><option value="view"${r!=="edit"?" selected":""}>ดูได้</option></select>`}
        <button type="button" class="icon-btn sh-x" data-uid="${esc(uid)}" aria-label="เลิกแชร์กับ ${esc(m.name)}">${icon("x")}</button></div>`}).join("")}
      ${cand.length?`<div class="sh-add"><select class="inp" id="shPick" aria-label="เลือกคนที่จะแชร์ให้"><option value="">+ เพิ่มคน…</option>${cand.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}${m.guest?" (คนนอก ดูได้อย่างเดียว)":""}</option>`).join("")}</select>
        <select class="inp" id="shPickR" aria-label="สิทธิ์"><option value="view">ดูได้</option><option value="edit">แก้ได้</option></select></div>`:""}
      ${!Object.keys(people).length&&share==="private"?`<p class="muted small-tx" style="margin:0">ยังไม่ได้แชร์ให้ใคร ตอนนี้เห็นแค่${owner===S.me?"คุณ":"เจ้าของหน้า"}คนเดียว</p>`:""}
    </div>
    ${kids.length?`<label class="check-row"><input type="checkbox" id="shKids" checked><span>ใช้กับหน้าย่อยอีก ${kids.length} หน้าด้วย</span></label>`:""}`;
    $("#shBody").querySelectorAll('input[name="sh"]').forEach(r=>r.onchange=()=>{share=r.value;draw()});
    const tasel=$("#shBody .sh-ta");if(tasel) tasel.onchange=()=>{ta=tasel.value};
    $("#shBody").querySelectorAll(".sh-r").forEach(x=>x.onchange=()=>{people[x.dataset.uid]=x.value});
    $("#shBody").querySelectorAll(".sh-x").forEach(x=>x.onclick=()=>{delete people[x.dataset.uid];draw()});
    const pick=$("#shPick");if(pick) pick.onchange=()=>{if(!pick.value) return;const m=memberOf(pick.value);people[pick.value]=m&&m.guest?"view":$("#shPickR").value;draw();const nx=$("#shPick");if(nx) nx.focus()}};
  $("#modalRoot").innerHTML=`<div class="modal-wrap" data-act="modal-bg"><form class="modal" id="shForm" role="dialog" aria-modal="true" aria-labelledby="shTitle">
    <div><h2 id="shTitle">แชร์ “${esc(p.title||"ไม่มีชื่อ")}”</h2><p class="muted small-tx" style="margin:2px 0 0">แบบ “เฉพาะคนที่เลือก” ผู้ดูแลแอปก็มองไม่เห็น ถ้าไม่ได้แชร์ให้</p></div>
    <div id="shBody" class="sh-body"></div>
    <div class="modal-foot"><button type="button" class="btn ghost" data-act="close-modal">ยกเลิก</button><button class="btn primary">บันทึก</button></div></form></div>`;
  draw();
  $("#shForm").addEventListener("submit",e=>{e.preventDefault();
    const fields={share,teamAccess:ta,people:Object.assign({},people),guestIds:[],updatedAt:nowIso()};
    const ids=[id,...(($("#shKids")||{}).checked?kids:[])];
    ids.forEach(pid=>{const pg=pageOf(pid);if(!pg||!canSharePage(pg)) return;Object.assign(pg,fields);const f2=pg.createdBy?fields:Object.assign({claimOwner:true},fields);if(!pg.createdBy) pg.createdBy=S.me;patch("pages",pid,f2,0)});
    closeModal();render();
    const n=Object.keys(people).length;
    toast(share==="private"?(n?`หน้านี้เห็นเฉพาะคุณกับอีก ${n} คน`:"หน้านี้เป็นส่วนตัวแล้ว"):`${space} ${ta==="view"?"ดูได้อย่างเดียว":"แก้ได้"}${n?` และแชร์เพิ่มอีก ${n} คน`:""}`)});
}

/* ---- outside followers of a project ---- */
const followsOf=p=>!!p&&isGuest()&&(p.guestIds||[]).includes(S.me)&&p.requestedBy!==S.me;
function fillWatchers(p,ro){const el=$("#pWatch");if(!el||!API.on) return;
  if(el.querySelector("#watchForm")) return; // an invite is being typed
  const ws=(p.guestIds||[]).map(id=>({id,m:memberOf(id)}));
  el.innerHTML=`<div class="watch-list">${ws.map(({id,m})=>`<span class="tchip sm watcher" data-c="pink">${avatar(m||{name:"?"},"xs")}${esc(m?m.name:"คนนอก")}${ro?"":`<button class="w-x" data-act="unwatch" data-uid="${esc(id)}" aria-label="เลิกให้ ${esc(m?m.name:"คนนี้")} ติดตาม">${icon("x")}</button>`}</span>`).join("")}
    ${ro?"":`<button class="btn small ghost" data-act="watch-open">${icon("plus")}เชิญคนนอก</button>`}${!ws.length&&ro?`<span class="muted small-tx">ไม่มี</span>`:""}</div>
    ${ws.length?`<span class="muted small-tx">เห็นสถานะ สิ่งที่กำลังทำ อัปเดตในห้องงาน และคอมเมนต์ของโปรเจกต์นี้ แก้อะไรไม่ได้</span>`:""}`}
function openWatchForm(){const el=$("#pWatch");if(!el||el.querySelector("form")) return;
  el.insertAdjacentHTML("beforeend",`<form class="watch-form" id="watchForm"><input class="inp" id="w-email" type="email" required placeholder="อีเมลคนนอก" aria-label="อีเมลคนนอก" autocomplete="off"><input class="inp" id="w-name" maxlength="60" placeholder="ชื่อ (ไม่ใส่ก็ได้)" aria-label="ชื่อที่แสดง" autocomplete="off">
    <button class="btn primary small" id="w-send">ส่งคำเชิญ</button><button type="button" class="btn ghost small" data-act="watch-close">ยกเลิก</button><div id="w-msg" class="small-tx" aria-live="polite"></div></form>`);
  $("#w-email").focus();
  $("#watchForm").addEventListener("submit",async e=>{e.preventDefault();const pid=S.openProject,b=$("#w-send"),msg=$("#w-msg");b.disabled=true;
    try{const j=await api(`/projects/${encodeURIComponent(pid)}/invite`,{method:"POST",body:{email:$("#w-email").value.trim(),name:$("#w-name").value.trim()}});
      const p=S.projects.find(x=>x.id===pid);if(p){const g=new Set(p.guestIds||[]);g.add(j.user.id);p.guestIds=[...g]}
      if(!memberOf(j.user.id)) S.members.push({id:j.user.id,name:j.user.name,guest:true,color:"pink"});
      backend.poll&&backend.poll();
      const who=esc(j.user.name||j.user.email);
      if(j.already){msg.innerHTML=`<span class="muted">${who} ติดตามโปรเจกต์นี้อยู่แล้ว</span>`;b.disabled=false;return}
      $("#watchForm").remove();fillPanel();
      toast(j.created?`ส่งคำเชิญไปที่ ${j.user.email} แล้ว`:`เพิ่ม ${j.user.name||j.user.email} แล้ว เขาได้แจ้งเตือนทางอีเมล`);
      if(j.devLink) $("#pWatch").insertAdjacentHTML("beforeend",`<p class="dev-note">โหมดพัฒนา: ยังไม่ได้ต่อระบบส่งเมล <a class="btn small" href="${esc(j.devLink)}" target="_blank" rel="noopener">ลิงก์ที่จะส่งให้ ${who}</a></p>`)}
    catch(err){msg.innerHTML=`<span style="color:var(--ci-pink)">${esc(err.msg||"เชิญไม่สำเร็จ ลองอีกครั้ง")}</span>`;b.disabled=false}})}

/* ---- comments with @mentions (pages and projects) ---- */
const cmtText=t=>esc(t).replace(/@\{([A-Za-z0-9]+)\}/g,(x,id)=>{const m=memberOf(id);return `<span class="mention${id===S.me?" me":""}">@${esc(m?m.name:"ใครบางคน")}</span>`});
function cmtTargetDoc(target){const [k,id]=target.split(":");return k==="page"?pageOf(id):S.projects.find(p=>p.id===id)}
function refreshComments(){document.querySelectorAll(".cmts[data-target]").forEach(fillComments)}
function fillComments(box){const target=box.dataset.target;if(!target) return;
  if(!box.querySelector(".cm-new")){
    box.innerHTML=`<div class="sec-h">คอมเมนต์ <span class="muted cm-n"></span></div><div class="cm-list"></div>
      <form class="cm-new">${avatar(meMember(),"sm")}<div class="cm-field"><textarea class="inp cm-inp" rows="1" maxlength="4000" placeholder="เขียนคอมเมนต์… พิมพ์ @ เพื่อแท็กเพื่อนในทีม" aria-label="เขียนคอมเมนต์"></textarea>
        <ul class="cm-pick" role="listbox" aria-label="เลือกคนที่จะแท็ก" hidden></ul></div><button class="btn primary small cm-send" disabled>ส่ง</button></form>`;
    wireComposer(box)}
  const list=(S.comments||[]).filter(c=>c.target===target).sort((a,b)=>String(a.at).localeCompare(String(b.at)));
  box.querySelector(".cm-n").textContent=list.length?list.length:"";
  if(box.querySelector(".cm-edit")) return; // someone is editing: keep their box
  box.querySelector(".cm-list").innerHTML=list.map(c=>{const m=memberOf(c.authorId),mine=c.authorId===S.me;
    return `<article class="cm${(c.mentions||[]).includes(S.me)?" to-me":""}" id="cm-${esc(c.id)}">${avatar(m,"sm")}<div class="cm-bd"><div class="cm-h"><b>${esc(m?m.name:"ใครบางคน")}</b><span class="muted">${esc(ago(c.at))}${c.editedAt?" · แก้ไขแล้ว":""}</span>
      <span class="cm-acts">${mine?`<button class="lnkbtn" data-act="cm-edit" data-id="${esc(c.id)}">แก้ไข</button>`:""}${mine||isAdmin()?`<button class="lnkbtn cm-del" data-act="cm-del" data-id="${esc(c.id)}">ลบ</button>`:""}</span></div><p>${cmtText(c.text)}</p></div></article>`}).join("")||`<p class="muted small-tx cm-empty">ยังไม่มีคอมเมนต์ เริ่มคุยเรื่องนี้ได้เลย</p>`;
}
/** @-mention picker on a textarea. Returns encode() -> {text, mentions} with @Name turned into @{id}. */
function mentionInput(ta,pick,{onSubmit,onCancel,onInput}={}){
  const picked=new Map();let opts=[],sel=0;
  const grow=()=>{ta.style.height="auto";ta.style.height=Math.min(ta.scrollHeight,220)+"px";onInput&&onInput()};
  const close=()=>{pick.hidden=true};
  const show=()=>{const m=ta.value.slice(0,ta.selectionStart).match(/(^|\s)@([^\s@]{0,30})$/);
    if(!m){close();return}const ql=m[2].toLowerCase();
    opts=S.members.filter(x=>x.id!==S.me&&(x.name||"").toLowerCase().includes(ql)).slice(0,6);
    if(!opts.length){close();return}sel=Math.min(sel,opts.length-1);
    pick.innerHTML=opts.map((x,i)=>`<li role="option" aria-selected="${i===sel}" data-i="${i}">${avatar(x,"sm")}<span>${esc(x.name)}</span>${x.guest?`<small class="muted">คนนอก</small>`:""}</li>`).join("");pick.hidden=false};
  const choose=i=>{const x=opts[i];if(!x) return;const pos=ta.selectionStart,before=ta.value.slice(0,pos).replace(/@([^\s@]{0,30})$/,"@"+x.name+" ");
    ta.value=before+ta.value.slice(pos);picked.set(x.name,x.id);ta.focus();ta.setSelectionRange(before.length,before.length);close();grow()};
  ta.addEventListener("input",()=>{sel=0;grow();show()});
  ta.addEventListener("keydown",e=>{
    if(!pick.hidden&&["ArrowDown","ArrowUp","Enter","Tab","Escape"].includes(e.key)){e.preventDefault();e.stopPropagation();
      if(e.key==="Escape") return close();if(e.key==="ArrowDown"||e.key==="ArrowUp"){sel=(sel+(e.key==="ArrowDown"?1:-1)+opts.length)%opts.length;show();return}return choose(sel)}
    if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();onSubmit&&onSubmit()}
    else if(e.key==="Escape"&&onCancel){e.preventDefault();e.stopPropagation();onCancel()}});
  ta.addEventListener("blur",()=>setTimeout(close,150));
  pick.addEventListener("mousedown",e=>{const li=e.target.closest("li");if(li){e.preventDefault();choose(+li.dataset.i)}});
  return {grow,
    load(text){ta.value=String(text||"").replace(/@\{([A-Za-z0-9]+)\}/g,(x,id)=>{const m=memberOf(id);if(!m) return "@ใครบางคน";picked.set(m.name,id);return "@"+m.name});grow()},
    clear(){ta.value="";picked.clear();grow()},
    encode(){let text=ta.value.trim();const mentions=[];
      for(const n of [...picked.keys()].sort((a,b)=>b.length-a.length)) if(text.includes("@"+n)){text=text.split("@"+n).join("@{"+picked.get(n)+"}");mentions.push(picked.get(n))}
      return {text,mentions}}}}
function wireComposer(box){
  const form=box.querySelector(".cm-new"),ta=form.querySelector(".cm-inp"),send=form.querySelector(".cm-send");
  const mi=mentionInput(ta,form.querySelector(".cm-pick"),{onSubmit:()=>form.requestSubmit(),onInput:()=>{send.disabled=!ta.value.trim()}});
  form.addEventListener("submit",async e=>{e.preventDefault();const {text,mentions}=mi.encode();if(!text) return;
    const target=box.dataset.target,t=cmtTargetDoc(target)||{},id=newId();
    const doc={target,text,mentions,authorId:S.me||"",teamId:t.teamId||"",requestedBy:t.requestedBy||"",guestIds:target.startsWith("page:")?t.guestIds||[]:[],at:nowIso()};
    send.disabled=true;
    try{await backend.set("comments",id,doc);mi.clear();if(!API.on){S.comments=[...(S.comments||[]).filter(c=>c.id!==id),Object.assign({id},doc)];refreshComments()}
      if(mentions.length) toast(`แท็ก ${mentions.length} คนแล้ว${API.on?" เขาจะได้แจ้งเตือน":""}`)}
    catch(err){toast((err&&err.msg)||"ส่งคอมเมนต์ไม่สำเร็จ ลองอีกครั้ง");send.disabled=false}});
}
function editComment(id){
  const c=(S.comments||[]).find(x=>x.id===id),art=document.getElementById("cm-"+id);if(!c||!art||art.querySelector(".cm-edit")) return;
  const p=art.querySelector(".cm-bd>p");
  p.insertAdjacentHTML("afterend",`<form class="cm-edit"><div class="cm-field"><textarea class="inp cm-inp" rows="1" maxlength="4000" aria-label="แก้คอมเมนต์"></textarea><ul class="cm-pick" role="listbox" aria-label="เลือกคนที่จะแท็ก" hidden></ul></div>
    <div class="row"><button class="btn primary small">บันทึก</button><button type="button" class="btn ghost small cm-cancel">ยกเลิก</button><span class="muted small-tx">Ctrl+Enter บันทึก · Esc ยกเลิก</span></div></form>`);
  p.hidden=true;
  const form=art.querySelector(".cm-edit"),ta=form.querySelector("textarea");
  const done=()=>{form.remove();p.hidden=false;refreshComments()};
  const mi=mentionInput(ta,form.querySelector(".cm-pick"),{onSubmit:()=>form.requestSubmit(),onCancel:done});
  mi.load(c.text);ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);
  form.querySelector(".cm-cancel").addEventListener("click",done);
  form.addEventListener("submit",async e=>{e.preventDefault();const {text,mentions}=mi.encode();
    if(!text){toast("ข้อความว่างอยู่ ถ้าไม่อยากเก็บไว้ ใช้ปุ่มลบแทน");return}
    if(text===c.text){done();return}
    const before=c.mentions||[],fields={text,mentions,editedAt:nowIso()};
    try{await backend.update("comments",id,fields);Object.assign(c,fields);done();
      const added=mentions.filter(m=>!before.includes(m)).length;toast(added?`บันทึกแล้ว แท็กเพิ่ม ${added} คน`:"บันทึกการแก้ไขแล้ว")}
    catch(err){toast((err&&err.msg)||"บันทึกไม่สำเร็จ ลองอีกครั้ง")}});
}

/* ---- backup ---- */
const BK_LABEL={pages:"หน้าเอกสาร",projects:"โปรเจกต์",events:"นัดประชุม",teams:"ทีมย่อย",members:"โปรไฟล์คน",updates:"ข้อความในห้องงาน",activity:"ประวัติ",stickers:"สติกเกอร์"};
let bkData=null;
async function backupExport(quiet){
  const r=await fetch("/api/admin/export",{credentials:"same-origin"});if(!r.ok) throw new Error("export");
  const name=((r.headers.get("content-disposition")||"").match(/filename="([^"]+)"/)||[])[1]||"team-pulse-backup.json";
  const url=URL.createObjectURL(await r.blob()),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
  if(!quiet) toast("ดาวน์โหลดไฟล์สำรองแล้ว");return name}
function backupPick(){const inp=document.createElement("input");inp.type="file";inp.accept=".json,application/json";
  inp.onchange=async()=>{const f=inp.files&&inp.files[0],msg=$("#bk-msg");if(!f||!msg) return;bkData=null;
    try{const j=JSON.parse(await f.text());if(j.app!=="team-pulse"||!Array.isArray(j.docs)) throw 0;bkData=j}
    catch(e){msg.innerHTML=`<p class="banner soft" data-c="pink">ไฟล์นี้ไม่ใช่ไฟล์สำรองของ Team Pulse</p>`;return}
    const n={};bkData.docs.forEach(d=>{n[d.col]=(n[d.col]||0)+1});const nf=Object.keys(bkData.files||{}).length;
    const when=bkData.exportedAt?new Date(bkData.exportedAt).toLocaleString("th-TH",{dateStyle:"medium",timeStyle:"short"}):"ไม่ทราบวันที่";
    msg.innerHTML=`<div class="bk-sum"><p><b>${esc(f.name)}</b><br><span class="muted small-tx">สำรองเมื่อ ${esc(when)}${bkData.exportedBy?" โดย "+esc(bkData.exportedBy):""}</span></p>
      <ul class="bk-n">${Object.keys(BK_LABEL).filter(k=>n[k]).map(k=>`<li><b>${n[k]}</b> ${BK_LABEL[k]}</li>`).join("")}<li><b>${(bkData.users||[]).length}</b> บัญชีผู้ใช้</li>${nf?`<li><b>${nf}</b> ไฟล์แนบ</li>`:""}</ul>
      <p class="muted small-tx">ก่อนกู้คืน ระบบจะดาวน์โหลดไฟล์สำรองของข้อมูลตอนนี้ให้ก่อนโดยอัตโนมัติ เผื่ออยากย้อนกลับ</p>
      <div class="row"><button class="btn danger" id="bk-go">กู้คืนข้อมูลจากไฟล์นี้</button><button class="btn ghost" data-act="backup-cancel">ยกเลิก</button></div></div>`;
    armDelete($("#bk-go"),"กดอีกครั้งเพื่อยืนยันการกู้คืน",backupRestore)};
  inp.click()}
async function backupRestore(){const msg=$("#bk-msg"),d=bkData;if(!d||!msg) return;
  const step=t=>{msg.innerHTML=`<p class="banner soft" data-c="blue">${esc(t)}</p>`};
  try{
    step("กำลังดาวน์โหลดข้อมูลตอนนี้เก็บไว้ก่อน…");await backupExport(true);
    const map={},files=Object.entries(d.files||{});
    for(let i=0;i<files.length;i++){const [id,f]=files[i];step(`กำลังอัปโหลดไฟล์แนบ ${i+1}/${files.length}…`);
      const bin=Uint8Array.from(atob(f.b64||""),c=>c.charCodeAt(0));
      const j=await api(`/files?name=${encodeURIComponent(f.name||"file")}&type=${encodeURIComponent(f.type||"")}`,{method:"POST",body:new Blob([bin]),headers:{"content-type":"application/octet-stream"}});map[id]=j.url}
    let users=0,docs=0,skipped=0;
    const r0=await api("/admin/import",{method:"POST",body:{users:d.users||[]}});users+=r0.users;skipped+=r0.skipped;
    // people who already have an account here (you, at least) get their id from this server: rewrite every reference
    const ids=r0.idMap||{},idRe=Object.keys(ids).length?new RegExp(`(["{])(${Object.keys(ids).map(k=>k.replace(/[^A-Za-z0-9]/g,"")).join("|")})(["}])`,"g"):null;
    const fix=doc=>{let s=JSON.stringify(doc);if(files.length) s=s.replace(/\/api\/files\/([a-z0-9]+)(\/[^"\s)]*)?/gi,(m,id)=>map[id]||m);
      if(idRe) s=s.replace(idRe,(m,a,id,z)=>a+(ids[id]||id)+z);return JSON.parse(s)};
    let batch=[],size=0;const flush=async()=>{if(!batch.length) return;const r=await api("/admin/import",{method:"POST",body:{docs:batch}});docs+=r.docs;skipped+=r.skipped;batch=[];size=0};
    for(let i=0;i<d.docs.length;i++){const x=fix(d.docs[i]),len=JSON.stringify(x).length;if(size+len>2500000) await flush();batch.push(x);size+=len;
      if(batch.length>=150){step(`กำลังกู้คืน ${i+1}/${d.docs.length} รายการ…`);await flush()}}
    await flush();
    bkData=null;msg.innerHTML=`<p class="banner soft" data-c="green">กู้คืนเสร็จแล้ว ${docs} รายการ${users?` เพิ่มบัญชีใหม่ ${users} คน`:""}${skipped?` (ข้าม ${skipped} รายการที่มีอยู่แล้วหรือใช้ไม่ได้)`:""} กำลังโหลดหน้าใหม่…</p>`;
    setTimeout(()=>location.reload(),1800);
  }catch(e){msg.innerHTML=`<p class="banner soft" data-c="pink">กู้คืนไม่สำเร็จ: ${esc((e&&e.msg)||"ลองอีกครั้ง")} ข้อมูลที่กู้ไปแล้วบางส่วนยังอยู่ ลองกู้คืนจากไฟล์เดิมซ้ำได้</p>`}
}
let wipeOpen=false,wiping=false;
// delegated, so the form keeps working after the people view re-renders on sync
document.addEventListener("input",e=>{if(e.target.id==="wipe-word"){const b=$("#wipe-go");if(b) b.disabled=wiping||e.target.value.trim()!=="ล้าง"}});
document.addEventListener("submit",e=>{if(e.target.id!=="bk-wipe") return;e.preventDefault();const w=$("#wipe-word");if(w&&w.value.trim()==="ล้าง"&&!wiping) wipeAll()});
async function wipeAll(){wiping=true;
  // the people view re-renders on sync, so look the message box up each time
  const show=(c,t)=>{const m=$("#bk-msg");if(m) m.innerHTML=`<p class="banner soft" data-c="${c}">${esc(t)}</p>`};
  const lock=on=>{const f=$("#bk-wipe");if(f) f.querySelectorAll("button,input").forEach(x=>x.disabled=on)};
  try{lock(true);
    show("blue","กำลังดาวน์โหลดไฟล์สำรองก่อนล้าง…");await backupExport(true);
    show("blue","กำลังล้างข้อมูล…");const r=await api("/admin/wipe",{method:"POST",body:{confirm:"ล้าง"}});
    show("green",`ล้างแล้ว ${r.docs} รายการ${r.users?` และบัญชี ${r.users} คน`:""} กำลังโหลดหน้าใหม่…`);
    setTimeout(()=>location.reload(),1600);
  }catch(e){wiping=false;show("pink",`ล้างไม่สำเร็จ: ${(e&&e.msg)||"ลองอีกครั้ง"}`);lock(false)}}
async function loadPeople(force){
  if(!force&&Date.now()-peopleAt<15000&&S.users){fillPeople();return}
  try{const j=await api("/users");S.users=j.users;peopleAt=Date.now();fillPeople()}catch(e){const el=$("#peopleList");if(el) el.innerHTML=`<div class="muted">โหลดรายชื่อไม่ได้</div>`}}
function fillPeople(){const el=$("#peopleList");if(!el||!S.users) return;$("#ppl-n").textContent=S.users.length+" คน";
  el.innerHTML=`<div class="ppl">${S.users.map(u=>{const m=memberOf(u.id)||{name:u.name,color:"sand"};const self=u.id===S.me;const ownerLock=u.role==="owner"&&S.role!=="owner";
    return `<div class="ppl-row">${avatar(Object.assign({id:u.id},m),"md")}<div class="ppl-id"><b>${esc(m.name||u.name)}${self?' <span class="muted">(คุณ)</span>':""}</b><small>${esc(u.email)}</small></div>
      <select class="inp ppl-role" data-uid="${esc(u.id)}" aria-label="สิทธิ์ของ ${esc(m.name||u.email)}" ${self||ownerLock?"disabled":""}>${["owner","admin","member","guest"].filter(r=>r!=="owner"||S.role==="owner"||u.role==="owner").map(r=>`<option value="${r}"${u.role===r?" selected":""}>${ROLE_LABEL[r]}</option>`).join("")}</select>
      ${self||ownerLock?"<span></span>":`<button class="btn small danger" data-act="del-user" data-uid="${esc(u.id)}" data-name="${esc(m.name||u.email)}">ลบ</button>`}</div>`}).join("")}</div>`}

/* ---- notifications ---- */
function renderBell(){const n=(S.notifs||[]).filter(x=>!x.read).length;document.querySelectorAll(".bell-n").forEach(b=>{b.hidden=!n;b.textContent=n>9?"9+":n});document.querySelectorAll(".bell").forEach(b=>b.hidden=!API.on)}
function openNotifs(anchor){const m=$("#menu");menuItems=[];const list=(S.notifs||[]).slice(0,25);
  m.innerHTML=`<div class="m-h notif-h"><span>แจ้งเตือน</span>${list.some(n=>!n.read)?`<button class="lnkbtn" data-act="notif-all">อ่านทั้งหมด</button>`:""}</div>`+(list.length?list.map(n=>`<button class="m-i notif${n.read?"":" unread"}" data-act="notif-open" data-nid="${esc(n.id)}" data-link="${esc(n.link||"")}"><span class="m-g">${icon({status:"board",assigned:"clip",meeting:"clock",mention:"chat"}[n.kind]||"sparkle")}</span><span class="lb">${esc(n.title)}${n.body?`<small>${esc(n.body)}</small>`:""}<small class="when">${esc(ago(n.createdAt))}</small></span></button>`).join(""):`<div class="s-empty">ยังไม่มีแจ้งเตือน</div>`);
  m.classList.add("wide-menu");placeFloating(m,anchor.getBoundingClientRect())}
async function markNotifs(ids){(S.notifs||[]).forEach(n=>{if(ids==="all"||ids.includes(n.id)) n.read=true});renderBell();try{await api("/notifications/read",{method:"POST",body:ids==="all"?{all:true}:{ids}})}catch(e){}}

/* ---- email login ---- */
function showLogin(){showLanding({api,esc,statusOf})}
async function logout(){try{await api("/auth/logout",{method:"POST"})}catch(e){}location.href="/"}

/* ---- preferences ---- */
function viewPreferences(){
  const me=meMember();
  const theme=`<section class="card"><div class="card-h"><h2>หน้าตา</h2></div>
    <div class="theme-pick" role="radiogroup" aria-label="ธีม">${THEMES.map(([k,l,ic])=>`<button role="radio" aria-checked="${S.theme===k}" class="th-opt th-${k}" data-act="theme" data-theme="${k}"><span class="th-prev" aria-hidden="true"><i></i><i></i><i></i></span><span class="th-l">${icon(ic)}${esc(l)}</span></button>`).join("")}</div>
    <p class="muted small-tx" style="margin:0">เก็บไว้ในเบราว์เซอร์นี้ ไม่กระทบคนอื่นในทีม</p></section>`;
  const who=`<section class="card"><div class="card-h"><h2>คุณคือใครในทีม</h2></div>
    ${S.members.length?`<div class="who-pick">${S.members.map(m=>`<button class="who${m.id===S.me?" on":""}" data-act="set-me" data-id="${esc(m.id)}" aria-pressed="${m.id===S.me}">${avatar(m)}<span>${esc(m.name)}</span></button>`).join("")}<button class="who add w-only" data-act="new-member-me">${icon("plus")}<span>เพิ่มตัวฉัน</span></button></div>`
      :`<div class="empty slim"><span>ยังไม่มีคนในทีม เพิ่มตัวคุณเป็นคนแรก</span><button class="btn w-only" data-act="new-member-me">${icon("user")}เพิ่มตัวฉัน</button></div>`}
    <p class="muted small-tx" style="margin:0">ใช้แสดงชื่อคุณที่มุมซ้ายล่าง และกด “ติดประชุม” ให้ตัวเองได้เร็วขึ้น</p></section>`;
  const prof=me?`<section class="card"><div class="card-h"><h2>โปรไฟล์ของ ${esc(me.name)}</h2></div>
    <div class="prof"><div class="prof-big">${avatar(me,"xxl")}</div>
      <div class="prof-f"><div class="f"><label for="pf-name">ชื่อเล่น</label><input id="pf-name" class="inp" maxlength="40" value="${esc(me.name)}" ${S.readOnly?"readonly":""}></div>
      <div class="f"><label for="pf-role">ตำแหน่ง / ดูแลส่วนไหน</label><input id="pf-role" class="inp" maxlength="60" value="${esc(me.role||"")}" ${S.readOnly?"readonly":""}></div>
      ${lineEditor(me)}
      <div class="f"><label>สีประจำตัว</label><div class="swatches">${COLORS.map(c=>`<button class="sw" data-c="${c}" data-act="me-color" data-color="${c}" aria-pressed="${(me.color||"blue")===c}" aria-label="สี ${c}"></button>`).join("")}</div></div></div></div>
    <div class="f"><label>รูปโปรไฟล์ เลือกจากภาพวาด หรืออัปโหลดรูปของคุณเอง</label>${avatarPicker(me)}</div>
    <div class="f"><label>สติกเกอร์บอกสถานะ <span class="muted">แสดงข้างชื่อคุณในบอร์ด “ใครติดประชุม” และแดชบอร์ด</span></label><div class="mood-pick"><button class="mood-opt none${me.mood?"":" on"}" data-act="set-mood" data-sid="" aria-pressed="${!me.mood}">ไม่ใช้</button>${STICKER_SET.map(st=>`<button class="mood-opt${me.mood===st.id?" on":""}" data-act="set-mood" data-sid="${st.id}" aria-pressed="${me.mood===st.id}" title="${esc(st.label)}" aria-label="${esc(st.label)}">${stickerArt(st.id,56)}</button>`).join("")}</div></div></section>`:"";
  const data=`<section class="card"><div class="card-h"><h2>ข้อมูล</h2></div>
    <p class="muted" style="margin:0;max-width:62ch">${backend&&backend.local?"ตอนนี้ข้อมูลเก็บในเบราว์เซอร์นี้เท่านั้น ดาวน์โหลดไฟล์สำรองไว้ก่อนล้างเบราว์เซอร์ หรือย้ายไปเครื่องอื่น (รูปในหน้าไม่รวมอยู่ในไฟล์)":API.on?"ข้อมูลแชร์กับทุกคนในทีมแล้ว และเก็บไว้บนเซิร์ฟเวอร์":"ข้อมูลแชร์กับทุกคนในทีมแล้ว ดาวน์โหลดไฟล์สำรองเก็บไว้ได้"}</p>
    <div class="row">${API.on?(isAdmin()?`<button class="btn" data-act="go" data-h="people">${icon("download")}สำรองและกู้คืนข้อมูลทั้งทีม</button>`:`<span class="muted small-tx">ผู้ดูแลทีมเป็นคนสำรองข้อมูลของทุกคน</span>`):`<button class="btn" data-act="export">${icon("download")}ดาวน์โหลดไฟล์สำรอง (.json)</button><button class="btn w-only" data-act="import">${icon("upload")}นำเข้าไฟล์สำรอง</button>`}${[...S.members,...S.projects,...S.events,...S.pages].some(x=>x.example)?`<button class="btn ghost w-only" data-act="clear-examples">ลบข้อมูลตัวอย่าง</button>`:""}</div></section>`;
  if(API.on){const u=API.user,pr=u.prefs||{};
    const acct=`<section class="card" data-c="yellow"><div class="card-h"><h2>บัญชีของคุณ</h2></div><div class="card-b">
      <div class="acct">${avatar(me||{name:u.email},"lg")}<div><b>${esc(me?me.name:u.name)}</b><small>${esc(u.email)}</small></div><span class="tchip sm" data-c="${S.role==="guest"?"pink":S.role==="member"?"blue":"green"}">${esc(ROLE_LABEL[S.role]||S.role)}</span></div>
      <div class="row"><button class="btn" data-act="logout">${icon("x")}ออกจากระบบ</button>${isAdmin()?`<button class="btn ghost" data-act="go" data-h="people">${icon("users")}จัดการคนและสิทธิ์</button>`:""}</div></div></section>`;
    const tog=(k,l,d)=>`<label class="check-row"><input type="checkbox" data-pref="${k}" ${pr[k]!==false?"checked":""}><span><b>${l}</b> ${d}</span></label>`;
    const mail=`<section class="card" data-c="blue"><div class="card-h"><h2>แจ้งเตือนทางอีเมล</h2></div><div class="card-b">
      ${tog("mailStatus","สถานะโปรเจกต์เปลี่ยน","เมื่อมีคนเลื่อนสถานะงานที่คุณรับผิดชอบหรือสั่งไว้")}
      ${S.role==="guest"?"":tog("mailAssigned","มีงานมอบหมายให้","เมื่อมีคนตั้งคุณเป็นผู้รับผิดชอบ หรือคนนอกส่งงานมาให้")}
      ${tog("mailMention","มีคนแท็กถึงฉัน","เมื่อมีคนพิมพ์ @ชื่อคุณ ในคอมเมนต์ของหน้าเอกสารหรือโปรเจกต์")}
      ${tog("mailUpdates","อัปเดตในห้องงาน","เมื่อมีคนโพสต์อัปเดตหรือคอมเมนต์ในงานที่เกี่ยวกับคุณ")}
      ${tog("mailMeeting","เตือนก่อนประชุม","15 นาทีก่อนประชุมที่คุณถูกเชิญ")}
      <div class="f"><label for="pref-digest">สรุปงานทางอีเมล</label><select id="pref-digest" class="inp" data-pref="digest">${[["daily","ทุกวัน 8 โมงเช้า"],["weekly","ทุกวันจันทร์ 8 โมงเช้า"],["both","ทั้งรายวันและรายสัปดาห์"],["off","ไม่ต้องส่ง"]].map(([v,l])=>`<option value="${v}"${(pr.digest||"daily")===v?" selected":""}>${l}</option>`).join("")}</select></div>
      <p class="muted small-tx" style="margin:0">แจ้งเตือนในแอปยังแสดงที่กระดิ่งเสมอ</p></div></section>`;
    return pageHead("ตั้งค่า","บัญชี การแจ้งเตือน ธีม และโปรไฟล์",null,"teal","bulb")+`<div class="pref-grid">${acct}${mail}</div>${theme}${prof}${isAdmin()?data:""}`}
  return pageHead("ตั้งค่า","ธีม โปรไฟล์ และไฟล์สำรอง",null,"teal","bulb")+`<div class="pref-grid">${theme}${who}</div>${prof}${data}`;
}
function avatarPicker(m){const cur=m.avatar||"";
  return `<div class="av-pick">${[...Array(AVATAR_COUNT)].map((_,i)=>`<button class="av-opt${cur==="a:"+i?" on":""}" data-act="pick-avatar" data-id="${esc(m.id)}" data-av="a:${i}" aria-pressed="${cur==="a:"+i}" aria-label="ภาพวาดแบบที่ ${i+1}" data-c="${esc(m.color||"blue")}"><span class="av lg drawn" data-c="${esc(m.color||"blue")}">${avatarSVG(i)}</span></button>`).join("")}
    <button class="av-opt up${cur.startsWith("data:")?" on":""}" data-act="upload-avatar" data-id="${esc(m.id)}" aria-pressed="${cur.startsWith("data:")}">${cur.startsWith("data:")?`<span class="av lg photo"><img src="${esc(cur)}" alt=""></span>`:`${icon("upload")}<small>อัปโหลด</small>`}</button>
    ${cur?`<button class="av-opt clear" data-act="pick-avatar" data-id="${esc(m.id)}" data-av="" aria-label="ใช้ตัวอักษรย่อแทนรูป"><span class="av lg" data-c="${esc(m.color||"blue")}">${esc(initial(m.name))}</span></button>`:""}</div>`}
function setMemberAvatar(id,av){const m=memberOf(id);if(!m||S.readOnly) return;m.avatar=av;patch("members",id,{avatar:av},0);render();
  if($("#mForm")){const box=$("#m-av");if(box) box.innerHTML=avatarPicker(m)}}
function uploadAvatar(id){const inp=document.createElement("input");inp.type="file";inp.accept="image/*";
  inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f) return;if(!f.type.startsWith("image/")){toast("เลือกได้เฉพาะไฟล์รูปภาพ");return}
    try{setMemberAvatar(id,await avatarDataUrl(f));toast("เปลี่ยนรูปโปรไฟล์แล้ว")}catch(e){toast("เปิดรูปนี้ไม่ได้ ลองไฟล์ JPG หรือ PNG")}};inp.click()}
async function exportData(){const data={app:"team-pulse",version:1,exportedAt:nowIso(),members:S.members,teams:S.teams.filter(t=>canSee(t.id)),projects:S.projects.filter(x=>canSee(x.teamId)),events:S.events.filter(x=>canSee(x.teamId)),pages:S.pages.filter(x=>canSee(x.teamId))};
  const name="team-pulse-"+toDateInput(new Date())+".json",text=JSON.stringify(data,null,2);
  if(window.claude&&typeof window.claude.use==="function"){const dl=await window.claude.use("downloads");
    if(!dl){toast("หน้านี้ดาวน์โหลดไฟล์ไม่ได้ ลองเปิดลิงก์ใน claude.ai");return}
    try{await dl.save({filename:name,data:text});toast("ดาวน์โหลดไฟล์สำรองแล้ว")}catch(e){if(e&&e.code!=="declined") toast("ดาวน์โหลดไม่สำเร็จ ลองอีกครั้ง")}return}
  const blob=new Blob([text],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);
  a.download="team-pulse-"+toDateInput(new Date())+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast("ดาวน์โหลดไฟล์สำรองแล้ว")}
function importData(){const inp=document.createElement("input");inp.type="file";inp.accept="application/json,.json";
  inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f) return;let d;try{d=JSON.parse(await f.text())}catch(e){toast("ไฟล์นี้ไม่ใช่ไฟล์สำรองของ Team Pulse");return}
    if(!d||d.app!=="team-pulse"){toast("ไฟล์นี้ไม่ใช่ไฟล์สำรองของ Team Pulse");return}
    let n=0;["members","teams","projects","events","pages"].forEach(c=>(d[c]||[]).forEach(row=>{if(!row||!row.id) return;const doc=Object.assign({},row);delete doc.id;
      const i=S[c].findIndex(x=>x.id===row.id);if(i>=0) S[c][i]=row;else S[c].push(row);put(c,row.id,doc);n++}));
    render();toast("นำเข้าแล้ว "+n+" รายการ")};inp.click()}

/* ---- projects ---- */
function projMatches(p){const q=S.projQ.trim().toLowerCase();if(S.projOwner&&p.ownerId!==S.projOwner) return false;
  if(!q) return true;return [p.title,p.where,p.notes,p.url,p.repo,(memberOf(p.ownerId)||{}).name].join(" ").toLowerCase().includes(q)}
/* gallery: every project as a picture card, three per row */
const GAL_FILTERS=[["all","ทั้งหมด"],["live","เสร็จแล้ว"],["active","กำลังทำ"],["idea","รอเริ่ม"]];
const projCover=p=>p.coverImg||((p.blocks||[]).find(b=>b.t==="image"&&b.src)||{}).src||"";
function viewGallery(){
  const f=S.galFilter||"all";
  const all=allLoaded()?vProjects():[];
  const pick=k=>k==="all"?all:k==="live"?all.filter(p=>p.status==="live"):k==="active"?all.filter(p=>["doing","review","stuck"].includes(p.status)):all.filter(p=>(p.status||"idea")==="idea");
  const head=pageHead("ผลงานทั้งหมด","ทุกโปรเจกต์ของทีม กดการ์ดเพื่อเปิดดูรายละเอียด",`<button class="btn primary w-only" data-act="new-project">${icon("plus")}โปรเจกต์ใหม่</button>`,"green","frame")
    +`<div class="chips gal-f" role="group" aria-label="กรองตามสถานะ">${GAL_FILTERS.map(([k,l])=>`<button class="chip plain" data-act="gal-filter" data-f="${k}" data-c="${k==="live"?"green":k==="active"?"blue":k==="idea"?"teal":"sand"}" aria-pressed="${f===k}">${esc(l)}<span class="n">${pick(k).length}</span></button>`).join("")}</div>`;
  if(!allLoaded()) return head+`<div class="empty"><h3>กำลังโหลดโปรเจกต์…</h3></div>`;
  const list=[...pick(f)].sort(byUpdated);
  if(!list.length) return head+`<div class="empty"><h3>${all.length?"ยังไม่มีโปรเจกต์ในกลุ่มนี้":"ยังไม่มีโปรเจกต์"}</h3>${all.length?"":`<button class="btn w-only" data-act="new-project">${icon("plus")}โปรเจกต์ใหม่</button>`}</div>`;
  return head+`<div class="gallery">${list.map(p=>{const st=statusOf(p.status),img=projCover(p),m=memberOf(p.ownerId);
    const art=(STATUS_STICKERS[p.status||"idea"]||["d23"])[0];
    return `<button class="gcard" data-act="open-project" data-id="${esc(p.id)}" data-c="${esc(p.cover||st.c)}">
      <span class="g-img${img?"":" art"}">${img?`<img data-src="${esc(img)}" alt="" loading="lazy">`:stickerArt(art,112)}</span>
      <span class="g-bd"><span class="pill soft g-st" data-c="${st.c}"><span class="d"></span><span class="tx">${esc(st.label)}</span></span><span class="g-tt">${esc(p.title||"ไม่มีชื่อ")}</span>
        ${p.statusNote||p.notes?`<span class="g-nt">${esc(p.statusNote||p.notes)}</span>`:""}
        <span class="g-ft">${m?`<span class="g-who">${avatar(m,"sm")}${esc(m.name)}</span>`:`<span class="muted">ยังไม่มีคนรับ</span>`}<span class="muted">${esc(ago(p.updatedAt))}</span></span></span>
    </button>`}).join("")}</div>`}
function viewProjects(){
  const head=pageHead("โปรเจกต์ทั้งหมด","ลากการ์ดข้ามคอลัมน์เพื่อเปลี่ยนสถานะ",`<div class="seg" role="group" aria-label="รูปแบบ"><button data-act="mode" data-mode="board" aria-pressed="${S.projMode==="board"}">${icon("board")}บอร์ด</button><button data-act="mode" data-mode="table" aria-pressed="${S.projMode==="table"}">${icon("list")}ตาราง</button></div>
    <button class="btn primary w-only" data-act="new-project">${icon("plus")}โปรเจกต์ใหม่</button>`,"blue","folder")+`
    <div class="filter"><label class="search-in">${icon("search")}<input id="projQ" placeholder="ค้นชื่อ, ที่รัน, โน้ต…" value="${esc(S.projQ)}" autocomplete="off" aria-label="ค้นหาโปรเจกต์"></label>
    <select id="projOwner" class="inp" style="width:auto"><option value="">ทุกคน</option>${S.members.map(m=>`<option value="${esc(m.id)}"${S.projOwner===m.id?" selected":""}>${esc(m.name)}</option>`).join("")}</select></div>`;
  if(!allLoaded()) return head+`<div class="empty"><h3>กำลังโหลดโปรเจกต์…</h3></div>`;
  const all=vProjects().filter(projMatches);
  if(S.projMode==="table"){const rows=[...all].sort(byUpdated);
    if(!rows.length) return head+`<div class="empty"><h3>${S.projects.length?"ไม่พบโปรเจกต์ที่ตรงกับตัวกรอง":"ยังไม่มีโปรเจกต์"}</h3><button class="btn w-only" data-act="new-project">+ โปรเจกต์ใหม่</button></div>`;
    return head+`<div class="table-scroll"><table><thead><tr><th>ชื่อ</th><th>สถานะ</th><th>คนรับผิดชอบ</th><th>รันอยู่ที่</th><th>ลิงก์</th><th>กำหนดส่ง</th><th>อัปเดต</th></tr></thead><tbody>${rows.map(p=>{const st=statusOf(p.status);
      return `<tr data-act="open-project" data-id="${esc(p.id)}"><td><span data-c="${esc(p.cover||st.c)}" style="display:flex;gap:8px;align-items:center;font-weight:500"><span class="sq"></span>${esc(p.title||"ไม่มีชื่อ")}</span></td><td><span class="pill soft" data-c="${st.c}"><span class="d"></span><span class="tx">${esc(st.label)}</span></span></td><td>${whoCell(p.ownerId)}</td><td>${whereTag(p.where)}</td><td>${p.url?`<a class="lnk" href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener">${esc(shortUrl(p.url))}</a>`:'<span class="muted">—</span>'}</td><td class="when">${p.due?esc(new Date(p.due+"T00:00").toLocaleDateString("th-TH",{day:"numeric",month:"short"})):"—"}</td><td class="when">${esc(ago(p.updatedAt))}</td></tr>`}).join("")}</tbody></table></div>`}
  return head+`<div class="board-scroll"><div class="board">${STATUSES.map(s=>{const items=all.filter(p=>(p.status||"idea")===s.key).sort(byUpdated);
    return `<div class="col" data-c="${s.c}" data-status="${s.key}"><div class="col-h"><span class="sq"></span>${esc(s.label)}<span class="n">${items.length}</span></div>
      ${items.map(p=>`<button class="pcard" draggable="${canEditT(p.teamId)}" data-act="open-project" data-id="${esc(p.id)}" data-c="${esc(p.cover||s.c)}"><span class="cv"></span><span class="bd">${p.teamId&&S.space==="all"?teamChip(p.teamId,true):""}<span class="tt">${esc(p.title||"ไม่มีชื่อ")}</span>${p.statusNote?`<span class="nt now">${icon("note")}${esc(p.statusNote)}</span>`:p.notes?`<span class="nt">${esc(p.notes)}</span>`:""}${p.where?whereTag(p.where):""}${p.ownerId?whoCell(p.ownerId):""}</span></button>`).join("")}
      <button class="add-in-col w-only" data-act="new-project" data-status="${s.key}">${icon("plus")}เพิ่ม</button></div>`}).join("")}</div></div>`;
}

/* ---- calendar ---- */
function viewCalendar(now){
  if(!S.weekStart) S.weekStart=startOfWeek(now);
  const ws=S.weekStart,days=[...Array(7)].map((_,i)=>{const d=new Date(ws);d.setDate(d.getDate()+i);return d});
  const label=days[0].toLocaleDateString("th-TH",{day:"numeric",month:"short"})+" – "+days[6].toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"numeric"});
  const head=pageHead("ปฏิทินประชุม",`${esc(label)} · คลิกช่องว่างเพื่อนัดประชุมเวลานั้น`,`<div class="seg"><button data-act="week" data-d="-1" aria-label="สัปดาห์ก่อน">${icon("chevron-left")}</button><button data-act="week" data-d="0">สัปดาห์นี้</button><button data-act="week" data-d="1" aria-label="สัปดาห์หน้า">${icon("chevron")}</button></div>
    <button class="btn primary w-only" data-act="new-event">${icon("plus")}นัดประชุม</button>`,"green","calendar");
  const hours=[];for(let h=H0;h<H1;h++) hours.push(h);
  const cols=days.map(d=>{const evs=vEvents().filter(e=>sameDay(new Date(e.start),d)).sort((a,b)=>new Date(a.start)-new Date(b.start));
    const lanes=[],laneOf={};evs.forEach(e=>{const s=new Date(e.start);let i=lanes.findIndex(end=>end<=s);if(i<0){i=lanes.length;lanes.push(0)}lanes[i]=new Date(e.end);laneOf[e.id]=i});
    const L=Math.max(1,lanes.length);
    const blocks=evs.map(e=>{const s=new Date(e.start),en=new Date(e.end);
      const sm=Math.max(s.getHours()*60+s.getMinutes(),H0*60),em=Math.min(sameDay(en,d)?en.getHours()*60+en.getMinutes():H1*60,H1*60);
      if(em<=H0*60||sm>=H1*60) return "";const top=(sm-H0*60)/60*HH,h=Math.max(22,(em-sm)/60*HH-2);
      const names=(e.memberIds||[]).map(memberOf).filter(Boolean).map(m=>m.name).join(", ");
      return `<button class="ev" data-act="edit-event" data-id="${esc(e.id)}" data-c="${evColor(e)}" style="top:${top}px;height:${h}px;left:calc(${laneOf[e.id]*100/L}% + 3px);width:calc(${100/L}% - 6px)" title="${esc((e.title||"")+" · "+names)}"><b>${e.pageId&&pageOf(e.pageId)?icon("note","ev-ic"):""}${esc(e.title||"ประชุม")}</b><small>${fmtTime(s)}–${fmtTime(en)}</small>${h>50&&names?`<div style="font-size:11px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(names)}</div>`:""}</button>`}).join("");
    const isToday=sameDay(d,now),nm=now.getHours()*60+now.getMinutes();
    const line=isToday&&nm>=H0*60&&nm<H1*60?`<div class="now-line" style="top:${(nm-H0*60)/60*HH}px"></div>`:"";
    return `<div class="cal-day${isToday?" today":""}" data-day="${toDateInput(d)}" style="height:${(H1-H0)*HH}px">${line}${blocks}</div>`});
  return head+`<div class="cal-scroll"><div class="cal" style="--hh:${HH}px"><div class="cal-dh" style="border-left:0"></div>${days.map(d=>`<div class="cal-dh${sameDay(d,now)?" today":""}">${esc(d.toLocaleDateString("th-TH",{weekday:"short"}))}<b>${d.getDate()}</b></div>`).join("")}
    <div class="cal-hours">${hours.map(h=>`<div>${pad(h)}:00</div>`).join("")}</div>${cols.join("")}</div></div>`;
}

/* ---- trash ---- */
function viewTrash(){const roots=S.pages.filter(p=>p.trashed&&p.trashRoot===p.id&&canSee(p.teamId)).sort(byUpdated);
  return pageHead("ถังขยะ","หน้าที่ลบจะอยู่ที่นี่จนกว่าจะลบถาวร",null,"orange","plant")+`
  <section class="card">${roots.length?`<div>${roots.map(p=>{const n=S.pages.filter(x=>x.trashRoot===p.id).length-1;
    return `<div class="trash-row"><span class="tr-ic">${pageIcon(p)}</span><span class="t">${esc(p.title||"ไม่มีชื่อ")}${n>0?` <span class="muted">+ หน้าย่อย ${n} หน้า</span>`:""}</span><span class="when">${esc(ago(p.updatedAt))}</span><span class="row w-only"><button class="btn small" data-act="restore" data-id="${esc(p.id)}">กู้คืน</button><button class="btn small danger" data-act="destroy" data-id="${esc(p.id)}" data-name="${esc(p.title||"ไม่มีชื่อ")}">ลบถาวร</button></span></div>`}).join("")}</div>`
    :`<div class="empty" style="padding:16px;border:0"><span>ถังขยะว่าง</span></div>`}</section>`}

/* ---- document page ---- */
function mountPage(id){
  const v=$("#view"),p=pageOf(id);
  if(!p){S.mounted=null;pageEditor=null;v.innerHTML=S.loaded.pages?`<div class="empty"><h3>ไม่พบหน้านี้</h3><span>อาจถูกลบถาวรไปแล้ว</span><button class="btn" data-act="go" data-h="home">กลับหน้าภาพรวม</button></div>`:`<div class="empty"><h3>กำลังเปิดหน้า…</h3></div>`;return}
  if(!canSee(p.teamId)){S.mounted=null;pageEditor=null;v.innerHTML=`<div class="empty">${sticker("heart",72)}<h3>หน้านี้อยู่ในทีมที่คุณไม่ได้อยู่</h3><span>ขอให้สมาชิกของทีมเพิ่มคุณเป็นสมาชิก หรือให้สิทธิ์ดูงาน</span><button class="btn" data-act="go" data-h="home">กลับหน้าภาพรวม</button></div>`;return}
  S.mounted="page:"+id;ancestors(p).forEach(a=>S.expanded.add(a.id));
  const ro=!canEditPage(p);
  v.innerHTML=`<div class="pg${p.wide?" wide":""}${ro?" ro":""}" id="pg">
    <div class="pg-top"><nav class="crumbs" id="pgCrumbs" aria-label="ตำแหน่งหน้า"></nav><div class="row" style="flex-wrap:nowrap;gap:2px"><span id="pgTeam"></span><span class="when" id="pgWhen" style="margin-right:6px"></span>
      <button class="icon-btn" data-act="fav" data-id="${esc(id)}" id="pgFav" aria-label="รายการโปรด">${icon("star")}</button><button class="icon-btn" data-act="page-menu" data-id="${esc(id)}" aria-label="ตัวเลือกหน้า">${icon("more")}</button></div></div>
    <div id="pgCover"></div>
    <div class="pg-body">
      <div id="pgIconWrap"></div>
      <div class="pg-add w-only" id="pgAdd"></div>
      <input id="pgTitle" class="doc-title" placeholder="ไม่มีชื่อ" autocomplete="off" ${ro?"readonly":""}>
      <div id="pgTpl"></div>
      <div id="pgEditor"></div>
      <div class="cmts" id="pgCmts" data-target="page:${esc(id)}"></div>
    </div></div>`;
  const t=$("#pgTitle");t.value=p.title||"";
  t.addEventListener("input",()=>{if(!canEditPage(pageOf(id))) return;const pp=pageOf(id);if(pp){pp.title=t.value;pp.updatedAt=nowIso()}patch("pages",id,{title:t.value,updatedAt:nowIso()});
    renderSide(new Date(),route());$("#topTitle").textContent=t.value||"ไม่มีชื่อ";updateCrumbs(id)});
  t.addEventListener("keydown",e=>{if(e.key==="Enter"||(e.key==="ArrowDown")){e.preventDefault();pageEditor&&pageEditor.focusFirst()}});
  pageEditor=new Editor($("#pgEditor"),{col:"pages",id,ro:()=>!canEditPage(pageOf(id)),teamId:()=>(pageOf(id)||{}).teamId||"",onChange:bl=>{const pp=pageOf(id);if(pp){pp.blocks=bl;pp.updatedAt=nowIso()}patch("pages",id,{blocks:bl,updatedAt:nowIso()},700);updateTpl(id)}});
  pageEditor.load(p.blocks);
  updatePage(id,true);
  if(!p.title&&blocksEmpty(p.blocks)&&!ro) setTimeout(()=>t.focus(),30);
}
function updateCrumbs(id){const p=pageOf(id);if(!p) return;const a=ancestors(p);
  $("#pgCrumbs").innerHTML=[...a,p].map((x,i)=>`${i?'<span class="sep" aria-hidden="true">/</span>':""}<button data-act="go-page" data-id="${esc(x.id)}">${x.icon?`<span>${esc(x.icon)}</span>`:""}<span class="t">${esc(x.title||"ไม่มีชื่อ")}</span></button>`).join("")}
function updateTpl(id){const p=pageOf(id),el=$("#pgTpl");if(!el||!p) return;const show=canEditPage(p)&&pageEditor&&blocksEmpty(pageEditor.blocks);
  el.innerHTML=show?`<div class="tpl"><span>เริ่มจากเทมเพลต หรือพิมพ์ / ในบรรทัดด้านล่างเพื่อเลือกบล็อก</span><div class="tpl-row">${TEMPLATES.map(([k,l,c,ic])=>`<button data-act="use-tpl" data-tpl="${k}" data-c="${c}">${icon(ic)}${esc(l)}</button>`).join("")}</div></div>`:""}
function updatePage(id,first){
  const p=pageOf(id);if(!p){if(S.loaded.pages) mountPage(id);return}
  if(p.trashed){$("#view").innerHTML=`<div class="empty"><h3>หน้านี้อยู่ในถังขยะ</h3><div class="row"><button class="btn" data-act="restore" data-id="${esc(p.trashRoot||p.id)}">กู้คืน</button><button class="btn" data-act="go" data-h="home">กลับหน้าภาพรวม</button></div></div>`;S.mounted=null;pageEditor=null;return}
  if(!canSee(p.teamId)){mountPage(id);return}
  const ro=!canEditPage(p);
  $("#pg").classList.toggle("wide",!!p.wide);$("#pg").classList.toggle("ro",ro);
  $("#pgTeam").innerHTML=shareChip(p);
  const tIn=$("#pgTitle");if(tIn) tIn.readOnly=ro;
  if(pageEditor&&pageEditor.host.classList.contains("ro")!==ro) pageEditor.render();
  const t=$("#pgTitle");if(document.activeElement!==t&&t.value!==(p.title||"")) t.value=p.title||"";
  $("#topTitle").textContent=p.title||"ไม่มีชื่อ";
  updateCrumbs(id);
  $("#pgWhen").textContent="แก้ไข "+ago(p.updatedAt);
  const fav=$("#pgFav");fav.setAttribute("aria-pressed",S.fav.has(id));
  $("#pgCover").innerHTML=p.cover?`<div class="pg-cover" data-c="${esc(p.cover)}">${ro?"":`<div class="cover-tools"><button data-act="cover-pick" data-id="${esc(id)}">เปลี่ยนสีปก</button><button data-act="cover-remove" data-id="${esc(id)}">ลบปก</button></div>`}</div>`:"";
  $("#pgIconWrap").innerHTML=p.icon?`<button class="pg-icon${p.cover?"":" nocover"}" data-act="icon-pick" data-id="${esc(id)}" aria-label="เปลี่ยนไอคอน" ${ro?"disabled":""}>${esc(p.icon)}</button>`:"";
  $("#pgAdd").innerHTML=ro?"":`${p.icon?"":`<button class="btn small ghost" data-act="icon-pick" data-id="${esc(id)}">${icon("sparkle")}เพิ่มไอคอน</button>`}${p.cover?"":`<button class="btn small ghost" data-act="cover-add" data-id="${esc(id)}">${icon("image")}เพิ่มปก</button>`}`;
  if(!first&&pageEditor&&pageEditor.opt.id===id) pageEditor.sync(p.blocks);
  updateTpl(id);
}

/* ================= project slide-over ================= */
function openProject(id){
  S.openProject=id;const p=S.projects.find(x=>x.id===id);
  $("#panelRoot").innerHTML=`<div class="scrim" data-act="close-panel"></div><div class="panel" role="dialog" aria-modal="true" aria-label="หน้าโปรเจกต์">
    <div class="cover" id="pCover"><img class="cv-img" id="pCoverImg" alt="" hidden><div class="cover-tools"><span id="pCoverBtns" class="w-only"></span><button data-act="close-panel">${icon("x")}ปิด</button></div><div class="swatches w-only" id="pSw"></div></div>
    <div class="doc">
      <input id="p-title" class="doc-title" placeholder="ชื่อโปรเจกต์" autocomplete="off">
      <div class="props">
        <label>สถานะ</label><div class="status-pick" id="pStatus"></div>
        <label for="p-snote">กำลังทำอะไรอยู่</label><input id="p-snote" class="field" maxlength="200" placeholder="เช่น กำลังทำหน้าจองเวลา รอไฟล์โลโก้ แล้วกด Enter" autocomplete="off">
        <label for="p-team" class="no-guest">ทีม</label><select id="p-team" class="field no-guest"></select>
        <label class="p-req-l" hidden>สั่งโดย</label><span id="p-req" class="p-req" hidden></span>
        <label for="p-owner">คนรับผิดชอบ</label><select id="p-owner" class="field"></select>
        <label for="p-where">รันอยู่ที่</label><input id="p-where" class="field mono" list="whereList" placeholder="เช่น Vercel, AWS EC2, Server ออฟฟิศ" autocomplete="off">
        <label for="p-url">ลิงก์ที่รัน</label><div class="row" style="flex-wrap:nowrap"><input id="p-url" class="field mono" placeholder="https://…" autocomplete="off"><a id="p-url-open" class="btn small" target="_blank" rel="noopener" hidden>เปิด</a></div>
        <label for="p-repo">Repo / ที่เก็บโค้ด</label><input id="p-repo" class="field mono" placeholder="github.com/team/repo" autocomplete="off">
        <label for="p-due">กำหนดส่ง</label><input id="p-due" class="field" type="date">
        <label class="admin-only">โชว์ในหน้าแรก</label><div class="admin-only show-pick"><button class="pill soft" data-c="green" data-act="showcase" id="p-show" aria-pressed="false"><span class="d"></span><span class="tx">ไม่โชว์</span></button><span class="muted small-tx">คนที่ยังไม่ได้ล็อกอินจะเห็นชื่อ รูปปก และลิงก์ของงานนี้</span></div>
        <label class="api-only">คนนอกที่ติดตาม</label><div class="api-only watch" id="pWatch"></div>
        <label>อัปเดตล่าสุด</label><span id="p-upd" class="muted" style="padding:6px 8px"></span>
      </div>
      <div class="sec-h">โน้ต / ค้างอะไรอยู่ <span class="muted" style="font-family:var(--font-body);font-size:12.5px;font-weight:400">พิมพ์ / เพื่อใส่ To-do, หัวข้อ, โค้ด</span></div>
      <div id="pEditor"></div>
      <div class="cmts" id="pCmts" data-target="project:${esc(id)}"></div>
      <div class="doc-foot w-only" id="p-foot"><span class="muted" style="font-size:12.5px">บันทึกอัตโนมัติ ทุกคนที่เห็นทีมนี้เห็นทันที</span><button class="btn danger" id="p-del">ลบโปรเจกต์</button></div>
    </div></div>`;
  const pro=()=>!canEditProject(S.projects.find(x=>x.id===id)||{});
  const bind=(sel,field,ev)=>$(sel).addEventListener(ev||"input",e=>{if(pro()) return;const v=e.target.value;const pp=S.projects.find(x=>x.id===id);if(pp){pp[field]=v;pp.updatedAt=nowIso()}
    patch("projects",id,{[field]:v,updatedAt:nowIso()});if(field==="url") fillUrlBtn(v)});
  bind("#p-title","title");bind("#p-where","where");bind("#p-url","url");bind("#p-repo","repo");bind("#p-owner","ownerId","change");bind("#p-due","due","change");bind("#p-team","teamId","change");
  // the status note notifies the requester and followers, so it saves once per edit (Enter / leaving the field)
  $("#p-snote").addEventListener("change",()=>saveStatusNote(id));
  $("#p-snote").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();e.target.blur()}});
  projEditor=new Editor($("#pEditor"),{col:"projects",id,ro:pro,onChange:bl=>{const pp=S.projects.find(x=>x.id===id);const notes=blocksPlain(bl).slice(0,400);if(pp){pp.blocks=bl;pp.notes=notes}
    patch("projects",id,{blocks:bl,notes,updatedAt:nowIso()},700)}});
  projEditor.load(p&&p.blocks?p.blocks:(p&&p.notes?String(p.notes).split("\n").map(l=>({id:bid(),t:"p",h:esc(l),i:0})):null));
  armDelete($("#p-del"),()=>"ยืนยันลบ “"+(((S.projects.find(x=>x.id===id))||{}).title||"โปรเจกต์นี้")+"”",()=>{remove("projects",id);S.projects=S.projects.filter(x=>x.id!==id);closePanel();render();toast("ลบโปรเจกต์แล้ว")});
  fillPanel(true);
  placeStickers();refreshComments();
}
function fillUrlBtn(v){const a=$("#p-url-open");if(!a) return;a.hidden=!v;if(v) a.href=safeUrl(v)}
function fillPanel(first){
  const p=S.projects.find(x=>x.id===S.openProject);
  if(!p){if(allLoaded()&&!pending["projects/"+S.openProject]) closePanel();return}
  if(!canSee(p.teamId)){closePanel();return}
  const ro=!canEditProject(p),stRO=ro||isGuest();
  const rq=p.requestedBy&&memberOf(p.requestedBy);$("#p-req").hidden=$(".p-req-l").hidden=!rq;if(rq) $("#p-req").innerHTML=whoCell(p.requestedBy)+`<span class="tchip sm" data-c="pink">คนนอก</span>`;
  document.querySelectorAll("#panelRoot .props input,#panelRoot .props select,#p-title").forEach(el=>{el.readOnly=ro;if(el.tagName==="SELECT") el.disabled=ro});
  $("#p-foot").hidden=ro||isGuest();$("#pSw").hidden=ro;  if(projEditor&&projEditor.host.classList.contains("ro")!==ro) projEditor.render();
  $("#p-snote").readOnly=stRO;
  const tm=$("#p-team");if(document.activeElement!==tm){tm.innerHTML=teamOptions(p.teamId||"")+(p.teamId&&!editTeams().some(t=>t.id===p.teamId)&&teamOf(p.teamId)?`<option value="${esc(p.teamId)}" selected>${esc(teamOf(p.teamId).name)}</option>`:"");tm.value=p.teamId||""}
  const st=statusOf(p.status),cover=p.cover||st.c;$("#pCover").dataset.c=cover;
  const ci=$("#pCoverImg");$("#pCover").classList.toggle("has-img",!!p.coverImg);if(p.coverImg){if(ci.dataset.src!==p.coverImg){ci.dataset.src=p.coverImg;urlFor(p.coverImg).then(u=>{if(u&&ci.dataset.src===p.coverImg){ci.src=u;ci.hidden=false}})}}else{ci.hidden=true;ci.removeAttribute("src");delete ci.dataset.src}
  $("#pCoverBtns").innerHTML=ro?"":`<button data-act="cover-img">${icon("image")}${p.coverImg?"เปลี่ยนรูปปก":"ใส่รูปปก"}</button>${p.coverImg?`<button data-act="cover-img-remove">เอารูปออก</button>`:""}`;
  $("#pSw").innerHTML=COLORS.map(c=>`<button class="sw" data-c="${c}" data-act="cover" data-color="${c}" aria-pressed="${c===cover}" aria-label="สี ${c}"></button>`).join("");
  $("#pStatus").innerHTML=STATUSES.map(s=>`<button class="pill soft" data-c="${s.c}" data-act="set-status" data-status="${s.key}" aria-pressed="${s.key===(p.status||"idea")}" ${stRO?"disabled":""}><span class="d"></span>${esc(s.label)}</button>`).join("");
  const set=(sel,v)=>{const el=$(sel);if(el&&document.activeElement!==el&&el.value!==(v||"")) el.value=v||""};
  const ow=$("#p-owner");if(document.activeElement!==ow){ow.innerHTML=`<option value="">— ยังไม่มีคนรับ —</option>`+S.members.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join("");ow.value=p.ownerId||""}
  set("#p-title",p.title);set("#p-snote",p.statusNote);set("#p-where",p.where);set("#p-url",p.url);set("#p-repo",p.repo);set("#p-due",p.due);
  fillUrlBtn($("#p-url").value);
  fillWatchers(p,ro);
  const sh=$("#p-show");if(sh){sh.setAttribute("aria-pressed",!!p.showcase);sh.querySelector(".tx").textContent=p.showcase?"โชว์อยู่":"ไม่โชว์";sh.disabled=!isAdmin()}
  $("#p-upd").textContent=p.updatedAt?ago(p.updatedAt)+" · "+new Date(p.updatedAt).toLocaleString("th-TH",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"—";
  if(!first&&projEditor&&p.blocks) projEditor.sync(p.blocks);
  if(first&&!p.title) setTimeout(()=>$("#p-title")&&$("#p-title").focus(),60);
}
function saveStatusNote(id){const el=$("#p-snote"),p=S.projects.find(x=>x.id===id);if(!el||!p||el.readOnly||!canEditProject(p)) return;
  const v=el.value.trim();if(v===(p.statusNote||"")) return;
  p.statusNote=v;p.updatedAt=nowIso();patch("projects",id,{statusNote:v,updatedAt:p.updatedAt},0);
  const n=new Set([p.requestedBy,...(p.guestIds||[])].filter(x=>x&&x!==S.me)).size;
  toast(v&&n&&API.on?`บันทึกแล้ว ส่งอัปเดตให้ ${n} คนที่ติดตามงานนี้`:"บันทึกแล้ว")}
function closePanel(){if(S.openProject){saveStatusNote(S.openProject);flush("projects",S.openProject)}S.openProject=null;projEditor=null;$("#panelRoot").innerHTML=""}
function newProject(status){const id=newId(),t=nowIso();
  const p={title:"",status:status||"idea",ownerId:"",where:"",url:"",repo:"",due:"",notes:"",teamId:spaceTeam(),blocks:serBlocks(normBlocks()),cover:"",createdAt:t,updatedAt:t};
  S.projects.push(Object.assign({id},p));put("projects",id,p);openProject(id)}

/* ================= modals ================= */
function closeModal(){$("#modalRoot").innerHTML=""}
function memberChips(sel){return S.members.map(m=>`<button type="button" class="chip" data-c="${esc(m.color||"blue")}" data-act="toggle-chip" data-id="${esc(m.id)}" aria-pressed="${sel.includes(m.id)}">${avatar(m,"sm")}${esc(m.name)}</button>`).join("")||`<span class="muted">ยังไม่มีคนในทีม เพิ่มได้ที่แถบซ้าย</span>`}
function armDelete(btn,textFn,fn){let t=null;const orig=btn.textContent;
  btn.addEventListener("click",()=>{if(!t){btn.classList.add("armed");btn.textContent=typeof textFn==="function"?textFn():textFn;t=setTimeout(()=>{t=null;btn.classList.remove("armed");btn.textContent=orig},4000);return}clearTimeout(t);fn()})}
function openEventModal(ev,preset){
  const now=new Date();let s,e;
  if(ev){s=new Date(ev.start);e=new Date(ev.end)}else if(preset){s=preset;e=new Date(+s+3600000)}else{s=new Date(now);s.setMinutes(s.getMinutes()<30?30:60,0,0);e=new Date(+s+3600000)}
  const sel=ev?(ev.memberIds||[]):(S.me&&meMember()?[S.me]:[]);const notes=ev&&ev.pageId&&pageOf(ev.pageId)&&!pageOf(ev.pageId).trashed;
  const tid=ev?ev.teamId||"":spaceTeam(),ro=!canEditT(tid);
  $("#modalRoot").innerHTML=`<div class="modal-wrap" data-act="modal-bg"><form class="modal${ro?" ro":""}" id="evForm" role="dialog" aria-modal="true" aria-label="นัดประชุม">
    <div class="m-head"><span class="t-prev" data-c="green">${sticker("calendar",56)}</span><div><h2>${ro?"รายละเอียดประชุม":ev?"แก้ไขประชุม":"นัดประชุม"}</h2>${ro?`<p class="muted small-tx" style="margin:2px 0 0">คุณดูประชุมของทีมนี้ได้อย่างเดียว</p>`:""}</div></div>
    <div class="f"><label for="e-team">ทีม</label><select id="e-team" class="inp" ${ro?"disabled":""}>${teamOptions(tid)}${tid&&!editTeams().some(t=>t.id===tid)&&teamOf(tid)?`<option value="${esc(tid)}" selected>${esc(teamOf(tid).name)}</option>`:""}</select></div>
    <div class="f"><label for="e-title">หัวข้อ</label><input id="e-title" class="inp" required placeholder="เช่น Sprint review, คุยลูกค้า" value="${esc(ev?ev.title:"")}"></div>
    <div class="f3"><div class="f"><label for="e-date">วันที่</label><input id="e-date" type="date" class="inp" required value="${toDateInput(s)}"></div>
      <div class="f"><label for="e-start">เริ่ม</label><input id="e-start" type="time" class="inp" required value="${toTimeInput(s)}"></div>
      <div class="f"><label for="e-end">ถึง</label><input id="e-end" type="time" class="inp" required value="${toTimeInput(e)}"></div></div>
    <div class="f"><label>ใครเข้าประชุม</label><div class="chips" id="e-mem">${memberChips(sel)}</div></div>
    <div class="f"><label for="e-place">ห้อง / ลิงก์ประชุม</label><input id="e-place" class="inp" placeholder="ห้องประชุม 2, Google Meet" value="${esc(ev?ev.place||"":"")}"></div>
    ${ev?`<button type="button" class="btn" data-act="meeting-notes" data-id="${esc(ev.id)}" style="align-self:flex-start">${icon("note")}${notes?"เปิดบันทึกประชุม":"เขียนบันทึกประชุม"}</button>`:""}
    <p id="e-err" style="margin:0;color:var(--pink)" hidden></p>
    <div class="modal-foot">${ev&&!ro?`<button type="button" class="btn danger" id="e-del">ลบประชุมนี้</button>`:"<span></span>"}<div class="row"><button type="button" class="btn" data-act="close-modal">${ro?"ปิด":"ยกเลิก"}</button>${ro?"":`<button class="btn primary">${ev?"บันทึก":"เพิ่มลงปฏิทิน"}</button>`}</div></div>
  </form></div>`;
  if(ro){$("#evForm").querySelectorAll("input").forEach(i=>i.readOnly=true);$("#e-mem").querySelectorAll(".chip").forEach(c=>c.disabled=true)}
  else $("#e-title").focus();
  $("#evForm").addEventListener("submit",x=>{x.preventDefault();if(ro) return;
    const d=$("#e-date").value,st=new Date(d+"T"+$("#e-start").value),en=new Date(d+"T"+$("#e-end").value);
    if(!(en>st)){const er=$("#e-err");er.hidden=false;er.textContent="เวลาจบต้องหลังเวลาเริ่ม แก้เวลาแล้วกดบันทึกอีกครั้ง";return}
    const memberIds=[...document.querySelectorAll("#e-mem .chip[aria-pressed='true']")].map(b=>b.dataset.id);
    const body={title:$("#e-title").value.trim()||"ประชุม",start:st.toISOString(),end:en.toISOString(),memberIds,place:$("#e-place").value.trim(),teamId:$("#e-team").value||""};
    if(ev){const k=Object.assign({},ev);delete k.id;Object.assign(k,body);Object.assign(ev,body);put("events",ev.id,k)}else{const id=newId();const doc=Object.assign(body,{createdAt:nowIso()});S.events.push(Object.assign({id},doc));put("events",id,doc)}
    closeModal();render();toast(ev?"บันทึกแล้ว":"เพิ่มประชุมลงปฏิทินแล้ว")});
  if(ev) armDelete($("#e-del"),"ยืนยันลบ “"+(ev.title||"ประชุม")+"”",()=>{remove("events",ev.id);S.events=S.events.filter(x=>x.id!==ev.id);closeModal();render();toast("ลบประชุมแล้ว")});
}
function meetingNotes(evId){const ev=S.events.find(x=>x.id===evId);if(!ev) return;closeModal();
  const ex=ev.pageId&&pageOf(ev.pageId);if(ex&&!ex.trashed){go("page-"+ex.id);return}
  if(S.readOnly){toast("ยังไม่มีบันทึกของประชุมนี้");return}
  const d=new Date(ev.start);const people=(ev.memberIds||[]).map(memberOf).filter(Boolean).map(m=>m.name).join(", ");
  const T=tpl("meeting",{title:(ev.title||"ประชุม")+" · "+d.toLocaleDateString("th-TH",{day:"numeric",month:"short"}),date:fmtDayLong(d)+" "+fmtTime(d)+"–"+fmtTime(new Date(ev.end)),people});
  if(!canEditT(ev.teamId)){toast("ยังไม่มีบันทึกของประชุมนี้");return}
  const pid=createPage({title:T.title,icon:T.icon,blocks:T.blocks,navigate:false,teamId:ev.teamId||""});ev.pageId=pid;patch("events",ev.id,{pageId:pid},0);go("page-"+pid)}
function openMemberModal(m,opts){
  opts=opts||{};
  let color=m?m.color||"blue":COLORS[S.members.length%COLORS.length];
  let av=m?m.avatar||"":"a:"+(S.members.length%AVATAR_COUNT);
  const draft=()=>({id:"draft",name:$("#m-name")?$("#m-name").value||"?":(m?m.name:"?"),color,avatar:av});
  const pickHTML=()=>`<div class="av-pick compact">${[...Array(AVATAR_COUNT)].map((_,i)=>`<button type="button" class="av-opt${av==="a:"+i?" on":""}" data-av="a:${i}" aria-pressed="${av==="a:"+i}" aria-label="ภาพวาดแบบที่ ${i+1}"><span class="av md drawn" data-c="${color}">${avatarSVG(i)}</span></button>`).join("")}
    <button type="button" class="av-opt up${av.startsWith("data:")?" on":""}" data-up="1" aria-pressed="${av.startsWith("data:")}" aria-label="อัปโหลดรูปของตัวเอง">${av.startsWith("data:")?`<span class="av md photo"><img src="${esc(av)}" alt=""></span>`:`${icon("upload")}<small>อัปโหลด</small>`}</button></div>`;
  $("#modalRoot").innerHTML=`<div class="modal-wrap" data-act="modal-bg"><form class="modal wide" id="mForm" role="dialog" aria-modal="true" aria-label="คนในทีม">
    <div class="m-head"><span id="m-prev">${avatar(draft(),"xl")}</span><div><h2>${m?"แก้ไขข้อมูล":"เพิ่มคนในทีม"}</h2><p class="muted small-tx" style="margin:2px 0 0">ชื่อ สี และรูปจะแสดงทุกที่ในแอป</p></div></div>
    <div class="f2"><div class="f"><label for="m-name">ชื่อเล่น</label><input id="m-name" class="inp" required maxlength="40" value="${esc(m?m.name:"")}" placeholder="เช่น มิ้นท์"></div>
    <div class="f"><label for="m-role">ตำแหน่ง / ดูแลส่วนไหน</label><input id="m-role" class="inp" maxlength="60" value="${esc(m?m.role||"":"")}" placeholder="เช่น Backend, Design"></div></div>
    <div class="f"><label for="m-line">ช่องทาง Line <span class="muted">ไม่บังคับ · รูป QR อัปโหลดได้ที่หน้าตั้งค่าของเจ้าของโปรไฟล์</span></label><div class="row nowrap"><select id="m-line-mode" class="inp" style="width:auto" aria-label="รูปแบบช่องทาง Line">${LINE_MODES.filter(x=>x[0]!=="qr"||(m&&m.lineQr)).map(([k,l])=>`<option value="${k}"${((m&&m.lineMode)||"id")===k?" selected":""}>${esc(l)}</option>`).join("")}</select><input id="m-line" class="inp" maxlength="40" value="${esc(m?m.line||"":"")}" placeholder="@line หรือเบอร์โทร"></div></div>
    <div class="f"><label>สีประจำตัว</label><div class="swatches" id="m-sw">${COLORS.map(c=>`<button type="button" class="sw" data-c="${c}" data-color="${c}" aria-pressed="${c===color}" aria-label="สี ${c}"></button>`).join("")}</div></div>
    <div class="f"><label>รูปโปรไฟล์</label><div id="m-av">${pickHTML()}</div></div>
    ${!API.on&&(isAdmin()||!S.members.some(x=>x.admin))?`<label class="check-row"><input type="checkbox" id="m-admin" ${m&&m.admin?"checked":""}><span><b>ผู้ดูแล</b> เห็นงานของทุกทีมย่อย และแก้ไขได้ทั้งหมด</span></label>`:""}
    ${opts.me?`<p class="muted small-tx" style="margin:0">บันทึกแล้วจะตั้งเป็น “ฉัน” ในเบราว์เซอร์นี้</p>`:""}
    <div class="modal-foot">${m&&!API.on?`<button type="button" class="btn danger w-only" id="m-del">${icon("trash")}ลบออกจากทีม</button>`:"<span></span>"}<div class="row"><button type="button" class="btn" data-act="close-modal">ยกเลิก</button><button class="btn primary w-only">${m?"บันทึก":"เพิ่ม"}</button></div></div>
  </form></div>`;
  const refresh=()=>{$("#m-av").innerHTML=pickHTML();$("#m-prev").innerHTML=avatar(draft(),"xl")};
  $("#m-name").focus();
  $("#m-name").addEventListener("input",()=>{$("#m-prev").innerHTML=avatar(draft(),"xl")});
  $("#m-sw").addEventListener("click",e=>{const b=e.target.closest(".sw");if(!b) return;color=b.dataset.color;$("#m-sw").querySelectorAll(".sw").forEach(x=>x.setAttribute("aria-pressed",x===b));refresh()});
  $("#m-av").addEventListener("click",e=>{const b=e.target.closest(".av-opt");if(!b) return;
    if(b.dataset.up){const inp=document.createElement("input");inp.type="file";inp.accept="image/*";
      inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f) return;try{av=await avatarDataUrl(f);refresh()}catch(x){toast("เปิดรูปนี้ไม่ได้ ลองไฟล์ JPG หรือ PNG")}};inp.click();return}
    av=b.dataset.av;refresh()});
  $("#mForm").addEventListener("submit",x=>{x.preventDefault();if(S.readOnly) return;const body={name:$("#m-name").value.trim()||"ไม่มีชื่อ",role:$("#m-role").value.trim(),line:$("#m-line").value.trim(),lineMode:$("#m-line-mode").value,color,avatar:av};
    const ad=$("#m-admin");if(ad) body.admin=ad.checked;
    let id;if(m){id=m.id;const k=Object.assign({},m);delete k.id;Object.assign(k,body);Object.assign(m,body);put("members",m.id,k)}
    else{id=newId();const doc=Object.assign(body,{busyUntil:"",busyNote:""});S.members.push(Object.assign({id},doc));put("members",id,doc)}
    if(opts.me){S.me=id;saveLocal("team-pulse-me",id);if(S.uid){const mm=memberOf(id);mm.uid=S.uid;patch("members",id,{uid:S.uid},0)}}
    closeModal();render();toast(m?"บันทึกแล้ว":"เพิ่ม "+body.name+" แล้ว")});
  if(m&&$("#m-del")) armDelete($("#m-del"),"ยืนยันลบ “"+m.name+"”",()=>{remove("members",m.id);S.members=S.members.filter(x=>x.id!==m.id);if(S.me===m.id){S.me="";saveLocal("team-pulse-me","")}closeModal();render();toast("ลบ "+m.name+" ออกจากทีมแล้ว")});
}
function openQuickMeeting(){
  if(!S.members.length){openMemberModal();return}
  $("#modalRoot").innerHTML=`<div class="modal-wrap" data-act="modal-bg"><form class="modal" id="qForm" role="dialog" aria-modal="true" aria-label="ติดประชุมอยู่">
    <h2>ใครติดประชุมอยู่ตอนนี้</h2>
    <div class="f"><label>เลือกคน</label><div class="chips" id="q-mem">${memberChips(S.me&&meMember()?[S.me]:[])}</div></div>
    <div class="f"><label for="q-note">ประชุมเรื่องอะไร</label><input id="q-note" class="inp" placeholder="ไม่ใส่ก็ได้" maxlength="60"></div>
    <div class="f"><label>นานแค่ไหน</label><div class="chips" id="q-dur">${[15,30,45,60,90,120].map(n=>`<button type="button" class="chip" data-c="pink" data-min="${n}" aria-pressed="${n===30}" style="padding-left:10px">${n<60?n+" นาที":(n/60)+" ชม."}</button>`).join("")}</div></div>
    <div class="modal-foot"><span></span><div class="row"><button type="button" class="btn" data-act="close-modal">ยกเลิก</button><button class="btn primary">ตั้งสถานะ</button></div></div></form></div>`;
  $("#q-dur").addEventListener("click",e=>{const b=e.target.closest(".chip");if(!b) return;$("#q-dur").querySelectorAll(".chip").forEach(x=>x.setAttribute("aria-pressed",x===b))});
  $("#qForm").addEventListener("submit",x=>{x.preventDefault();const ids=[...document.querySelectorAll("#q-mem .chip[aria-pressed='true']")].map(b=>b.dataset.id);
    if(!ids.length){toast("เลือกอย่างน้อยหนึ่งคน");return}const min=+(document.querySelector("#q-dur .chip[aria-pressed='true']")||{dataset:{min:30}}).dataset.min;
    ids.forEach(id=>setBusy(id,min,$("#q-note").value.trim()));closeModal()});
}
function setBusy(id,min,note){const until=new Date(Date.now()+min*60000).toISOString();const m=memberOf(id);if(m){m.busyUntil=until;m.busyNote=note||""}
  patch("members",id,{busyUntil:until,busyNote:note||""},0);render();toast((m?m.name:"")+" ติดประชุมถึง "+fmtTime(new Date(until)))}

/* search */
function openSearch(){closeNav();
  $("#modalRoot").innerHTML=`<div class="modal-wrap top instant" data-act="modal-bg"><div class="modal search" role="dialog" aria-modal="true" aria-label="ค้นหา"><label class="s-in">${icon("search")}<input id="sQ" placeholder="ค้นหาหน้า โปรเจกต์ ประชุม หรือคนในทีม…" autocomplete="off" aria-label="ค้นหา"><span class="kbd">Esc</span></label><div class="s-res" id="sRes"></div></div></div>`;
  let sel=0,res=[];const q=$("#sQ");
  const draw=()=>{const s=q.value.trim().toLowerCase();res=[];
    livePages().filter(p=>canSee(p.teamId)).forEach(p=>{const body=blocksPlain(p.blocks);const hit=!s||(p.title||"").toLowerCase().includes(s)||body.toLowerCase().includes(s);
      if(hit){let snip="";if(s&&body.toLowerCase().includes(s)){const i=body.toLowerCase().indexOf(s);snip=body.slice(Math.max(0,i-20),i+60).replace(/\n/g," ")}
        else snip=ancestors(p).map(a=>a.title||"ไม่มีชื่อ").join(" / ");res.push({k:"หน้า",ic:pageIcon(p),t:p.title||"ไม่มีชื่อ",sub:snip,u:p.updatedAt,fn:()=>go("page-"+p.id)})}});
    S.projects.filter(p=>canSee(p.teamId)).forEach(p=>{if(!s||[p.title,p.where,p.notes,p.url].join(" ").toLowerCase().includes(s)) res.push({k:"โปรเจกต์",ic:icon("board"),t:p.title||"ไม่มีชื่อ",sub:[statusOf(p.status).label,p.where].filter(Boolean).join(" · "),u:p.updatedAt,fn:()=>openProject(p.id)})});
    S.events.filter(e=>canSee(e.teamId)).forEach(e=>{if(s&&[e.title,e.place].join(" ").toLowerCase().includes(s)){const d=new Date(e.start);res.push({k:"ประชุม",ic:icon("calendar"),t:e.title||"ประชุม",sub:fmtDayLong(d)+" "+fmtTime(d),u:e.start,fn:()=>{S.weekStart=startOfWeek(d);go("calendar");setTimeout(()=>openEventModal(e),30)}})}});
    S.members.forEach(m=>{if(s&&[m.name,m.role].join(" ").toLowerCase().includes(s)) res.push({k:"คนในทีม",ic:avatar(m,"xs"),t:m.name,sub:m.role||"",fn:()=>openMemberModal(m)})});
    if(!s) res.sort((a,b)=>String(b.u||"").localeCompare(String(a.u||"")));res=res.slice(0,40);if(sel>=res.length) sel=0;
    $("#sRes").innerHTML=res.length?(s?"":`<div class="m-h">ล่าสุด</div>`)+res.map((r,i)=>`<button class="s-it${i===sel?" on":""}" data-si="${i}"><span class="ic">${r.ic}</span><span class="tx"><b>${esc(r.t)}</b>${r.sub?`<small>${esc(r.sub)}</small>`:""}</span><span class="s-kind">${esc(r.k)}</span></button>`).join("")
      :`<div class="s-empty">ไม่พบ “${esc(q.value)}” ลองคำอื่น หรือ${S.readOnly?"":` <button class="btn small" data-act="search-new">สร้างหน้า “${esc(q.value)}”</button>`}</div>`;
    const on=$("#sRes .on");if(on) on.scrollIntoView({block:"nearest"})};
  const pick=i=>{const r=res[i];if(!r) return;closeModal();r.fn()};
  q.addEventListener("input",()=>{sel=0;draw()});
  q.addEventListener("keydown",e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(res.length){sel=(sel+(e.key==="ArrowDown"?1:-1)+res.length)%res.length;draw()}}else if(e.key==="Enter"){e.preventDefault();pick(sel)}});
  $("#sRes").addEventListener("click",e=>{const b=e.target.closest("[data-si]");if(b) pick(+b.dataset.si);else if(e.target.closest('[data-act="search-new"]')){const t=q.value.trim();closeModal();createPage({title:t})}});
  draw();q.focus()}

/* ================= examples (user-triggered) ================= */
function seedExamples(){
  const now=new Date(),at=(off,h,m)=>{const d=new Date(now);d.setDate(d.getDate()+off);d.setHours(h,m,0,0);return d.toISOString()};
  const t=nowIso(),me=newId(),boss=newId(),in1=newId(),in2=newId(),tBoss=newId(),tIntern=newId();
  [[me,"ฉัน (ตัวอย่าง)","Tech lead","yellow",4],[boss,"หัวหน้า (ตัวอย่าง)","Head of Product","blue",7],[in1,"ต้น (ฝึกงาน, ตัวอย่าง)","Frontend intern","green",8],[in2,"แพร (ฝึกงาน, ตัวอย่าง)","Design intern","pink",14]]
    .forEach(([id,name,role,color,n])=>{const d={name,role,color,avatar:"a:"+n,busyUntil:"",busyNote:"",example:true};S.members.push(Object.assign({id},d));put("members",id,d)});
  [[tBoss,"ฉันกับหัวหน้า","blue","books",[me,boss],[]],[tIntern,"ฉันกับเด็กฝึกงาน","green","plant",[me,in1,in2],[boss]]]
    .forEach(([id,name,color,stk,memberIds,viewerIds],i)=>{const d={name,color,sticker:stk,memberIds,viewerIds,order:Date.now()+i,createdAt:t,example:true};S.teams.push(Object.assign({id},d));put("teams",id,d)});
  if(!S.me){S.me=me;saveLocal("team-pulse-me",me);if(S.uid){S.members.find(x=>x.id===me).uid=S.uid;patch("members",me,{uid:S.uid},0)}}
  [["เว็บจองคิว v2","doing",me,"Vercel","https://example.com","ทำหน้า checkout เหลือเชื่อม API ชำระเงิน",""],
   ["API ชำระเงิน","stuck",me,"AWS ECS · ap-southeast-1","","รอ key production จากธนาคาร ส่งเมลตามไปแล้ว",tBoss],
   ["แผนไตรมาสหน้า","review",boss,"","","รอหัวหน้าเคาะงบกับลำดับงาน",tBoss],
   ["หน้า Landing ใหม่","doing",in1,"Netlify (preview)","https://example.org","ต้นทำหน้า hero เสร็จ เหลือ responsive",tIntern],
   ["ชุดไอคอนแอป","idea",in2,"","","แพรรวบรวมไอเดียสไตล์ไอคอน",tIntern],
   ["บอท LINE แจ้งเตือน","live",me,"Render","https://example.net","รันปกติ cron ทุก 9 โมง",""]].forEach(([title,status,ownerId,where,url,notes,teamId])=>{const id=newId();
    const d={title,status,ownerId,where,url,repo:"",due:"",notes,teamId,blocks:[{id:bid(),t:"p",h:esc(notes),i:0},{id:bid(),t:"todo",h:"ขั้นตอนถัดไป",i:0}],cover:"",createdAt:t,updatedAt:t,example:true};S.projects.push(Object.assign({id},d));put("projects",id,d)});
  const st=new Date(now-15*60000),en=new Date(+now+30*60000);
  [{title:"คุยแผนไตรมาสกับหัวหน้า",start:st.toISOString(),end:en.toISOString(),memberIds:[me,boss],place:"ห้องประชุม 2",teamId:tBoss},
   {title:"รีวิวงานเด็กฝึกงาน",start:at(0,16,0),end:at(0,17,0),memberIds:[me,in1,in2],place:"Google Meet",teamId:tIntern},
   {title:"Daily standup",start:at(1,10,0),end:at(1,10,15),memberIds:[me,boss,in1,in2],place:"",teamId:""}].forEach(ev=>{const id=newId();ev.example=true;S.events.push(Object.assign({id},ev));put("events",id,ev)});
  const B=(t,h,i,x)=>Object.assign({id:bid(),t,h:h||"",i:i||0},x||{});
  const home=createPage({title:"คู่มือทีม (ตัวอย่าง)",icon:"🏠",cover:"teal",teamId:"",example:true,navigate:false,blocks:[
    B("callout","หน้านี้เป็น<b>ตัวอย่าง</b> อยู่ใน “ทั้งองค์กร” ทุกคนเห็น พิมพ์ <code>/</code> เพื่อเลือกบล็อก แนบไฟล์ หรือใส่รูป",0,{col:"yellow"}),
    B("h2","เริ่มงานวันแรก"),B("todo","ขอสิทธิ์ GitHub กับ Vercel",0,{c:true}),B("todo","อ่านเอกสารโปรเจกต์ที่ตัวเองดูแล"),B("todo","ตั้งเครื่อง local ตามคำสั่งด้านล่าง"),
    B("code","git clone git@github.com:team/app.git\nnpm install\nnpm run dev"),
    B("toggle","กติกาการ deploy (กดลูกศรเพื่อเปิด)"),B("ol","ให้เพื่อนรีวิว PR ก่อน merge",1),B("ol","deploy ขึ้น staging ก่อนเสมอ",1),
    B("divider"),B("quote","ติดอะไรถามในทีมได้เลย ไม่มีคำถามไหนโง่")]});
  createPage({title:"งานของเด็กฝึกงาน (ตัวอย่าง)",icon:"🌱",cover:"green",teamId:tIntern,example:true,navigate:false,blocks:[
    B("callout","หน้านี้อยู่ในทีม <b>ฉันกับเด็กฝึกงาน</b> หัวหน้าเปิดดูได้ แต่แก้ไม่ได้",0,{col:"green"}),
    B("h2","สัปดาห์นี้"),B("todo","ต้น: ทำหน้า Landing ให้รองรับมือถือ"),B("todo","แพร: ส่งไอคอน 3 แบบให้เลือก"),B("h2","ไฟล์ที่เกี่ยวข้อง"),B("file","")]});
  createPage({title:"แผนไตรมาส (ตัวอย่าง)",icon:"📚",cover:"blue",teamId:tBoss,example:true,navigate:false,blocks:[
    B("callout","หน้านี้อยู่ในทีม <b>ฉันกับหัวหน้า</b> เด็กฝึกงานจะไม่เห็นหน้านี้",0,{col:"blue"}),B("h2","เป้าหมาย"),B("ul","ปิดงาน API ชำระเงิน"),B("ul","รับเด็กฝึกงานเพิ่ม 1 คน")]});
  toast("ใส่ข้อมูลตัวอย่างแล้ว ลองเปลี่ยนตัวเองเป็นเด็กฝึกงานในหน้าตั้งค่า แล้วดูว่าเห็นอะไรบ้าง");go("page-"+home)}
function clearExamples(){["members","teams","projects","events","pages"].forEach(c=>{S[c].filter(x=>x.example).forEach(x=>remove(c,x.id));S[c]=S[c].filter(x=>!x.example)});render();toast("ลบข้อมูลตัวอย่างแล้ว")}

/* ================= global events ================= */
function closeNav(){document.body.classList.remove("nav-open");$("#navScrimRoot").innerHTML=""}
document.addEventListener("mousedown",e=>{if(!$("#menu").hidden&&!e.target.closest("#menu")) closeMenu();if(Slash.isOpen()&&!e.target.closest("#slash")) Slash.close()});
document.addEventListener("click",e=>{
  const el=e.target.closest("[data-act]");
  if(!el){const day=e.target.closest(".cal-day");if(day&&!S.readOnly){const r=day.getBoundingClientRect();const mins=Math.floor(((e.clientY-r.top)/HH*60)/30)*30+H0*60;
      const d=new Date(day.dataset.day+"T00:00");d.setMinutes(mins);openEventModal(null,d)}return}
  const act=el.dataset.act,id=el.dataset.id;
  switch(act){
    case "go":closeNav();go(el.dataset.h);break;
    case "go-page":closeNav();go("page-"+id);break;
    case "nav-open":document.body.classList.add("nav-open");$("#navScrimRoot").innerHTML=`<div class="nav-scrim" data-act="nav-close"></div>`;break;
    case "nav-close":closeNav();break;
    case "search":openSearch();break;
    case "expand":if(S.expanded.has(id)) S.expanded.delete(id);else S.expanded.add(id);saveLocal("team-pulse-exp",[...S.expanded]);renderSide(new Date(),route());break;
    case "new-page":if(!S.readOnly){closeNav();createPage({})}break;
    case "add-child":if(canEditPage(pageOf(id))){closeNav();createPage({parentId:id})}else toast("คุณดูทีมนี้ได้อย่างเดียว");break;
    case "tree-menu":case "page-menu":{const p=pageOf(id);if(!p) break;const ed=canEditPage(p);
      const moves=ed?[{header:"ย้ายไปทีม"},{ic:"users",label:"ทั้งองค์กร",on:!p.teamId,onClick:()=>movePageTeam(id,"")},...editTeams().map(t=>({ic:"team",label:t.name,on:p.teamId===t.id,onClick:()=>movePageTeam(id,t.id)}))]:[];
      openMenu(el,[
      {ic:"star",label:S.fav.has(id)?"เอาออกจากรายการโปรด":"เพิ่มในรายการโปรด",onClick:()=>toggleFav(id)},
      ...(ed?[{ic:"plus",label:"เพิ่มหน้าย่อย",onClick:()=>createPage({parentId:id})},{ic:"copy",label:"ทำสำเนา",onClick:()=>duplicatePage(id)}]:[]),
      ...(act==="page-menu"&&ed?[{ic:"width",label:p.wide?"ความกว้างปกติ":"เต็มความกว้าง",onClick:()=>{p.wide=!p.wide;patch("pages",id,{wide:p.wide},0);updatePage(id,true)}}]:[]),
      {g:"MD",label:"คัดลอกเป็น Markdown",onClick:()=>copyText(toMarkdown(p))},
      ...(ed?[{ic:"trash",label:"ย้ายไปถังขยะ",danger:true,onClick:()=>trashPage(id)}]:[]),...moves,
      ...(canSharePage(p)?[{ic:"users",label:"แชร์ / สิทธิ์ดูและแก้…",onClick:()=>openShareModal(id)}]:[])]);break}
    case "fav":toggleFav(id);break;
    case "space":setSpace(el.dataset.space);break;
    case "new-team":if(!S.readOnly){closeNav();if(!S.me&&!isAdmin()){toast("เลือกก่อนว่าคุณคือใคร แล้วค่อยสร้างทีม");go("preferences");break}openTeamModal()}break;
    case "edit-team":openTeamModal(teamOf(id));break;
    case "icon-pick":if(canEditPage(pageOf(id))) openMenu(el,[{header:"เลือกไอคอน"},{emoji:true,onPick:em=>{const p=pageOf(id);p.icon=em;patch("pages",id,{icon:em,updatedAt:nowIso()},0);render()}},{ic:"x",label:"ลบไอคอน",onClick:()=>{const p=pageOf(id);p.icon="";patch("pages",id,{icon:""},0);render()}}]);break;
    case "cover-add":{const p=pageOf(id);p.cover=COLORS[Math.floor(Math.random()*COLORS.length)];patch("pages",id,{cover:p.cover},0);render();break}
    case "cover-pick":openMenu(el,[{header:"สีปก"},{swatches:true,current:(pageOf(id)||{}).cover,onPick:c=>{const p=pageOf(id);p.cover=c;patch("pages",id,{cover:c},0);render()}}]);break;
    case "cover-remove":{const p=pageOf(id);p.cover="";patch("pages",id,{cover:""},0);render();break}
    case "use-tpl":{const r=route();if(r.v!=="page"||!pageEditor) break;const p=pageOf(r.id);const T=tpl(el.dataset.tpl);
      pageEditor.load(T.blocks);pageEditor.changed();const f={};if(!p.title){p.title=T.title;f.title=T.title;$("#pgTitle").value=T.title}if(!p.icon){p.icon=T.icon;f.icon=T.icon}
      if(Object.keys(f).length) patch("pages",r.id,f,0);updatePage(r.id,true);renderSide(new Date(),r);break}
    case "restore":restorePage(id);break;
    case "destroy":if(el.classList.contains("armed")) destroyPage(id);else{el.classList.add("armed");el.textContent="ยืนยันลบ “"+el.dataset.name+"” ถาวร";setTimeout(()=>{if(el.isConnected){el.classList.remove("armed");el.textContent="ลบถาวร"}},4000)}break;
    case "open-project":if(e.target.closest("a")) break;openProject(id);break;
    case "close-panel":closePanel();break;
    case "new-project":if(!S.readOnly) newProject(el.dataset.status);break;
    case "new-member":closeNav();if(API.on){if(isAdmin()) go("people");else toast("ให้ผู้ดูแลเชิญคนใหม่ด้วยอีเมล");break}openMemberModal();break;
    case "edit-member":closeNav();if(API.on&&id!==S.me&&!isAdmin()){toast("แก้ได้เฉพาะโปรไฟล์ของตัวเอง");break}openMemberModal(memberOf(id));break;
    case "new-event":openEventModal();break;
    case "edit-event":openEventModal(S.events.find(x=>x.id===id));break;
    case "meeting-notes":meetingNotes(id);break;
    case "quick-meeting":openQuickMeeting();break;
    case "busy":setBusy(id,+el.dataset.min,"");break;
    case "free":{const m=memberOf(id);if(m) m.busyUntil="";patch("members",id,{busyUntil:"",busyNote:""},0);render();break}
    case "gal-filter":S.galFilter=el.dataset.f;render();break;
    case "cover-img":{const p=S.projects.find(x=>x.id===S.openProject);if(!p||!canEditT(p.teamId)) break;const inp=document.createElement("input");inp.type="file";inp.accept="image/*";
      inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f) return;try{const src=await putImage(f);p.coverImg=src;p.updatedAt=nowIso();patch("projects",p.id,{coverImg:src,updatedAt:p.updatedAt},0);fillPanel();render();toast("ใส่รูปปกแล้ว")}catch(err){toast(err&&err.code==="too_large"?`รูปใหญ่เกิน ${err.limit} MB`:"อัปโหลดไม่สำเร็จ ลองอีกครั้ง")}};inp.click();break}
    case "cover-img-remove":{const p=S.projects.find(x=>x.id===S.openProject);if(!p||!canEditT(p.teamId)) break;p.coverImg="";patch("projects",p.id,{coverImg:""},0);fillPanel();render();break}
    case "mode":S.projMode=el.dataset.mode;saveLocal("team-pulse-mode",S.projMode);render();break;
    case "week":{const d=+el.dataset.d;if(d===0) S.weekStart=startOfWeek(new Date());else{const w=new Date(S.weekStart);w.setDate(w.getDate()+7*d);S.weekStart=w}render();break}
    case "showcase":{const p=S.projects.find(x=>x.id===S.openProject);if(!p||!isAdmin()) break;p.showcase=!p.showcase;p.updatedAt=nowIso();patch("projects",p.id,{showcase:p.showcase,updatedAt:p.updatedAt},0);fillPanel();toast(p.showcase?"โชว์งานนี้ในหน้าแรกแล้ว":"เอาออกจากหน้าแรกแล้ว");break}
    case "set-status":{const p=S.projects.find(x=>x.id===S.openProject);if(!p||!canEditT(p.teamId)||p.status===el.dataset.status) break;p.status=el.dataset.status;p.updatedAt=nowIso();patch("projects",p.id,{status:p.status,updatedAt:p.updatedAt},0);render();suggestSticker(p.id,p.status);break}
    case "cover":{const p=S.projects.find(x=>x.id===S.openProject);if(!p||!canEditT(p.teamId)) break;p.cover=el.dataset.color;patch("projects",p.id,{cover:p.cover},0);render();break}
    case "toggle-chip":el.setAttribute("aria-pressed",el.getAttribute("aria-pressed")!=="true");break;
    case "close-modal":closeModal();break;
    case "modal-bg":if(e.target===el) closeModal();break;
    case "theme":applyTheme(el.dataset.theme);saveLocal("team-pulse-theme",S.theme);render();break;
    case "set-me":{const m=memberOf(id);if(!m) break;
      if(S.uid){if(m.uid&&m.uid!==S.uid&&!isAdmin()){toast("โปรไฟล์นี้ผูกกับบัญชีของคนอื่นแล้ว");break}
        S.members.filter(x=>x.uid===S.uid&&x.id!==id).forEach(x=>{x.uid="";patch("members",x.id,{uid:""},0)});m.uid=S.uid;patch("members",id,{uid:S.uid},0)}
      S.me=id;saveLocal("team-pulse-me",id);render();toast("ตั้งให้คุณเป็น "+m.name+" แล้ว");break}
    case "new-member-me":openMemberModal(null,{me:true});break;
    case "me-color":{const m=meMember();if(!m||S.readOnly) break;m.color=el.dataset.color;patch("members",m.id,{color:m.color},0);render();break}
    case "pick-avatar":setMemberAvatar(id,el.dataset.av);break;
    case "upload-avatar":if(!S.readOnly) uploadAvatar(id);break;
    case "export":exportData();break;
    case "import":if(!S.readOnly) importData();break;
    case "seed":seedExamples();break;
    case "new-request":openRequestModal();break;
    case "claim":claimRequest(id);break;
    case "set-mood":{const m=meMember();if(!m||S.readOnly) break;m.mood=el.dataset.sid||"";patch("members",m.id,{mood:m.mood},0);render();toast(m.mood?"ตั้งสติกเกอร์บอกสถานะแล้ว":"เอาสติกเกอร์บอกสถานะออกแล้ว");break}
    case "room-sticker":{const r=el.getBoundingClientRect();const pid=id;openStickerMenu(r.left,r.top,async sid=>{try{await backend.set("updates",newId(),{projectId:pid,text:"",sticker:sid});toast("ส่งสติกเกอร์แล้ว")}catch(e){toast((e&&e.msg)||"ส่งไม่สำเร็จ")}},"ส่งสติกเกอร์ในห้องงาน");break}
    case "line-mode":{const m=meMember();if(!m||S.readOnly) break;m.lineMode=el.dataset.mode;patch("members",m.id,{lineMode:m.lineMode},0);render();break}
    case "line-qr-remove":{const m=meMember();if(!m||S.readOnly) break;m.lineQr="";patch("members",m.id,{lineQr:""},0);render();break}
    case "line-qr-upload":{const m=meMember();if(!m||S.readOnly) break;const inp=document.createElement("input");inp.type="file";inp.accept="image/*";
      inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f) return;if(!f.type.startsWith("image/")){toast("เลือกได้เฉพาะไฟล์รูปภาพ");return}
        try{const src=await putImage(f);m.lineQr=src;m.lineMode="qr";patch("members",m.id,{lineQr:src,lineMode:"qr"},0);render();toast("อัปโหลด QR code แล้ว")}catch(e){toast("อัปโหลดไม่สำเร็จ ลองอีกครั้ง")}};inp.click();break}
    case "room-status":{const p=S.projects.find(x=>x.id===id);if(!p||!canEditProject(p)||p.status===el.dataset.status) break;p.status=el.dataset.status;p.updatedAt=nowIso();patch("projects",id,{status:p.status,updatedAt:p.updatedAt},0);render();suggestSticker(id,p.status);break}
    case "dl-file":downloadSrc(el.dataset.src,el.dataset.name);break;
    case "bell":openNotifs(el);break;
    case "notif-all":markNotifs("all");closeMenu();break;
    case "notif-open":{const nid=el.dataset.nid,link=el.dataset.link;closeMenu();markNotifs([nid]);if(link) location.hash=link.replace(/^#/,"");break}
    case "logout":logout();break;
    case "share-page":openShareModal(el.dataset.id);break;
    case "watch-open":openWatchForm();break;
    case "watch-close":{const f=$("#watchForm");if(f) f.remove();break}
    case "unwatch":{const p=S.projects.find(x=>x.id===S.openProject);if(!p||!canEditProject(p)) break;const uid=el.dataset.uid,m=memberOf(uid);
      if(!el.classList.contains("armed")){el.classList.add("armed");el.setAttribute("aria-label","กดอีกครั้งเพื่อยืนยัน");el.closest(".watcher").classList.add("armed");toast(`กด × อีกครั้งเพื่อเลิกให้ ${m?m.name:"คนนี้"} ติดตาม`);setTimeout(()=>{if(el.isConnected){el.classList.remove("armed");el.closest(".watcher").classList.remove("armed")}},4000);break}
      p.guestIds=(p.guestIds||[]).filter(x=>x!==uid);p.updatedAt=nowIso();patch("projects",p.id,{guestIds:p.guestIds,updatedAt:p.updatedAt},0);fillPanel();toast(`${m?m.name:"คนนี้"} เลิกติดตามโปรเจกต์นี้แล้ว`);break}
    case "cm-edit":editComment(el.dataset.id);break;
    case "cm-del":{const id=el.dataset.id;if(!el.classList.contains("armed")){el.classList.add("armed");el.textContent="ยืนยันลบ";setTimeout(()=>{if(el.isConnected){el.classList.remove("armed");el.textContent="ลบ"}},4000);break}
      remove("comments",id);S.comments=(S.comments||[]).filter(c=>c.id!==id);refreshComments();toast("ลบคอมเมนต์แล้ว");break}
    case "backup-export":backupExport().catch(()=>toast("ดาวน์โหลดไม่สำเร็จ ลองอีกครั้ง"));break;
    case "backup-pick":backupPick();break;
    case "wipe-open":{wipeOpen=true;const f=$("#bk-wipe");if(f){f.hidden=false;const w=$("#wipe-word");w.value="";$("#wipe-go").disabled=true;w.focus()}break}
    case "wipe-close":{wipeOpen=false;const f=$("#bk-wipe");if(f) f.hidden=true;break}
    case "backup-cancel":bkData=null;$("#bk-msg").innerHTML="";break;
    case "del-user":if(el.classList.contains("armed")){api("/users/"+el.dataset.uid,{method:"DELETE"}).then(()=>{toast("ลบ "+el.dataset.name+" แล้ว");loadPeople(true)}).catch(err=>toast(err.msg||"ลบไม่สำเร็จ"))}
      else{el.classList.add("armed");el.textContent="ยืนยันลบ “"+el.dataset.name+"”";setTimeout(()=>{if(el.isConnected){el.classList.remove("armed");el.textContent="ลบ"}},4000)}break;
    case "share-guest":{const p=pageOf(el.dataset.page);if(!p) break;const g=new Set(p.guestIds||[]);g.has(id)?g.delete(id):g.add(id);p.guestIds=[...g];patch("pages",p.id,{guestIds:p.guestIds},0);toast(g.has(id)?"แชร์ให้ "+((memberOf(id)||{}).name||"")+" แล้ว":"เลิกแชร์แล้ว");break}
    case "clear-examples":clearExamples();break;
  }
});
document.addEventListener("input",e=>{
  if(["pf-name","pf-role","pf-line"].includes(e.target.id)&&!S.readOnly){const m=meMember();if(!m) return;const f=e.target.id.slice(3).replace("name","name");m[f]=e.target.value;patch("members",m.id,{[f]:e.target.value});renderSide(new Date(),route());return}
  if(e.target.id==="projQ"){S.projQ=e.target.value;const pos=e.target.selectionStart;render(false);const q=$("#projQ");if(q){q.focus();try{q.setSelectionRange(pos,pos)}catch(x){}}}});
document.addEventListener("change",async e=>{const t=e.target;
  if(t.id==="projOwner"){S.projOwner=t.value;render();return}
  if(t.classList.contains("ppl-role")){try{await api("/users/"+t.dataset.uid,{method:"PATCH",body:{role:t.value}});toast("เปลี่ยนสิทธิ์แล้ว");loadPeople(true)}catch(err){toast(err.msg||"เปลี่ยนสิทธิ์ไม่สำเร็จ");loadPeople(true)}return}
  if(t.dataset&&t.dataset.pref){const prefs={[t.dataset.pref]:t.type==="checkbox"?t.checked:t.value};try{const j=await api("/me",{method:"PATCH",body:{prefs}});API.user=j.user;toast("บันทึกการแจ้งเตือนแล้ว")}catch(err){toast("บันทึกไม่สำเร็จ")}}});
document.addEventListener("submit",e=>{if(e.target.id==="upForm"){e.preventDefault();postUpdate(e.target)}
  if(e.target.id==="noteForm"){e.preventDefault();const id=e.target.dataset.id,p=S.projects.find(x=>x.id===id);if(!p||!canEditProject(p)) return;
    const v=$("#sn-text").value.trim();if(v===(p.statusNote||"")) return;p.statusNote=v;p.updatedAt=nowIso();patch("projects",id,{statusNote:v,updatedAt:p.updatedAt},0);render();toast(p.requestedBy?"บันทึกแล้ว ผู้สั่งงานได้รับแจ้งเตือน":"บันทึกแล้ว")}});
document.addEventListener("change",e=>{if(e.target.id==="up-files"){const n=e.target.files.length;$("#up-fn").textContent=n?n+" ไฟล์":""}});
document.addEventListener("submit",async e=>{if(e.target.id!=="invForm") return;e.preventDefault();const msg=$("#inv-msg");msg.textContent="กำลังส่ง…";
  try{const j=await api("/users/invite",{method:"POST",body:{email:$("#inv-email").value.trim(),name:$("#inv-name").value.trim(),role:$("#inv-role").value}});
    msg.innerHTML=j.devLink?`ส่งแล้ว (โหมดพัฒนา: <a href="${esc(j.devLink)}" target="_blank" rel="noopener">ลิงก์คำเชิญ</a>)`:"ส่งคำเชิญทางอีเมลแล้ว";e.target.reset();loadPeople(true)}
  catch(err){msg.textContent=err.msg||"ส่งคำเชิญไม่สำเร็จ"}});
document.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch();return}
  if(e.key==="Escape"){if(!$("#menu").hidden) closeMenu();else if(Slash.isOpen()) Slash.close();else if($("#modalRoot").innerHTML) closeModal();else if(S.openProject) closePanel();else closeNav()}});
let chartTip=null;
document.addEventListener("pointermove",e=>{const b=e.target.closest&&e.target.closest(".chart .bar[data-tip]");
  if(!b){if(chartTip) chartTip.hidden=true;return}
  if(!chartTip){chartTip=document.createElement("div");chartTip.className="chart-tip";chartTip.setAttribute("role","tooltip");document.body.appendChild(chartTip)}
  chartTip.textContent=b.dataset.tip;chartTip.hidden=false;const w=chartTip.offsetWidth;
  chartTip.style.left=Math.max(8,Math.min(innerWidth-w-8,e.clientX-w/2))+"px";chartTip.style.top=(e.clientY-40)+"px"});
let dragId=null;
document.addEventListener("dragstart",e=>{const c=e.target.closest&&e.target.closest(".pcard");if(!c||S.readOnly) return;dragId=c.dataset.id;c.classList.add("dragging");try{e.dataTransfer.setData("text/plain",dragId);e.dataTransfer.effectAllowed="move"}catch(x){}});
document.addEventListener("dragend",()=>{dragId=null;document.querySelectorAll(".dragging,.col.over").forEach(x=>x.classList.remove("dragging","over"))});
document.addEventListener("dragover",e=>{const col=e.target.closest&&e.target.closest(".col");if(!col||!dragId) return;e.preventDefault();document.querySelectorAll(".col.over").forEach(x=>x!==col&&x.classList.remove("over"));col.classList.add("over")});
document.addEventListener("drop",e=>{const col=e.target.closest&&e.target.closest(".col");if(!col||!dragId) return;e.preventDefault();
  const p=S.projects.find(x=>x.id===dragId);if(p&&canEditT(p.teamId)&&p.status!==col.dataset.status){p.status=col.dataset.status;p.updatedAt=nowIso();patch("projects",p.id,{status:p.status,updatedAt:p.updatedAt},0);suggestSticker(p.id,p.status)}dragId=null;render()});
window.addEventListener("scroll",()=>{if(!$("#menu").hidden) closeMenu()},{passive:true});

let toastT=null;
function toast(msg,action){let t=$(".toast");if(!t){t=document.createElement("div");t.className="toast";t.setAttribute("role","status");document.body.appendChild(t)}
  t.innerHTML=`<span></span>`;t.firstChild.textContent=msg;if(action){const b=document.createElement("button");b.textContent=action.label;b.onclick=()=>{t.hidden=true;action.fn()};t.appendChild(b)}
  t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true},action?6000:2600)}

/* ================= stickers you can stick anywhere =================
   Right-click (long-press on a phone) on any page, project, request room or overview → pick a sticker →
   it stays at that spot for everyone who can see the place. The person who stuck it can drag or remove it. */
const STICK_VIEWS=["home","dashboard","projects","calendar","intake","teams"];
function surfaceAt(target){
  const pd=target.closest&&target.closest(".panel .doc");
  if(pd&&S.openProject) return {key:"project:"+S.openProject,el:pd};
  const v=target.closest&&target.closest("#view");if(!v) return null;
  const r=route();
  if(r.v==="page") return {key:"page:"+r.id,el:v};
  if(r.v==="req") return {key:"req:"+r.id,el:v};
  if(STICK_VIEWS.includes(r.v)&&!isGuest()) return {key:"view:"+r.v,el:v};
  return null}
function canStickHere(key){if(S.readOnly) return false;const [k,id]=key.split(":");
  if(k==="view") return !isGuest();
  if(k==="page") return canSee((pageOf(id)||{}).teamId);
  const p=S.projects.find(x=>x.id===id);if(!p) return false;
  return isGuest()?p.requestedBy===S.me:canSee(p.teamId)}
let freshSticker=null;
function placeStickers(){
  document.querySelectorAll(".sticker-layer").forEach(l=>l.remove());
  const r=route(),tips=[];
  const put=(key,host)=>{if(!host) return;const list=(S.stickers||[]).filter(s=>s.surface===key);if(!list.length) return;
    const layer=document.createElement("div");layer.className="sticker-layer";
    layer.innerHTML=list.map(s=>{const m=memberOf(s.by),mine=s.by===S.me||isAdmin();
      return `<div class="stuck${mine?" mine":""}${freshSticker===s.id?" fresh":""}" data-sk="${esc(s.id)}" style="left:${(s.x*100).toFixed(3)}%;top:${Math.round(s.y)}px;--r:${Number(s.rot)||0}deg" title="${esc((stickerById(s.sid)||{}).label||"")} · ติดโดย ${esc(m?m.name:"ใครบางคน")} ${esc(ago(s.at))}">${stickerArt(s.sid,104)}</div>`}).join("");
    host.appendChild(layer)};
  if(r.v==="page") put("page:"+r.id,$("#view"));
  else if(r.v==="req") put("req:"+r.id,$("#view"));
  else if(STICK_VIEWS.includes(r.v)) put("view:"+r.v,$("#view"));
  if(S.openProject) put("project:"+S.openProject,$(".panel .doc"));
  void tips}
function stickerPicker(onPick){return {stickers:true,onPick}}
function openStickerMenu(x,y,onPick,head){const m=$("#menu");menuItems=[{header:head||"เลือกสติกเกอร์"},stickerPicker(onPick)];
  m.classList.add("wide-menu","stk-menu");
  m.innerHTML=`<div class="m-h">${esc(head||"เลือกสติกเกอร์")}</div>`+Object.entries(SHEETS).map(([k,sh])=>`<div class="m-h sub">${esc(sh.name)}</div><div class="stk-grid">${STICKER_SET.filter(s=>s.sheet===k).map(s=>`<button data-mi="1" data-sid="${s.id}" title="${esc(s.label)}" aria-label="${esc(s.label)}">${stickerArt(s.id,64)}</button>`).join("")}</div>`).join("");
  placeFloating(m,{left:x,right:x,top:y,bottom:y,width:0,height:0})}
async function stickAt(surf,clientX,clientY,sid){const rc=surf.el.getBoundingClientRect();
  const x=Math.min(.98,Math.max(.02,(clientX-rc.left)/rc.width)),y=Math.max(0,clientY-rc.top),rot=Math.round((Math.random()*14-7)*10)/10,id=newId();
  const doc={surface:surf.key,sid,x,y,rot,by:S.me||"",at:nowIso()};
  const [k,tid]=surf.key.split(":");if(k!=="view"){const t=k==="page"?pageOf(tid):S.projects.find(p=>p.id===tid);doc.teamId=(t&&t.teamId)||"";doc.requestedBy=(t&&t.requestedBy)||""}else{doc.teamId="";doc.view=true}
  S.stickers=[...(S.stickers||[]),Object.assign({id},doc)];freshSticker=id;placeStickers();setTimeout(()=>{if(freshSticker===id) freshSticker=null},900);
  try{await put("stickers",id,doc)}catch(e){}}
document.addEventListener("contextmenu",e=>{
  if(e.target.closest("input,textarea,select,[contenteditable='true'],[contenteditable='plaintext-only'],.menu,.tb,.login,.lp,.editor")) return;
  const sel=getSelection();if(sel&&!sel.isCollapsed) return;
  const onSticker=e.target.closest(".stuck");
  if(onSticker){e.preventDefault();const s=(S.stickers||[]).find(x=>x.id===onSticker.dataset.sk);if(!s) return;const m=memberOf(s.by);
    openMenu(onSticker,[{header:`${(stickerById(s.sid)||{}).label||"สติกเกอร์"} · ติดโดย ${m?m.name:"ใครบางคน"}`},...((s.by===S.me||isAdmin())&&!S.readOnly?[{ic:"trash",label:"เอาสติกเกอร์ออก",danger:true,onClick:()=>{S.stickers=S.stickers.filter(x=>x.id!==s.id);placeStickers();remove("stickers",s.id)}}]:[{ic:"eye",label:"ย้ายหรือเอาออกได้เฉพาะคนที่ติด",onClick:()=>{}}])]);return}
  const surf=surfaceAt(e.target);if(!surf||!canStickHere(surf.key)) return;
  e.preventDefault();const cx=e.clientX,cy=e.clientY;
  openStickerMenu(cx,cy,sid=>stickAt(surf,cx,cy,sid),"ติดสติกเกอร์ตรงนี้ · ทุกคนที่เห็นหน้านี้จะเห็นด้วย")});
/* drag your own sticker to move it */
let drag=null;
document.addEventListener("pointerdown",e=>{const el=e.target.closest&&e.target.closest(".stuck.mine");if(!el||e.button!==0||S.readOnly) return;
  const s=(S.stickers||[]).find(x=>x.id===el.dataset.sk);if(!s) return;
  drag={el,s,x0:e.clientX,y0:e.clientY,moved:false,host:el.closest(".sticker-layer").parentElement};el.setPointerCapture(e.pointerId)});
document.addEventListener("pointermove",e=>{if(!drag) return;const dx=e.clientX-drag.x0,dy=e.clientY-drag.y0;
  if(!drag.moved&&Math.hypot(dx,dy)<4) return;drag.moved=true;drag.el.classList.add("dragging");drag.el.style.translate=`${dx}px ${dy}px`});
document.addEventListener("pointerup",e=>{if(!drag) return;const d=drag;drag=null;d.el.classList.remove("dragging");
  if(!d.moved){d.el.style.translate="";return}
  const rc=d.host.getBoundingClientRect(),br=d.el.getBoundingClientRect();
  const x=Math.min(.98,Math.max(.02,(br.left+br.width/2-rc.left)/rc.width)),y=Math.max(0,br.top+br.height/2-rc.top);
  d.s.x=x;d.s.y=y;d.el.style.translate="";placeStickers();patch("stickers",d.s.id,{x,y},0)});
window.addEventListener("resize",()=>placeStickers());

/* After a status change, offer stickers that fit the new status. One click sends it:
   a request → into its request room (the requester is notified); an internal project → stuck on the project page. */
const STATUS_STICKERS={idea:["p15","d23","d18"],doing:["d7","p2","p14"],stuck:["d9","p8","d11"],review:["d6","d12","p17"],live:["d13","p7","d5"]};
let suggestT=null;
function suggestSticker(projectId,status){
  if(S.readOnly||isGuest()) return;
  const p=S.projects.find(x=>x.id===projectId);const ids=STATUS_STICKERS[status];if(!p||!ids) return;
  let box=$("#stkSuggest");if(!box){box=document.createElement("div");box.id="stkSuggest";box.className="stk-suggest";box.setAttribute("role","dialog");box.setAttribute("aria-label","ส่งสติกเกอร์บอกสถานะ");document.body.appendChild(box)}
  const toRoom=API.on&&!!p.requestedBy;
  box.innerHTML=`<div class="ss-h"><b>${esc(statusOf(status).label)}แล้ว ส่งสติกเกอร์บอก${toRoom?"ผู้สั่งงาน":"ทีม"}ไหม?</b><button class="icon-btn" data-ss="close" aria-label="ไม่ต้อง">${icon("x")}</button></div>
    <div class="ss-row">${ids.map(id=>`<button data-ss="${id}" title="${esc((stickerById(id)||{}).label||"")}" aria-label="${esc((stickerById(id)||{}).label||"")}">${stickerArt(id,84)}</button>`).join("")}</div>
    <small class="muted">${toRoom?"ส่งเข้าห้องงาน ผู้สั่งงานได้รับแจ้งเตือน":"ติดไว้บนหน้าโปรเจกต์ ทุกคนที่เห็นโปรเจกต์นี้เห็นด้วย"}</small>`;
  box.hidden=false;box.dataset.pid=projectId;box.dataset.room=toRoom?"1":"";
  clearTimeout(suggestT);suggestT=setTimeout(()=>{box.hidden=true},9000);
}
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("#stkSuggest [data-ss]");if(!b) return;
  const box=$("#stkSuggest"),pid=box.dataset.pid,sid=b.dataset.ss;box.hidden=true;clearTimeout(suggestT);if(sid==="close") return;
  if(box.dataset.room){try{await backend.set("updates",newId(),{projectId:pid,text:"",sticker:sid});toast("ส่งสติกเกอร์เข้าห้องงานแล้ว")}catch(err){toast((err&&err.msg)||"ส่งไม่สำเร็จ")}return}
  const p=S.projects.find(x=>x.id===pid);if(!p) return;
  const id=newId(),doc={surface:"project:"+pid,sid,x:.78+Math.random()*.12,y:60+Math.random()*60,rot:Math.round((Math.random()*14-7)*10)/10,by:S.me||"",at:nowIso(),teamId:p.teamId||"",requestedBy:p.requestedBy||""};
  S.stickers=[...(S.stickers||[]),Object.assign({id},doc)];freshSticker=id;placeStickers();put("stickers",id,doc);toast("ติดสติกเกอร์บนโปรเจกต์แล้ว",{label:"เปิดดู",fn:()=>openProject(pid)})});

/* ================= boot ================= */
async function init(){
  S.projMode=loadLocal("team-pulse-mode","board");S.expanded=new Set(loadLocal("team-pulse-exp",[]));S.fav=new Set(loadLocal("team-pulse-fav",[]));
  S.me=loadLocal("team-pulse-me","");S.space=loadLocal("team-pulse-space","all");applyTheme(loadLocal("team-pulse-theme","system"));
  try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>applyTheme(S.theme))}catch(e){}
  paintIcons(document);
  render(true);
  let db=null,user=null;
  const inClaude=window.claude&&typeof window.claude.use==="function";
  if(!inClaude){try{const r=await fetch("/api/me",{credentials:"same-origin"});
    if(r.status===401){showLogin();return}
    const ct=r.headers.get("content-type")||"";
    if(r.ok&&ct.includes("json")){const j=await r.json();if(j.mode==="api"){API.on=true;API.user=j.user;API.mail=j.mail;API.storage=j.storage}}}catch(e){}}
  if(API.on){
    S.me=API.user.id;S.role=API.user.role;document.body.classList.add("api");document.body.classList.toggle("guest",S.role==="guest");document.body.classList.toggle("admin",isAdmin());
    setApiUpload(async(blob,name,type)=>{const j=await api(`/files?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type||"")}`,{method:"POST",body:blob,headers:{"content-type":"application/octet-stream"}});return j.url});
    backend=apiBackend();
    if(API.mail==="dev") setBanner("dev",{c:"yellow",t:"โหมดพัฒนา: ยังไม่ได้ต่อระบบส่งเมล อีเมลจะแสดงใน terminal และที่ /api/dev/outbox แทนการส่งจริง"});
    renderBell();
  }else{
    if(inClaude){try{[db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);const as=await window.claude.use("assets");if(as) setAssets(as)}catch(e){}}
    if(user){try{const c=await user.can("data.write");if(c===false) setReadOnly(true);S.uid=await user.id();S.isOwner=await user.isOwner()}catch(e){}}
    if(db) setSharedDb(db);
    backend=db?dbBackend(db):localBackend();
    if(!db) setBanner("local",{c:"orange",t:"โหมดเครื่องนี้: ข้อมูลเก็บในเบราว์เซอร์นี้เท่านั้น ยังไม่แชร์กับทีม"});
  }
  const loadTimer=setTimeout(()=>{if(!allLoaded()) setBanner("slow",{c:"yellow",t:"ยังโหลดข้อมูลของทีมไม่ได้ เช็กอินเทอร์เน็ต ข้อมูลที่เห็นอาจไม่ใช่ล่าสุด"})},10000);
  if(API.on){backend.watch("activity",rows=>{S.activity=rows;if(["dashboard","req"].includes(route().v)) render()});
    backend.watch("updates",rows=>{S.updates=rows;if(route().v==="req") render()})}
  backend.watch("stickers",rows=>{S.stickers=rows;placeStickers()});
  backend.watch("comments",rows=>{S.comments=rows;refreshComments()});
  let openedFromHash=false;
  ["members","teams","projects","events","pages"].forEach(c=>backend.watch(c,(rows,snap)=>{
    if(!openedFromHash&&allLoaded()&&location.hash.startsWith("#project-")){openedFromHash=true;setTimeout(()=>window.dispatchEvent(new HashChangeEvent("hashchange")),0)}
    const loc=S[c];S[c]=rows.map(r=>{const k=c+"/"+r.id;return pending[k]?Object.assign(r,pending[k]):r});
    if(!snap||!snap.metadata.fromCache) S.loaded[c]=true;
    if(c==="members"&&S.uid){const mine=S[c].find(m=>m.uid===S.uid);if(mine&&mine.id!==S.me){S.me=mine.id;saveLocal("team-pulse-me",mine.id)}}
    if(c==="teams"&&S.space!=="all"&&S.space!=="general"&&S.loaded.teams&&!canSee(S.space)) S.space="all";
    if(allLoaded()){clearTimeout(loadTimer);setBanner("slow",null)}void loc;
    render()},err=>{S.loaded[c]=true;setBanner("err",{c:"pink",t:"เชื่อมต่อข้อมูลไม่ได้ ลองรีเฟรชหน้านี้อีกครั้ง"});render()}));
  setInterval(()=>render(),30000);
}
init();
})();
