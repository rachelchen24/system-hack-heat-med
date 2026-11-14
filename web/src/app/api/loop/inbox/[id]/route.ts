// GET: what the demo phone shows for one patient. Polled every ~2.5 s.
import { connection } from "next/server";
import { inbox } from "@/lib/loop";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await ctx.params;
  return Response.json(inbox(id));
}
