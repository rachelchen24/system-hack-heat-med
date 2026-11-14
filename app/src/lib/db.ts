// Local SQLite via Node's built-in driver (node:sqlite, Node 22.13+). No native build needed.
// Server-only: import from route handlers / server components, never from client components.
import "server-only";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";

// Repo root is one level above the Next.js app (cwd when running `npm run dev` in app/).
const ROOT = path.resolve(process.cwd(), "..");
const DB_DIR = path.join(ROOT, "db");
const DB_FILE = process.env.DB_FILE ?? path.join(DB_DIR, "heat.sqlite");

// Reuse one connection across hot reloads in dev.
const g = globalThis as unknown as { __heatDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!g.__heatDb) {
    mkdirSync(DB_DIR, { recursive: true });
    const conn = new DatabaseSync(DB_FILE);
    conn.exec("PRAGMA journal_mode = WAL;");
    conn.exec(readFileSync(path.join(DB_DIR, "schema.sql"), "utf8"));
    g.__heatDb = conn;
  }
  return g.__heatDb;
}
