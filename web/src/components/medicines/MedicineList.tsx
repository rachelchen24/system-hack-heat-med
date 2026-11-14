// Grouped medicine list for /medicines (P4). Outcome first: one plain line per
// medicine; the full evidence lives on /drug/[id] behind "See the evidence".

import Link from "next/link";
import type { Bucket, DrugRecord } from "@lib/types/knowledge-base.ts";
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
  const m = METER[meter];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span aria-hidden className="inline-flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full border border-line-strong ${i <= m.filled ? "bg-ink" : "bg-page"}`}
          />
        ))}
      </span>
      {m.label}
    </span>
  );
}

const borderOnly = (cls: string) => cls.split(" ").filter((c) => c.startsWith("border-")).join(" ");

const COLS = "md:grid md:grid-cols-[minmax(0,2.4fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-4";

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
            <div className="mb-2 flex items-center gap-3">
              <span
                aria-hidden
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${
                  b ? b.solid : "border-line-strong"
                }`}
              >
                {b?.letter ?? "?"}
              </span>
              <div>
                <h2 id={`grp-${g.bucket ?? "none"}`} className="text-xl font-bold leading-tight">
                  {g.bucket ? GROUP_HEADER[g.bucket] : "Not grouped yet"}
                  <span className="ml-2 text-sm font-normal text-ink-muted">
                    {g.rows.length} {g.rows.length === 1 ? "medicine" : "medicines"}
                  </span>
                </h2>
                {b && !b.plain.startsWith(GROUP_HEADER[g.bucket!]) && <p className="text-sm text-ink-muted">{b.plain}</p>}
              </div>
            </div>

            <div className={`hidden border-b border-line px-3 pb-1 text-xs font-semibold text-ink-muted ${COLS}`}>
              <span>Medicine and the risk in heat</span>
              <span>Evidence</span>
              <span>Who prescribes it</span>
              <span>Label warns about heat</span>
              <span>Guidance says what to do</span>
            </div>
            <ul className={`divide-y divide-line rounded-tile border-l-4 text-ink ${b ? borderOnly(b.ink) : "border-line-strong"}`}>
              {g.rows.map(({ drug: d }) => (
                <li key={d.id}>
                  <Link
                    href={`/drug/${encodeURIComponent(d.id)}`}
                    className={`group block px-3 py-3 hover:bg-surface focus-visible:bg-surface ${COLS} md:items-center`}
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
            </ul>
          </section>
        );
      })}
    </div>
  );
}
