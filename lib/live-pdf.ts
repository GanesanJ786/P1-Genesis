import {
  parseFinishers,
  formatScheduledTime,
  isFinalHeat,
  scheduleComparator,
  displayResult,
  dqShortLabel,
  LIVE_STATUS_LABELS,
  type LiveRow,
  type IndividualResultRow,
} from "@/lib/live";
import { slugify } from "@/lib/utils";

/**
 * Results PDFs — a single round, or a consolidated "all finals" booklet — each
 * with a dark brand header band (Track Fest logo left, Genesis emblem right).
 * jsPDF is imported lazily inside the functions so it never ships in the main
 * page bundle.
 */

// Brand palette (RGB).
const INK: [number, number, number] = [12, 10, 9];
const CREAM: [number, number, number] = [247, 242, 234];
const EMBER: [number, number, number] = [232, 83, 31];
const MUTED: [number, number, number] = [120, 113, 108];
const LINE: [number, number, number] = [230, 225, 218];
const STRIPE: [number, number, number] = [248, 245, 240];

const TABLE_HEAD = [["#", "Bib", "Name", "School / Club", "Result", "Record"]];

// Vertical space the sponsor footer strip (label + logo row) occupies above
// the plain-text footer line — every autoTable call must reserve this as its
// bottom margin, or autoTable's own automatic pagination (which knows
// nothing about drawSponsorFooter) lets table rows run straight through it.
const SPONSOR_FOOTER_RESERVED_H = 38;

type JsPdf = import("jspdf").jsPDF;
type AutoTable = typeof import("jspdf-autotable").default;

/** jsPDF image format from a data-URL mime type (PNG / JPEG / WEBP). */
function imgFormat(dataUrl: string): "PNG" | "JPEG" | "WEBP" {
  const m = dataUrl.match(/^data:image\/(png|jpe?g|webp)/i);
  const f = (m?.[1] ?? "png").toLowerCase();
  if (f === "jpg" || f === "jpeg") return "JPEG";
  if (f === "webp") return "WEBP";
  return "PNG";
}

/** Detect the true image type from its base64 magic bytes (extensions lie). */
function sniffMime(base64: string): string {
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/png";
}

async function loadImageDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    if (!dataUrl) return null;
    // Rebuild the mime from the actual bytes so a mislabelled file (e.g. a JPEG
    // saved as .png) still decodes correctly in jsPDF.
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return dataUrl;
    const payload = dataUrl.slice(comma + 1);
    return `data:${sniffMime(payload)};base64,${payload}`;
  } catch {
    return null;
  }
}

