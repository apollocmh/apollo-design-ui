/**
 * Masonry 的样式生成。
 *
 * 契约来源：antd 6.6.4 的 `es/masonry/style/index.js`（`genMasonryStyle`，62 行）。
 * 选择器结构**从 cssinjs 的嵌套语义展开**（`&` 是复合、普通键是后代），
 * 与 antd 真实产物逐条对齐。
 *
 * ```css
 * .apollo-masonry                          ← 根（position/box-sizing/flex 三件套）
 * .apollo-masonry-rtl                      ← &-rtl ⇒ **复合**，是顶级类
 * .apollo-masonry > .apollo-masonry-item   ← `& > ${itemCls}` ⇒ 后代（带 `>`）
 * .apollo-masonry > .apollo-masonry-item-fade-appear
 * .apollo-masonry > .apollo-masonry-item-fade-appear-active
 * .apollo-masonry > .apollo-masonry-item-fade-leave
 * .apollo-masonry > .apollo-masonry-item-fade-leave-active
 * .apollo-masonry > .apollo-masonry-item:not(.apollo-masonry-item-fade)
 * ```
 *
 * 🚨 **`&-fade` 展开在 `& > ${itemCls}` 之内** ⇒ 选择器是
 * `.apollo-masonry > .apollo-masonry-item-fade`，**不是** `.apollo-masonry-item > .apollo-masonry-item-fade`。
 * 搞错会让动效规则永不命中（而 L4 只看类名、照样绿 —— 只有 L6 能抓到）。
 *
 * ── 与 antd 的两处**有意**差异 ────────────────────────────────────────────────
 *
 * 1. 没有 cssinjs 的 hash / css-var 包裹（差异 D5）—— 本组件**没有 Component Token**
 *    （上游 `ComponentToken` 是空接口），所以也没有「组件变量声明块」。
 * 2. 三段时长/缓动输出 `var(--apollo-motion-*)`，antd 在 cssVar 模式下输出解析后的定值。
 *    这是零运行时的必然结果（D7 家族）：变量随主题自适应。
 *
 * ── 这个函数没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（L6 逐像素负责）。
 *   - 没证明变量名存在（`test:build` 的 B7 校验）。
 *   - `--apollo-masonry-item-width` **不在本文件里** —— 它是**内联**的组件作用域变量
 *     （上游 `genCssVar(rootPrefixCls,'masonry')` 的等价物），声明在 item 元素自己的
 *     `style` 上（`MasonryItem.ts`）。自定义属性对**同元素**的内联样式可见，所以
 *     `inset-inline-start` / `width` 里的 `var()` 取得到。B7 只扫本文件的产物，不受影响。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Masonry 的静态 CSS。
 *
 * @param prefixCls **根**前缀（`apollo` / `ant`）；类名是 `${prefixCls}-masonry`
 *   （与 flex 同判：`getPrefixCls('masonry')` 在不传 customizePrefixCls 时返回带后缀的值）
 */
export function genMasonryStyle(prefixCls: string): string {
  const cls = `.${prefixCls}-masonry`;
  const itemCls = `${cls}-item`;

  const slow = v('motionDurationSlow');
  const fast = v('motionDurationFast');
  const easeOut = v('motionEaseOut');

  const rules: string[] = [
    // ---- 根 ----
    `${cls}{`,
    `  position:relative;`,
    `  box-sizing:border-box;`,
    `  display:flex;`,
    `  flex-direction:column;`,
    `  flex-wrap:wrap;`,
    `}`,
    // `&-rtl` ⇒ 复合，顶级类
    `${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,
    '',
    // ---- `& > ${itemCls}` ----
    `${cls} > ${itemCls}{`,
    `  box-sizing:border-box;`,
    `}`,
    '',
    // ---- 动效：`&-fade` 在 `& > itemCls` 之内 ----
    `${cls} > ${itemCls}-fade-appear{`,
    `  transition:opacity ${slow} ${easeOut};`,
    `  opacity:0;`,
    `}`,
    `${cls} > ${itemCls}-fade-appear-active{`,
    `  opacity:1;`,
    `}`,
    `${cls} > ${itemCls}-fade-leave{`,
    `  transition:opacity ${fast} ${easeOut};`,
    `  opacity:1;`,
    `}`,
    `${cls} > ${itemCls}-fade-leave-active{`,
    `  opacity:0;`,
    `}`,
    '',
    // ---- 非动画期间才给 left/right/top 过渡（否则与位移动画打架）----
    // ⚠️ 上游是 `['left','right','top'].map(prop => `${prop} ${slow} ${easeOut}`).join(',')`
    //    —— 顺序就是 left,right,top，且 `transition` 是**一条**声明。
    `${cls} > ${itemCls}:not(${itemCls}-fade){`,
    `  transition:left ${slow} ${easeOut},right ${slow} ${easeOut},top ${slow} ${easeOut};`,
    `}`,
  ];

  return rules.join('\n');
}
