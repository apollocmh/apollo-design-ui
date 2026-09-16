import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { darkAlgorithm } from '../get-design-token';
import { createThemeContext, ThemeProvider, useTheme, useToken } from '../vue';
import type { ThemeContext } from '../vue';

/**
 * Vue 绑定层的测试。
 *
 * 关注点是"接得对不对"，不是派生值对不对（那是 baseline.test.ts 的事）：
 *   - provide / inject 是否贯通
 *   - 换 config 是否触发重算
 *   - 卸载是否清理干净
 */

describe('useTheme / useToken', () => {
  it('无 Provider 时回落到默认主题，不抛错', () => {
    const Host = defineComponent({
      setup() {
        const token = useToken();
        return () => h('div', token.value.colorPrimary);
      },
    });
    expect(mount(Host).text()).toBe('#1677ff');
  });

  it('Provider 的 theme 能被子组件读到', () => {
    const Child = defineComponent({
      setup() {
        return () => h('span', useToken().value.colorPrimary);
      },
    });
    const wrapper = mount(ThemeProvider, {
      props: { theme: { token: { colorPrimary: '#00b96b' } } },
      slots: { default: () => h(Child) },
    });
    expect(wrapper.text()).toBe('#00b96b');
  });

  it('createThemeContext 改 config 后 token 重算', () => {
    const ctx = createThemeContext({});
    expect(ctx.token.value.colorBgContainer).toBe('#ffffff');
    ctx.config.value = { algorithm: darkAlgorithm };
    expect(ctx.token.value.colorBgContainer).toBe('#141414');
  });
});

describe('ThemeProvider 的运行时 CSS 变量注入', () => {
  it('injectCssVar 打开时写入 document.documentElement', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    mount(ThemeProvider, {
      props: { theme: { token: { colorPrimary: '#00b96b' } }, injectCssVar: true, target: el },
      slots: { default: () => h('div') },
    });

    expect(el.style.getPropertyValue('--apollo-color-primary')).toBe('#00b96b');
  });

  it('★ 卸载后移除写过的变量（不清理会污染后续渲染）', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const wrapper = mount(ThemeProvider, {
      props: { injectCssVar: true, target: el },
      slots: { default: () => h('div') },
    });
    expect(el.style.getPropertyValue('--apollo-color-primary')).toBe('#1677ff');

    wrapper.unmount();
    expect(el.style.getPropertyValue('--apollo-color-primary')).toBe('');
  });

  it('换 theme 后变量跟着更新', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const wrapper = mount(ThemeProvider, {
      props: { theme: { token: { colorPrimary: '#1677ff' } }, injectCssVar: true, target: el },
      slots: { default: () => h('div') },
    });
    expect(el.style.getPropertyValue('--apollo-color-primary')).toBe('#1677ff');

    await wrapper.setProps({ theme: { token: { colorPrimary: '#00b96b' } } });
    expect(el.style.getPropertyValue('--apollo-color-primary')).toBe('#00b96b');
  });

  it('useTheme 拿到的 context 与 Provider 是同一个', () => {
    // 用数组收集而不是 `let x: T | null = null`：TS 的控制流分析看不到 setup 回调里的赋值，
    // 会把读点窄化成 null（`Property 'token' does not exist on type 'never'`）。
    const seen: ThemeContext[] = [];
    const Child = defineComponent({
      setup() {
        seen.push(useTheme());
        return () => h('div');
      },
    });
    mount(ThemeProvider, {
      props: { theme: { token: { colorPrimary: '#ff0000' } } },
      slots: { default: () => h(Child) },
    });
    expect(seen[0]?.token.value.colorPrimary).toBe('#ff0000');
  });
});
