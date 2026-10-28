// Initial class/rule reference: Ant Design 6.6.4 (MIT); docs/analysis/flex.md.
// Current behavior is defined by Apollo public contracts.
/** Static Flex CSS. Visual gaps consume the current scoped alias variables. */

import { token2CSSVar } from '@apollo-design/theme';
import { alignItemsValues, flexWrapValues, justifyContentValues } from '../utils';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Flex 的静态 CSS。
 *
 * @param prefixCls 类名前缀（`apollo` 或 `ant`）
 */
export function genFlexStyle(prefixCls: string): string {
  // ⚠️ 带 `-flex` 后缀：`getPrefixCls('flex')` 在不传 customizePrefixCls 时返回
  // `${root}-flex`；传了 customizePrefixCls 时它直接返回该值（不加后缀）。
  const cls = `.${prefixCls}-flex`;

  // flexToken 的三个派生 token（见 style/token.ts 的注释）：
  //   flexGapSM = paddingXS, flexGap = padding, flexGapLG = paddingLG
  // 全部是别名派生 → var(--apollo-*)，随主题自适应。
  const gapSmall = v('paddingXS');
  const gapMedium = v('padding');
  const gapLarge = v('paddingLG');

  const rules: string[] = [
    // ---- genFlexStyle ------------------------------------------------------
    `${cls}{`,
    `  display:flex;`,
    `  align-items:flex-start;`,
    `  margin:0;`,
    `  padding:0;`,
    `}`,
    `${cls}-vertical{`,
    `  flex-direction:column;`,
    `  align-items:stretch;`,
    `}`,
    `${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,
    '',
    // ---- genFlexGapStyle ---------------------------------------------------
    `${cls}-gap-small{`,
    `  gap:${gapSmall};`,
    `}`,
    `${cls}-gap-medium,${cls}-gap-middle{`,
    `  gap:${gapMedium};`,
    `}`,
    `${cls}-gap-large{`,
    `  gap:${gapLarge};`,
    `}`,
    '',
  ];

  // ---- genFlexWrapStyle / genAlignItemsStyle / genJustifyContentStyle -----
  // 三个枚举逐一展开为**顶级**类（antd 的键是 `${componentCls}-wrap-${value}` 等，
  // 模板串拼接 → 复合自身，不是后代）。gap 三档同理。
  //
  // ⚠️ 选择器段与 CSS 属性名是**两回事**：类名段是 `wrap` / `align` / `justify`
  // （utils.ts 的 genCls* 决定），属性才是 `flex-wrap` / `align-items` /
  // `justify-content`。两者混用会让 CSS 静默失配 —— L4 比对不到选择器，
  // 只有 L6 能抓到（2026-09-21 实测：wrap 用例 52% 差异，根因即此）。
  const expand = (segment: string, property: string, values: readonly string[]) => {
    for (const value of values) {
      rules.push(`${cls}-${segment}-${value}{`, `  ${property}:${value};`, `}`);
    }
  };
  expand('wrap', 'flex-wrap', flexWrapValues);
  expand('align', 'align-items', alignItemsValues);
  expand('justify', 'justify-content', justifyContentValues);

  return rules.join('\n');
}
