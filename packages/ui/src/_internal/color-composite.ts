/**
 * `onBackground` —— FastColor 的「半透明前景合成到背景」。
 *
 * ⚠️ **这是全仓的单一真源**（2026-09-29 按三次法则收敛：`tour/style/token.ts` 与
 *    `input-number/style/token.ts` 各写过一份，slider 是第三个消费者）。
 *    两处旧实现已删除、改为从本文件 import（它们的 L7 断言值不变，见
 *    `tour/__tests__/theme.test.ts` 与 `input-number/__tests__/theme.test.ts`）。
 *
 * 为什么需要它：`registry/tokens.json` 的令牌是**不带透明度语义**的原始值，
 * 而 antd 的 `prepareComponentToken` 里有一批「把半透明色叠到容器底色上」的构建期算式
 * （`FastColor(fg).onBackground(bg)`）。本仓的 `Color` **没有** `onBackground`
 * —— 只有 `mix`，而 `mix` 的语义不同（按比例插值，alpha 也一起插值，结果仍是半透明）。
 *
 * 公式逐字取自 FastColor（`@rc-component/color-picker` 的 `Color#onBackground`）：
 *
 * ```
 * alpha   = fg.a + bg.a × (1 − fg.a)
 * channel = round((fg.c × fg.a + bg.c × bg.a × (1 − fg.a)) / alpha)
 * ```
 *
 * ⚠️ 返回的是 **`Color` 实例**而不是字符串：调用方的输出格式不同
 * （tour 用 `toRgbString()` → `rgba(...)`；input-number / slider 用 `toHexString()`
 * → `#rrggbb`），收敛函数里替它们决定格式会让某一侧的断言变红。
 *    —— 这也解释了为什么两处旧实现看起来「公式不同」：input-number 那份把
 *    `bg.a` 省略了（只在背景不透明时等价），而输出格式又不同；
 *    合并时**以 FastColor 的通用式为准**（背景带 alpha 时也正确）。
 */

import { Color } from '@apollo-design/utils';

/**
 * 把 `foreground`（可带 alpha）合成到 `background` 上，返回合成后的颜色。
 *
 * @example
 * ```ts
 * onBackground('rgba(0,0,0,0.25)', '#fff').toHexString();   // #bfbfbf
 * onBackground('rgba(0,0,0,0.06)', '#fff').toHexString();   // #f0f0f0
 * ```
 */
export function onBackground(foreground: string, background: string): Color {
  const fg = new Color(foreground);
  const bg = new Color(background);
  const alpha = fg.a + bg.a * (1 - fg.a);
  if (alpha === 0) {
    return new Color('rgba(0,0,0,0)');
  }
  const channel = (f: number, b: number): number =>
    Math.round((f * fg.a + b * bg.a * (1 - fg.a)) / alpha);
  return new Color({
    r: channel(fg.r, bg.r),
    g: channel(fg.g, bg.g),
    b: channel(fg.b, bg.b),
    a: alpha,
  });
}
