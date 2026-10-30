import { h, toRaw, type VNodeChild } from 'vue';
import type { TableComponent } from '../interface';

/** Native tags take children; user supplied Vue components take a default slot. */
export function renderElement(
  component: TableComponent,
  props: Record<string, unknown> | null,
  children: VNodeChild[],
) {
  const target = toRaw(component);
  return typeof target === 'string'
    ? h(target, props, children)
    : h(target, props, { default: () => children });
}
