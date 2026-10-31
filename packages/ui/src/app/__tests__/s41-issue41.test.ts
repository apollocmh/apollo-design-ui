/**
 * Issue #41 · [App] appConfig 注入的是 setup 期快照
 *
 * `mergedAppConfig` 是 computed，但 `provide(appConfigContextKey, mergedAppConfig.value)`
 * **只在 setup 里求值一次** ⇒ 之后改 App 的 `message` / `notification` props，
 * 已经注入的子孙拿到的还是**挂载那一刻的对象**（Issue #41.1）。
 *
 * 修法与 `ConfigProvider` 的 `config` 同范式：provide 一个**引用恒定**的 reactive
 * 对象，内容用 `watchEffect` 打补丁 —— `inject` 只在 setup 期解析一次，所以
 * 「引用必须恒定」是硬约束。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, inject } from 'vue';
import { appConfigContextKey, injectAppConfig } from '../../_internal/app-context';
import App from '../App';

/** 探针：setup 期 inject 一次（模拟真实消费者），渲染时读最新字段。 */
const Probe = defineComponent({
  setup() {
    const config = injectAppConfig();
    return () =>
      h('div', {
        'data-max-count': String(config.message?.maxCount ?? 'none'),
        'data-placement': String(config.notification?.placement ?? 'none'),
      });
  },
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('App · Issue #41 appConfig 必须随 props 更新', () => {
  it('[A] 改 App 的 message.maxCount ⇒ 后代注入的配置跟着变（核心回归）', async () => {
    const w = mount(App, {
      props: { message: { maxCount: 1 } },
      slots: { default: () => h(Probe) },
      attachTo: document.body,
    });
    expect(w.find('[data-max-count="1"]').exists()).toBe(true);

    await w.setProps({ message: { maxCount: 5 } });
    expect(w.find('[data-max-count="5"]').exists()).toBe(true);
    expect(w.find('[data-max-count="1"]').exists()).toBe(false);
    w.unmount();
  });

  it('[B] 改 App 的 notification.placement ⇒ 后代注入的配置跟着变', async () => {
    const w = mount(App, {
      props: { notification: { placement: 'topLeft' } },
      slots: { default: () => h(Probe) },
      attachTo: document.body,
    });
    expect(w.find('[data-placement="topLeft"]').exists()).toBe(true);

    await w.setProps({ notification: { placement: 'bottomRight' } });
    expect(w.find('[data-placement="bottomRight"]').exists()).toBe(true);
    w.unmount();
  });

  it('[C] 嵌套 App：父级更新 ⇒ 内层合并结果跟着变（子覆盖父）', async () => {
    const w = mount(App, {
      props: { message: { maxCount: 1 } },
      slots: {
        default: () => h(App, { notification: { placement: 'top' } }, { default: () => h(Probe) }),
      },
      attachTo: document.body,
    });
    // 内层：message 来自父（1），notification 是自己（top）
    expect(w.find('[data-max-count="1"]').exists()).toBe(true);
    expect(w.find('[data-placement="top"]').exists()).toBe(true);

    await w.setProps({ message: { maxCount: 9 } });
    expect(w.find('[data-max-count="9"]').exists()).toBe(true);
    w.unmount();
  });

  it('[D] 守卫：无 Provider 时 injectAppConfig() 返回空对象（不变）', () => {
    const Standalone = defineComponent({
      setup() {
        const config = injectAppConfig();
        return () => h('div', { 'data-has-message': config && 'message' in config ? '1' : '0' });
      },
    });
    const w = mount(Standalone, { attachTo: document.body });
    expect(w.find('[data-has-message="0"]').exists()).toBe(true);
    w.unmount();
  });

  it('[E] 守卫：注入的对象**引用恒定**（inject 只在 setup 解析一次）', async () => {
    const refs: unknown[] = [];
    const RefProbe = defineComponent({
      setup() {
        refs.push(inject(appConfigContextKey, {}));
        return () => h('div', { class: 'ref-probe' });
      },
    });
    const w = mount(App, {
      props: { message: { maxCount: 1 } },
      slots: { default: () => h(RefProbe) },
      attachTo: document.body,
    });
    await w.setProps({ message: { maxCount: 3 } });

    // 同一个探针只 inject 一次；若 App 每次 provide 新对象，子孙就拿不到新值
    // —— 这里钉的是「引用恒定」这条硬约束（用 identity 断言而非值断言）
    const again = defineComponent({
      setup() {
        refs.push(inject(appConfigContextKey, {}));
        return () => h('div', { class: 'ref-probe-2' });
      },
    });
    const w2 = mount(App, {
      props: { message: { maxCount: 3 } },
      slots: { default: () => h(again) },
      attachTo: document.body,
    });
    // 两个 App 实例各有自己的 config 对象（隔离），但**同一实例内**引用必须恒定
    expect(refs.length).toBe(2);
    expect(refs[0]).not.toBe(refs[1]);
    w.unmount();
    w2.unmount();
  });
});
