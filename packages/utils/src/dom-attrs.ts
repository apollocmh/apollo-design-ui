/** Normalize attributes only at a Vue DOM destination; pickAttrs retains its data contract. */
import { mergeProps } from 'vue';
import { isReactEventName, toVueEventName } from './event-name';
import { PICK_ATTRS_ALL } from './pick-attrs-allowlist';

function uniqueListeners(attrs: Record<string, unknown>): Record<string, unknown> {
  for (const [key, value] of Object.entries(attrs)) {
    if (/^on[A-Z]/.test(key) && Array.isArray(value)) {
      attrs[key] = [...new Set<unknown>(value)];
    }
  }
  return attrs;
}

export function toVueDomAttrs(source: Record<string, unknown>): Record<string, unknown> {
  let result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    const target =
      key === 'className'
        ? 'class'
        : PICK_ATTRS_ALL.has(key) && isReactEventName(key)
          ? (toVueEventName(key) ?? key)
          : key;
    result = mergeProps(result, { [target]: value });
  }
  return uniqueListeners(result);
}

/** Merge class/style and event listeners using Vue's own rules. */
export function mergeDomAttrs(...sources: Record<string, unknown>[]): Record<string, unknown> {
  return uniqueListeners(mergeProps(...sources.map(toVueDomAttrs)));
}
