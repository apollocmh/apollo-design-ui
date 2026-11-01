import type { ComponentTokenMap, ThemeConfig } from './types';

/** Merge configuration, never a previously expanded preset or derived AliasToken. */
export function mergeThemeConfig(
  parent: ThemeConfig | undefined,
  own: ThemeConfig | undefined,
): ThemeConfig | undefined {
  if (!own) return parent;
  const base = own.inherit !== false && parent ? parent : { cssVarPrefix: parent?.cssVarPrefix };
  const components = new Map(Object.entries(base.components ?? {}));
  for (const [name, values] of Object.entries(own.components ?? {}))
    components.set(name, { ...components.get(name), ...values });
  const mergedComponents: ComponentTokenMap = Object.fromEntries(components);
  const merged: ThemeConfig = {
    ...base,
    ...own,
    token: { ...base.token, ...own.token },
    components: mergedComponents,
  };
  if (own.preset === undefined && base.preset !== undefined) merged.preset = base.preset;
  // A local appearance replaces an inherited algorithm, and vice versa. Do not
  // add absent keys to the historical configuration shape.
  if (own.mode !== undefined && own.algorithm === undefined) delete merged.algorithm;
  else if (own.algorithm !== undefined && own.mode === undefined) delete merged.mode;
  else if (own.mode === undefined && base.mode !== undefined) merged.mode = base.mode;
  return merged;
}