/** Dark header band with both logos + centred title. Returns its height (mm). */
async function drawHeaderBand(
  doc: JsPdf,
  pageW: number,
  eventTitle: string,
  subtitle: string,
): Promise<number> {
  const bandH = 36;
  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(0, 0, pageW, bandH, "F");

  // Left — Coimbatore Track Fest logo on a white chip.
  const festLogo = await loadImageDataUrl("/brand/coimbatore-track-fest-logo.png");
  if (festLogo) {
    const chipX = 8;
    const chipY = 4;
    const chip = 28;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(chipX, chipY, chip, chip, 2, 2, "F");
    doc.addImage(festLogo, imgFormat(festLogo), chipX + 2, chipY + 2, chip - 4, chip - 4);
  }

  // Right — full Genesis logo (mark + wordmark), light artwork on the dark
  // band — the plain emblem alone dropped the "GENESIS SPORTS FOUNDATION"
  // wordmark, which this asset already carries baked in (same one used
  // standalone in Footer.tsx, also over a dark background).
  const genesisLogo = await loadImageDataUrl("/brand/genesis-logo.png");
  if (genesisLogo) {
    const props = doc.getImageProperties(genesisLogo);
    const maxW = 24;
    const maxH = 28;
    const scale = Math.min(maxW / props.width, maxH / props.height);
    const w = props.width * scale;
    const h = props.height * scale;
    doc.addImage(genesisLogo, imgFormat(genesisLogo), pageW - 14 - w, (bandH - h) / 2, w, h);
  }

  const midX = pageW / 2;
  doc.setTextColor(CREAM[0], CREAM[1], CREAM[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(eventTitle.toUpperCase(), midX, 17, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(EMBER[0], EMBER[1], EMBER[2]);
  doc.text(subtitle, midX, 24, { align: "center" });

  return bandH;
}

function metaLine(item: LiveRow): string {
  const m: string[] = [];
  if (item.venue) m.push(`Venue: ${item.venue}`);
  if (item.wind) m.push(`Wind: ${item.wind}`);
  if (item.participants_count) m.push(`Athletes: ${item.participants_count}`);
  m.push(`Day ${item.day}`);
  if (item.scheduled_at) m.push(`Time: ${formatScheduledTime(item.scheduled_at)}`);
  return m.join("      ");
}

function resultRows(item: LiveRow): string[][] {
  const rows = parseFinishers(item.results).map((f) => [
    String(f.rank),
    f.bib ?? "",
    f.name,
    f.school ?? "",
    dqShortLabel(f) || f.result || "",
    f.record ?? "",
  ]);
  return rows.length ? rows : [["", "", "No results recorded yet.", "", "", ""]];
}

/** A disqualified finisher's freetext "Other" note doesn't fit the fixed-width
 *  Result column (dqShortLabel omits it) — printed as a footnote instead. */
function dqFootnotes(item: LiveRow): string[] {
  return parseFinishers(item.results)
    .filter((f) => f.disqualified && f.disqualificationReason === "Other" && f.disqualificationNote)
    .map((f) => `* ${f.name}: ${f.disqualificationNote}`);
}

/** Draws the results table and any DQ footnotes beneath it; returns the Y
 *  position after everything drawn, for callers to place content below it. */
function drawTable(autoTable: AutoTable, doc: JsPdf, item: LiveRow, startY: number): number {
  autoTable(doc, {
    startY,
    head: TABLE_HEAD,
    body: resultRows(item),
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 2.5, textColor: INK, lineColor: LINE, lineWidth: 0.1 },
    headStyles: { fillColor: EMBER, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: STRIPE },
    margin: { top: 16, bottom: SPONSOR_FOOTER_RESERVED_H },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 26, halign: "right", fontStyle: "bold" },
      5: { cellWidth: 20, halign: "center" },
    },
  });

  let y = lastY(doc, startY);
  const footnotes = dqFootnotes(item);
  if (footnotes.length) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    for (const line of footnotes) {
      y += 4;
      doc.text(line, 14, y);
    }
    doc.setFont("helvetica", "normal");
  }
  return y;
}

function lastY(doc: JsPdf, fallback: number): number {
  return (
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? fallback
  );
}

/** A sponsor as needed for the PDF footer — pre-resolved to a real logo URL
 *  (or null) so this module never has to know about Supabase Storage paths. */
export type PdfSponsor = {
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
};

const SPONSOR_CHIP_W_MAX = 28;
const SPONSOR_CHIP_H_MAX = 16;
const SPONSOR_CHIP_W_MIN = 12;
const SPONSOR_CHIP_GAP = 6;
const SPONSOR_CHIP_ASPECT = SPONSOR_CHIP_H_MAX / SPONSOR_CHIP_W_MAX;

type ResolvedSponsor = { sponsor: PdfSponsor; dataUrl: string | null };

/** Fetches every sponsor logo ONCE per document — callers must load this
 *  before a per-page footer loop and reuse the result, rather than calling
 *  it once per page (a multi-page booklet would otherwise re-fetch/re-decode
 *  the same handful of logos once per page for no reason). */
async function loadSponsorLogos(sponsors: PdfSponsor[]): Promise<ResolvedSponsor[]> {
  const dataUrls = await Promise.all(
    sponsors.map((s) => (s.logoUrl ? loadImageDataUrl(s.logoUrl) : null)),
  );
  return sponsors.map((sponsor, i) => ({ sponsor, dataUrl: dataUrls[i] }));
}

