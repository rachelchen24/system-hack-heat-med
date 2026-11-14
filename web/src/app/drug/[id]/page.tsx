import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isPublicClaim } from "@lib/types/knowledge-base.ts";
import {
  BucketChip,
  CompassArrowMark,
  Dash,
  EvidenceMeter,
  GapBadge,
  LayerTag,
  LevelMeter,
  VerificationBadge,
} from "@/components/badges";
import { DISCLAIMER } from "@/components/Disclaimer";
import { KbSourceBanner } from "@/components/KbSourceBanner";
import { Placeholder } from "@/components/Placeholder";
import { getDrug, getDrugs, loadKb, primaryBucket } from "@/lib/kb";
import { BUCKETS } from "@/lib/ui";

export function generateStaticParams() {
  return getDrugs().map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/drug/[id]">): Promise<Metadata> {
  const { id } = await params;
  const d = getDrug(decodeURIComponent(id));
  return { title: `${d?.names?.display ?? "Drug"} · The Missing Label` };
}

function Section({ title, plain, children }: { title: string; plain?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-tile border border-line p-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {plain && <p className="mb-2 text-sm text-ink-muted">{plain}</p>}
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] | undefined }) {
  if (!items || items.length === 0) return <Dash />;
  return <span>{items.join(", ")}</span>;
}

