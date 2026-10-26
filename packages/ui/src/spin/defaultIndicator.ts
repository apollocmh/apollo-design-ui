/** Module default content. The setter does not schedule component updates. */
import type { VNodeChild } from 'vue';

let defaultIndicator: VNodeChild | undefined;
export function getDefaultIndicator(): VNodeChild | undefined {
  return defaultIndicator;
}
/** Mounted instances read the current value on their next actual render. */
export function setDefaultIndicator(indicator: VNodeChild): void {
  defaultIndicator = indicator;
}
