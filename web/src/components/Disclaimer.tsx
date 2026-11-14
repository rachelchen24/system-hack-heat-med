export const DISCLAIMER = "Prototype. Considerations for clinicians, not instructions.";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p role="note" className={`text-sm font-medium text-ink-muted ${className}`}>
      {DISCLAIMER}
    </p>
  );
}
