/**
 * L1/L2 的主题矩阵：light / dark / compact / token-override 四态。
 *
 * ⚠️ 当前**只做到「四态下都能渲染」**，没做到「四态下视觉正确」。
 *
 * 原因不是偷懒，而是 Divider 的样式里没有**任何字面视觉值**：颜色/线宽/间距全部是
 * `var(--apollo-*)`（见 `style/index.ts`）。于是：
 *   - 主题切换改变的是**变量值**，不是我们的 CSS；
 *   - 断言「dark 下颜色不同」需要浏览器计算样式（jsdom 不做布局与层叠），那是 L6 的职责。
 *
 * 所以这里断言的是**这条架构性质本身**，外加 Divider 特有的一条：**字面量 token
 * 是唯一被允许出现的字面值**（`1em` / `0.05`），它们来自 `style/token.ts` 的
 * Component Token 定义，不是硬编码的视觉值（H7 允许：它们与 antd 的
 * `prepareComponentToken` 逐字相同）。
 *
 * 「变量真的存在」由 `tests/build/run.mjs` 的 B7 校验（CSS 里引用的每个 `--apollo-*`
 * 都必须在 theme 的 `tokens.css` 里有声明）—— 那才是这个风险的正解。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Divider } from '../index';
import { genDividerStyle } from '../style';
import { ORIENTATION_MARGIN, prepareComponentToken, TEXT_PADDING_INLINE } from '../style/token';

const P = 'apollo-divider';

themeTest('Divider', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Divider · 主题无关性', () => {
  it('四态下的 DOM 完全相同（差异全在 CSS 变量里）', () => {
    const html = mount(Divider).html();
    // 组件本身不读任何 token 值，所以同一份 HTML 在四态下都成立。
    // 这条断言的作用是：一旦有人往组件里塞进「按主题分支」的逻辑，它会红。
    expect(html).not.toContain('data-apollo-theme');
    expect(html).toContain(`class="${P}`); // 类名以 apollo-divider 开头
  });

  it('样式里引用的变量名全部是 `--apollo-*` 形态', () => {
    const vars = [...genDividerStyle('apollo').matchAll(/var\((--[a-z0-9-]+)\)/g)].map(
      (m) => m[1] ?? '',
    );
    expect(vars.length).toBeGreaterThan(0);
    for (const name of vars) {
      expect(name.startsWith('--apollo-')).toBe(true);
    }
  });

  it('前缀不同则产物不同（否则 prefixCls 参数是摆设）', () => {
    expect(genDividerStyle('apollo')).not.toBe(genDividerStyle('ant'));
    expect(genDividerStyle('ant')).toContain('.ant-divider-rail');
    expect(genDividerStyle('ant')).toContain('.ant-divider-vertical');
  });

  it('★ 样式里的字面值**恰好**是这四个，且每一个都有出处（H7 的可执行判据）', () => {
    // H7 禁止硬编码视觉值。Divider 的特殊之处：它的产物里**确实**有 4 个字面值，
    // 所以判据不能是「没有字面值」，而必须是「每一个字面值都能被解释」——
    // 且用 `toEqual` 断言**恰好**是这四个，多一个少一个都红（防止「顺手加个 #f00」溜过去）。
    const css = genDividerStyle('apollo');
    const literals = [
      ...new Set(
        css.match(/#[0-9a-f]{3,8}\b|rgba?\(|\b\d+(?:\.\d+)?(?:px|em|rem)\b|\b\d+\.\d+\b/g) ?? [],
      ),
    ].sort();

    expect(literals).toEqual(['0.05', '0.06em', '0.9em', '1em']);

    // 出处逐条对应（这条断言是上面那个 `toEqual` 的**理由**，不是重复）：
    //   1em / 0.05  —— 两个字面量 Component Token，唯一真源在 style/token.ts，
    //                  与 antd 的 `prepareComponentToken` 逐字相同（见下面 Component Token 一节）
    //   0.06em / 0.9em —— antd `genSharedDividerStyle` 里的字面量（`top` / `height`），
    //                     我们逐字镜像；它们**不是** Component Token，antd 也写死
    expect(css).toContain(`padding-inline:${TEXT_PADDING_INLINE}`);
    expect(css).toContain(`calc(${ORIENTATION_MARGIN} * 100%)`);
    expect(css).toContain('top:-0.06em');
    expect(css).toContain('height:0.9em');

    // 颜色一律不许硬编码（全部走 var(--apollo-*)）
    expect(css.match(/#[0-9a-f]{3,8}\b|rgba?\(/g) ?? []).toEqual([]);
  });
});

describe('Divider · Component Token', () => {
  it('★ 三个 token 的名称与默认值与 antd 的 `prepareComponentToken` 逐字一致', () => {
    // antd 6.6.4 `components/divider/style/index.ts`：
    //   prepareComponentToken = (token) => ({
    //     textPaddingInline: '1em',
    //     orientationMargin: 0.05,
    //     verticalMarginInline: token.marginXS,
    //   })
    const alias = { marginXS: '8px' };
    const prepared = prepareComponentToken(alias as never);
    expect(prepared).toEqual({
      textPaddingInline: '1em',
      orientationMargin: 0.05,
      verticalMarginInline: '8px',
    });
    // 数量也是契约：多一个少一个都算漂移
    expect(Object.keys(prepared).sort()).toEqual([
      'orientationMargin',
      'textPaddingInline',
      'verticalMarginInline',
    ]);
  });

  it('★ `orientationMargin` 是 **unitless** token（antd 的 `{ unitless: { orientationMargin: true } }`）', () => {
    // 它参与 `calc(0.05 * 100%)` 这类算式，一旦被补成 `0.05px` 算式就全错。
    // 我们把它作为常量内联，所以这条断言直接钉住「没有单位」。
    expect(ORIENTATION_MARGIN).toBe(0.05);
    expect(typeof ORIENTATION_MARGIN).toBe('number');
    expect(genDividerStyle('apollo')).not.toContain('0.05px');
  });

  it('别名派生的 `verticalMarginInline` 走 `var(--apollo-margin-xs)`（随主题自适应）', () => {
    // 这是零运行时架构下「组件 token 如何随主题变化」的答案：
    // 派生自 Alias token 的那部分必须是变量引用，不能是运行期算出的定值。
    expect(genDividerStyle('apollo')).toContain('margin-inline:var(--apollo-margin-xs)');
  });
});
