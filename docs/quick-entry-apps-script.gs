/**
 * ============================================================================
 * Genesis Live Hub — Quick Result Entry (per-Category group sheets)
 * ============================================================================
 *
 * WHY
 *   The "Results" tab (see live-results-sheet-template.csv) wants one row per
 *   finisher with the full event/athlete details on every row. Re-typing all
 *   of that live, race after race, heat after heat, is what makes event-day
 *   entry slow.
 *
 * WORKFLOW
 *   1. Paste your registration/master list into a tab named "Roster" (see
 *      quick-entry-roster-template.csv for the expected columns — headers
 *      just need to roughly match, punctuation/spacing differences are OK).
 *   1b. OPTIONAL — if you already know how many heats (and semifinals) a
 *      Track event needs (from a separate seeding/lane-draw sheet), add a
 *      tab named "Heat Plan" with columns Category | Event | Heats |
 *      Semis and one row per event you want to override, e.g.
 *      "BOYS12 | 100MTS | 3 | 1" (3 heats, 1 semifinal round, then Final).
 *      Semis is optional — leave it blank/0 for heats-then-final only. Any
 *      Category+Event NOT listed there just falls back to the automatic
 *      heat guess (ceil(entrants / 8)) with no semifinal block. Field
 *      events always ignore this — they never get split into heats.
 *      Update this tab BEFORE step 2 — heat/semis counts only get read at
 *      generation time, not live.
 *   2. Menu "📋 Quick Entry → 1. Generate category sheets from Roster". For
 *      every distinct Category in the roster (e.g. "BOYS12", "GIRLS10") this
 *      creates a SEPARATE TAB named exactly that category, listing every
 *      event that category is registered for. Each event gets one or more
 *      blocks — Track events get "Heat 1", "Heat 2", ... blocks of 8 rows
 *      (count from Heat Plan if you gave one, else guessed) plus a "Final"
 *      block; events with only 1 heat, and all Field events (Jump/Throw/
 *      Put), just get a single "Final" block. This never assigns which
 *      athlete runs in which heat — you decide that on the day; the blocks
 *      are just pre-sized paper/blank slots to write bibs into. Every block
 *      also gets a **Time** cell right on its header row (type the
 *      scheduled time there — optional, shown live on the site once typed)
 *      and, for Field blocks only, a **Started** checkbox (see step 5).
 *      Generating also immediately announces every block to the live site's
 *      Upcoming list — no separate publish click needed (see step 3).
 *   3. Menu "📋 Quick Entry → 2. Re-sync Upcoming schedule (usually
 *      automatic)". Step 2 (generating tabs) already announces every block
 *      to the "Results" tab as a placeholder row (Status "Upcoming", blank
 *      Athlete) and publishes it — this menu item is now just a manual
 *      safety-net re-sync (e.g. if a generation run's auto-publish didn't
 *      finish). Safe to re-run any time: already-announced blocks are
 *      skipped, only new ones get announced.
 *   4. During the event: open the tab for the group currently racing. In a
 *      block, type only the BIB NUMBER as each athlete finishes, in finish
 *      order. Athlete name and School auto-appear (a live formula looks them
 *      up from Roster) and Rank auto-fills as the position among bibs typed
 *      so far in that block. Type the Result (time/distance) yourself, and
 *      Record ("MR"/"NR") if one fell. That's the only typing needed.
 *   5. Menu "📋 Quick Entry → 3. Push category sheets to Results & publish".
 *      Run this any time, including mid-heat: for **Track** blocks, any
 *      block with a typed Bib but no Result yet gets marked Status "Live"
 *      (no reliable "started" signal exists for a race beyond someone
 *      typing a bib). For **Field** blocks, bibs may be listed well before
 *      the competition actually begins, so Live is instead controlled by
 *      the **Started** checkbox on that block's header row — tick it when
 *      the event starts and it goes Live; leave it blank and it stays
 *      Upcoming no matter how many bibs are typed. Separately (both
 *      disciplines), any row with both Bib and Result filled (and not
 *      already pushed) gets appended to the "Results" tab in the exact
 *      grouped format the existing "⚡ Live Site" script expects — carrying
 *      the block's Time along as the Scheduled time — ticks its Pushed
 *      checkbox so re-running never duplicates it, and then immediately
 *      calls the same "Send now" logic to publish those results live — one
 *      click covers both moving the data AND putting it on the live page.
 *      A race never gets downgraded backwards (Completed stays Completed
 *      even if you push again), and Status for a given Event Key always
 *      reflects whichever of Upcoming/Live/Completed was set most recently.
 *
 *   Re-running step 2 (tab generation) is safe: a category tab that already
 *   has any typed bib is left untouched (reported in the summary), never
 *   wiped. Only brand-new or still-empty category tabs get (re)built.
 *
 * SPOT ENTRIES — ADDING A HEAT ON THE DAY
 *   Normally every heat is pre-generated from the Roster (step 2). If a
 *   late/spot entry needs one more heat than planned, open the category tab
 *   it belongs to and run "📋 Quick Entry → Add heat to an event (spot
 *   entries)" — it asks for the Event name, a round label (e.g. "Heat 4"),
 *   and how many bib rows to size it, then appends a fully-wired block
 *   (same Athlete/School/Rank formulas, Time/Started, Pushed checkbox as a
 *   generated one) to the end of that tab. Don't hand-copy an existing
 *   block instead — the hidden Event/Heat columns it depends on are easy to
 *   miss when copy-pasting, and a mismatch there either drops the new rows
 *   silently or folds them into the wrong heat.
 *
 * UPGRADING EXISTING CATEGORY SHEETS
 *   Category sheets generated before the Time/Started columns existed use
 *   an older 9-column layout. Menu "📋 Quick Entry → Upgrade existing sheets
 *   for Time/Started columns" (run once) captures every already-typed Bib/
 *   Result/Record/Pushed value from each old-layout sheet, rebuilds it fresh
 *   with the new layout, and replays those values back into the matching
 *   block/row — nothing typed is lost. Sheets already on the new layout are
 *   skipped automatically, so it's safe to re-run.
 *
 * INSTALL
 *   In the SAME Apps Script project as live-results-apps-script.gs:
 *   Extensions → Apps Script → the "+" next to Files → Script, name it
 *   QuickEntry, paste this whole file, Save. (It reuses that file's
 *   SHEET_NAME/COLS/slugify/maybeAlert/toIso — keep both files in one
 *   project.)
 * ============================================================================
 */

