"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Building2, Download, ListFilter, Loader2, Share2, Trophy } from "lucide-react";
import { dqFullReason, displayResult, isDisqualified, isFinalHeat, type IndividualResultRow } from "@/lib/live";
import { Button } from "@/components/ui/Button";

/** One Event/Category/Gender/Round section within the results list — built
 *  by scanning consecutive rows for a changed key, not re-sorting, since
 *  `rows` already arrives pre-sorted by exactly this key (computeIndividualResults).
 *  Without this grouping, a flat list only distinguished one race from the
 *  next by a tiny inline label, which read as one long undifferentiated
 *  scroll — especially where a Boys group's rows end and a Girls group's
 *  rows begin right below with no visual break. */
type ResultGroup = {
  key: string;
  round: string;
  event: string;
  category: string;
  gender: string;
  items: IndividualResultRow[];
};

function groupConsecutive(items: IndividualResultRow[]): ResultGroup[] {
  const groups: ResultGroup[] = [];
  for (const r of items) {
    const key = `${r.event}|${r.category}|${r.gender}|${r.round}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(r);
    } else {
      groups.push({ key, round: r.round, event: r.event, category: r.category, gender: r.gender, items: [r] });
    }
  }
  return groups;
}
import type { PdfSponsor } from "@/lib/live-pdf";

const PAGE_SIZE = 50;

// Above this, warn before generating — a full completed meet with every
// filter cleared can be 1000+ rows, and even a single round-stage scope
// (e.g. "Winners" — every medalist across the whole meet) can still run
// into the hundreds. Even chunked (see drawChunkedTable in lib/live-pdf.ts)
// that genuinely takes a while on a weak phone. This is a heads-up, not a
// hard block — "Download anyway" still proceeds. Kept low enough to catch
// any single-round-stage "whole meet" scope, not just the fully-unfiltered
// worst case.
const LARGE_PDF_ROW_THRESHOLD = 200;

const MEDALS: Record<"Gold" | "Silver" | "Bronze", string> = {
  Gold: "🥇",
  Silver: "🥈",
  Bronze: "🥉",
};

export type RoundFilter = "all" | "heats" | "semis" | "finalists" | "winners";
const ROUND_FILTERS: { key: RoundFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "heats", label: "Heats" },
  { key: "semis", label: "Semis" },
  { key: "finalists", label: "Finalists" },
  { key: "winners", label: "Winners" },
];

function matchesRoundFilter(r: IndividualResultRow, filter: RoundFilter): boolean {
  if (filter === "all") return true;
  if (filter === "heats") return /heat/i.test(r.round);
  if (filter === "semis") return /semi/i.test(r.round);
  if (filter === "finalists") return isFinalHeat(r.round); // every athlete who reached the final, any placing
  return r.medal !== null; // "winners" — medal-eligible only
}

/** WhatsApp/native-share text — one line per result, same convention as the
 *  Schedule tab's share (no length cap; the filters are how you narrow it
 *  down to something worth sending, e.g. one institute's results). */
function buildShareText(rows: IndividualResultRow[], scopeLabel: string, eventTitle: string, url: string): string {
  const lines = rows.map((r) => {
    const medal = r.medal ? `${MEDALS[r.medal]} ` : "";
    const bib = r.bib ? `${r.bib} ` : "";
    const meta = [r.event, r.category, r.gender, r.round].filter(Boolean).join(" · ");
    const resultText = displayResult(r);
    const mark = resultText ? ` — ${resultText}` : "";
    return `${r.rank}. ${medal}${bib}${r.name.toUpperCase()} (${(r.school || "Unattached").toUpperCase()})${mark} [${meta}]`;
  });
  return [`🏆 ${eventTitle} — ${scopeLabel}`, ...lines, `Full results: ${url}`].join("\n");
}

const selectClass =
  "w-full appearance-none rounded-lg border border-white/15 bg-ink py-2.5 pl-9 pr-3 text-sm text-cream focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember";

function FilterSelect({
  icon: Icon,
  label,
  value,
  options,
  onChange,
  optionsUppercase = false,
}: {
  icon: typeof Building2;
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
  /** Institution names read better in caps, matching the uppercase treatment
   *  used everywhere else a school/club name appears. Transforms only the
   *  visible option text — `value` stays the original string so filtering
   *  (which compares against each row's raw, non-uppercased r.school) still
   *  matches correctly. */
  optionsUppercase?: boolean;
}) {
  return (
    <div className="relative">
      <Icon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sand/50" />
      <select
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={selectClass}
      >
        <option value="">All {label}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {optionsUppercase ? o.toUpperCase() : o}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Every posted performance, filterable by Institution/Category/Event plus a
 * Round stage (Heats/Semis/Finalists/Winners) — built so one institute can
 * pull up just their own athletes and generate a shareable/printable report,
 * not just browse. Cards, not a table — this page's users are overwhelmingly
 * on mobile, and a wide multi-column table forces horizontal scrolling that
 * hides exactly the columns (Category, Result, Medal) a report reader needs.
 */
export function IndividualResultsList({
  rows,
  institutions,
  categories,
  events,
  institution,
  category,
  event,
  round,
  onInstitutionChange,
  onCategoryChange,
  onEventChange,
  onRoundChange,
  eventTitle,
  sponsors,
}: {
  rows: IndividualResultRow[];
  institutions: string[];
  categories: string[];
  events: string[];
  institution: string | null;
  category: string | null;
  event: string | null;
  round: RoundFilter;
  onInstitutionChange: (v: string | null) => void;
  onCategoryChange: (v: string | null) => void;
  onEventChange: (v: string | null) => void;
  onRoundChange: (v: RoundFilter) => void;
  eventTitle: string;
  sponsors: PdfSponsor[];
}) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [showLargeDownloadWarning, setShowLargeDownloadWarning] = useState(false);

  // Not every meet uses every round stage (e.g. a meet with no Semifinals
  // anywhere) — only offer a round chip when at least one row actually
  // matches it, same reasoning as why the Institution/Category/Event
  // dropdowns are built from real data rather than a fixed list.
  const availableRoundFilters = ROUND_FILTERS.filter(
    (f) => f.key === "all" || rows.some((r) => matchesRoundFilter(r, f.key)),
  );

  const filtered = rows.filter(
    (r) =>
      (!institution || r.school === institution) &&
      (!category || r.category === category) &&
      (!event || r.event === event) &&
      matchesRoundFilter(r, round),
  );

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // A stale page offset after narrowing the filters could show 0 rows even
  // though matches exist further down the (now much shorter) list — reset
  // to the first page whenever any filter changes. Adjusted during render
  // (not an effect) per React's "adjusting state when props change" pattern.
  const filterKey = `${institution ?? ""}|${category ?? ""}|${event ?? ""}|${round}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const visible = filtered.slice(0, visibleCount);
  const groups = groupConsecutive(visible);
  const scopeLabel = institution ?? "All Individual Results";

  const share = async () => {
    const text = buildShareText(filtered, scopeLabel, eventTitle, window.location.href);
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        return; // dismissed — nothing to do
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const generatePdf = async () => {
    setPdfBusy(true);
    try {
      const { downloadIndividualResultsPdf } = await import("@/lib/live-pdf");
      await downloadIndividualResultsPdf(filtered, eventTitle, scopeLabel, sponsors);
    } finally {
      setPdfBusy(false);
    }
  };

  const downloadPdf = () => {
    if (filtered.length > LARGE_PDF_ROW_THRESHOLD) {
      setShowLargeDownloadWarning(true);
      return;
    }
    generatePdf();
  };

  return (
    <>
    <section aria-label="Individual results">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="eyebrow">All Individual Results</p>
        {filtered.length > 0 ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-sand transition-colors hover:bg-white/10 hover:text-cream"
            >
              <Share2 size={12} /> Share
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={pdfBusy}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-sand transition-colors hover:bg-white/10 hover:text-cream disabled:opacity-50"
            >
              {pdfBusy ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              PDF
            </button>
          </div>
        ) : null}
      </div>

      <div className="mb-3 grid gap-2.5 sm:grid-cols-3">
        <FilterSelect
          icon={Building2}
          label="Institutions"
          value={institution}
          options={institutions}
          onChange={onInstitutionChange}
          optionsUppercase
        />
        <FilterSelect
          icon={ListFilter}
          label="Categories"
          value={category}
          options={categories}
          onChange={onCategoryChange}
        />
        <FilterSelect icon={Trophy} label="Events" value={event} options={events} onChange={onEventChange} />
      </div>

      <div className="snap-rail -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
        {availableRoundFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => onRoundChange(f.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
              round === f.key
                ? "bg-ember text-white shadow-sm shadow-ember/30"
                : "bg-ink-soft text-sand hover:text-cream"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-sand/10 bg-ink-soft px-6 py-10 text-center text-sm text-sand">
          No results match these filters.
        </p>
      ) : (
        <>
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.key}>
                <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-sand/10 pb-2">
                  <span className="shrink-0 rounded bg-ember/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-ember">
                    {g.round}
                  </span>
                  <h4 className="font-display text-base uppercase leading-tight text-cream">
                    {g.event}
                  </h4>
                  <span className="text-xs text-sand/60">
                    {g.category} · {g.gender}
                  </span>
                </div>
                <div className="space-y-2">
                  {g.items.map((r, i) => (
                    <div
                      key={`${r.rowId}-${r.rank}-${r.bib ?? r.name}-${i}`}
                      className={`rounded-xl px-3 py-3 ${
                        r.medal ? "bg-amber-500/10 ring-1 ring-amber-500/20" : "bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold tabular-nums text-sand">
                          {r.rank}
                        </span>
                        {r.bib ? (
                          <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums text-sand">
                            {r.bib}
                          </span>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-cream">
                            <span className="truncate uppercase">{r.name}</span>
                            {isDisqualified(r) ? (
                              <span
                                className="shrink-0 rounded bg-rose-500/20 px-1.5 py-0.5 text-[0.65rem] font-bold text-rose-400"
                                title={dqFullReason(r) ?? "Disqualified"}
                              >
                                DQ
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate text-xs uppercase text-sand/70">{r.school || "Unattached"}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={`text-sm font-bold tabular-nums ${
                              isDisqualified(r) ? "text-rose-400" : "text-ember"
                            }`}
                          >
                            {displayResult(r) || "—"}
                          </p>
                          {r.medal ? <p className="text-xs">{MEDALS[r.medal]}</p> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-sand/60">
            Showing {visible.length} of {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </p>
          {visibleCount < filtered.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
              className="mt-1 text-xs font-semibold text-ember hover:text-ember-bright"
            >
              Load more
            </button>
          ) : null}
        </>
      )}
    </section>

    {showLargeDownloadWarning
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
            onClick={() => setShowLargeDownloadWarning(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-sand/15 bg-ink-soft p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ember/15 text-ember">
                  <AlertTriangle size={20} />
                </span>
                <div>
                  <p className="font-display text-base uppercase tracking-wide text-cream">
                    Large download
                  </p>
                  <p className="mt-1.5 text-sm text-sand">
                    This report has{" "}
                    <span className="font-semibold text-cream">{filtered.length}</span>{" "}
                    results and may take a while — or fail — on some phones. Narrow it
                    down with the filters above, or continue anyway.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLargeDownloadWarning(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShowLargeDownloadWarning(false);
                    generatePdf();
                  }}
                >
                  Download anyway
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null}
    </>
  );
}
