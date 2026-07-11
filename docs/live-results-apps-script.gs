/**
 * ============================================================================
 * Genesis Live Hub — Google Sheets → Live site sync  (Plan A: push model)
 * ============================================================================
 *
 * WHAT IT DOES
 *   When the results sheet is edited, this sends every event to the live site's
 *   webhook. Results appear on /live/<event> within ~1 second.
 *
 * SHEET LAYOUT  (see live-results-sheet-template.csv)
 *   One ROW per finisher, grouped by "Event Key". A race is a block of rows
 *   that share the same Event Key:
 *     • The FIRST row of a race carries the event details (Event, Age Group,
 *       Round, Status, Venue, …) and its first finisher.
 *     • The following rows just carry that race's other finishers — you can
 *       leave Event Key blank on them (it carries down) or fill it for safety.
 *     • An upcoming race with no results yet is a single row with the details
 *       and a blank Athlete.
 *   Any number of finishers per race is fine. Heats, semis and finals are each
 *   their own race (their own Event Key + Round).
 *
 * INSTALL  (needs EDIT access to the sheet)
 *   1. Extensions → Apps Script. Delete any code, paste this whole file, Save.
 *   2. Fill WEBHOOK_SECRET below (same value as LIVE_WEBHOOK_SECRET on the
 *      Cloudflare Worker) and set SHEET_NAME to the results tab.
 *   3. Reload the sheet → a "⚡ Live Site" menu appears:
 *        • "Send now"  — push immediately (also the test button).
 *        • "Turn ON auto-send" — installs the on-edit trigger (authorise once).
 * ============================================================================
 */

/* ── CONFIG — edit these ──────────────────────────────────────────────────── */

const WEBHOOK_URL = "https://gsfteams.com/api/live/webhook";
const WEBHOOK_SECRET = "PASTE_LIVE_WEBHOOK_SECRET_HERE";
const SHEET_NAME = "Results"; // the tab to read
const HEADER_ROW = 1;         // row number containing the column headers

// Which live event these rows belong to. Leave "" to use the site's default
// live-tracked event (fine while you run one event at a time).
const EVENT_SLUG = "";

// Map our fields → the exact header text in the sheet (from the template).
const COLS = {
  event_key: "Event Key",
  event_name: "Event",
  category: "Age Group",
  gender: "Gender",
  event_type: "Discipline",
  heat_label: "Round",
  day: "Day",
  sort_order: "Order",
  status: "Status",
  scheduled_at: "Scheduled",
  venue: "Venue",
  wind: "Wind",
  participants_count: "Participants",
  poc_name: "POC Name",
  poc_phone: "POC Phone",
  notes: "Notes",
  rank: "Rank",
  bib: "Bib",
  name: "Athlete",
  school: "School / Club",
  result: "Result",
  record: "Record",
};

/* ── Menu ─────────────────────────────────────────────────────────────────── */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⚡ Live Site")
    .addItem("Send now", "sendNow")
    .addSeparator()
    .addItem("Turn ON auto-send", "installTrigger")
    .addItem("Turn OFF auto-send", "removeTriggers")
    .addToUi();
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

// Menu "Send now" — a manual push that shows a confirmation popup.
function sendNow() {
  sendToSite(true);
}

// interactive=true shows popups (manual send); auto-send stays silent so it
// doesn't interrupt data entry on every edit.
function sendToSite(interactive) {
  const results = buildPayload();
  if (results.length === 0) {
    if (interactive) maybeAlert('Nothing to send — no rows found on "' + SHEET_NAME + '".');
    return;
  }
  const res = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    headers: { "x-webhook-secret": WEBHOOK_SECRET },
    payload: JSON.stringify({ results: results, event_slug: EVENT_SLUG || undefined }),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code === 200) {
    if (interactive) maybeAlert("Sent " + results.length + " events to the live site. ✅");
  } else if (interactive) {
    maybeAlert("Send failed (HTTP " + code + "): " + res.getContentText());
  } else {
    Logger.log("Auto-send failed (HTTP " + code + "): " + res.getContentText());
  }
}

