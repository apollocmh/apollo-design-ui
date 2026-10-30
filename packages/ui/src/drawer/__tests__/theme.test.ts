/** L7 主题 —— Drawer 的组件变量（DECLS 字面量）+ token 判据。 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import Drawer from '../Drawer';
import PurePanel from '../PurePanel';
import { genDrawerStyle, genDrawerTokenDecls } from '../style';
import { drawerTokenValues, prepareComponentToken } from '../style/token';

themeTest('Drawer', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 18,
  global: { stubs: { teleport: false } },
});

it('consumes nested theme overrides and returns to current parent tokens after removal', async () => {
  const custom = ref(true);
  const parentBase = ref(1400);
  const customIndex = ref(2500);
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            theme: {
              token: {
                colorText: '#123456',
                zIndexPopupBase: parentBase.value,
                padding: 24,
                paddingXS: 10,
              },
            },
          },
          () => [
            h(PurePanel, { class: 'outer-static' }),
            h(
              ConfigProvider,
              {
                theme: custom.value
                  ? {
                      token: { colorText: '#654321' },
                      components: {
                        Drawer: {
                          zIndexPopup: customIndex.value,
                          footerPaddingBlock: 4,
                          footerPaddingInline: 9,
                          draggerSize: 7,
                        },
                      },
                    }
                  : undefined,
              },
              () =>
                h(Drawer, {
                  open: true,
                  getContainer: false,
                  autoFocus: false,
                  class: 'inner-overlay',
                }),
            ),
          ],
        ),
    }),
    { global: { stubs: { teleport: false } } },
  );
  for (let index = 0; index < 6; index++) await nextTick();
  const outer = wrapper.get<HTMLElement>('.outer-static').element;
  const inner = wrapper.get<HTMLElement>('.inner-overlay').element;
  expect(outer.style.getPropertyValue('--apollo-drawer-z-index-popup')).toBe('1400');
  expect(outer.style.getPropertyValue('--apollo-drawer-footer-padding-block')).toBe('10px');
  expect(outer.style.getPropertyValue('--apollo-drawer-footer-padding-inline')).toBe('24px');
  expect(inner.style.getPropertyValue('--apollo-color-text')).toBe('#654321');
  expect(inner.style.getPropertyValue('--apollo-drawer-z-index-popup')).toBe('2500');
  expect(inner.style.getPropertyValue('--apollo-drawer-footer-padding-block')).toBe('4px');
  expect(inner.style.getPropertyValue('--apollo-drawer-footer-padding-inline')).toBe('9px');
  expect(inner.style.getPropertyValue('--apollo-drawer-dragger-size')).toBe('7px');
  customIndex.value = -1;
  await nextTick();
  expect(inner.style.getPropertyValue('--apollo-drawer-z-index-popup')).toBe('-1');
  custom.value = false;
  parentBase.value = 1700;
  await nextTick();
  expect(inner.style.getPropertyValue('--apollo-color-text')).toBe('#123456');
  expect(inner.style.getPropertyValue('--apollo-drawer-z-index-popup')).toBe('1700');
  expect(inner.style.getPropertyValue('--apollo-drawer-footer-padding-block')).toBe('10px');
  expect(inner.style.getPropertyValue('--apollo-drawer-footer-padding-inline')).toBe('24px');
  expect(inner.style.getPropertyValue('--apollo-drawer-dragger-size')).toBe('4px');
  expect(outer.style.getPropertyValue('--apollo-drawer-z-index-popup')).toBe('1700');
  wrapper.unmount();
});

describe('Drawer · token 契约', () => {
  const css = genDrawerStyle();
  const decls = genDrawerTokenDecls();

  it('组件变量声明块（4 个 token，对拍 antd .ant-drawer-css-var）', () => {
    expect(decls).toContain('--apollo-drawer-z-index-popup:1000;');
    expect(decls).toContain('--apollo-drawer-footer-padding-block:8px;');
    expect(decls).toContain('--apollo-drawer-footer-padding-inline:16px;');
    expect(decls).toContain('--apollo-drawer-dragger-size:4px;');
  });

  it('声明块挂在 .apollo-drawer 上（PurePanel 的根类含它）', () => {
    expect(css).toContain(`.apollo-drawer{${decls}}`);
  });

  it('关键规则：容器 / mask / 面板 / 四向定位', () => {
    expect(css).toContain('.apollo-drawer{');
    expect(css).toContain('z-index:var(--apollo-drawer-z-index-popup)');
    expect(css).toContain('.apollo-drawer-mask');
    expect(css).toContain('.apollo-drawer-content-wrapper');
    expect(css).toContain('.apollo-drawer-section');
    // 四向各一套动效类
    for (const p of ['top', 'right', 'bottom', 'left']) {
      expect(css).toContain(`.apollo-drawer-panel-motion-${p}-appear`);
    }
  });

  it('ant 残留三坑核查（#79/#80/#81）', () => {
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).not.toMatch(/[^a-z-]anticon[^-]/);
    expect(css).not.toContain('@supports');
  });
});

describe('Drawer · prepareComponentToken 判据', () => {
  it('zIndexPopup 直接用 base（**不加偏移** —— 与 message/notification 不同）', () => {
    const t = prepareComponentToken({ zIndexPopupBase: 1000, paddingXS: 8, padding: 16 });
    expect(t.zIndexPopup).toBe(1000);
    expect(t.footerPaddingBlock).toBe(8);
    expect(t.footerPaddingInline).toBe(16);
    expect(t.draggerSize).toBe(4);
  });

  it('drawerTokenValues 与 DECLS 字面量一致', () => {
    const t = drawerTokenValues();
    expect(genDrawerTokenDecls()).toContain(`--apollo-drawer-z-index-popup:${t.zIndexPopup};`);
  });
});
