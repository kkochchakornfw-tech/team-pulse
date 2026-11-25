// Who may read and write what. Enforced on the server: the client never receives rows it cannot read.
// Roles: owner, admin (see and edit everything) · member (team rules) · guest (an outside person who
// gives work: sees their own requests, pages shared with them, meetings they are invited to).
export const ROLES = ["owner", "admin", "member", "guest"];
export const COLS = ["members", "teams", "projects", "events", "pages", "activity", "updates", "stickers", "comments"];
export const isAdmin = (u) => u && (u.role === "owner" || u.role === "admin");

export function teamRole(u, teamId, teams) {
  if (isAdmin(u)) return "edit";
  if (u.role === "guest") return "none";
  if (!teamId) return "edit";
  const t = teams[teamId];
  if (!t) return "edit";
  if ((t.memberIds || []).includes(u.id)) return "edit";
  if ((t.viewerIds || []).includes(u.id)) return "view";
  return "none";
}

/** What one person may do with one page: "edit", "view" or "none".
 *  share: "team" (default: whoever can see the page's team) or "private" (only the creator and the people listed).
 *  teamAccess: "view" makes the team read-only. people: { userId: "view" | "edit" } adds people on top. */
export function pageRole(u, data, teams) {
  if (!data) return "none";
  if (data.createdBy && data.createdBy === u.id) return "edit";
  // private pages stay private, even from admins; a private page nobody owns (made before owners were recorded) admins can still manage
  if (isAdmin(u) && (data.share !== "private" || !data.createdBy)) return "edit";
  const p = (data.people || {})[u.id];
  if (u.role === "guest") return p || (data.guestIds || []).includes(u.id) ? "view" : "none";
  let r = data.share === "private" ? "none" : teamRole(u, data.teamId, teams);
  if (r === "edit" && data.teamAccess === "view") r = "view";
  if (p === "edit") r = "edit"; else if (p === "view" && r === "none") r = "view";
  return r;
}
export const SHARE_KEYS = ["share", "people", "teamAccess", "guestIds", "createdBy"];

export function canRead(u, col, id, data, teams) {
  if (!data) return false;
  if (col === "pages") return pageRole(u, data, teams) !== "none"; // before the admin shortcut: private pages stay private
  if (isAdmin(u)) return true;
  if (u.role === "guest") {
    switch (col) {
      case "members": return true;
      case "projects": return data.requestedBy === u.id || (data.guestIds || []).includes(u.id);
      case "pages": return pageRole(u, data, teams) !== "none";
      case "events": return (data.memberIds || []).includes(u.id);
      case "activity": case "updates": case "stickers": return data.requestedBy === u.id;
      case "comments": return data.requestedBy === u.id || (data.guestIds || []).includes(u.id);
      default: return false;
    }
  }
  if (col === "members") return true;
  if (col === "pages") return pageRole(u, data, teams) !== "none";
  if (col === "teams") return teamRole(u, id, teams) !== "none";
  return teamRole(u, data.teamId, teams) !== "none";
}

const BUSY_ONLY = new Set(["busyUntil", "busyNote"]);
const changed = (a, b) => Object.keys({ ...a, ...b }).filter((k) => JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k]));

/** next === null means delete. Returns true when allowed. */
export function canWrite(u, col, id, prev, next, teams) {
  if (!COLS.includes(col) || col === "activity") return false;
  // updates are append-only; the API fills author, project link and visibility before this check
  if (col === "updates") return !prev && !!next && next.authorId === u.id || (isAdmin(u) && next === null);
  // comments: anyone who can see the page/project may comment (the API checks that and fills author and
  // visibility); the author edits only the text, the author or an admin deletes
  if (col === "comments") {
    if (!prev) return !!next && next.authorId === u.id;
    if (next === null) return prev.authorId === u.id || isAdmin(u);
    return prev.authorId === u.id && changed(prev, next).every((k) => k === "text" || k === "mentions" || k === "editedAt");
  }
  // stickers: anyone who can see the spot may stick one; only its owner (or an admin) moves or removes it
  if (col === "stickers") {
    if (!prev) return !!next && next.by === u.id;
    if (prev.by !== u.id && !isAdmin(u)) return false;
    return next === null || changed(prev, next).every((k) => k === "x" || k === "y" || k === "rot");
  }
  if (u.role === "guest") {
    if (col === "members") return id === u.id && next !== null;
    if (col !== "projects") return false;
    if (!prev) return !!next && next.requestedBy === u.id && !next.teamId;
    if (prev.requestedBy !== u.id || next === null) return false;
    return next.requestedBy === u.id && next.status === prev.status && (next.teamId || "") === (prev.teamId || "") && (!prev.ownerId || next.ownerId === prev.ownerId) && (next.statusNote || "") === (prev.statusNote || "");
  }
  if (col === "pages") {
    if (!prev) return !!next && (next.share === "private" || teamRole(u, next.teamId, teams) === "edit");
    if (pageRole(u, prev, teams) !== "edit") return false;
    if (next === null) return true;
    // who it is shared with: the creator, or an admin on a page that is not private; old pages without a creator: any editor
    const owner = !prev.createdBy || prev.createdBy === u.id || (isAdmin(u) && prev.share !== "private");
    if (!owner && changed(prev, next).some((k) => SHARE_KEYS.includes(k))) return false;
    if (next.share !== "private" && (next.teamId || "") !== (prev.teamId || "") && teamRole(u, next.teamId, teams) !== "edit") return false;
    return true;
  }
  if (isAdmin(u)) return true;
  if (col === "members") {
    if (id === u.id) return next !== null;
    return !!prev && next !== null && changed(prev, next).every((k) => BUSY_ONLY.has(k));
  }
  if (col === "teams") {
    if (!prev) return !!next && (next.memberIds || []).includes(u.id);
    return teamRole(u, id, teams) === "edit";
  }
  if (prev && teamRole(u, prev.teamId, teams) !== "edit") return false;
  if (next && teamRole(u, next.teamId, teams) !== "edit") return false;
  return true;
}

/** Remove fields a viewer should not see. A guest sees contact details (email, Line) only of
 *  themselves and of the people working on their requests. */
export function shape(u, col, data, id, ctx) {
  if (col === "members" && u.role === "guest" && data && id !== u.id && !(ctx && ctx.contacts && ctx.contacts.has(id))) {
    const { email, line, lineQr, lineMode, phone, ...rest } = data; return rest;
  }
  return data;
}
