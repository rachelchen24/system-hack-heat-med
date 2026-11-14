// CDS Hooks discovery endpoint (stub). Spec §4.6.
// The CDS Hooks spec expects discovery at {base}/cds-services; point the
// sandbox at /api/cds-hooks and add a rewrite if it insists on that suffix.

export function GET() {
  return Response.json({
    services: [
      {
        hook: "order-select",
        id: "heat-medication-check",
        title: "The Missing Label: heat and medications",
        description:
          "Prototype. Fires only when a flagged drug or combination is ordered while the heat forecast is high.",
        prefetch: {
          patient: "Patient/{{context.patientId}}",
          medications: "MedicationRequest?patient={{context.patientId}}&status=active",
        },
      },
    ],
  });
}
