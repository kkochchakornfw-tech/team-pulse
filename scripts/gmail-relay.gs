/**
 * Team Pulse mail relay: lets the app send email from your Gmail account.
 *
 * Setup (script.google.com → New project, paste this file):
 *   1. Project Settings (gear) → Script Properties → add SECRET = the same long random value
 *      you put in Vercel as GAS_MAIL_SECRET.
 *   2. Deploy → New deployment → type "Web app"
 *        Execute as: Me
 *        Who has access: Anyone
 *      Authorize when asked, then copy the Web app URL into Vercel as GAS_MAIL_URL.
 *   3. After changing this code: Deploy → Manage deployments → edit → Version "New version".
 *
 * Only requests carrying the secret are sent, so the URL is not an open relay.
 * Gmail limit: about 100 recipients a day (1,500 on Google Workspace).
 */
function doPost(e) {
  var out = function (o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); };
  try {
    var secret = PropertiesService.getScriptProperties().getProperty("SECRET");
    var d = JSON.parse(e.postData.contents);
    if (!secret || d.secret !== secret) return out({ ok: false, error: "unauthorized" });
    var to = String(d.to || "");
    if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(to)) return out({ ok: false, error: "bad recipient" });
    MailApp.sendEmail({
      to: to,
      subject: String(d.subject || "").slice(0, 250),
      htmlBody: String(d.html || ""),
      body: String(d.text || ""),
      name: String(d.name || "Team Pulse").slice(0, 60),
    });
    return out({ ok: true, left: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return out({ ok: false, error: String(err).slice(0, 200) });
  }
}

/** Run once from the editor to check the quota and trigger the authorization prompt. */
function checkQuota() {
  Logger.log("Emails left today: " + MailApp.getRemainingDailyQuota());
}
