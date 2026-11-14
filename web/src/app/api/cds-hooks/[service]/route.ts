// CDS Hooks service call (stub). Returns no cards until the forecast gate and
// drug/combination rules are wired to the knowledge base (spec §4.6).

export async function POST(_req: Request, ctx: RouteContext<"/api/cds-hooks/[service]">) {
  const { service } = await ctx.params;
  if (service !== "heat-medication-check") {
    return Response.json({ error: `Unknown service: ${service}` }, { status: 404 });
  }
  return Response.json({ cards: [] });
}
