/**
 * App · L1 单元（G5）—— 判据：antd app 测试主行为（context 注入/合并、
 * component=false、警告）+ HookAPI 接线（Issue #40 后不再是 v1 stub）。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, inject, nextTick, onMounted } from 'vue';
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
    // ⚠️ App 现在是 **Fragment**（三个通知 holder + `<Component>` 同级，与 antd
    //    App.tsx 同构）⇒ `wrapper.element` 是 VTU 的宿主，真正的根是 `.apollo-app`。
    const el = wrapper.find('.apollo-app').element as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('apollo-app');
    expect(el.className).toContain('extra');
    expect(el.style.padding).toBe('8px');
    expect(el.textContent).toBe('content');
  });

  it('component=false ⇒ 无包裹；带根 attrs（class/style）时 dev 警告', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(App, {
      props: { component: false, class: 'legacy' },
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

  it('真实 HookAPI：调用**不再** dev 警告，且真的渲染 notice（Issue #40）', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Caller = defineComponent({
      setup() {
        const { message } = App.useApp();
        // ⚠️ 必须在 **holder 挂载之后**调用：setup 期内核实例还没就绪
        onMounted(() => {
          message.success?.('x' as never);
        });
        return () => h('span');
      },
    });
    // ⚠️ v1 的 stub（`createStubApi`，调用即 `console.error('… is not available')`）
    //    已被真实接线取代：现在 `useApp()` 拿到的是 `useMessage()` 的实例。
    const wrapper = mount(App, {
      slots: { default: () => h(Caller) },
      attachTo: document.body,
    });
    // ⚠️ 内核 open → notice 落 DOM 需要几拍（同 `__tests__/s40-issue40.test.ts` 的 flush）
    await nextTick();
    await nextTick();
    await nextTick();
    expect(err.mock.calls.some((c) => String(c[0]).includes('`success` is not available'))).toBe(
      false,
    );
    expect(document.body.querySelector('[role="alert"]')).not.toBeNull();
    err.mockRestore();
    wrapper.unmount();
    document.body.innerHTML = '';
  });

  it('App.useApp 静态属性存在（antd 同构）', () => {
    expect(typeof App.useApp).toBe('function');
  });
});
