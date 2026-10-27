/** Exact reference additions for the owned Button content host; no projection changes. */
type Allowance = { reason: string; diff: readonly string[]; deviationId?: string };
function isOwnedContentClassAddition(line: string): boolean {
  const match = line.match(
    /^.+\/(?:button|a)\[\d+\]\/span\[\d+\]: 类名不同 \[([^\]]*)\] vs \[([^\]]*)\]$/,
  );
  if (!match) return false;
  const before = (match[1] ?? '').split(' ').filter(Boolean);
  const after = (match[2] ?? '').split(' ').filter(Boolean);
  return (
    !before.includes('apollo-btn-content') &&
    after.includes('apollo-btn-content') &&
    JSON.stringify(after.filter((name) => name !== 'apollo-btn-content')) === JSON.stringify(before)
  );
}
export function mergeButtonContentReferenceAllowances(
  updated: Readonly<Record<string, readonly string[]>>,
  original: Readonly<Record<string, Allowance>> = {},
): Record<string, Allowance> {
  const result: Record<string, Allowance> = { ...original };
  for (const [id, diff] of Object.entries(updated)) {
    const retained = diff.filter((line) => !isOwnedContentClassAddition(line));
    if (
      retained.length === diff.length ||
      JSON.stringify(retained) !== JSON.stringify(original[id]?.diff ?? [])
    )
      throw new Error(
        `Unreviewed Button reference change in ${id}: only the owning content class may be added; all existing exact differences must remain.`,
      );
    result[id] = {
      ...original[id],
      reason: `${original[id]?.reason ?? ''} Apollo owns the Button content host; every original scenario, child, style and attribute remains compared. See docs/migrations/button-contracts.md.`,
      diff,
    };
  }
  return result;
}
