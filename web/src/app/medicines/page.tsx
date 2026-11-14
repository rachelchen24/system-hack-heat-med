import type { Metadata } from "next";
import { KbSourceBanner } from "@/components/KbSourceBanner";
import { MapLegend, PeriodicTable, type TileData } from "@/components/PeriodicTable";
import { Placeholder } from "@/components/Placeholder";
import { loadKb, primaryBucket } from "@/lib/kb";

export const metadata: Metadata = { title: "Medicines · The Missing Label" };

export default function MedicinesPage() {
  const { kb, source, file } = loadKb();
  const tiles: TileData[] = kb.drugs.map((d) => ({
    id: d.id,
    name: d.names?.display ?? d.id,
    classLabel: d.names?.class_label ?? null,
    bucket: primaryBucket(d),
    meter: d.evidence?.meter ?? null,
    tierCode: d.evidence?.tier?.code ?? null,
    tierLabel: d.evidence?.tier?.label ?? null,
    prescribers: d.prescribers ?? [],
    gap: Boolean(d.guidance?.gap),
    pediatric: Boolean(d.pediatric_note) || (d.prescribers ?? []).some((p) => p.toLowerCase().includes("pediatric")),
  }));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Medicines</h1>
        <p className="text-ink-muted">
          &ldquo;I&apos;m prescribing this, and a heat wave is coming. What do I need to know?&rdquo; Pick a medicine.
        </p>
      </header>
      <KbSourceBanner source={source} file={file} />
      <MapLegend />
      <PeriodicTable tiles={tiles} />
      <div className="grid gap-3 md:grid-cols-3">
        <Placeholder title="Evidence vs guidance quadrant" spec="§5 #5" />
        <Placeholder title="Heat-risk pathways (Sankey)" spec="§5 #6" />
        <Placeholder title="Node graph explorer" spec="§5 #4">
          Needs react-force-graph (see web/README.md).
        </Placeholder>
      </div>
    </div>
  );
}
