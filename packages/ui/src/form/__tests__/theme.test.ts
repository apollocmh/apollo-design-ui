/**
 * L7 主题 —— Form 的 Component Token（**11 个字段**）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genFormStyle, genTokenDecls as genFormTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Form', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Form · Component Token 判定值（antd 产物逐字对拍）', () => {
  const t = prepareComponentToken();

  it('11 个字段', () => {
    expect(t.labelRequiredMarkColor).toBe('#ff4d4f'); // colorError
    expect(t.labelColor).toBe('rgba(0,0,0,0.88)'); // colorTextHeading
    expect(t.labelFontSize).toBe(14);
    expect(t.labelHeight).toBe(32); // controlHeight
    expect(t.verticalLabelHeight).toBe('auto');
    expect(t.labelColonMarginInlineStart).toBe(2); // marginXXS / 2
    expect(t.labelColonMarginInlineEnd).toBe(8); // marginXS
    expect(t.itemMarginBottom).toBe(24); // marginLG
    expect(t.verticalLabelPadding).toBe('0 0 8px'); // 0 0 paddingXS
    expect(t.verticalLabelMargin).toBe(0);
    // ⚠️ 第 11 个：只在 -inline 布局里被消费，最容易漏（漏了静态 CSS 看不出来）
    expect(t.inlineItemMarginBottom).toBe(0);
  });
});

describe('Form · 静态 CSS（Token 声明块 + 规则）', () => {
  const decls = genFormTokenDecls('apollo');

  it('11 个 token 变量全部声明（含 -inline-item-margin-bottom）', () => {
    expect(decls).toHaveLength(11);
    const joined = decls.join('\n');
    for (const name of [
      '--apollo-form-label-required-mark-color',
      '--apollo-form-label-color',
      '--apollo-form-label-font-size',
      '--apollo-form-label-height',
      '--apollo-form-vertical-label-height',
      '--apollo-form-label-colon-margin-inline-start',
      '--apollo-form-label-colon-margin-inline-end',
      '--apollo-form-item-margin-bottom',
      '--apollo-form-vertical-label-padding',
      '--apollo-form-vertical-label-margin',
      '--apollo-form-inline-item-margin-bottom',
    ]) {
      expect(joined).toContain(`${name}:`);
    }
  });

  it('规则面覆盖布局 / explain / 反馈图标 / 动效四组（机械移植的抽样哨兵）', () => {
    const css = genFormStyle('apollo');
    // 布局：vertical / inline / horizontal / 尺寸
    expect(css).toContain('.apollo-form-item-vertical .apollo-form-item-row');
    expect(css).toContain('.apollo-form-inline .apollo-form-item-inline');
    expect(css).toContain('.apollo-form-item-horizontal .apollo-form-item-control');
    expect(css).toContain('.apollo-form-small .apollo-form-item .apollo-form-item-label>label');
    // 网格覆盖变量（Form 把 Col 的 display 改成 flex）
    expect(css).toContain('--apollo-grid-display:flex');
    // explain / 反馈图标 / 动效 + keyframes
    expect(css).toContain('.apollo-form-item .apollo-form-item-explain');
    expect(css).toContain('.apollo-form-item-feedback-icon-validating');
    expect(css).toContain('.apollo-form-show-help-item');
    expect(css).toContain('@keyframes apolloZoomIn');
    // 无把手写的失效类名残留（早期版本自造过 -exit-done，antd 产物里没有）
    expect(css).not.toContain('-show-help-exit-done');
  });
});
