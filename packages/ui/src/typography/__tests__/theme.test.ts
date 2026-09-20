/**
 * L1/L2 的主题矩阵：light / dark / compact / token-override 四态。
 *
 * ⚠️ 当前**只做到「四态下都能渲染」**，没做到「四态下视觉正确」。
 *
 * 原因不是偷懒，而是 Typography 的样式里**没有字面视觉值**（除下面「字面值清单」
 * 一节列出的那批上游字面量）：颜色 / 字号 / 行高 / 间距全部是 `var(--apollo-*)`
 * 或 `style/token.ts` 里逐条登记过出处的上游字面量。于是：
 *   - 主题切换改变的是**变量值**，不是我们的 CSS；
 *   - 断言「dark 下颜色不同」需要浏览器计算样式（jsdom 不做布局与层叠），那是 L6 的职责。
 *
 * 「变量真的存在」由 `tests/build/run.mjs` 的 B7 校验（CSS 里引用的每个 `--apollo-*`
 * 都必须在 theme 的 `tokens.css` 里有声明）—— 那才是这个风险的正解。
 *
 * ── 字面值清单（H7 的可执行判据）──────────────────────────────────────────────
 *
 * H7 禁止硬编码视觉值。Typography 的产物里**确实**有一批字面值，所以判据不能是
 * 「没有字面值」，而必须是「每一个字面值都能被解释」，并且用 `toEqual` 断言
 * **恰好**是这些 —— 多一个少一个都红（防止「顺手加个 #f00」溜过去）。
 *
 * 出处分三类（逐条对应 `style/token.ts` 与 `style/index.ts` 的注释）：
 *
 *   | 类 | 值 | 出处 |
 *   |---|---|---|
 *   | Component Token | `1.2em` / `0.5em` | `prepareComponentToken`（与 antd 逐字相同） |
 *   | 上游硬编码字面量 | `rgba(150, 150, 150, 0.1)` / `rgba(150, 150, 150, 0.06)` / `rgba(100, 100, 100, 0.2)` / `#ffe58f` / `3px` | antd `style/mixins.ts` 的 `getResetStyles`（它自己也没做成 token） |
 *   | 上游 CSS 里的字面量 | `0.1em` `0.15em` `0.2em` `0.4em` `0.6em` `0.85` `1.6em` `1em` `1px` `2px` `4px` `20px` `50%` `85%` `90%` `100%` `-50%` | antd `mixins.ts` / `components/style/index.tsx` 的 `operationUnit` / `genFocusOutline` 逐字照搬 |
 *
 * ⚠️ 「上游 CSS 里的字面量」这一类**没有**对应 Alias token，也不是 antd 的
 *    Component Token —— 它们就是 antd 自己写死的值。换成最接近的变量会让视觉偏离
 *    （理由逐条写在 `style/token.ts` §2）。所以本文件把它们**列出来**，
 *    让「多一个字面量」这件事必须经过一次显式修改。
 *
 * ⚠️ 判据的口径与 `divider/__tests__/theme.test.ts` 的同名用例一致：**不**匹配裸整数
 *    （`calc()` 里的算子、`z-index` 之类）。这是一条**已知的盲区**：往 CSS 里塞一个
 *    裸整数不会让它变红。裸整数在 Typography 的产物里只有 `calc()` 算子与
 *    `-webkit-line-clamp:3`（后者会被组件算出的内联 `WebkitLineClamp` 覆盖），
 *    所以盲区的实际影响可忽略；但它是**盲区**，不是「测到了」。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Paragraph, Text, Title } from '../index';
import { genTypographyStyle } from '../style';
import { prepareComponentToken, TITLE_MARGIN_BOTTOM, TITLE_MARGIN_TOP } from '../style/token';

const P = 'apollo-typography';

themeTest('Typography', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Typography · 主题无关性', () => {
  it('四态下的 DOM 完全相同（差异全在 CSS 变量里）', () => {
    const html = mount(Text, { slots: { default: () => 'x' } }).html();
    // 组件本身不读任何 token 值，所以同一份 HTML 在四态下都成立。
    // 这条断言的作用是：一旦有人往组件里塞进「按主题分支」的逻辑，它会红。
    expect(html).not.toContain('data-apollo-theme');
    expect(html).toContain(`class="${P}`);
  });

  it('样式里引用的变量名全部是 `--apollo-*` 形态', () => {
    const vars = [...genTypographyStyle('apollo').matchAll(/var\((--[a-z0-9-]+)\)/g)].map(
      (m) => m[1] ?? '',
    );
    expect(vars.length).toBeGreaterThan(0);
    for (const name of vars) {
      expect(name.startsWith('--apollo-')).toBe(true);
    }
  });

  it('前缀不同则产物不同（否则 prefixCls 参数是摆设）', () => {
    expect(genTypographyStyle('apollo')).not.toBe(genTypographyStyle('ant'));
    expect(genTypographyStyle('ant')).toContain('.ant-typography-ellipsis-single-line');
    expect(genTypographyStyle('ant')).toContain('.ant-typography-actions');
  });

  it('★ 样式里的字面值**恰好**是这些，且每一类都有出处（H7 的可执行判据）', () => {
    const css = genTypographyStyle('apollo');
    const literals = [
      ...new Set(
        css.match(
          // 三条分支（顺序即优先级）：
          //   1. 十六进制色
          //   2. 整个 `rgb()` / `rgba()`（含它内部的数字，所以必须排在数值分支之前）
          //   3. 带单位的数值（`px` / `em` / `rem` / `%`）
          //   4. 裸小数（`opacity:0.85` 这类）。**不**匹配裸整数 —— 与 divider 的同名用例同口径，
          //      裸整数出现在 `calc()` 的算子与 `z-index` 这类地方，噪声远大于信号。
          /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|-?\d+(?:\.\d+)?(?:px|em|rem|%)|(?<![\w.])-?\d+\.\d+(?![\w%])/g,
        ) ?? [],
      ),
    ].sort();

    expect(literals).toEqual([
      '#ffe58f',
      '-50%',
      '0.15em',
      '0.1em',
      '0.2em',
      '0.4em',
      '0.5em',
      '0.6em',
      '0.85',
      '1.2em',
      '1.6em',
      '100%',
      '1em',
      '1px',
      '20px',
      '2px',
      '3px',
      '4px',
      '50%',
      '85%',
      '90%',
      'rgba(100, 100, 100, 0.2)',
      'rgba(150, 150, 150, 0.06)',
      'rgba(150, 150, 150, 0.1)',
    ]);

    // 出处逐条对应（这条断言是上面那个 `toEqual` 的**理由**，不是重复）：
    //   `1.2em` / `0.5em`  —— 两个字面量 Component Token，唯一真源在 style/token.ts
    expect(css).toContain(`margin-top:${TITLE_MARGIN_TOP}`);
    expect(css).toContain(`margin-bottom:${TITLE_MARGIN_BOTTOM}`);
    //   三个半透明灰 + `#ffe58f` + `3px` —— antd `getResetStyles` 里它自己也没做成 token 的字面量
    expect(css).toContain('rgba(150, 150, 150, 0.1)');
    expect(css).toContain('rgba(150, 150, 150, 0.06)');
    expect(css).toContain('rgba(100, 100, 100, 0.2)');
    expect(css).toContain('#ffe58f');
    expect(css).toContain('border-radius:3px');
    //   其余（`0.1em`…`90%`、`-50%`、`0.85`、`20px`、`4px`、`2px`、`1px`）是 antd
    //   `style/mixins.ts` / `components/style/index.tsx` 的 `operationUnit` /
    //   `genFocusOutline` 里逐字照搬的字面量。

    // ★ 硬编码的**颜色**只允许是上面那四个（三个半透明灰 + mark 的 gold[2]）。
    //   任何新的十六进制色 / rgb() 都必须先在这里被解释，否则红。
    const colors = [...new Set(css.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/g) ?? [])].sort();
    expect(colors).toEqual([
      '#ffe58f',
      'rgba(100, 100, 100, 0.2)',
      'rgba(150, 150, 150, 0.06)',
      'rgba(150, 150, 150, 0.1)',
    ]);
  });

  it('★ 样式里**没有** CSS-in-JS 的 hash 类名（零运行时架构的判据）', () => {
    const css = genTypographyStyle('apollo');
    expect(css.match(/css-(?:dev-only-do-not-override-)?[a-z0-9]+/g) ?? []).toEqual([]);
    expect(css).not.toContain('css-var-');
  });
});

describe('Typography · Component Token', () => {
  it('★ 两个 token 的名称与默认值与 antd 的 `prepareComponentToken` 逐字一致', () => {
    // antd 6.6.4 `components/typography/style/index.ts`：
    //   prepareComponentToken = () => ({ titleMarginTop: '1.2em', titleMarginBottom: '0.5em' })
    expect(prepareComponentToken()).toEqual({
      titleMarginTop: '1.2em',
      titleMarginBottom: '0.5em',
    });
    // 数量也是契约：多一个少一个都算漂移
    expect(Object.keys(prepareComponentToken()).sort()).toEqual([
      'titleMarginBottom',
      'titleMarginTop',
    ]);
  });

  it('★ `prepareComponentToken` 不接收 token（上游的签名就是零参 —— 两个字面量不派生别名）', () => {
    // 这是**忠实的签名**，不是省事：antd 的 `prepareComponentToken` 也是 `() => ({...})`。
    // 一旦有人「顺手」加上 `token` 参数去派生别名，这条断言会红。
    expect(prepareComponentToken.length).toBe(0);
    // 反证「确实没有别名派生」：换个假 token 进去，结果不变（因为根本不读）
    expect(prepareComponentToken()).toEqual({
      titleMarginTop: TITLE_MARGIN_TOP,
      titleMarginBottom: TITLE_MARGIN_BOTTOM,
    });
  });

  it('★ Component Token 是**内联**的，不是 `var(--apollo-typography-*)`（零运行时管线的缺口）', () => {
    // antd 的 cssVar 产物会多一条
    //   `.css-var-_R_0_.apollo-typography{--apollo-typography-title-margin-top:1.2em;…}`
    // 然后组件 CSS 引用那个变量。我们的管线**没有**「Component Token → CSS 变量」这一段
    // （见 `style/token.ts` 文件头 §1），所以直接内联。
    // ⚠️ 代价：用户**无法**用 `theme.components.Typography` 覆盖这两个 token ——
    //    缺口登记在 README §7。
    const css = genTypographyStyle('apollo');
    expect(css).toContain('margin-bottom:0.5em');
    expect(css).toContain('margin-top:1.2em');
    expect(css).not.toContain('var(--apollo-typography-title-margin');
  });

  it('别名派生的部分走 `var(--apollo-*)`（随主题自适应）', () => {
    // 零运行时架构下「组件 token 如何随主题变化」的答案：派生自 Alias 的那部分
    // 必须是变量引用，不能是运行期算出的定值。
    const css = genTypographyStyle('apollo');
    expect(css).toContain('color:var(--apollo-color-text)');
    expect(css).toContain('font-size:var(--apollo-font-size-heading-1)');
    expect(css).toContain('line-height:var(--apollo-line-height-heading-1)');
  });
});

describe('Typography · 语义化类名与主题无关', () => {
  it('`Title` / `Paragraph` 在四态下都渲染同一份结构', () => {
    const title = mount(Title, { props: { level: 2 }, slots: { default: () => 'T' } });
    const para = mount(Paragraph, {
      props: { ellipsis: { rows: 2 } },
      slots: { default: () => 'P' },
    });
    expect(title.element.tagName).toBe('H2');
    expect(title.classes()).toEqual([P]);
    expect(para.classes()).toContain(`${P}-ellipsis-multiple-line`);
  });
});