/** Read the sheet and group rows into one payload per race. */
function buildPayload() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('No tab named "' + SHEET_NAME + '".');

  const values = sheet.getDataRange().getValues();
  if (values.length <= HEADER_ROW) return [];

  const headers = values[HEADER_ROW - 1].map(function (h) { return String(h).trim(); });
  const col = {};
  headers.forEach(function (h, i) { if (h) col[h] = i; });

  function raw(row, key) {
    const h = COLS[key];
    if (!h || !(h in col)) return "";
    const v = row[col[h]];
    return v === null || v === undefined ? "" : v;
  }
  function text(row, key) {
    const v = raw(row, key);
    return v instanceof Date ? v : String(v).trim();
  }

  const groups = {};
  const order = [];
  let lastKey = "";

  for (var r = HEADER_ROW; r < values.length; r++) {
    const row = values[r];
    const rawKey = String(raw(row, "event_key")).trim();
    const eventName = String(raw(row, "event_name")).trim();
    const athlete = String(raw(row, "name")).trim();

    let key;
    if (rawKey) {
      key = slugify(rawKey);
    } else if (eventName) {
      key = slugify([
        eventName,
        String(raw(row, "category")).trim(),
        String(raw(row, "gender")).trim(),
        "d" + (String(raw(row, "day")).trim() || "1"),
        String(raw(row, "heat_label")).trim() || "final",
      ].join(" "));
    } else {
      key = lastKey; // finisher line of the current race
    }
    if (!key) continue;
    lastKey = key;

    if (!groups[key]) {
      groups[key] = { event_key: key, results: [] };
      order.push(key);
    }
    const g = groups[key];

    setMeta(g, "event_name", eventName);
    setMeta(g, "category", String(raw(row, "category")).trim());
    setMeta(g, "gender", String(raw(row, "gender")).trim());
    setMeta(g, "event_type", String(raw(row, "event_type")).trim());
    setMeta(g, "heat_label", String(raw(row, "heat_label")).trim());
    setMeta(g, "status", String(raw(row, "status")).trim());
    setMeta(g, "day", String(raw(row, "day")).trim());
    setMeta(g, "sort_order", String(raw(row, "sort_order")).trim());
    setMeta(g, "venue", String(raw(row, "venue")).trim());
    setMeta(g, "wind", String(raw(row, "wind")).trim());
    setMeta(g, "participants_count", String(raw(row, "participants_count")).trim());
    setMeta(g, "poc_name", String(raw(row, "poc_name")).trim());
    setMeta(g, "poc_phone", String(raw(row, "poc_phone")).trim());
    setMeta(g, "notes", String(raw(row, "notes")).trim());
    const iso = toIso(raw(row, "scheduled_at"));
    if (iso) setMeta(g, "scheduled_at", iso);

    if (athlete) {
      const rankRaw = String(raw(row, "rank")).trim();
      g.results.push({
        rank: rankRaw ? Number(rankRaw) : g.results.length + 1,
        bib: String(raw(row, "bib")).trim(),
        name: athlete,
        school: String(raw(row, "school")).trim(),
        result: String(raw(row, "result")).trim(),
        record: String(raw(row, "record")).trim().toUpperCase(),
      });
    }
  }

  return order.map(function (key) {
    const g = groups[key];
    g.results.sort(function (a, b) { return a.rank - b.rank; });
    const finishers = g.results.map(function (f) {
      const o = { rank: f.rank, name: f.name };
      if (f.bib) o.bib = f.bib;
      if (f.school) o.school = f.school;
      if (f.result) o.result = f.result;
      if (f.record) o.record = f.record;
      return o;
    });

    const payload = {
      event_key: g.event_key,
      event_name: g.event_name || g.event_key,
      category: g.category || "",
      results: finishers,
    };
    addIf(payload, "gender", g.gender);
    addIf(payload, "event_type", g.event_type);
    addIf(payload, "heat_label", g.heat_label);
    addIf(payload, "status", g.status);
    addIf(payload, "venue", g.venue);
    addIf(payload, "wind", g.wind);
    addIf(payload, "notes", g.notes);
    addIf(payload, "poc_name", g.poc_name);
    addIf(payload, "poc_phone", g.poc_phone);
    addIf(payload, "scheduled_at", g.scheduled_at);
    addNumber(payload, "day", g.day);
    addNumber(payload, "sort_order", g.sort_order);
    addNumber(payload, "participants_count", g.participants_count);
    if (EVENT_SLUG) payload.event_slug = EVENT_SLUG;
    return payload;
  });
}

/* ── Auto-send trigger (installable on-edit) ──────────────────────────────── */

// Simple on-edit triggers can't call external URLs; an INSTALLABLE one can.
function installTrigger() {
  removeTriggers();
  ScriptApp.newTrigger("onEditHandler")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
  maybeAlert("Auto-send is ON. Every edit now pushes to the live site.");
}

function removeTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "onEditHandler") ScriptApp.deleteTrigger(t);
  });
}

function onEditHandler(e) {
  if (e && e.range && e.range.getSheet().getName() !== SHEET_NAME) return;
  sendToSite(false); // silent — no popup on every edit
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function setMeta(g, key, val) {
  if ((g[key] === undefined || g[key] === "") && val !== "" && val !== null && val !== undefined) {
    g[key] = val;
  }
}
function addIf(obj, key, val) {
  if (val !== undefined && val !== null && val !== "") obj[key] = val;
}
function addNumber(obj, key, val) {
  if (val === undefined || val === null || val === "") return;
  const n = Number(val);
  if (!isNaN(n)) obj[key] = n;
}
function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
// Sheet date/time → ISO in stadium time (IST). Non-dates are skipped.
function toIso(val) {
  const d = val instanceof Date ? val : val ? new Date(val) : null;
  if (!d || isNaN(d.getTime())) return "";
  return Utilities.formatDate(d, "Asia/Kolkata", "yyyy-MM-dd'T'HH:mm:ssXXX");
}
function maybeAlert(msg) {
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (err) {
    Logger.log(msg); // trigger context has no UI
  }
}