/**
 * One-row "PARTNERS" strip anchored to the bottom of the CURRENT page, above
 * the existing plain-text footer line (unchanged, still at pageH - 8) — each
 * major sponsor's logo drawn directly (no background box/border — just the
 * mark itself), scaled object-contain within its slot (mirrors
 * EventSponsors.tsx's LogoPlate normalization, since sponsor logos vary
 * wildly in aspect ratio), or the sponsor's name as plain text if it has no
 * logo / the logo fails to load, so a broken image never silently drops a
 * sponsor. Each logo links to the sponsor's site via doc.link(), same as
 * every logo on the live site being wrapped in a link.
 *
 * Purely synchronous (no fetching) — takes already-resolved logos from
 * loadSponsorLogos() so it's cheap to call once per page.
 *
 * Chip size shrinks (down to a readable floor) so every sponsor fits in one
 * row — a fixed chip size silently truncated the list once there were more
 * sponsors than fit at full size, dropping whichever tiers came last. Only
 * a pathologically long sponsor list (more than fits even at the floor size)
 * truncates, and only then.
 */
function drawSponsorFooterOnPage(
  doc: JsPdf,
  pageW: number,
  pageH: number,
  resolved: ResolvedSponsor[],
): void {
  if (resolved.length === 0) return;

  const available = pageW - 28;
  const fitWidth = (available - (resolved.length - 1) * SPONSOR_CHIP_GAP) / resolved.length;
  const chipW = Math.min(SPONSOR_CHIP_W_MAX, Math.max(SPONSOR_CHIP_W_MIN, fitWidth));
  const chipH = chipW * SPONSOR_CHIP_ASPECT;

  const maxChips = Math.max(1, Math.floor((available + SPONSOR_CHIP_GAP) / (chipW + SPONSOR_CHIP_GAP)));
  const visible = resolved.slice(0, maxChips);

  const ruleY = pageH - 12;
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.line(14, ruleY, pageW - 14, ruleY);

  // Chip row must clear the rule with a real gap — its bottom edge otherwise
  // lands exactly on the rule's Y, cutting through the bottom of any logo
  // tall enough to use the full chip height.
  const chipY = ruleY - 3 - chipH;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text("PARTNERS", 14, chipY - 3);

  let x = 14;
  visible.forEach(({ sponsor, dataUrl }) => {
    if (dataUrl) {
      const props = doc.getImageProperties(dataUrl);
      const scale = Math.min(chipW / props.width, chipH / props.height);
      const w = props.width * scale;
      const h = props.height * scale;
      doc.addImage(
        dataUrl,
        imgFormat(dataUrl),
        x + (chipW - w) / 2,
        chipY + (chipH - h) / 2,
        w,
        h,
      );
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(sponsor.name, x + chipW / 2, chipY + chipH / 2 + 1, {
        align: "center",
        maxWidth: chipW - 2,
      });
    }

    if (sponsor.websiteUrl) {
      doc.link(x, chipY, chipW, chipH, { url: sponsor.websiteUrl });
    }

    x += chipW + SPONSOR_CHIP_GAP;
  });
}

/* -------------------------------------------------------------------------- */
/* Single round                                                               */
/* -------------------------------------------------------------------------- */

