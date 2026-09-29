/**
 * L7 主题 —— TreeSelect（**0 自有 Component Token**：antd
 * `prepareComponentToken = initComponentToken`（tree 的 9 个）；样式 = select
 * 外壳规则改前缀 + tree 规则同前缀 + 62 行 dropdown 层）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { prepareComponentToken } from '../../tree/style/token';
import { genTreeSelectStyle } from '../style';

themeTest('TreeSelect', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('TreeSelect · Component Token（0 自有，复用 tree 的 9 个）', () => {
  it('prepareComponentToken === tree initComponentToken 的产物', () => {
    const t = prepareComponentToken(getDesignToken() as never);
    expect(t.titleHeight).toBe(24);
    expect(t.switcherSize).toBe(24);
    expect(t.directoryNodeSelectedBg).toBe('#1677ff');
  });
});

describe('TreeSelect · 静态 CSS（前缀改写 + dropdown 判定值）', () => {
  const css = genTreeSelectStyle('apollo');

  it('dropdown padding：paddingXS + paddingXS/2（antd 逐字；外壳复用 ⇒ dropdown 规则出现两次，一次来自 select 壳）', () => {
    expect(css).toContain(
      '.apollo-tree-select-dropdown{padding:var(--apollo-padding-xs) calc(var(--apollo-padding-xs) / 2);}',
    );
  });

  it('内嵌树压平：border-radius:0 + node-content-wrapper flex:auto（antd 嵌套 -dropdown 作用域，勿写顶层——会清零触发器圆角）', () => {
    expect(css).toContain('.apollo-tree-select-dropdown .apollo-tree-select{border-radius:0;}');
    expect(css).toContain(
      '.apollo-tree-select-dropdown .apollo-tree-select-list-holder-inner .apollo-tree-select-treenode .apollo-tree-select-node-content-wrapper{flex:auto;}',
    );
    // ⚠️ 触发器根的圆角不能被清零（视觉 diff 四角红点实测）
    expect(css).not.toMatch(/^\.apollo-tree-select\{border-radius:0/m);
  });

  it('RTL：close switcher 图标 rotate(90deg)', () => {
    expect(css).toContain(
      '.apollo-tree-select-dropdown-rtl .apollo-tree-select-switcher.apollo-tree-select-switcher_close .apollo-tree-select-switcher-icon svg{transform:rotate(90deg);}',
    );
  });

  it('外壳复用 select 全套规则（前缀改写为 tree-select）', () => {
    // select 外壳的边框/高度类已改前缀
    expect(css).toContain('.apollo-tree-select-outlined');
  });

  it('树规则同前缀生成（选择器替换到 .apollo-tree-select；变量名沿用 --apollo-tree-*）', () => {
    expect(css).toContain('.apollo-tree-select{--apollo-tree-title-height:');
    expect(css).toContain('.apollo-tree-select-treenode{display:flex');
  });

  it('自定义前缀：整体前缀替换一致', () => {
    const custom = genTreeSelectStyle('myapp');
    expect(custom).toContain('.myapp-tree-select-dropdown{padding:');
    expect(custom).toContain('.myapp-tree-select-dropdown .myapp-tree-select{border-radius:0;}');
    expect(custom).toContain('.myapp-tree-select{--apollo-tree-title-height:');
  });
});