/* ── CONFIG — edit these if your tab/column names differ ────────────────── */

const ROSTER_SHEET_NAME = "Roster";
const HEAT_PLAN_SHEET_NAME = "Heat Plan"; // optional; overrides the guessed heat count
const HEAT_BLOCK_SIZE = 8; // bibs per heat block for Track events
const FIELD_BLOCK_BUFFER = 3; // extra blank rows beyond entrant count
const GROUP_TAB_METADATA_KEY = "GENESIS_CATEGORY_TAB";

const HEAT_PLAN_COLS = {
  category: "CATEGORY",
  event: "EVENT",
  heats: "HEATS",
  semis: "SEMIS", // optional column; 0/blank = no Semifinal blocks
};

// Roster header text we look for (matched loosely — case/spacing/punctuation
// insensitive — so "NAME OF THE : INSTITUTION" still matches "institution").
const ROSTER_COLS = {
  bib: "BIB",
  name: "NAME OF THE ATHLETE",
  father: "FATHER NAME",
  institution: "NAME OF THE INSTITUTION",
  gender: "GENDER",
  category: "CATEGORY",
  event1: "EVENT 1",
  event2: "EVENT 2",
};

// Substring (case-insensitive) → Discipline label, checked in this order.
// Anything that matches none of these is treated as a running/Track event.
const FIELD_EVENT_MAP = [
  ["LONG JUMP", "Long Jump"],
  ["TRIPLE JUMP", "Triple Jump"],
  ["HIGH JUMP", "High Jump"],
  ["SHOT PUT", "Shot Put"],
  ["SHOTPUT", "Shot Put"],
  ["DISCUS", "Discus Throw"],
  ["JAVELIN", "Javelin Throw"],
  ["CRICKET BALL", "Cricket Ball Throw"],
  ["CBT", "Cricket Ball Throw"],
  ["BACK THROW", "Back Throw"],
];

/* ── 1. Generate category sheets from Roster ─────────────────────────────── */

function generateCategoryTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const roster = ss.getSheetByName(ROSTER_SHEET_NAME);
  if (!roster) {
    maybeAlert('No tab named "' + ROSTER_SHEET_NAME + '". Paste your master list there first.');
    return;
  }

  const values = roster.getDataRange().getValues();
  if (values.length < 2) {
    maybeAlert('"' + ROSTER_SHEET_NAME + '" has no data rows.');
    return;
  }

  const headerIdx = mapHeaders(values[0], ROSTER_COLS);
  const missing = Object.keys(ROSTER_COLS).filter(function (k) { return k !== "father" && headerIdx[k] === undefined; });
  if (missing.length) {
    maybeAlert("Roster is missing columns for: " + missing.join(", ") + ". Check quick-entry-roster-template.csv for the expected headers.");
    return;
  }

  const bibColLetter = columnToLetter(headerIdx.bib + 1);
  const nameColLetter = columnToLetter(headerIdx.name + 1);
  const institutionColLetter = columnToLetter(headerIdx.institution + 1);

  const grouped = computeCategoryEventGroups(values, headerIdx);
  if (grouped.categoryOrder.length === 0) {
    maybeAlert("No usable rows found — check Bib/Athlete/Category/Event-1/Event-2 are filled in the roster.");
    return;
  }

  const heatPlan = readHeatPlan(ss);

  const created = [];
  const skipped = [];

  grouped.categoryOrder.slice().sort().forEach(function (category) {
    const existing = ss.getSheetByName(category);
    if (existing && tabHasTypedData(existing)) {
      skipped.push(category);
      return;
    }
    var sheet = existing;
    if (sheet) {
      resetGroupTab(sheet);
    } else {
      sheet = ss.insertSheet(category);
    }
    buildCategorySheet(sheet, category, grouped.groups[category], bibColLetter, nameColLetter, institutionColLetter, heatPlan);
    created.push(category);
  });

  // Auto-sync every heat block to the live site's Upcoming list — folds the
  // old separate "2. Publish schedule" click into generation itself. That
  // menu item still exists as an idempotent safety-net re-sync.
  const announcedCount = announceUpcomingBlocks(ss);

  var msg = "Created/updated " + created.length + " category sheet(s)" + (created.length ? ": " + created.join(", ") : "") + ".";
  if (skipped.length) msg += "\n\nAlready had typed data, left untouched: " + skipped.join(", ") + ".";
  if (announcedCount > 0) msg += "\n\nAnnounced " + announcedCount + " upcoming race(s) to the live site.";
  maybeAlert(msg);

  if (announcedCount > 0) sendToSite(false);
}

/** Groups roster rows into { groups: { category: { event: entrantCount } }, categoryOrder: [...] }. */
function computeCategoryEventGroups(values, headerIdx) {
  const groups = {};
  const categoryOrder = [];

  for (var r = 1; r < values.length; r++) {
    const row = values[r];
    const bib = String(cell(row, headerIdx, "bib")).trim();
    const name = String(cell(row, headerIdx, "name")).trim();
    const category = String(cell(row, headerIdx, "category")).trim();
    if (!bib || !name || !category) continue;

    if (!groups[category]) {
      groups[category] = {};
      categoryOrder.push(category);
    }
    [String(cell(row, headerIdx, "event1")).trim(), String(cell(row, headerIdx, "event2")).trim()]
      .forEach(function (event) {
        if (!event) return;
        groups[category][event] = (groups[category][event] || 0) + 1;
      });
  }

  return { groups: groups, categoryOrder: categoryOrder };
}

/**
 * Reads the optional "Heat Plan" tab into { "category||event": { heats, semis } }.
 * Missing tab, missing columns, or a non-positive Heats value just means "no
 * override for this row" — callers fall back to the automatic guess. Semis
 * defaults to 0 (no Semifinal blocks) if the column or value is missing.
 */
