import {
  parseFinishers,
  formatScheduledTime,
  isFinalHeat,
  scheduleComparator,
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

  // Right — Genesis emblem (light artwork, reads on the dark band).
  const genesisLogo = await loadImageDataUrl("/brand/genesis-emblem.png");
  if (genesisLogo) {
    const w = 30;
    const h = 15;
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
    f.result ?? "",
    f.record ?? "",
  ]);
  return rows.length ? rows : [["", "", "No results recorded yet.", "", "", ""]];
}

function drawTable(autoTable: AutoTable, doc: JsPdf, item: LiveRow, startY: number): void {
  autoTable(doc, {
    startY,
    head: TABLE_HEAD,
    body: resultRows(item),
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 2.5, textColor: INK, lineColor: LINE, lineWidth: 0.1 },
    headStyles: { fillColor: EMBER, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: STRIPE },
    margin: { top: 16 },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 26, halign: "right", fontStyle: "bold" },
      5: { cellWidth: 20, halign: "center" },
    },
  });
}

function lastY(doc: JsPdf, fallback: number): number {
  return (
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? fallback
  );
}

/* -------------------------------------------------------------------------- */
/* Single round                                                               */
/* -------------------------------------------------------------------------- */

export async function downloadRoundPdf(item: LiveRow, eventTitle: string): Promise<void> {
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

  drawTable(autoTable, doc, item, bandH + 24);

  doc.setFontSize(8);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  const stamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  doc.text(`Generated ${stamp} · gsfteams.com`, 14, Math.min(lastY(doc, bandH + 24) + 10, pageH - 8));

  doc.save(
    `${slugify(eventTitle)}-${slugify(
      [item.event_name, item.category, item.gender, roundName].filter(Boolean).join(" "),
    )}.pdf`,
  );
}

/* -------------------------------------------------------------------------- */
/* All completed finals — one booklet                                         */
/* -------------------------------------------------------------------------- */

export async function downloadAllFinalsPdf(items: LiveRow[], eventTitle: string): Promise<void> {
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

    drawTable(autoTable, doc, item, y + 1);
    y = lastY(doc, y) + 10;
  }

  // Footer on every page.
  const pages = doc.getNumberOfPages();
  const stamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`${eventTitle} · Finals · ${stamp}`, 14, pageH - 8);
    doc.text(`Page ${i} of ${pages} · gsfteams.com`, pageW - 14, pageH - 8, {
      align: "right",
    });
  }

  doc.save(`${slugify(eventTitle)}-all-finals.pdf`);
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
export async function downloadSchedulePdf(items: LiveRow[], eventTitle: string): Promise<void> {
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
    margin: { top: 16 },
    columnStyles: {
      0: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
    },
  });

  const pages = doc.getNumberOfPages();
  const stamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`${eventTitle} · Schedule · ${stamp}`, 14, pageH - 8);
    doc.text(`Page ${i} of ${pages} · gsfteams.com`, pageW - 14, pageH - 8, {
      align: "right",
    });
  }

  doc.save(`${slugify(eventTitle)}-schedule.pdf`);
}

/* -------------------------------------------------------------------------- */
/* Individual results — a school's (or any filtered view's) report            */
/* -------------------------------------------------------------------------- */

const INDIVIDUAL_RESULTS_HEAD = [
  ["Round", "Event", "Category", "Gender", "Bib", "Athlete", "Institution", "Result", "Medal"],
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
    r.bib ?? "",
    r.name,
    r.school || "",
    r.result || "",
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
    margin: { top: 16 },
    columnStyles: {
      4: { cellWidth: 16, halign: "center" },
      7: { cellWidth: 22, halign: "right", fontStyle: "bold" },
      8: { cellWidth: 20, halign: "center" },
    },
  });

  const pages = doc.getNumberOfPages();
  const stamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`${eventTitle} · ${scopeLabel} · ${stamp}`, 14, pageH - 8);
    doc.text(`Page ${i} of ${pages} · gsfteams.com`, pageW - 14, pageH - 8, {
      align: "right",
    });
  }

  doc.save(`${slugify(eventTitle)}-${slugify(scopeLabel)}.pdf`);
}
