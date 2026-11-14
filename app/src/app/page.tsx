import Link from "next/link";

// Placeholder index until the journey shell (Step 5) lands.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold">The Missing Label</h1>
      <p className="mt-2 text-neutral-600">Scaffold is running.</p>
      <ul className="mt-8 space-y-3 text-lg">
        <li><Link className="underline" href="/clinician">Clinician app</Link></li>
        <li><Link className="underline" href="/patient">Patient app (open on the demo phone)</Link></li>
        <li><Link className="underline" href="/api/health">API + database health check</Link></li>
      </ul>
    </main>
  );
}