function readHeatPlan(ss) {
  const sheet = ss.getSheetByName(HEAT_PLAN_SHEET_NAME);
  if (!sheet) return {};

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return {};

  const headerIdx = mapHeaders(values[0], HEAT_PLAN_COLS);
  if (headerIdx.category === undefined || headerIdx.event === undefined || headerIdx.heats === undefined) return {};

  const plan = {};
  for (var r = 1; r < values.length; r++) {
    const row = values[r];
    const category = String(cell(row, headerIdx, "category")).trim();
    const event = String(cell(row, headerIdx, "event")).trim();
    const heats = Number(cell(row, headerIdx, "heats"));
    if (!category || !event || !heats || heats < 1) continue;
    const semisRaw = headerIdx.semis !== undefined ? Number(cell(row, headerIdx, "semis")) : 0;
    const semis = semisRaw > 0 ? Math.round(semisRaw) : 0;
    plan[category + "||" + event] = { heats: Math.round(heats), semis: semis };
  }
  return plan;
}

/**
 * Builds the full block layout for one category tab. Plain text (titles,
 * block headers, column headers) is written with one setValues() call.
 * Formulas are written with a SEPARATE setFormulas() call PER BLOCK, scoped
 * to just that block's data rows — never touching header/title/spacer rows.
 * (setFormulas() treats every string it's given as formula syntax, even
 * plain words with no leading "=" — mixing plain header text into it made
 * cells like "Athlete" get evaluated as a formula and show #NAME?.)
 *
 * Columns: A Bib, B Athlete, C School, D Rank, E Result, F Record, G Time,
 * H Started, I Pushed, J(hidden) Event, K(hidden) Heat. Time and Started are
 * typed ONCE per block, directly on that block's (unmerged) header-row G/H
 * cells; every data row in the block just mirrors those two cells via a
 * formula (same trick as the Athlete/School Roster lookups) so the read side
 * never needs to track "which header row does this data row belong to" —
 * every data row is already self-contained, same as the hidden Event/Heat
 * columns. Started is Field-only (a checkbox is only inserted on a Field
 * block's header row) — Track blocks leave it blank/unused since a bib
 * being typed is already the "started" signal for those.
 */
function buildCategorySheet(sheet, category, eventCounts, bibColLetter, nameColLetter, institutionColLetter, heatPlan) {
  const mainRows = [];
  const boldRows = [];
  const mergeRows = [];
  const dataRowRanges = []; // { start, count } per block, for Pushed checkbox insertion + protection
  const formulaBlocks = []; // { start, count, matrix } per block, for Athlete/School/Rank setFormulas
  const mirrorBlocks = []; // { start, count, matrix } per block, for Time/Started mirror setFormulas
  const fieldStartedHeaderRows = []; // header rows needing a Started checkbox (Field blocks only)

  function pushBlankRow() {
    mainRows.push(["", "", "", "", "", "", "", "", "", "", ""]);
  }
  function pushTitleRow() {
    mainRows.push(["Category: " + category, "", "", "", "", "", "", "", "", "", ""]);
    boldRows.push(mainRows.length);
    mergeRows.push(mainRows.length);
  }
  function pushBlockHeaderRow(label) {
    mainRows.push([label, "", "", "", "", "", "", "", "", "", ""]);
    boldRows.push(mainRows.length);
    mergeRows.push(mainRows.length);
    return mainRows.length; // 1-based row number, for the Time/Started mirror formulas
  }
  function pushColumnHeaderRow() {
    // J/K stay blank here (not "Event"/"Heat" labels) so tabHasTypedData's
    // "hidden Event column non-blank = a real data row" check can't
    // false-positive on the header row itself.
    mainRows.push(["Bib", "Athlete", "School", "Rank", "Result", "Record", "Time", "Started", "Pushed", "", ""]);
    boldRows.push(mainRows.length);
  }
  function dataRowFormulas(rowNum, blockStartRow) {
    return [
      '=IFERROR(INDEX(Roster!$' + nameColLetter + ':$' + nameColLetter + ',MATCH($A' + rowNum + ',Roster!$' + bibColLetter + ':$' + bibColLetter + ',0)),"")',
      '=IFERROR(INDEX(Roster!$' + institutionColLetter + ':$' + institutionColLetter + ',MATCH($A' + rowNum + ',Roster!$' + bibColLetter + ':$' + bibColLetter + ',0)),"")',
      '=IF($A' + rowNum + '="","",COUNTIF($A$' + blockStartRow + ':$A' + rowNum + ',"<>"))',
    ];
  }
  // Time: guard against Sheets returning 0 for a bare reference to a blank
  // cell (would otherwise turn "no time typed" into a bogus epoch date
  // downstream). Started is always a checkbox (TRUE/FALSE), never truly
  // blank, so a bare reference is safe there.
  function mirrorFormulas(headerRow, isFieldBlock) {
    return [
      '=IF($G$' + headerRow + '="","",$G$' + headerRow + ')',
      isFieldBlock ? '=$H$' + headerRow : "",
    ];
  }

  pushTitleRow();
  pushBlankRow();

  Object.keys(eventCounts).sort().forEach(function (eventName) {
    const count = eventCounts[eventName];
    if (count <= 0) return;
    const discipline = classifyDiscipline(eventName);
    const isFieldBlock = discipline !== "Track";
    const blocks = [];
    if (discipline === "Track") {
      const plannedEntry = heatPlan[category + "||" + eventName];
      const heats = (plannedEntry && plannedEntry.heats) || Math.ceil(count / HEAT_BLOCK_SIZE);
      const semis = plannedEntry ? plannedEntry.semis : 0;
      if (heats <= 1) {
        blocks.push({ label: "Final", rows: count + FIELD_BLOCK_BUFFER });
      } else {
        for (var h = 1; h <= heats; h++) blocks.push({ label: "Heat " + h, rows: HEAT_BLOCK_SIZE });
        for (var s = 1; s <= semis; s++) blocks.push({ label: "Semifinal " + s, rows: HEAT_BLOCK_SIZE });
        blocks.push({ label: "Final", rows: HEAT_BLOCK_SIZE });
      }
    } else {
      blocks.push({ label: "Final", rows: count + FIELD_BLOCK_BUFFER });
    }

    blocks.forEach(function (block) {
      const headerRow = pushBlockHeaderRow(eventName + " — " + block.label);
      if (isFieldBlock) fieldStartedHeaderRows.push(headerRow);
      pushColumnHeaderRow();
      const blockStartRow = mainRows.length + 1;
      const blockFormulas = [];
      const blockMirrors = [];
      for (var i = 0; i < block.rows; i++) {
        mainRows.push(["", "", "", "", "", "", "", "", false, eventName, block.label]);
        const rowNum = mainRows.length;
        blockFormulas.push(dataRowFormulas(rowNum, blockStartRow));
        blockMirrors.push(mirrorFormulas(headerRow, isFieldBlock));
      }
      dataRowRanges.push({ start: blockStartRow, count: block.rows });
      formulaBlocks.push({ start: blockStartRow, count: block.rows, matrix: blockFormulas });
      mirrorBlocks.push({ start: blockStartRow, count: block.rows, matrix: blockMirrors });
      pushBlankRow();
    });
  });

  const totalRows = mainRows.length;
  sheet.getRange(1, 1, totalRows, 11).setValues(mainRows);
  formulaBlocks.forEach(function (b) { sheet.getRange(b.start, 2, b.count, 3).setFormulas(b.matrix); });
  mirrorBlocks.forEach(function (b) { sheet.getRange(b.start, 7, b.count, 2).setFormulas(b.matrix); });

  boldRows.forEach(function (r) { sheet.getRange(r, 1, 1, 11).setFontWeight("bold"); });
  mergeRows.forEach(function (r) { sheet.getRange(r, 1, 1, 6).merge(); }); // A:F — leaves G/H free on the header row itself
  dataRowRanges.forEach(function (rr) { sheet.getRange(rr.start, 9, rr.count, 1).insertCheckboxes(); }); // I Pushed
  fieldStartedHeaderRows.forEach(function (r) { sheet.getRange(r, 8, 1, 1).insertCheckboxes(); }); // H Started

  sheet.hideColumns(10, 2); // J:K (Event, Heat helper columns)
  sheet.setFrozenRows(1);
  protectFormulaRanges(sheet, totalRows, dataRowRanges);
  markGroupTab(sheet, category);
}

