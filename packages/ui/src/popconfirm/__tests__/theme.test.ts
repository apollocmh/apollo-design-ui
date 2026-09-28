/**
 * L7 主题矩阵 —— Popconfirm 有 **1 个 Component Token**（antd 同，规则 R7）。
 * 钉：主题无关性（themeTest）+ Token 声明形态 + 关键 token 的 var() 消费。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genPopconfirmStyle, genTokenDecls as genPopconfirmTokenDecls } from '../style';

themeTest('Popconfirm', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Popconfirm · 主题无关性', () => {
  const css = genPopconfirmStyle('apollo');
  const decls = genPopconfirmTokenDecls('apollo');

  it('Component Token 恰好 1 个（zIndexPopup = zIndexPopupBase + 60）', () => {
    expect(decls).toHaveLength(1);
    expect(css).toContain(
      '--apollo-popconfirm-z-index-popup:calc(var(--apollo-z-index-popup-base) + 60);',
    );
    expect(css).toContain('z-index:var(--apollo-popconfirm-z-index-popup);');
  });

  it('resetStyle: false —— 上游没有 resetComponent 段（逐字保留）', () => {
    expect(css).not.toContain('box-sizing:border-box;');
  });

  it('message / icon / title / description / buttons 的规则', () => {
    expect(css).toContain('.apollo-popconfirm-message{');
    expect(css).toContain('.apollo-popconfirm-message>.apollo-popconfirm-message-icon{');
    expect(css).toContain('color:var(--apollo-color-warning);');
    expect(css).toContain('font-weight:var(--apollo-font-weight-strong);');
    expect(css).toContain('color:var(--apollo-color-text-heading);');
    // 只有 title 没有 description 时不加粗（上游 &:only-child）
    expect(css).toContain('.apollo-popconfirm-title:only-child{');
    expect(css).toContain('margin-top:var(--apollo-margin-xxs);');
    expect(css).toContain('.apollo-popconfirm-buttons button{');
  });

  it('浮层字号由 `.apollo-popconfirm.apollo-popover` 单独给（上游同构）', () => {
    expect(css).toContain('.apollo-popconfirm.apollo-popover{');
    expect(css).toContain('font-size:var(--apollo-font-size);');
  });
});
