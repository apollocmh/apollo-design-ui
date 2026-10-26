/** Normalize finite pixel lengths; native CSS strings remain unchanged. */
export function toCssLength(value: number | string | undefined | null): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'number') return value;
  if (!Number.isFinite(value)) return undefined;
  return value === 0 ? '0' : `${value}px`;
}