function protectFormulaRanges(sheet, totalRows, dataRowRanges) {
  sheet.getRange(1, 2, totalRows, 3).protect().setWarningOnly(true); // Athlete, School, Rank
  // Time/Started mirror formulas — protect data rows only, never the header
  // row (that's the actual editable input cell for both).
  dataRowRanges.forEach(function (rr) {
    sheet.getRange(rr.start, 7, rr.count, 2).protect().setWarningOnly(true);
  });
  sheet.getRange(1, 10, totalRows, 2).protect().setWarningOnly(true); // hidden Event, Heat
}

/** True if any data row in this (already-generated, new-layout) tab has a typed Bib. */
function tabHasTypedData(sheet) {
  const values = sheet.getDataRange().getValues();
  for (var r = 0; r < values.length; r++) {
    if (String(values[r][9]).trim() && String(values[r][0]).trim()) return true; // col J (Event) + col A (Bib)
  }
  return false;
}

/** Clears an existing-but-empty group tab so it can be rebuilt cleanly. */
function resetGroupTab(sheet) {
  sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) { p.remove(); });
  sheet.createDeveloperMetadataFinder().withKey(GROUP_TAB_METADATA_KEY).find().forEach(function (m) { m.remove(); });
  sheet.showColumns(1, sheet.getMaxColumns());
  sheet.clear();
}

function markGroupTab(sheet, category) {
  sheet.addDeveloperMetadata(GROUP_TAB_METADATA_KEY, category, SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);
}
function isGroupTab(sheet) {
  return sheet.createDeveloperMetadataFinder().withKey(GROUP_TAB_METADATA_KEY).find().length > 0;
}
function groupTabCategory(sheet) {
  const found = sheet.createDeveloperMetadataFinder().withKey(GROUP_TAB_METADATA_KEY).find();
  return found.length ? found[0].getValue() : "";
}

/* ── 2. Publish schedule (mark Upcoming) ──────────────────────────────────── */

/**
 * Announces every not-yet-announced block (Event+Heat) across all category
 * sheets to the Results tab as a single "Upcoming" placeholder row (blank
 * Athlete — same convention live-results-apps-script.gs already documents),
 * carrying that block's Time (if typed) through as Scheduled. Returns the
 * count of newly-announced blocks; does NOT publish — callers decide
 * whether/how to call sendToSite().
 *
 * Since generation now auto-announces immediately (see generateCategoryTabs),
 * Time is always still blank at that exact instant — an operator can only
 * ever type it afterward. So "already announced" alone can't be the skip
 * condition, or a Time typed later would never reach the live site: a block
 * is re-announced (a fresh Upcoming row appended, picked up by the existing
 * "last non-blank value wins" merge in setMeta()) when its Time has changed
 * since the last announcement — but ONLY while it's still Upcoming; a block
 * that's already progressed to Live/Completed is never touched by this,
 * regardless of Time edits, so this can't downgrade it.
 */
function announceUpcomingBlocks(ss) {
  const sheets = ss.getSheets().filter(isGroupTab);
  if (sheets.length === 0) return 0;

  const participantCounts = readParticipantCounts(ss);
  const announced = readEventKeyStatuses(ss);
  const announcedTimes = readEventKeyScheduledTimes(ss);

  const outRows = [];
  var newCount = 0;

  sheets.forEach(function (sheet) {
    const category = groupTabCategory(sheet) || sheet.getName();
    const values = sheet.getDataRange().getValues();
    const seenBlocks = {}; // "event||heat" -> true, dedupes repeated rows within the same block

    for (var r = 0; r < values.length; r++) {
      const row = values[r];
      const eventName = String(row[9]).trim(); // J
      if (!eventName) continue;
      const heat = String(row[10]).trim(); // K
      const blockKey = eventName + "||" + heat;
      if (seenBlocks[blockKey]) continue;
      seenBlocks[blockKey] = true;

      const roundLabel = normalizeHeatLabel(heat || "Final");
      const eventKey = slugify([eventName, category, roundLabel].join(" "));
      const scheduledAt = toIso(row[6]); // G — Time, mirrored from the block header

      if (announced[eventKey] !== undefined) {
        const stillUpcoming = announced[eventKey] === "Upcoming";
        const timeChanged = (announcedTimes[eventKey] || "") !== (scheduledAt || "");
        if (!stillUpcoming || !timeChanged) continue;
      }
      announced[eventKey] = "Upcoming"; // guard against duplicate blocks across tabs in the same run
      announcedTimes[eventKey] = scheduledAt;

      const participants = (participantCounts[category] && participantCounts[category][eventName]) || "";

      outRows.push([
        eventKey, eventName, category, parseGenderFromCategory(category), eventName,
        roundLabel, "", "", "Upcoming", scheduledAt, "", "", participants, "", "", "",
        "", "", "", "", "", "",
      ]);
      newCount++;
    }
  });

  if (newCount === 0) return 0;

  const results = ensureResultsSheet(ss);
  const headers = resultsHeaders();
  results.getRange(results.getLastRow() + 1, 1, outRows.length, headers.length).setValues(outRows);
  return newCount;
}