export default async function DrugPage({ params }: PageProps<"/drug/[id]">) {
  const { id } = await params;
  const d = getDrug(decodeURIComponent(id));
  if (!d) notFound();
  const { source, file } = loadKb();
  const bucket = primaryBucket(d);
  const b = bucket ? BUCKETS[bucket] : null;
  const claims = (d.claims ?? []).filter(isPublicClaim);
  const g = d.guidance;
  const patientMsgs = d.patient_messages ?? [];

  return (
    <article className="space-y-5">
      <Link href="/map" className="text-sm underline">
        ← Evidence Map
      </Link>
      <KbSourceBanner source={source} file={file} />

      {/* The Missing Label */}
      <section className={`rounded-tile border-4 bg-page p-5 ${b ? b.ink : "border-line-strong"}`} aria-labelledby="label-h">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">The Missing Label</p>
            <h1 id="label-h" className="text-3xl font-bold text-ink">
              {d.names?.display ?? d.id}
            </h1>
            <p className="text-ink-muted">
              {d.names?.class_label}
              {d.names?.plain && d.names.plain !== d.names.display ? ` · "${d.names.plain}"` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(d.buckets ?? []).map((x) => (
              <BucketChip key={x.bucket} bucket={x.bucket} size="md" />
            ))}
            {(d.buckets ?? []).length === 0 && <BucketChip bucket={null} />}
          </div>
        </div>
        <p className="mt-4 text-xl font-semibold leading-snug text-ink">{d.label_line || <Dash what="No label line yet" />}</p>
        <dl className="mt-4 grid gap-2 text-sm text-ink sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Who prescribes it</dt>
            <dd>
              <List items={d.prescribers} />
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Higher-risk groups</dt>
            <dd>
              <List items={d.higher_risk_groups} />
            </dd>
          </div>
          {d.pediatric_note && (
            <div className="sm:col-span-2">
              <dt className="font-semibold">Children</dt>
              <dd>{d.pediatric_note}</dd>
            </div>
          )}
        </dl>
        <p className="mt-4 border-t border-line pt-2 text-xs font-semibold text-ink-muted">{DISCLAIMER}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Check on this person" plain="How strongly this prescription marks someone to contact (FLAG).">
          <LevelMeter level={d.flag?.level} />
          <p className="text-sm">{d.flag?.rationale || <Dash />}</p>
        </Section>
        <Section title="Rethink the medicine" plain="How strongly the evidence supports changing the drug itself (CHANGE).">
          <LevelMeter level={d.change?.level} />
          <p className="text-sm">{d.change?.rationale || <Dash />}</p>
        </Section>
      </div>

      <Section title="Heat Dose Compass" plain="Direction only, not doses. There isn't enough data for numbers.">
        <CompassArrowMark arrow={d.compass?.arrow} large />
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Why</dt>
            <dd>{d.compass?.mechanism || <Dash />}</dd>
          </div>
          <div>
            <dt className="font-semibold">Triggers</dt>
            <dd>
              <List items={d.compass?.triggers} />
            </dd>
          </div>
          <div>
            <dt className="font-semibold">What to monitor</dt>
            <dd>
              <List items={d.compass?.monitor} />
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Evidence</dt>
            <dd>
              <EvidenceMeter meter={d.compass?.evidence_meter} />
            </dd>
          </div>
        </dl>
      </Section>

      <Section title="Evidence" plain="Every claim has a receipt. ① System graph, ② literature, ③ FDA reports are kept separate.">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <EvidenceMeter meter={d.evidence?.meter} />
          <span className="text-ink-muted">Best tier: {d.evidence?.tier?.label ?? <Dash />}</span>
        </div>
        <p className="text-sm">{d.evidence?.plain_summary || <Dash />}</p>
        {claims.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No verified claims yet <Dash />
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {claims.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start gap-2 py-2 text-sm">
                <LayerTag layer={c.layer} />
                <VerificationBadge code={c.badge_code} />
                <div className="min-w-0 flex-1">
                  <p>{c.plain || c.text}</p>
                  <p className="text-xs text-ink-muted" title={c.text}>
                    {c.number?.display ? `${c.number.display} · ` : ""}
                    {c.source?.url ? (
                      <a href={c.source.url} className="underline" target="_blank" rel="noreferrer">
                        {c.source.label}
                      </a>
                    ) : (
                      c.source?.label
                    )}
                    {c.population ? ` · ${c.population}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Placeholder title="Mini forest plot" spec="§5 #8">
          ECharts, grouped by statistic type, built from the claims above.
        </Placeholder>
      </Section>

      <Section title="Guidance" plain="Which of the guidance documents mention this medicine, and what they say.">
        <p className="flex items-center gap-2 text-sm">
          {g?.n_jurisdictions ? (
            <>
              {g.jurisdictions_mentioning} of {g.n_jurisdictions} mention it; {g.jurisdictions_specific_action} give a
              drug-specific action.
            </>
          ) : (
            <Dash what="Guidance not coded yet" />
          )}
          {g?.gap && <GapBadge />}
        </p>
        {g?.gap_reason && <p className="text-sm text-ink-muted">{g.gap_reason}</p>}
        {(g?.by_source ?? []).filter((s) => s.mention_level !== "none").length > 0 && (
          <ul className="space-y-1 text-sm">
            {g!.by_source
              .filter((s) => s.mention_level !== "none")
              .map((s) => (
                <li key={s.source_id}>
                  <span className="font-semibold">{s.source_id}</span> ({s.jurisdiction}, {s.mention_level}):{" "}
                  <q className="text-ink-muted">{s.quote}</q>
                </li>
              ))}
          </ul>
        )}
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Risky combinations" plain="Common partners that stack the same heat risk.">
          {(d.combinations ?? []).length === 0 ? (
            <Dash />
          ) : (
            <ul className="space-y-1 text-sm">
              {d.combinations.map((c) => (
                <li key={c.id}>
                  <span className="font-semibold">{c.label}</span>: {c.plain}
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section
          title="Lower heat-risk alternatives to consider"
          plain="Spring-review considerations, never automatic switches. Never stop abruptly."
        >
          {(d.alternatives ?? []).length === 0 ? (
            <Dash />
          ) : (
            <ul className="space-y-2 text-sm">
              {d.alternatives.map((a) => (
                <li key={a.name}>
                  <span className="font-semibold">{a.name}</span>: {a.why}
                  <br />
                  <span className="text-ink-muted">
                    What you lose: {a.what_is_lost || "—"} · {a.heat_evidence_label} · {a.caution}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Patient wording preview" plain="Exactly what the patient app says for this medicine.">
          {patientMsgs.length === 0 ? (
            <Dash what="No patient message yet" />
          ) : (
            patientMsgs.map((m) => (
              <blockquote key={m.situation} className="rounded border-l-4 border-line-strong bg-surface p-3 text-sm">
                <span className="block text-xs font-semibold text-ink-muted">{m.situation.replace(/_/g, " ")}</span>
                {m.en}
              </blockquote>
            ))
          )}
        </Section>
        <Placeholder title="EHR alert preview (CDS Hooks card)" spec="§4.6">
          Fires only when this drug is ordered and the heat forecast is high. Service stub: /api/cds-hooks.
        </Placeholder>
      </div>

      {(d.gaps ?? []).length > 0 && (
        <Section title="What we don't know" plain="Gaps are shown, not hidden.">
          <ul className="list-disc pl-5 text-sm">
            {d.gaps.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  );
}
