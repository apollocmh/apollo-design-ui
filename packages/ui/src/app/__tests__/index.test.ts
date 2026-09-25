/**
 * App · L1 单元（G5）—— 判据：antd app 测试主行为（context 注入/合并、
 * component=false、警告）+ v1 stub API 契约。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, inject } from 'vue';
import { appConfigContextKey, appContextKey } from '../../_internal/app-context';
import App from '../index';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('App · L1 渲染', () => {
  it('component=div ⇒ 根元素带 {p} 类与样式；attrs 透传', async () => {
    const wrapper = mount(App, {
      props: { class: 'extra', style: { padding: '8px' } },
      slots: { default: () => h('span', 'content') },
    });
    const el = wrapper.element as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('apollo-app');
    expect(el.className).toContain('extra');
    expect(el.style.padding).toBe('8px');
    expect(el.textContent).toBe('content');
  });

  it('component=false ⇒ 无包裹；带根类 props 时 dev 警告', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(App, {
      props: { component: false, className: 'legacy' },
      slots: { default: () => h('span', 'x') },
    });
    expect(wrapper.element.tagName).toBe('DIV'); // VTU 的宿主
    expect(wrapper.find('.apollo-app').exists()).toBe(false);
    expect(err.mock.calls.some((c) => String(c[0]).includes('component'))).toBe(true);
    err.mockRestore();
  });

  it('context 注入：子组件 useApp() 拿到三件套；AppConfig 合并', async () => {
    const Probe = defineComponent({
      setup() {
        const api = inject(appContextKey);
        const config = inject(appConfigContextKey);
        return () =>
          h('div', {
            'data-has-api': api ? '1' : '0',
            'data-message-max-count': String(
              (config?.message as Record<string, unknown>)?.maxCount ?? null,
            ),
          });
      },
    });
    const wrapper = mount(App, {
      props: { message: { maxCount: 1 } },
      slots: { default: () => h(Probe) },
    });
    expect(wrapper.find('[data-has-api="1"]').exists()).toBe(true);
    expect(wrapper.find('[data-message-max-count="1"]').exists()).toBe(true);
  });

  it('嵌套 App：AppConfig 沿树合并（子覆盖父）', async () => {
    const Probe = defineComponent({
      setup() {
        const config = inject(appConfigContextKey);
        return () =>
          h('div', {
            'data-placement': String(
              (config?.notification as Record<string, unknown>)?.placement ?? null,
            ),
            'data-max-count': String(
              (config?.message as Record<string, unknown>)?.maxCount ?? null,
            ),
          });
      },
    });
    const wrapper = mount(App, {
      props: { message: { maxCount: 1 }, notification: { placement: 'topLeft' } },
      slots: {
        default: () => h(App, { notification: { placement: 'bottomLeft' } }, () => h(Probe)),
      },
    });
    expect(wrapper.find('[data-placement="bottomLeft"]').exists()).toBe(true);
    expect(wrapper.find('[data-max-count="1"]').exists()).toBe(true);
  });

  it('v1 stub API：调用即 dev 警告', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Caller = defineComponent({
      setup() {
        const { message } = App.useApp();
        message.success?.('x' as never);
        return () => h('span');
      },
    });
    mount(App, { slots: { default: () => h(Caller) } });
    expect(err.mock.calls.some((c) => String(c[0]).includes('`success` is not available'))).toBe(
      true,
    );
    err.mockRestore();
  });

  it('App.useApp 静态属性存在（antd 同构）', () => {
    expect(typeof App.useApp).toBe('function');
  });
});
