// Grouped medicine list for /medicines (P4). Outcome first: one plain line per
// medicine; the full evidence lives on /drug/[id] behind "See the evidence".

import Link from "next/link";
import type { Bucket, DrugRecord } from "@lib/types/knowledge-base.ts";
import { Card } from "@/components/ui/card";
import { BUCKETS, BUCKET_ORDER, METER } from "@/lib/ui";
import { GROUP_HEADER, guidanceSaysWhatToDo, labelWarnsAboutHeat, prescriberText } from "./plain";

export interface MedicineRow {
  drug: DrugRecord;
  bucket: Bucket | null;
}

function YesNo({ value, yes, no }: { value: boolean | null; yes: string; no: string }) {
  if (value === null)
    return (
      <span className="text-sm text-missing" title="Not checked yet">
        —<span className="sr-only">Not checked yet</span>
      </span>
    );
  return value ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
      <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-page">
        ✓
      </span>
      {yes}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
      <span
        aria-hidden
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line-strong text-xs"
      >
        ✗
      </span>
      {no}
    </span>
  );
}

function Strength({ meter }: { meter: DrugRecord["evidence"]["meter"] | undefined }) {
  if (!meter || !METER[meter]) return <span className="text-sm text-missing">—</span>;
  return <span className="inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold border-line-strong bg-surface text-ink">{METER[meter].label}</span>;
}

const COLS = "md:grid md:grid-cols-[minmax(0,2.4fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-4";

const BAR: Record<string, string> = { hold_or_substitute: "hold", adjust_dose: "adjust", monitor: "monitor", storage: "store" };

export function MedicineList({ rows }: { rows: MedicineRow[] }) {
  const groups: { bucket: Bucket | null; rows: MedicineRow[] }[] = [
    ...BUCKET_ORDER.map((b) => ({ bucket: b as Bucket | null, rows: rows.filter((r) => r.bucket === b) })),
    { bucket: null, rows: rows.filter((r) => !r.bucket) },
  ].filter((g) => g.rows.length > 0);

  return (
    <div className="space-y-8">
      {groups.map((g) => {
        const b = g.bucket ? BUCKETS[g.bucket] : null;
        return (
          <section key={g.bucket ?? "none"} aria-labelledby={`grp-${g.bucket ?? "none"}`}>
            <div className="mb-3 flex items-center gap-3">
              <span aria-hidden className={`h-3 w-3 shrink-0 rounded-full border ${b ? b.solid : "border-line-strong"}`} />
              <h2 id={`grp-${g.bucket ?? "none"}`} className="text-xl font-semibold">
                {g.bucket ? GROUP_HEADER[g.bucket] : "Not grouped yet"}
                <span className="ml-2 text-sm font-normal text-ink-muted">
                  {g.rows.length} {g.rows.length === 1 ? "medicine" : "medicines"}
                </span>
              </h2>
            </div>
            {b && !b.plain.startsWith(GROUP_HEADER[g.bucket!]) && <p className="-mt-2 mb-3 pl-6 text-sm text-ink-muted">{b.plain}</p>}

            <div className={`hidden px-4 pb-1 text-xs text-ink-muted ${COLS}`}>
              <span>Medicine and the risk in heat</span>
              <span>Evidence</span>
              <span>Who prescribes it</span>
              <span>Label warns about heat</span>
              <span>Guidance says what to do</span>
            </div>
            <Card
              className="overflow-hidden border-line border-l-4"
              style={{ borderLeftColor: g.bucket ? `var(--bucket-${BAR[g.bucket] ?? "hold"}-ink)` : "var(--ui-line-strong)" }}
            ><ul className="divide-y divide-line text-ink">
              {g.rows.map(({ drug: d }) => (
                <li key={d.id}>
                  <Link
                    href={`/drug/${encodeURIComponent(d.id)}`}
                    className={`group block px-4 py-3 hover:bg-surface focus-visible:bg-surface ${COLS} md:items-center`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink underline-offset-2 group-hover:underline">
                        {d.names?.display ?? d.id}
                        <span aria-hidden className="ml-1 text-ink-muted">
                          ›
                        </span>
                      </p>
                      <p className="text-sm text-ink-muted">{d.label_line || "No plain summary yet"}</p>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 md:contents">
                      <div className="md:block">
                        <dt className="text-xs text-ink-muted md:sr-only">Evidence</dt>
                        <dd>
                          <Strength meter={d.evidence?.meter} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-muted md:sr-only">Who prescribes it</dt>
                        <dd className="text-sm">{prescriberText(d) || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-muted md:sr-only">Label warns about heat</dt>
                        <dd>
                          <YesNo value={labelWarnsAboutHeat(d)} yes="Yes" no="No" />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-muted md:sr-only">Guidance says what to do</dt>
                        <dd>
                          <YesNo value={guidanceSaysWhatToDo(d)} yes="Yes" no="No" />
                        </dd>
                      </div>
                    </dl>
                  </Link>
                </li>
              ))}
            </ul></Card>
          </section>
        );
      })}
    </div>
  );
}
