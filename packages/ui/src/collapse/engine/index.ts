/** Framework-independent key normalization; Vue owns rendering and state lifetime. */
export function getActiveKeysArray(
  activeKey: (string | number)[] | string | number | undefined,
): string[] {
  if (Array.isArray(activeKey)) return activeKey.map(String);
  return typeof activeKey === 'string' || typeof activeKey === 'number' ? [String(activeKey)] : [];
}
