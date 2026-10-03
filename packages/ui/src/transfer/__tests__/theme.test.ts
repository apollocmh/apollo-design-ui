/**
 * L1/L2 的主题矩阵：light / dark / compact / token-override 四态。
 *
 * 与 spin 同判：Transfer 的静态样式里没有任何字面颜色（antd 的
 * `genTransferStyle` 全部编译成 `var(--apollo-*)`），主题切换改变的是
 * **变量值**而不是我们的 CSS。断言这条架构性质本身 + 本组件特有的三条：
 *  - token 判定值与 antd 产物逐字对拍（extract-transfer-css.mjs --tokens）；
 *  - 声明块的变量名含 `--apollo-transfer-transfer-header-vertical-padding`
 *    （antd 的 token 名以 transfer 开头 ⇒ 变量名出现两次 transfer，钉成断言）；
 *  - 「变量真的存在」由 tests/build/run.mjs 的 B7 校验。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Transfer from '../index';
import { genTransferStyle } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Transfer', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Transfer · 主题无关性', () => {
  it('四态下的 DOM 完全相同（差异全在 CSS 变量里）', () => {
    const html = mount(Transfer, { props: { dataSource: [] } }).html();
    expect(html).not.toContain('data-apollo-theme');
    expect(html).toContain('class="apollo-transfer');
  });

  it('样式里引用的变量名全部是 `--apollo-*` 形态', () => {
    const vars = [...genTransferStyle('apollo').matchAll(/var\((--[a-z0-9-]+)\)/g)].map(
      (m) => m[1] ?? '',
    );
    expect(vars.length).toBeGreaterThan(0);
    for (const name of vars) {
      expect(name.startsWith('--apollo-')).toBe(true);
    }
  });

  it('前缀不同则产物不同（rename 全链路生效）', () => {
    const ant = genTransferStyle('ant');
    expect(ant).not.toBe(genTransferStyle('apollo'));
    expect(ant).toContain('.ant-transfer-section');
    expect(ant).toContain('--ant-transfer-list-width');
    // ⚠️ 跨组件引用（.apollo-table-* / .apollo-btn 等消费侧命名）**不**跟随改名
    expect(ant).toContain('.apollo-table-wrapper');
  });

  it('★ 7 个 token 声明齐全，且含「双 transfer」变量名（antd 命名照抄）', () => {
    const css = genTransferStyle('apollo');
    expect(css).toContain('--apollo-transfer-list-width:180px');
    expect(css).toContain('--apollo-transfer-list-height:200px');
    expect(css).toContain('--apollo-transfer-list-width-lg:250px');
    expect(css).toContain('--apollo-transfer-header-height:40px');
    expect(css).toContain('--apollo-transfer-item-height:32px');
    expect(css).toContain('--apollo-transfer-item-padding-block:5px');
    expect(css).toContain('--apollo-transfer-transfer-header-vertical-padding:9px');
  });

  it('★ 样式里没有任何硬编码颜色（H7 的可执行判据）', () => {
    const css = genTransferStyle('apollo');
    expect(css.match(/#[0-9a-f]{3,8}\b|rgba?\(/g) ?? []).toEqual([]);
  });

  it('prepareComponentToken 与产物逐字对拍（构建期算式）', () => {
    const t = prepareComponentToken({
      fontSize: 14,
      lineHeight: 1.5714285714285714,
      controlHeight: 32,
      controlHeightLG: 40,
      lineWidth: 1,
    } as never);
    expect(t.listWidth).toBe('180px');
    expect(t.listHeight).toBe('200px');
    expect(t.listWidthLG).toBe('250px');
    expect(t.headerHeight).toBe('40px');
    expect(t.itemHeight).toBe('32px');
    expect(t.itemPaddingBlock).toBe('5px');
    expect(t.transferHeaderVerticalPadding).toBe('9px');
  });
});
