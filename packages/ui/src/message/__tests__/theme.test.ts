/** L7 主题 —— Message 的组件变量（DECLS 字面量）+ prepareComponentToken 判据。 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genMessageStyle, genMessageTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Message', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
});

describe('Message · token 契约', () => {
  const css = genMessageStyle();
  const decls = genMessageTokenDecls();

  it('组件变量声明块（关键值对拍 antd .ant-message-css-var）', () => {
    expect(decls).toContain('--apollo-message-z-index-popup:2010;');
    expect(decls).toContain('--apollo-message-content-bg:#ffffff;');
    expect(decls).toContain('--apollo-message-content-padding:9px 12px;');
  });

  it('声明块覆盖两个根形态（PurePanel 根不在 .apollo-message 子树内）', () => {
    expect(css).toContain(`.apollo-message{${decls}}`);
    expect(css).toContain(`.apollo-message-notice-pure-panel{${decls}}`);
  });

  it('holder / list / notice 的关键规则（原序字面量）', () => {
    expect(css).toContain('.apollo-message{');
    expect(css).toContain('z-index:var(--apollo-message-z-index-popup)');
    expect(css).toContain('.apollo-message.apollo-message-list{');
    expect(css).toContain('.apollo-message .apollo-message-notice{');
    expect(css).toContain('padding:var(--apollo-message-content-padding)');
    expect(css).toContain('background:var(--apollo-message-content-bg)');
  });

  it('stack 折叠 + 类型图标着色 + pure-panel 段', () => {
    expect(css).toContain('.apollo-message.apollo-message-stack');
    expect(css).toContain(
      '--notification-scale:calc(1 - min(var(--notification-index, 0), 2) * 0.06)',
    );
    expect(css).toContain(
      '.apollo-message-notice-icon.apollo-message-notice-icon-success{color:var(--apollo-color-success);}',
    );
    expect(css).toContain('.apollo-message-notice-pure-panel{');
  });

  it('ant 残留三坑核查（#79/#80/#81）', () => {
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).not.toMatch(/[^a-z-]anticon[^-]/);
    expect(css).not.toContain('@supports');
  });
});

describe('Message · prepareComponentToken 判据', () => {
  it('zIndexPopup = zIndexPopupBase + CONTAINER_MAX_OFFSET(1000) + 10', () => {
    const t = prepareComponentToken({
      zIndexPopupBase: 1000,
      colorBgElevated: '#ffffff',
      controlHeightLG: 40,
      fontSize: 14,
      lineHeight: 1.5714285714285714,
      paddingSM: 12,
    });
    expect(t.zIndexPopup).toBe(2010);
    expect(t.contentBg).toBe('#ffffff');
    expect(t.contentPadding).toBe('9px 12px');
  });
});
