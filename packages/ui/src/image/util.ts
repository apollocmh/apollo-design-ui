/**
 * image 的尺寸工具。
 *
 * ⚠️ **Vue 的 style 值必须带单位字符串**：`{ width: 200 }`（number）会被
 * 静默丢弃，必须写 `'200px'`。rc 在 React 里靠「数字自动补 px」，Vue 没有这层。
 * 这个坑在 menu 的 inline 缩进上已经踩过一次（COMPONENT-CHECKLIST）。
 */
export function toCssSize(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
}
