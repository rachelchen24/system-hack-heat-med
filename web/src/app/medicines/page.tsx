import type { Metadata } from "next";
import { KbSourceBanner } from "@/components/KbSourceBanner";
import { HeatMedicinePicture } from "@/components/medicines/HeatMedicinePicture";
import { MedicineList, type MedicineRow } from "@/components/medicines/MedicineList";
import { loadPathways, PATHWAYS_FILE } from "@/components/medicines/pathways";
import { loadKb, primaryBucket } from "@/lib/kb";

export const metadata: Metadata = { title: "Medicines · Cool-Aid" };

export default function MedicinesPage() {
  const { kb, source, file } = loadKb();
  const rows: MedicineRow[] = kb.drugs.map((d) => ({ drug: d, bucket: primaryBucket(d) }));
  const pathways = loadPathways(kb.drugs.map((d) => ({ id: d.id, label: d.names?.display ?? d.id })));

  // Title states the takeaway: the body effects that the most medicines share with heat.
  const byEffect = pathways.effects
    .map((e) => ({ label: e.label.toLowerCase(), n: new Set(pathways.links.filter((l) => l.effect === e.id).map((l) => l.drug)).size }))
    .sort((a, b) => b.n - a.n);
  const top = byEffect.filter((e) => e.n > 0).slice(0, 2);
  const title =
    top.length === 2
      ? `Heat and these medicines hit the same weak spots: ${top[0].n} of ${rows.length} push toward ${top[0].label}, ${top[1].n} toward ${top[1].label}`
      : "How heat and medicine add up";

  return (
    <div className="max-w-5xl space-y-12">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">How medicines add to the heat</h1>
        <p className="text-ink-muted">Hover a medicine to see what it does to the body in heat.</p>
      </header>
      <HeatMedicinePicture data={pathways} title={title} source={PATHWAYS_FILE} />
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{rows.length} medicines, by what to do</h2>
        <MedicineList rows={rows} />
      </section>
      <KbSourceBanner source={source} file={file} />
      <details className="text-xs text-ink-muted">
        <summary className="cursor-pointer">Sources</summary>
        <p className="mt-1">
          Medicines: {file ?? "inline fallback"}. &ldquo;Label warns about heat&rdquo;: data/processed/fda_label_heat_audit_summary_v2.csv.
          &ldquo;Guidance says what to do&rdquo;: data/processed/guidance_matrix.csv (at least one guidance document gives a
          drug-specific action). Picture: {PATHWAYS_FILE} and data/processed/system_drug_mediator_findings.csv.
        </p>
      </details>
    </div>
  );
}
