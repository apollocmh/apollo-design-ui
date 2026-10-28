/** Normalize ellipsis tooltip data without spreading Vue nodes into native attrs.
 * Historical algorithm reference: antd6.6.4 useTooltipProps; arrays remain content.
 */
import {
  type ComputedRef,
  computed,
  isVNode,
  type MaybeRefOrGetter,
  toValue,
  type VNodeChild,
} from 'vue';
import type { TypographyTooltipProps } from '../interface';

export function useTooltipProps(
  tooltip: MaybeRefOrGetter<VNodeChild | TypographyTooltipProps | undefined>,
  editConfigText: MaybeRefOrGetter<VNodeChild>,
  children: MaybeRefOrGetter<VNodeChild>,
): ComputedRef<TypographyTooltipProps> {
  return computed(() => {
    const raw = toValue(tooltip);
    const fallback = toValue(editConfigText) ?? toValue(children);
    if (raw === true) return { title: fallback };
    if (isVNode(raw) || Array.isArray(raw)) return { title: raw };
    if (raw !== null && typeof raw === 'object')
      return { title: 'title' in raw ? raw.title : fallback };
    return { title: raw };
  });
}
