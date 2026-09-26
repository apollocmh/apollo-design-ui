/** L7 主题 —— Notification 的组件变量（DECLS 字面量）+ token 派生判据。 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genNotificationStyle, genNotificationTokenDecls } from '../style';
import {
  notificationDerivedValues,
  notificationTokenValues,
  prepareComponentToken,
  prepareNotificationToken,
} from '../style/token';

themeTest('Notification', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
  global: { stubs: { teleport: false } },
});

describe('Notification · token 契约', () => {
  const css = genNotificationStyle();
  const decls = genNotificationTokenDecls();

  it('组件变量声明块（关键值对拍 antd .ant-notification-css-var）', () => {
    expect(decls).toContain('--apollo-notification-z-index-popup:2050;');
    expect(decls).toContain('--apollo-notification-width:384px;');
    expect(decls).toContain(
      '--apollo-notification-progress-bg:linear-gradient(90deg, #69b1ff, #1677ff);',
    );
  });

  it('声明块覆盖两个根形态（PurePanel 根不在 .apollo-notification 子树内）', () => {
    expect(css).toContain(`.apollo-notification{${decls}}`);
    expect(css).toContain(`.apollo-notification-notice-pure-panel{${decls}}`);
  });

  it('holder / list / notice / placement 的关键规则', () => {
    expect(css).toContain('.apollo-notification{');
    expect(css).toContain('z-index:var(--apollo-notification-z-index-popup)');
    expect(css).toContain('.apollo-notification.apollo-notification-list{');
    expect(css).toContain('.apollo-notification .apollo-notification-notice{');
    expect(css).toContain('width:var(--apollo-notification-width)');
    // 六方位定位（message 只有 top）
    expect(css).toContain('.apollo-notification.apollo-notification-topLeft');
    expect(css).toContain('.apollo-notification.apollo-notification-bottomRight');
  });

  it('notice 的图标/标题字号是共享派生（fontSizeLG / lineHeightLG）', () => {
    expect(css).toContain(
      '--apollo-notification-icon-font-size:calc(var(--apollo-font-size-lg) * var(--apollo-line-height-lg))',
    );
    expect(css).toContain('--apollo-notification-title-font-size:var(--apollo-font-size-lg)');
  });

  it('四个容器背景色是**带 fallback 的 var()**（上游默认 undefined，不进声明块）', () => {
    expect(css).toContain(
      'var(--apollo-notification-color-success-bg, var(--apollo-color-bg-elevated))',
    );
    expect(decls).not.toContain('color-success-bg');
  });

  it('ant 残留三坑核查（#79/#80/#81）', () => {
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).not.toMatch(/[^a-z-]anticon[^-]/);
    expect(css).not.toContain('@supports');
  });
});

describe('Notification · token 派生判据', () => {
  it('zIndexPopup = zIndexPopupBase + CONTAINER_MAX_OFFSET(1000) + 50', () => {
    const t = prepareComponentToken({
      zIndexPopupBase: 1000,
      colorPrimaryBorderHover: '#69b1ff',
      colorPrimary: '#1677ff',
    });
    expect(t.zIndexPopup).toBe(2050);
    expect(t.width).toBe(384);
    expect(t.progressBg).toBe('linear-gradient(90deg, #69b1ff, #1677ff)');
    expect(t.colorSuccessBg).toBeUndefined();
  });

  it('prepareNotificationToken 的 9 个派生量（message 也用这一份）', () => {
    const d = notificationDerivedValues();
    expect(d.notificationBg).toBe('#ffffff');
    expect(d.notificationPadding).toBe('20px 24px');
    expect(d.notificationPaddingVertical).toBe(20);
    expect(d.notificationPaddingHorizontal).toBe(24);
    expect(d.notificationIconSize).toBe(24); // 16 × 1.5
    expect(d.notificationCloseButtonSize).toBe(22); // 40 × 0.55
    expect(d.notificationMarginBottom).toBe(16);
    expect(d.notificationMarginEdge).toBe(24);
    expect(d.notificationProgressHeight).toBe(2);
    expect(d.notificationMotionOffset).toBe(64);
  });

  it('notificationTokenValues 与 DECLS 字面量一致', () => {
    const t = notificationTokenValues();
    expect(genNotificationTokenDecls()).toContain(
      `--apollo-notification-z-index-popup:${t.zIndexPopup};`,
    );
    expect(genNotificationTokenDecls()).toContain(`--apollo-notification-width:${t.width}px;`);
  });

  it('prepareNotificationToken 保留输入字段（透传 + 派生）', () => {
    const d = prepareNotificationToken({
      colorBgElevated: '#000',
      paddingMD: 10,
      paddingLG: 12,
      paddingContentHorizontalLG: 14,
      fontSizeLG: 20,
      lineHeightLG: 2,
      controlHeightLG: 50,
      margin: 6,
      marginLG: 8,
    });
    expect(d.notificationIconSize).toBe(40);
    // ⚠️ `50 * 0.55` 在 IEEE754 下是 27.500000000000004 ⇒ 用 toBeCloseTo（上游同样是浮点乘法）
    expect(d.notificationCloseButtonSize).toBeCloseTo(27.5);
    expect(d.notificationPadding).toBe('10px 14px');
  });
});