export async function downloadRoundPdf(
  item: LiveRow,
  eventTitle: string,
  sponsors: PdfSponsor[] = [],
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const bandH = await drawHeaderBand(doc, pageW, eventTitle, "OFFICIAL RESULTS");

  const roundName = item.heat_label || "Final";
  const heading = `${[item.event_name, item.category, item.gender]
    .filter(Boolean)
    .join(" · ")} — ${roundName}`;
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(heading, 14, bandH + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(metaLine(item), 14, bandH + 19);

  const tableEndY = drawTable(autoTable, doc, item, bandH + 24);

  doc.setFontSize(8);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  const stamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  doc.text(`Generated ${stamp} · gsfteams.com`, 14, Math.min(tableEndY + 10, pageH - 8));

  drawSponsorFooterOnPage(doc, pageW, pageH, await loadSponsorLogos(sponsors));

  doc.save(
    `${slugify(eventTitle)}-${slugify(
      [item.event_name, item.category, item.gender, roundName].filter(Boolean).join(" "),
    )}.pdf`,
  );
}

/* -------------------------------------------------------------------------- */
/* All completed finals — one booklet                                         */
/* -------------------------------------------------------------------------- */

export async function downloadAllFinalsPdf(
  items: LiveRow[],
  eventTitle: string,
  sponsors: PdfSponsor[] = [],
): Promise<void> {
  const finals = items
    .filter((r) => r.status === "completed" && isFinalHeat(r.heat_label))
    .sort(
      (a, b) =>
        a.day - b.day ||
        a.sort_order - b.sort_order ||
        a.event_name.localeCompare(b.event_name),
    );
  if (finals.length === 0) return;

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const bandH = await drawHeaderBand(doc, pageW, eventTitle, "OFFICIAL RESULTS — FINALS");

  let y = bandH + 12;
  for (const item of finals) {
    // Keep a section heading from being orphaned at the foot of a page.
    if (y > pageH - 45) {
      doc.addPage();
      y = 18;
    }
    const heading = `${[item.event_name, item.category, item.gender]
      .filter(Boolean)
      .join(" · ")} — ${item.heat_label || "Final"}`;
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(heading, 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(metaLine(item), 14, y);
    y += 2;

    y = drawTable(autoTable, doc, item, y + 1) + 10;
  }

  // Footer on every page.
  const pages = doc.getNumberOfPages();
  const stamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const resolvedSponsors = await loadSponsorLogos(sponsors);
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`${eventTitle} · Finals · ${stamp}`, 14, pageH - 8);
    doc.text(`Page ${i} of ${pages} · gsfteams.com`, pageW - 14, pageH - 8, {
      align: "right",
    });
    drawSponsorFooterOnPage(doc, pageW, pageH, resolvedSponsors);
  }

  doc.save(`${slugify(eventTitle)}-all-finals.pdf`);
}

/* -------------------------------------------------------------------------- */
/* Qualified lineups — Finals whose lineup is known but haven't run yet       */
/* -------------------------------------------------------------------------- */

/** Every Final currently in "Finalist" status (qualified lineup announced,
 *  not yet run) — same table/footer machinery as the all-finals booklet, but
 *  Result/Record columns are naturally blank since these races haven't
 *  happened yet; this is a "who's through" sheet, not a results sheet. */
export async function downloadQualifiedPdf(
  items: LiveRow[],
  eventTitle: string,
  sponsors: PdfSponsor[] = [],
): Promise<void> {
  const qualified = items
    .filter((r) => r.status === "finalist" && isFinalHeat(r.heat_label))
    .sort(
      (a, b) =>
        a.day - b.day ||
        a.sort_order - b.sort_order ||
        a.event_name.localeCompare(b.event_name),
    );
  if (qualified.length === 0) return;

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const bandH = await drawHeaderBand(doc, pageW, eventTitle, "QUALIFIED FOR FINALS");

  let y = bandH + 12;
  for (const item of qualified) {
    if (y > pageH - 45) {
      doc.addPage();
      y = 18;
    }
    const heading = `${[item.event_name, item.category, item.gender]
      .filter(Boolean)
      .join(" · ")} — ${item.heat_label || "Final"}`;
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(heading, 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(metaLine(item), 14, y);
    y += 2;

    y = drawTable(autoTable, doc, item, y + 1) + 10;
  }

  const pages = doc.getNumberOfPages();
  const stamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const resolvedSponsors = await loadSponsorLogos(sponsors);
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`${eventTitle} · Qualified · ${stamp}`, 14, pageH - 8);
    doc.text(`Page ${i} of ${pages} · gsfteams.com`, pageW - 14, pageH - 8, {
      align: "right",
    });
    drawSponsorFooterOnPage(doc, pageW, pageH, resolvedSponsors);
  }

  doc.save(`${slugify(eventTitle)}-qualified-finals.pdf`);
}

/* -------------------------------------------------------------------------- */
/* Full schedule — every race regardless of status, time/event/venue/POC      */
/* -------------------------------------------------------------------------- */

const SCHEDULE_TABLE_HEAD = [["Time", "Event", "Category", "Round", "Status", "Venue", "POC"]];

function scheduleRow(item: LiveRow): string[] {
  const poc = [item.poc_name, item.poc_phone].filter(Boolean).join(" · ");
  return [
    item.scheduled_at ? formatScheduledTime(item.scheduled_at) : "TBA",
    item.event_name,
    [item.category, item.gender].filter(Boolean).join(" · "),
    item.heat_label || "Final",
    LIVE_STATUS_LABELS[item.status] ?? item.status,
    item.venue || "-",
    poc || "-",
  ];
}