/**
 * { event_key: lastNonBlankScheduledAt } already written to Results — same
 * "last non-blank value wins" merge as readEventKeyStatuses(), used to
 * detect a Time typed/changed after a block's first Upcoming announcement.
 */
function readEventKeyScheduledTimes(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return {};
  const headerIdx = mapHeaders(values[0], { event_key: COLS.event_key, scheduled_at: COLS.scheduled_at });
  if (headerIdx.event_key === undefined) return {};
  const times = {};
  for (var r = 1; r < values.length; r++) {
    const key = String(cell(values[r], headerIdx, "event_key")).trim();
    if (!key) continue;
    const iso = headerIdx.scheduled_at !== undefined ? toIso(cell(values[r], headerIdx, "scheduled_at")) : "";
    if (iso) times[key] = iso;
  }
  return times;
}

/**
 * Manual safety-net re-sync — "1. Generate category sheets" now calls
 * announceUpcomingBlocks() automatically, so this is normally a no-op. Kept
 * for cases like a generation run's auto-publish not completing, or new
 * category tabs added by some other means.
 */
function publishSchedule() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().filter(isGroupTab);
  if (sheets.length === 0) {
    maybeAlert('No category sheets found yet. Run "1. Generate category sheets from Roster" first.');
    return;
  }

  const newCount = announceUpcomingBlocks(ss);
  if (newCount === 0) {
    maybeAlert("Nothing new to announce — every block already has a Results entry.");
    return;
  }

  maybeAlert("Announced " + newCount + " upcoming race(s) to \"" + SHEET_NAME + "\".\n\nPublishing to the live site now…");
  sendToSite(true);
}

/** { category: { event: entrantCount } } from the current Roster, for the Participants column. */
function readParticipantCounts(ss) {
  const roster = ss.getSheetByName(ROSTER_SHEET_NAME);
  if (!roster) return {};
  const values = roster.getDataRange().getValues();
  if (values.length < 2) return {};
  const headerIdx = mapHeaders(values[0], ROSTER_COLS);
  if (headerIdx.category === undefined) return {};
  return computeCategoryEventGroups(values, headerIdx).groups;
}

/**
 * { event_key: lastNonBlankStatus } already written to Results — mirrors
 * buildPayload()'s own "last non-blank value wins" merge (see setMeta() in
 * live-results-apps-script.gs), so callers can tell not just whether a race
 * has been announced at all, but what its most-recently-set Status is.
 */
function readEventKeyStatuses(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return {};
  const headerIdx = mapHeaders(values[0], { event_key: COLS.event_key, status: COLS.status });
  if (headerIdx.event_key === undefined) return {};
  const statuses = {};
  for (var r = 1; r < values.length; r++) {
    const key = String(cell(values[r], headerIdx, "event_key")).trim();
    if (!key) continue;
    const status = headerIdx.status !== undefined ? String(cell(values[r], headerIdx, "status")).trim() : "";
    if (status) statuses[key] = status;
  }
  return statuses;
}

/* ── 3. Push category sheets to Results ──────────────────────────────────── */

function pushGroupTabsToResults() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().filter(isGroupTab);
  if (sheets.length === 0) {
    maybeAlert('No category sheets found yet. Run "1. Generate category sheets from Roster" first.');
    return;
  }

  const races = {};
  const raceOrder = [];
  const touched = []; // { sheet, row }
  var finisherCount = 0;

  // Any block considered "started" but not yet a completed push is a
  // candidate to announce as "Live". Track has no reliable "started" signal
  // beyond someone typing a bib, so that's still the trigger there. Field
  // events often have bibs listed well before the competition actually
  // begins, so those use the explicit Started checkbox instead — see the
  // loop below for the guards that keep this from ever downgrading an
  // already-Completed race.
  const liveCandidates = {}; // event_key -> { event, category, round, scheduledAt }

  sheets.forEach(function (sheet) {
    const category = groupTabCategory(sheet) || sheet.getName();
    const values = sheet.getDataRange().getValues();
    for (var r = 0; r < values.length; r++) {
      const row = values[r];
      const eventName = String(row[9]).trim(); // J — blank on title/header/spacer rows
      if (!eventName) continue;
      const heat = String(row[10]).trim(); // K
      const bib = String(row[0]).trim();
      const result = String(row[4]).trim();
      const time = row[6]; // G — Time, mirrored from the block header
      const started = row[7] === true; // H — Started, mirrored from the block header (Field only)

      const roundLabel = normalizeHeatLabel(heat || "Final");
      const eventKey = slugify([eventName, category, roundLabel].join(" "));
      const isTrack = classifyDiscipline(eventName) === "Track";

      const startedSignal = isTrack ? !!bib : started;
      if (startedSignal && !liveCandidates[eventKey]) {
        liveCandidates[eventKey] = { event: eventName, category: category, round: roundLabel, scheduledAt: time };
      }

      if (row[8] === true || !bib || !result) continue; // I — Pushed

      if (!races[eventKey]) {
        races[eventKey] = {
          event_key: eventKey,
          event: eventName,
          category: category,
          gender: parseGenderFromCategory(category),
          discipline: eventName,
          round: roundLabel,
          scheduledAt: time,
          finishers: [],
        };
        raceOrder.push(eventKey);
      }
      races[eventKey].finishers.push({
        rank: Number(row[3]) || 999,
        bib: bib,
        name: String(row[1]).trim(),
        school: String(row[2]).trim(),
        result: result,
        record: String(row[5]).trim().toUpperCase(),
      });
      touched.push({ sheet: sheet, row: r + 1 });
      finisherCount++;
    }
  });

  const statuses = readEventKeyStatuses(ss);
  const liveRows = [];
  Object.keys(liveCandidates).forEach(function (key) {
    if (races[key]) return; // becoming Completed in this very run — don't also mark it Live
    if (statuses[key] === "Completed" || statuses[key] === "Live") return; // already there; don't downgrade or re-announce
    const c = liveCandidates[key];
    liveRows.push([
      key, c.event, c.category, parseGenderFromCategory(c.category), c.event,
      c.round, "", "", "Live", toIso(c.scheduledAt), "", "", "", "", "", "", "", "", "", "", "", "",
    ]);
  });

  if (raceOrder.length === 0 && liveRows.length === 0) {
    maybeAlert("Nothing new to push — no typed Bibs, and no rows with both Bib and Result filled (and not already Pushed).");
    return;
  }

  const outRows = [];
  raceOrder.forEach(function (key) {
    const g = races[key];
    g.finishers.sort(function (a, b) { return a.rank - b.rank; });
    const scheduledAt = toIso(g.scheduledAt);
    g.finishers.forEach(function (f, i) {
      // Participants is left blank here (not g.finishers.length) so a race
      // announced via "2. Publish schedule" keeps its true registered count
      // (last-non-blank-value-wins in setMeta) instead of that count
      // shrinking to "how many results have been pushed so far" on every
      // push. If the race was never announced, Participants just stays
      // unset for it — same graceful-degradation as Venue/POC/Notes.
      outRows.push(i === 0
        ? [g.event_key, g.event, g.category, g.gender, g.discipline, g.round, "", "", "Completed", scheduledAt, "", "", "", "", "", "", f.rank, f.bib, f.name, f.school, f.result, f.record]
        : ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", f.rank, f.bib, f.name, f.school, f.result, f.record]
      );
    });
  });
  outRows.push.apply(outRows, liveRows);

  const results = ensureResultsSheet(ss);
  const headers = resultsHeaders();
  results.getRange(results.getLastRow() + 1, 1, outRows.length, headers.length).setValues(outRows);

  touched.forEach(function (t) { t.sheet.getRange(t.row, 9).setValue(true); }); // I — Pushed

  var summary = "Pushed " + raceOrder.length + " race(s), " + finisherCount + " finisher row(s), to \"" + SHEET_NAME + "\".";
  if (liveRows.length) summary += "\nMarked " + liveRows.length + " race(s) as Live (bibs typed, not finished yet).";
  summary += "\n\nPublishing to the live site now…";
  maybeAlert(summary);

  // sendToSite is defined in live-results-apps-script.gs (same Apps Script
  // project) — reused as-is so "push" and "go live" happen in one click.
  sendToSite(true);
}

