/**
 * `toCssSize` —— 尺寸值 → CSS 字符串。
 *
 * ⚠️ **这是全仓的单一真源**（2026-09-26 按三次法则从 `image/util.ts` 与
 *    `drawer/engine/util.ts` 的两份同名实现收敛而来；modal 是第三个消费者）。
 *    两个旧文件保留为**再导出**，消费方（`image/Image.ts` / `image/Progress.ts` /
 *    `drawer/engine/DrawerPopup.ts`）的 import 路径不变。
 *
 * 为什么必须存在：**Vue 的 `patchStyle` 不给数字补 `px`**（React 会补）。
 * 裸数字会被静默丢弃 —— 不报错、不警告、类型检查也过，只是 style 属性整个不出现。
 * 实测（drawer）：`wrapperStyle.width = 378` ⇒ 面板宽高全丢，只有 L6 能发现
 * （PITFALLS 170 / D94）。
 */
export function toCssSize(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
}
