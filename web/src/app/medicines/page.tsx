import type { Metadata } from "next";
import { KbSourceBanner } from "@/components/KbSourceBanner";
import { MedicineList, type MedicineRow } from "@/components/medicines/MedicineList";
import { loadKb, primaryBucket } from "@/lib/kb";

export const metadata: Metadata = { title: "Medicines · The Missing Label" };

export default function MedicinesPage() {
  const { kb, source, file } = loadKb();
  const rows: MedicineRow[] = kb.drugs.map((d) => ({ drug: d, bucket: primaryBucket(d) }));

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Medicines that matter in a heat wave</h1>
        <p className="text-ink-muted">
          {rows.length} common medicines, grouped by what to do. Pick one to see what to do and why.
        </p>
      </header>
      <KbSourceBanner source={source} file={file} />
      <MedicineList rows={rows} />
      <p className="text-xs text-ink-muted">
        Sources: {file ?? "inline fallback"} · &ldquo;Label warns about heat&rdquo; from
        data/processed/fda_label_heat_audit_summary_v2.csv · &ldquo;Guidance says what to do&rdquo; from
        data/processed/guidance_matrix.csv (at least one guidance document gives a drug-specific action).
      </p>
    </div>
  );
}