/* ── Add a heat to an already-generated event (spot entries on the day) ──── */

/**
 * Real meets sometimes get a late/spot entry needing one more heat than what
 * the Roster pre-generated. This is the supported way to add it — hand-
 * copying an existing block breaks the hidden Event/Heat columns
 * pushGroupTabsToResults()/announceUpcomingBlocks() key off (they're
 * invisible, easy to miss when copy-pasting, and a mismatch either silently
 * drops the new rows or folds them into the wrong heat).
 *
 * Always APPENDS the new block to the end of the active category tab, never
 * inserts it mid-sheet next to that event's other heats — inserting rows in
 * the middle would need every later block's protections re-scoped, the same
 * category of risk this project already rejected for the layout-upgrade
 * tool (see upgradeExistingCategorySheets()). The new block is fully wired
 * (Athlete/School/Rank formulas, Time/Started mirrors, Pushed checkboxes) —
 * identical to a block generateCategoryTabs() would have built.
 */
function addHeatToEvent() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (!isGroupTab(sheet)) {
    maybeAlert('Open the category tab (e.g. "BOYS10") you want to add a heat to, then run this again.');
    return;
  }
  const ui = SpreadsheetApp.getUi();

  const eventResp = ui.prompt(
    "Add Heat — Event (1/3)",
    'JUST the event/distance name — e.g. "300M". Do NOT include the heat/round here (that\'s the next question).',
    ui.ButtonSet.OK_CANCEL,
  );
  if (eventResp.getSelectedButton() !== ui.Button.OK) return;
  const eventName = eventResp.getResponseText().trim();
  if (!eventName) return;

  const roundResp = ui.prompt("Add Heat — Round label (2/3)", 'e.g. "Heat 4" or "Final":', ui.ButtonSet.OK_CANCEL);
  if (roundResp.getSelectedButton() !== ui.Button.OK) return;
  const roundLabel = normalizeHeatLabel(roundResp.getResponseText().trim() || "Final");

  const rowsResp = ui.prompt("Add Heat — Slots (3/3)", "How many bib rows should this block have? (default " + HEAT_BLOCK_SIZE + "):", ui.ButtonSet.OK_CANCEL);
  if (rowsResp.getSelectedButton() !== ui.Button.OK) return;
  const rowCount = Number(rowsResp.getResponseText().trim()) || HEAT_BLOCK_SIZE;

  // One last check before writing anything — this exact mix-up (typing the
  // round into the Event answer, e.g. "300M - Heat 4") is what this
  // confirmation is for: it shows precisely what will be created.
  const confirm = ui.alert(
    "Confirm",
    'Create "' + eventName + " — " + roundLabel + '" (' + rowCount + " rows) in \"" + sheet.getName() + '"?' +
    '\n\nIf "' + eventName + '" doesn\'t look like just the event/distance on its own, choose No and start over.',
    ui.ButtonSet.YES_NO,
  );
  if (confirm !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const roster = ss.getSheetByName(ROSTER_SHEET_NAME);
  if (!roster) {
    maybeAlert('No tab named "' + ROSTER_SHEET_NAME + '" — needed for the Athlete/School lookup formulas.');
    return;
  }
  const rosterValues = roster.getDataRange().getValues();
  const headerIdx = mapHeaders(rosterValues[0], ROSTER_COLS);
  if (headerIdx.bib === undefined || headerIdx.name === undefined || headerIdx.institution === undefined) {
    maybeAlert("Roster is missing Bib/Athlete/Institution columns.");
    return;
  }
  const bibColLetter = columnToLetter(headerIdx.bib + 1);
  const nameColLetter = columnToLetter(headerIdx.name + 1);
  const institutionColLetter = columnToLetter(headerIdx.institution + 1);

  const isFieldBlock = classifyDiscipline(eventName) !== "Track";

  // Append after a blank spacer row, same convention as generated blocks.
  const headerRow = sheet.getLastRow() + 2;
  const columnHeaderRow = headerRow + 1;
  const dataStart = headerRow + 2;

  sheet.getRange(headerRow, 1, 1, 11).setValues([[
    eventName + " — " + roundLabel, "", "", "", "", "", "", "", "", "", "",
  ]]);
  sheet.getRange(headerRow, 1, 1, 11).setFontWeight("bold");
  sheet.getRange(headerRow, 1, 1, 6).merge(); // A:F — leaves G/H free for Time/Started, same as a generated block

  sheet.getRange(columnHeaderRow, 1, 1, 11).setValues([[
    "Bib", "Athlete", "School", "Rank", "Result", "Record", "Time", "Started", "Pushed", "", "",
  ]]);
  sheet.getRange(columnHeaderRow, 1, 1, 11).setFontWeight("bold");

  const mainRows = [];
  const formulaRows = [];
  const mirrorRows = [];
  for (var i = 0; i < rowCount; i++) {
    const rowNum = dataStart + i;
    mainRows.push(["", "", "", "", "", "", "", "", false, eventName, roundLabel]);
    formulaRows.push([
      '=IFERROR(INDEX(Roster!$' + nameColLetter + ':$' + nameColLetter + ',MATCH($A' + rowNum + ',Roster!$' + bibColLetter + ':$' + bibColLetter + ',0)),"")',
      '=IFERROR(INDEX(Roster!$' + institutionColLetter + ':$' + institutionColLetter + ',MATCH($A' + rowNum + ',Roster!$' + bibColLetter + ':$' + bibColLetter + ',0)),"")',
      '=IF($A' + rowNum + '="","",COUNTIF($A$' + dataStart + ':$A' + rowNum + ',"<>"))',
    ]);
    mirrorRows.push([
      '=IF($G$' + headerRow + '="","",$G$' + headerRow + ')',
      isFieldBlock ? '=$H$' + headerRow : "",
    ]);
  }
  sheet.getRange(dataStart, 1, rowCount, 11).setValues(mainRows);
  sheet.getRange(dataStart, 2, rowCount, 3).setFormulas(formulaRows);
  sheet.getRange(dataStart, 7, rowCount, 2).setFormulas(mirrorRows);
  sheet.getRange(dataStart, 9, rowCount, 1).insertCheckboxes(); // I Pushed
  if (isFieldBlock) sheet.getRange(headerRow, 8, 1, 1).insertCheckboxes(); // H Started (Field only)

  // Scoped to just the newly added rows — deliberately not touching the
  // sheet's original protections, so there's no overlap to reason about.
  sheet.getRange(dataStart, 2, rowCount, 3).protect().setWarningOnly(true); // Athlete, School, Rank
  sheet.getRange(dataStart, 7, rowCount, 2).protect().setWarningOnly(true); // Time, Started mirror
  sheet.getRange(headerRow, 10, rowCount + 2, 2).protect().setWarningOnly(true); // hidden Event, Heat

  // Announce it immediately — same as generateCategoryTabs() — so there's
  // visible confirmation on the live site right away, instead of silence
  // until someone later types a bib and runs step 3.
  const announcedCount = announceUpcomingBlocks(ss);

  maybeAlert(
    'Added "' + eventName + " — " + roundLabel + '" with ' + rowCount + ' row(s) starting at row ' + dataStart + ' in "' + sheet.getName() + '".' +
    (announcedCount > 0 ? "\n\nAnnounced it to the live site as Upcoming." : "") +
    '\n\nType bibs there as usual, then run "3. Push category sheets to Results & publish".',
  );

  if (announcedCount > 0) sendToSite(false);
}

