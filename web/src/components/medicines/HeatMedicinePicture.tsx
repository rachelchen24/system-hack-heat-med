"use client";

// "How heat and medicine add up" (P5): medicines → body effect ← heat.
// Line thickness = number of studies in the System graph. Click a line for "Why?".
// Three colors only: grey (medicine studies), orange (heat studies), ink (selected).

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PathwayData } from "./pathways";

const C_DRUG = "#6b6b66"; // neutral grey, medicine → effect
const C_HEAT = "#d55e00"; // --bucket-hold-solid / --risk-high, heat → effect
const C_SEL = "#141414"; // --ui-ink, the selected line

type Sel = { kind: "drug"; drug: string; effect: string } | { kind: "heat"; effect: string } | null;

const W = 760;
const ROW = 30;
const TOP = 40;
const X_DRUG = 268; // right edge of medicine labels
const X_EFF_L = 346;
const X_EFF_R = 496;
const X_HEAT = 612;

export function HeatMedicinePicture({ data, title, source }: { data: PathwayData; title: string; source: string }) {
  const [sel, setSel] = useState<Sel>(null);
  const [hoverDrug, setHoverDrug] = useState<string | null>(null);

  const maxStudies = useMemo(
    () => Math.max(1, ...data.links.map((l) => l.drugStudies), ...data.effects.map((e) => e.heatStudies)),
    [data],
  );
  const width = (n: number) => 1.5 + 10 * Math.sqrt(n / maxStudies);

  // Order medicines by the average position of the effects they link to: fewer crossings.
  const effIndex = new Map(data.effects.map((e, i) => [e.id, i]));
  const drugs = useMemo(() => {
    const score = (id: string) => {
      const ls = data.links.filter((l) => l.drug === id);
      if (ls.length === 0) return 99;
      const tot = ls.reduce((s, l) => s + l.drugStudies, 0);
      return ls.reduce((s, l) => s + (effIndex.get(l.effect) ?? 0) * l.drugStudies, 0) / tot;
    };
    return [...data.drugs].sort((a, b) => score(a.id) - score(b.id));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const H = TOP + drugs.length * ROW + 10;
  const yDrug = new Map(drugs.map((d, i) => [d.id, TOP + i * ROW + ROW / 2]));
  const effGap = (drugs.length * ROW) / data.effects.length;
  const yEff = new Map(data.effects.map((e, i) => [e.id, TOP + i * effGap + effGap / 2]));
  const yHeat = TOP + (drugs.length * ROW) / 2;
  const drugLabel = new Map(data.drugs.map((d) => [d.id, d.label]));
  const effLabel = new Map(data.effects.map((e) => [e.id, e.label]));

  const curve = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  };

  const isSel = (k: Sel) =>
    !!sel && !!k && sel.kind === k.kind && sel.effect === k.effect && (k.kind === "heat" || (sel.kind === "drug" && sel.drug === k.drug));
  const dimmed = (drug: string | null, effect: string) => {
    if (hoverDrug) return drug !== hoverDrug && !(drug === null && data.links.some((l) => l.drug === hoverDrug && l.effect === effect));
    if (sel) return !(sel.effect === effect && (drug === null || sel.kind === "heat" || (sel.kind === "drug" && sel.drug === drug)));
    return false;
  };

  const selLink = sel?.kind === "drug" ? data.links.find((l) => l.drug === sel.drug && l.effect === sel.effect) : null;
  const selEffect = sel ? data.effects.find((e) => e.id === sel.effect) : null;

  if (!data.ok || data.links.length === 0) {
    return (
      <p className="rounded-tile border border-dashed border-line-strong bg-surface p-4 text-sm text-ink-muted">
        Picture not available: no rows found in {source}.
      </p>
    );
  }

  const legendW = (n: number) => (
    <svg width="34" height="14" aria-hidden className="inline-block align-middle">
      <line x1="2" y1="7" x2="32" y2="7" stroke={C_DRUG} strokeWidth={width(n)} strokeLinecap="round" />
    </svg>
  );

  return (
    <section aria-labelledby="hm-title" className="space-y-3">
      <div>
        <h2 id="hm-title" className="text-xl font-semibold">
          {title}
        </h2>
        <p className="text-sm text-ink-muted">
          Each line is a link found in published studies. Click a line to see why.
        </p>
      </div>

      {/* One legend. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-1 w-6 rounded" style={{ background: C_DRUG }} /> Medicine studies
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-1 w-6 rounded" style={{ background: C_HEAT }} /> Heat studies
        </span>
        <span className="inline-flex items-center gap-1.5">
          Thicker line = more studies: {legendW(1)} 1 {legendW(10)} 10 {legendW(maxStudies)} {maxStudies}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="overflow-x-auto">
          <p className="px-3 pt-2 text-xs text-ink-muted md:hidden">Swipe sideways to see the whole picture →</p>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block w-full min-w-[640px]"
            role="img"
            aria-label={`${title}. Medicines on the left, body effects in the middle, heat on the right.`}
            onMouseLeave={() => setHoverDrug(null)}
          >
            <text x={X_DRUG} y={22} textAnchor="end" className="fill-ink-muted text-[12px] font-semibold">
              Medicines
            </text>
            <text x={(X_EFF_L + X_EFF_R) / 2} y={22} textAnchor="middle" className="fill-ink-muted text-[12px] font-semibold">
              What it does to the body
            </text>
            <text x={X_HEAT + 20} y={22} textAnchor="start" className="fill-ink-muted text-[12px] font-semibold">
              Heat
            </text>

            {/* heat → effect */}
            {data.effects.map((e) => {
              const k: Sel = { kind: "heat", effect: e.id };
              const d = curve(X_HEAT, yHeat, X_EFF_R, yEff.get(e.id)!);
              const on = isSel(k);
              return (
                <g
                  key={`h-${e.id}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Heat to ${e.label}: ${e.heatStudies} studies. Show why.`}
                  className="cursor-pointer outline-none"
                  onClick={() => setSel(on ? null : k)}
                  onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), setSel(on ? null : k))}
                >
                  <path d={d} stroke="transparent" strokeWidth={14} fill="none" />
                  <path
                    d={d}
                    stroke={on ? C_SEL : C_HEAT}
                    strokeOpacity={dimmed(null, e.id) ? 0.15 : 0.75}
                    strokeWidth={width(e.heatStudies)}
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {/* medicine → effect */}
            {data.links.map((l) => {
              const k: Sel = { kind: "drug", drug: l.drug, effect: l.effect };
              const d = curve(X_DRUG + 8, yDrug.get(l.drug)!, X_EFF_L, yEff.get(l.effect)!);
              const on = isSel(k);
              return (
                <g
                  key={`d-${l.drug}-${l.effect}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${drugLabel.get(l.drug)} to ${effLabel.get(l.effect)}: ${l.drugStudies} studies. Show why.`}
                  className="cursor-pointer outline-none"
                  onClick={() => setSel(on ? null : k)}
                  onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), setSel(on ? null : k))}
                >
                  <path d={d} stroke="transparent" strokeWidth={12} fill="none" />
                  <path
                    d={d}
                    stroke={on ? C_SEL : C_DRUG}
                    strokeOpacity={on ? 1 : dimmed(l.drug, l.effect) ? 0.1 : 0.45}
                    strokeWidth={width(l.drugStudies)}
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {/* medicine labels */}
            {drugs.map((d) => {
              const has = data.links.some((l) => l.drug === d.id);
              return (
                <text
                  key={d.id}
                  x={X_DRUG}
                  y={yDrug.get(d.id)! + 4}
                  textAnchor="end"
                  className={`text-[13px] ${has ? "fill-ink" : "fill-ink-muted"} ${hoverDrug === d.id ? "font-bold" : ""}`}
                  onMouseEnter={() => setHoverDrug(d.id)}
                >
                  {d.label}
                  {!has ? " (none)" : ""}
                </text>
              );
            })}

            {/* effect boxes */}
            {data.effects.map((e) => (
              <g key={e.id}>
                <rect
                  x={X_EFF_L}
                  y={yEff.get(e.id)! - 15}
                  width={X_EFF_R - X_EFF_L}
                  height={30}
                  rx={15}
                  className="fill-page stroke-line-strong"
                  strokeWidth={1.5}
                />
                <text x={(X_EFF_L + X_EFF_R) / 2} y={yEff.get(e.id)! + 5} textAnchor="middle" className="fill-ink text-[14px] font-semibold">
                  {e.label}
                </text>
              </g>
            ))}

            {/* heat node */}
            <rect x={X_HEAT} y={yHeat - 20} width={110} height={40} rx={20} fill={C_HEAT} />
            <text x={X_HEAT + 55} y={yHeat + 5} textAnchor="middle" className="text-[15px] font-bold" fill="#141414">
              Heat
            </text>
          </svg>
        </div>

        {/* Why? panel */}
        <aside aria-live="polite" className="rounded-tile bg-surface p-4 text-sm">
          <h3 className="mb-2 font-bold">Why?</h3>
          {!sel && <p className="text-ink-muted">Click or tap a line to see the studies behind it.</p>}
          {selLink && (
            <div className="space-y-2">
              <p>
                <span className="font-semibold">{drugLabel.get(selLink.drug)}</span> →{" "}
                <span className="font-semibold">{effLabel.get(selLink.effect)?.toLowerCase()}</span>
              </p>
              <ul className="space-y-1">
                <li>
                  <span className="font-semibold">{selLink.drugStudies}</span>{" "}
                  {selLink.drugStudies === 1 ? "study in the System graph links" : "studies in the System graph link"} this
                  medicine to {effLabel.get(selLink.effect)?.toLowerCase()} ({selLink.drugFindings}{" "}
                  {selLink.drugFindings === 1 ? "finding" : "findings"}).
                </li>
                {selEffect && (
                  <li>
                    <span className="font-semibold">{selEffect.heatStudies}</span>{" "}
                    {selEffect.heatStudies === 1 ? "study links" : "studies link"} heat to the same effect.
                  </li>
                )}
                <li>
                  <span className="font-semibold">{selLink.directStudies}</span>{" "}
                  {selLink.directStudies === 1 ? "study tests" : "studies test"} this medicine and heat together.
                </li>
              </ul>
              <p className="text-ink-muted">
                Both arrows point at the same body effect, so heat and the medicine can add up.
              </p>
              {selLink.examples.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-ink-muted">Example studies</p>
                  <ul className="list-disc space-y-1 pl-4 text-xs">
                    {selLink.examples.map((x) => (
                      <li key={x.pmid}>
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${x.pmid}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {x.title}
                        </a>{" "}
                        ({x.year})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Link href={`/drug/${encodeURIComponent(selLink.drug)}`} className="inline-block font-semibold underline">
                Open {drugLabel.get(selLink.drug)} →
              </Link>
            </div>
          )}
          {sel?.kind === "heat" && selEffect && (
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Heat</span> →{" "}
                <span className="font-semibold">{selEffect.label.toLowerCase()}</span>
              </p>
              <p>
                <span className="font-semibold">{selEffect.heatStudies}</span> studies in the System graph link heat to{" "}
                {selEffect.label.toLowerCase()}.
              </p>
              <p className="text-ink-muted">
                Medicines that also push this way (studies):{" "}
                {data.links
                  .filter((l) => l.effect === selEffect.id)
                  .sort((a, b) => b.drugStudies - a.drugStudies)
                  .map((l) => `${drugLabel.get(l.drug)} (${l.drugStudies})`)
                  .join(", ") || "none found"}
                .
              </p>
            </div>
          )}
        </aside>
      </div>

      <details className="text-xs text-ink-muted">
        <summary className="cursor-pointer">Sources</summary>
        <p className="mt-1">
          {source} (full System API run): study counts per medicine and per body effect. Example study titles from
          data/processed/system_drug_mediator_findings.csv. &ldquo;Drowsy&rdquo; is not shown: there is no drowsiness pathway
          in {source}.
        </p>
      </details>
    </section>
  );
}