/** The full event timetable — usable and shareable before the meet starts, not
 *  just a "what's next" list, so it deliberately includes every status. */
export async function downloadSchedulePdf(
  items: LiveRow[],
  eventTitle: string,
  sponsors: PdfSponsor[] = [],
): Promise<void> {
  const schedule = [...items].sort(scheduleComparator);
  if (schedule.length === 0) return;

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const bandH = await drawHeaderBand(doc, pageW, eventTitle, "SCHEDULE");

  autoTable(doc, {
    startY: bandH + 10,
    head: SCHEDULE_TABLE_HEAD,
    body: schedule.map(scheduleRow),
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: INK, lineColor: LINE, lineWidth: 0.1 },
    headStyles: { fillColor: EMBER, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: STRIPE },
    margin: { top: 16, bottom: SPONSOR_FOOTER_RESERVED_H },
    columnStyles: {
      0: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
    },
  });

  const pages = doc.getNumberOfPages();
  const stamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const resolvedSponsors = await loadSponsorLogos(sponsors);
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`${eventTitle} · Schedule · ${stamp}`, 14, pageH - 8);
    doc.text(`Page ${i} of ${pages} · gsfteams.com`, pageW - 14, pageH - 8, {
      align: "right",
    });
    drawSponsorFooterOnPage(doc, pageW, pageH, resolvedSponsors);
  }

  doc.save(`${slugify(eventTitle)}-schedule.pdf`);
}

/* -------------------------------------------------------------------------- */
/* Individual results — a school's (or any filtered view's) report            */
/* -------------------------------------------------------------------------- */

const INDIVIDUAL_RESULTS_HEAD = [
  ["Round", "Event", "Category", "Gender", "Pos", "Bib", "Athlete", "Institution", "Result", "Medal"],
];

const MEDAL_LABEL: Record<"Gold" | "Silver" | "Bronze", string> = {
  Gold: "Gold",
  Silver: "Silver",
  Bronze: "Bronze",
};

function individualResultRow(r: IndividualResultRow): string[] {
  return [
    r.round,
    r.event,
    r.category,
    r.gender,
    String(r.rank),
    r.bib ?? "",
    r.name,
    r.school || "",
    displayResult(r) || "",
    r.medal ? MEDAL_LABEL[r.medal] : "",
  ];
}

/** A report for one institute (or whatever the Individual Results tab's
 *  filters currently narrow down to) — landscape, since the row shape has
 *  more columns than the per-round/schedule reports. */
export async function downloadIndividualResultsPdf(
  rows: IndividualResultRow[],
  eventTitle: string,
  scopeLabel: string,
  sponsors: PdfSponsor[] = [],
): Promise<void> {
  if (rows.length === 0) return;

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const bandH = await drawHeaderBand(doc, pageW, eventTitle, scopeLabel.toUpperCase());

  autoTable(doc, {
    startY: bandH + 8,
    head: INDIVIDUAL_RESULTS_HEAD,
    body: rows.map(individualResultRow),
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: INK, lineColor: LINE, lineWidth: 0.1 },
    headStyles: { fillColor: EMBER, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: STRIPE },
    margin: { top: 16, bottom: SPONSOR_FOOTER_RESERVED_H },
    columnStyles: {
      4: { cellWidth: 12, halign: "center" },
      5: { cellWidth: 16, halign: "center" },
      8: { cellWidth: 22, halign: "right", fontStyle: "bold" },
      9: { cellWidth: 20, halign: "center" },
    },
  });

  const pages = doc.getNumberOfPages();
  const stamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const resolvedSponsors = await loadSponsorLogos(sponsors);
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`${eventTitle} · ${scopeLabel} · ${stamp}`, 14, pageH - 8);
    doc.text(`Page ${i} of ${pages} · gsfteams.com`, pageW - 14, pageH - 8, {
      align: "right",
    });
    drawSponsorFooterOnPage(doc, pageW, pageH, resolvedSponsors);
  }

  doc.save(`${slugify(eventTitle)}-${slugify(scopeLabel)}.pdf`);
}
