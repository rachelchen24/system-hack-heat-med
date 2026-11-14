import Link from "next/link";

// Home: the product in one sentence, then pick a side.
export default function Home() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">The Missing Label</p>
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
        On the morning a heat wave is forecast, a clinic nurse sees which patients are at risk because of their
        medicines and their home, texts each group a simple plan, and each patient sees where it&apos;s cooler,
        where help is, how to get there and the safest time to go.
      </h1>
      <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
        <Link href="/board" className="rounded-full bg-ink px-6 py-3 text-lg font-semibold text-page">
          I&apos;m a clinician
        </Link>
        <Link href="/phone" className="rounded-full border-2 border-ink px-6 py-3 text-lg font-semibold">
          I&apos;m a patient
        </Link>
      </div>
    </section>
  );
}
