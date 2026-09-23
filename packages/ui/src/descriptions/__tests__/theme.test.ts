/**
 * L7 主题矩阵 —— Descriptions 有 **10 个 Component Token**（antd 同，规则 R7 逐字段对齐）。
 * 这一层钉的是：主题无关性（themeTest）+ Token 声明的**取值形态**（radio D46 同判：
 * 别名派生走 var()、titleMarginBottom 乘法派生走构建期解析值）+ 三形态关键样式。
 */

import { themeTest } from '@apollo-design/test-utils';
import { getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { genDescriptionsStyle, genTokenDecls as genDescriptionsTokenDecls } from '../style';

themeTest('Descriptions', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Descriptions · 主题无关性', () => {
  const css = genDescriptionsStyle('apollo');
  const decls = genDescriptionsTokenDecls('apollo');

  it('Component Token 恰好 10 个；别名派生走 var(--apollo-*)', () => {
    expect(decls).toHaveLength(10);
    expect(css).toContain('--apollo-descriptions-label-bg:var(--apollo-color-fill-alter);');
    expect(css).toContain('--apollo-descriptions-label-color:var(--apollo-color-text-tertiary);');
    expect(css).toContain('--apollo-descriptions-title-color:var(--apollo-color-text);');
    expect(css).toContain('--apollo-descriptions-item-padding-bottom:var(--apollo-padding);');
    expect(css).toContain('--apollo-descriptions-colon-margin-right:var(--apollo-margin-xs);');
    expect(css).toContain(
      '--apollo-descriptions-colon-margin-left:calc(var(--apollo-margin-xxs) / 2);',
    );
    expect(css).toContain('--apollo-descriptions-content-color:var(--apollo-color-text);');
    expect(css).toContain('--apollo-descriptions-extra-color:var(--apollo-color-text);');
  });

  it('titleMarginBottom 是构建期解析值（fontSizeSM * lineHeightSM 的浮点 hazard）', () => {
    // 与 antd 同公式；值必须等于 JS 计算结果（不是 calc）
    const token = getDesignToken();
    expect(css).toContain(
      `--apollo-descriptions-title-margin-bottom:${token.fontSizeSM * token.lineHeightSM}px;`,
    );
  });

  it('冒号 ::after（top:-0.5px 魔数）与 -no-colon 覆盖', () => {
    expect(css).toContain('.apollo-descriptions .apollo-descriptions-item-label::after{');
    expect(css).toContain('content:":";');
    expect(css).toContain('top:-0.5px;');
    expect(css).toContain(
      'margin-inline:var(--apollo-descriptions-colon-margin-left) var(--apollo-descriptions-colon-margin-right);',
    );
    expect(css).toContain(
      '.apollo-descriptions .apollo-descriptions-item-label.apollo-descriptions-item-no-colon::after{',
    );
    expect(css).toContain('content:"";');
  });

  it('bordered 交集选择器 + labelBg + 圆角 + 分隔线', () => {
    expect(css).toContain(
      '.apollo-descriptions.apollo-descriptions-bordered > .apollo-descriptions-view{',
    );
    expect(css).toContain(
      'border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);',
    );
    expect(css).toContain('background-color:var(--apollo-descriptions-label-bg);');
    expect(css).toContain('border-start-start-radius:var(--apollo-border-radius-lg);');
    expect(css).toContain('border-end-start-radius:var(--apollo-border-radius-lg);');
    expect(css).toContain(
      '.apollo-descriptions.apollo-descriptions-bordered > .apollo-descriptions-view .apollo-descriptions-row > .apollo-descriptions-item-label::after{',
    );
    expect(css).toContain('display:none;');
  });

  it('view/table（fixed 布局；bordered 覆盖 auto）与尺寸三档', () => {
    expect(css).toContain('.apollo-descriptions .apollo-descriptions-view table{');
    expect(css).toContain('table-layout:fixed;');
    expect(css).toContain('table-layout:auto;');
    expect(css).toContain(
      '.apollo-descriptions-medium .apollo-descriptions-row > th,.apollo-descriptions-medium .apollo-descriptions-row > td{',
    );
    expect(css).toContain('padding-bottom:var(--apollo-padding-sm);');
    expect(css).toContain(
      '.apollo-descriptions-small .apollo-descriptions-row > th,.apollo-descriptions-small .apollo-descriptions-row > td{',
    );
    expect(css).toContain('padding-bottom:var(--apollo-padding-xs);');
  });

  it('item-container 的 inline-flex baseline（非 bordered 两列布局）', () => {
    expect(css).toContain('.apollo-descriptions .apollo-descriptions-item-container{');
    expect(css).toContain('display:inline-flex;');
    expect(css).toContain('align-items:baseline;');
    expect(css).toContain('min-width:1em;');
  });
});