/* ── Upgrade existing category sheets to the Time/Started layout ─────────── */

/**
 * One-time upgrade for category sheets generated before the Time/Started
 * columns existed (old 9-column layout: ...F Record, G Pushed, H/I hidden
 * Event/Heat). In-place column insertion into a live sheet was rejected —
 * too much risk of Sheets silently expanding an existing header-row merge
 * into the newly inserted columns, or protections not shifting with the
 * insert, with no way to test against the real spreadsheet beforehand.
 * Instead this captures every already-typed value, deletes and rebuilds the
 * sheet via the (now-updated) buildCategorySheet() — the same trusted path
 * fresh tabs use — then replays the captured values back into the matching
 * block/position. Time/Started have nothing to carry over (the columns
 * didn't exist before) and stay blank, ready to type.
 *
 * Safe to re-run: sheets already on the new layout are detected and skipped.
 */
function upgradeExistingCategorySheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().filter(isGroupTab);
  if (sheets.length === 0) {
    maybeAlert("No category sheets found.");
    return;
  }

  const roster = ss.getSheetByName(ROSTER_SHEET_NAME);
  if (!roster) {
    maybeAlert('No tab named "' + ROSTER_SHEET_NAME + '" — needed to rebuild category sheets.');
    return;
  }
  const rosterValues = roster.getDataRange().getValues();
  const headerIdx = mapHeaders(rosterValues[0], ROSTER_COLS);
  const missing = Object.keys(ROSTER_COLS).filter(function (k) { return k !== "father" && headerIdx[k] === undefined; });
  if (missing.length) {
    maybeAlert("Roster is missing columns for: " + missing.join(", ") + ".");
    return;
  }
  const bibColLetter = columnToLetter(headerIdx.bib + 1);
  const nameColLetter = columnToLetter(headerIdx.name + 1);
  const institutionColLetter = columnToLetter(headerIdx.institution + 1);
  const grouped = computeCategoryEventGroups(rosterValues, headerIdx);
  const heatPlan = readHeatPlan(ss);

  const upgraded = [];
  const skippedAlready = [];
  const skippedNoRoster = [];
  const warnings = [];

  sheets.forEach(function (sheet) {
    if (!isOldLayout(sheet)) {
      skippedAlready.push(sheet.getName());
      return;
    }
    const category = groupTabCategory(sheet) || sheet.getName();
    if (!grouped.groups[category]) {
      skippedNoRoster.push(category);
      return;
    }

    const captured = captureOldLayoutData(sheet);

    sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) { p.remove(); });
    ss.deleteSheet(sheet);
    const fresh = ss.insertSheet(category);
    buildCategorySheet(fresh, category, grouped.groups[category], bibColLetter, nameColLetter, institutionColLetter, heatPlan);

    const replay = replayCapturedData(fresh, captured);
    upgraded.push(category + " (" + replay.replayed + "/" + captured.length + " row(s) carried over)");
    if (replay.unmatched.length) {
      warnings.push(category + ": could not place " + replay.unmatched.length + " row(s) — bib(s) " +
        replay.unmatched.map(function (u) { return u.bib; }).join(", "));
    }
  });

  var msg = upgraded.length
    ? "Upgraded " + upgraded.length + " sheet(s):\n" + upgraded.join("\n")
    : "Nothing to upgrade.";
  if (skippedAlready.length) msg += "\n\nAlready on the new layout, skipped: " + skippedAlready.join(", ") + ".";
  if (skippedNoRoster.length) msg += "\n\nNo matching Roster entries, skipped: " + skippedNoRoster.join(", ") + ".";
  if (warnings.length) msg += "\n\n⚠️ Check manually (Roster/Heat Plan may have changed since these were generated):\n" + warnings.join("\n");
  maybeAlert(msg);
}

