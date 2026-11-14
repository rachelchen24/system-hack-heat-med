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

  // Short title; the takeaway (which body effects most medicines share with heat) is in the picture itself.
  const title = "Heat and these medicines hit the same weak spots";

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold tracking-tight">Medicines in the heat</h1>
      <HeatMedicinePicture data={pathways} title={title} source={PATHWAYS_FILE} />
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What to do, by medicine</h2>
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
