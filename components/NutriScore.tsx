// Small colored Nutri-Score badge (A green -> E red). Uses inline colors from
// the CSS vars because Tailwind can't see dynamically-built class names.
const COLORS: Record<string, string> = {
  a: "var(--color-grade-a)",
  b: "var(--color-grade-b)",
  c: "var(--color-grade-c)",
  d: "var(--color-grade-d)",
  e: "var(--color-grade-e)",
};

export function NutriScore({ grade, size = 24 }: { grade: string | null; size?: number }) {
  if (!grade) return null;
  const g = grade.toLowerCase();
  const color = COLORS[g];
  if (!color) return null;
  return (
    <span
      title={`Nutri-Score ${g.toUpperCase()}`}
      className="inline-flex items-center justify-center rounded-md font-extrabold text-white"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.55 }}
    >
      {g.toUpperCase()}
    </span>
  );
}