/** Old layout's column-header row has "Pushed" in G; new layout has "Time" there. */
function isOldLayout(sheet) {
  const values = sheet.getDataRange().getValues();
  for (var r = 0; r < values.length; r++) {
    const g = String(values[r][6]).trim();
    if (g === "Pushed") return true;
    if (g === "Time") return false;
  }
  return false; // no column-header row found — nothing to upgrade
}

/** Captures every typed data row from an OLD-layout (9-col) sheet, keyed by block + position within it. */
function captureOldLayoutData(sheet) {
  const values = sheet.getDataRange().getValues();
  const positionByBlock = {}; // "event||heat" -> running count, mirrors sheet order
  const captured = [];
  for (var r = 0; r < values.length; r++) {
    const row = values[r];
    const eventName = String(row[7]).trim(); // old hidden Event = H
    if (!eventName) continue;
    const heat = String(row[8]).trim(); // old hidden Heat = I
    const bib = String(row[0]).trim();
    if (!bib) continue; // nothing typed in this data row
    const blockKey = eventName + "||" + heat;
    const position = (positionByBlock[blockKey] = (positionByBlock[blockKey] || 0) + 1);
    captured.push({
      event: eventName,
      heat: heat,
      position: position,
      bib: bib,
      result: String(row[4]).trim(),
      record: String(row[5]).trim(),
      pushed: row[6] === true, // old Pushed = G
    });
  }
  return captured;
}

/** Replays captured old-layout rows into the matching block/position of a freshly-built (new-layout) sheet. */
function replayCapturedData(sheet, captured) {
  const values = sheet.getDataRange().getValues();
  const slotsByBlock = {}; // "event||heat" -> [0-based row index, ...] in sheet order
  for (var r = 0; r < values.length; r++) {
    const eventName = String(values[r][9]).trim(); // new hidden Event = J
    if (!eventName) continue;
    const heat = String(values[r][10]).trim(); // new hidden Heat = K
    const blockKey = eventName + "||" + heat;
    (slotsByBlock[blockKey] = slotsByBlock[blockKey] || []).push(r);
  }

  var replayed = 0;
  const unmatched = [];
  captured.forEach(function (c) {
    const slots = slotsByBlock[c.event + "||" + c.heat];
    const rowIdx = slots && slots[c.position - 1];
    if (rowIdx === undefined) {
      unmatched.push(c);
      return;
    }
    const rowNum = rowIdx + 1;
    sheet.getRange(rowNum, 1).setValue(c.bib); // A Bib — Athlete/School/Rank formulas react automatically
    sheet.getRange(rowNum, 5).setValue(c.result); // E Result
    sheet.getRange(rowNum, 6).setValue(c.record); // F Record
    sheet.getRange(rowNum, 9).setValue(c.pushed); // I Pushed
    replayed++;
  });

  return { replayed: replayed, unmatched: unmatched };
}

function parseGenderFromCategory(category) {
  if (/BOY/i.test(category)) return "Boys";
  if (/GIRL/i.test(category)) return "Girls";
  return "";
}

// Reuses COLS from live-results-apps-script.gs so header text can't drift.
// A function (not a top-level const) so it doesn't depend on file load order.
function resultsHeaders() {
  return [
    COLS.event_key, COLS.event_name, COLS.category, COLS.gender, COLS.event_type,
    COLS.heat_label, COLS.day, COLS.sort_order, COLS.status, COLS.scheduled_at,
    COLS.venue, COLS.wind, COLS.participants_count, COLS.poc_name, COLS.poc_phone,
    COLS.notes, COLS.rank, COLS.bib, COLS.name, COLS.school, COLS.result, COLS.record,
  ];
}

function ensureResultsSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = resultsHeaders();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function classifyDiscipline(eventName) {
  const upper = eventName.toUpperCase();
  for (var i = 0; i < FIELD_EVENT_MAP.length; i++) {
    if (upper.indexOf(FIELD_EVENT_MAP[i][0]) !== -1) return FIELD_EVENT_MAP[i][1];
  }
  return "Track";
}

function normalizeHeatLabel(heat) {
  const t = heat.trim();
  var m = /^h\s*-?\s*(\d+)$/i.exec(t);
  if (m) return "Heat " + m[1];
  m = /^sf\s*-?\s*(\d+)?$/i.exec(t);
  if (m) return "Semifinal" + (m[1] ? " " + m[1] : "");
  if (/^f(inal)?$/i.test(t)) return "Final";
  return t;
}

function toTitleCase(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

// Normalizes header text (case/whitespace/punctuation insensitive) and maps
// each `wanted` key to the column index whose header matches, if any.
function mapHeaders(headerRow, wanted) {
  const norm = function (s) { return String(s).toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim(); };
  const byNorm = {};
  headerRow.forEach(function (h, i) { byNorm[norm(h)] = i; });
  const out = {};
  Object.keys(wanted).forEach(function (key) {
    const target = norm(wanted[key]);
    if (target in byNorm) out[key] = byNorm[target];
  });
  return out;
}

function cell(row, headerIdx, key) {
  const i = headerIdx[key];
  return i === undefined || row[i] === null || row[i] === undefined ? "" : row[i];
}

// 1-based column number -> A1 letter(s), e.g. 1 -> "A", 27 -> "AA".
function columnToLetter(col) {
  var letter = "";
  while (col > 0) {
    var rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}
