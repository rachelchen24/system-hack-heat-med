import { db } from "@/lib/db";

// Smoke test: confirms the server and SQLite work, from the laptop or the demo phone.
export async function GET() {
  const tables = db()
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((r) => (r as { name: string }).name);
  return Response.json({ ok: true, tables, time: new Date().toISOString() });
}
