/**
 * drawer 内核的尺寸工具。
 *
 * ⚠️ **Vue 的 style 值必须带单位字符串**：`{ width: 378 }`（number）会被静默丢弃，
 *    必须写 `'378px'` —— React 侧数字会自动补 px，Vue 没有这层（PITFALLS 170 / D94）。
 *    实测：drawer 的 `wrapperStyle.width` 写成裸数字时，**整个 style 属性都不出现**
 *    （面板宽高全丢），而 L6 之外的单测也看不出来。
 *
 * ⚠️ `packages/ui/src/image/util.ts` 里有一份**同名同实现**的版本。
 *    按仓库的「三次法则」（组件间共享代码放 `_internal/`），drawer 是第二个消费者
 *    ⇒ 第三个消费者出现时把它提到 `packages/ui/src/_internal/` 并让两边都用。
 *    （本轮不顺手搬：image 是已收口组件，搬它要连带跑 image 的五层门禁。）
 */
export function toCssSize(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
}
