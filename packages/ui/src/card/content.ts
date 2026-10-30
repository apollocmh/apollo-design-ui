import { isRenderable, toArray } from '@apollo-design/utils';
import type { VNodeChild } from 'vue';

/** Presence follows actual Vue content while retaining the existing true/0 data contract. */
export function hasCardContent(value: VNodeChild): boolean {
  return isRenderable(value) && (value === true || toArray(value).length > 0);
}
