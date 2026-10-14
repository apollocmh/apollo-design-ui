/**
 * Issue #40 · [App] `useApp()` 的通知 API 仍是 stub
 *
 * 原来 `App` 用 `createStubApi()` 造三个假 API：调用只 `console.error`，DOM 上什么
 * 都不会出现。而仓库里 `message` / `notification` / `modal` **都已经有实现**
 * （`useMessage` / `useNotification` / `Modal.useModal()`）—— 缺的只是接线。
 *
 * 上游 antd `App.tsx` 就是「三个 `useXxx` + 三个 contextHolder」：holder 与
 * `<Component>` **同级**渲染 ⇒ 每个 App 实例自带一套通知容器（嵌套隔离、
 * 随 App 卸载销毁、能吃 ConfigProvider 与 AppConfig 的配置）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { useApp } from '../../_internal/app-context';
import App from '../App';

type AppApi = {
  message: { success: (c: string) => void; destroy: (key?: string | number) => void };
  notification: {
    success: (config: { message: string }) => void;
    destroy: (key?: string | number) => void;
  };
  modal: { info: (c: { title: string; content: string }) => unknown };
};

/** 抓取子树里 `useApp()` 拿到的 API。 */
const createChild = () => {
  const holder: { api: AppApi | null } = { api: null };
  const Child = defineComponent({
    setup() {
      holder.api = useApp() as unknown as AppApi;
      return () => h('span', { class: 'child' }, 'child');
    },
  });
  return { Child, holder };
};

const mountApp = (props: Record<string, unknown> = {}, nested = false) => {
  const { Child, holder } = createChild();
  const inner = () => h(Child);
  const tree = nested ? () => h(App, null, { default: inner }) : inner;
  const w = mount(App, {
    props: props as never,
    slots: { default: tree },
    attachTo: document.body,
  });
  return { w, holder };
};

const flush = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('App · Issue #40 useApp() 必须接到真实 HookAPI', () => {
  it('[A] message.success ⇒ DOM 上真的出现 notice（核心回归）', async () => {
    const { w, holder } = mountApp();
    await flush();
    holder.api!.message.success('Hello Message');
    await flush();

    const notice = document.body.querySelector('[role="alert"]');
    expect(notice).not.toBeNull();
    expect(document.body.textContent).toContain('Hello Message');
    w.unmount();
  });

  it('[B] notification.success ⇒ DOM 上真的出现 notice', async () => {
    const { w, holder } = mountApp();
    await flush();
    // ⚠️ notification 的四个类型方法收的是 **config 对象**（`message` 字段），不是裸字符串
    holder.api!.notification.success({ message: 'Hello Notification' });
    await flush();

    expect(document.body.innerHTML).toContain('apollo-notification');
    expect(document.body.textContent).toContain('Hello Notification');
    w.unmount();
  });

  it('[C] modal.info ⇒ DOM 上真的出现 modal', async () => {
    const { w, holder } = mountApp();
    await flush();
    holder.api!.modal.info({ title: 'T', content: 'Hello Modal' });
    await flush();

    expect(document.body.innerHTML).toContain('apollo-modal');
    expect(document.body.textContent).toContain('Hello Modal');
    w.unmount();
  });

  it('[D] 配置继承：`message={{ maxCount: 1 }}` 生效（只留最后一条）', async () => {
    const { w, holder } = mountApp({ message: { maxCount: 1 } });
    await flush();
    holder.api!.message.success('one');
    await flush();
    holder.api!.message.success('two');
    await flush();

    const notices = document.body.querySelectorAll('[role="alert"]');
    expect(notices).toHaveLength(1);
    expect(notices[0]?.textContent).toContain('two');
    w.unmount();
  });

  it('[E] destroy() 清空 notice', async () => {
    const { w, holder } = mountApp();
    await flush();
    holder.api!.message.success('bye');
    await flush();
    expect(document.body.querySelectorAll('[role="alert"]')).toHaveLength(1);

    holder.api!.message.destroy();
    await flush();
    expect(document.body.querySelectorAll('[role="alert"]')).toHaveLength(0);
    w.unmount();
  });

  it('[F] 嵌套 App：内层拿到**自己的** API（实例隔离）', async () => {
    const outer = createChild();
    const inner = createChild();
    // ⚠️ 外层探针必须挂在外层 App 的**直接子树**里，内层探针挂在内层 App 里
    const w = mount(App, {
      slots: {
        default: () => [h(outer.Child), h(App, null, { default: () => h(inner.Child) })],
      },
      attachTo: document.body,
    });
    await flush();

    // 两层 provide 的 api 不是同一个对象 ⇒ 各自独立的通知容器
    expect(outer.holder.api).not.toBe(inner.holder.api);
    expect(typeof outer.holder.api!.message.success).toBe('function');
    expect(typeof inner.holder.api!.notification.success).toBe('function');

    // 内层开的通知，外层 destroy 关不掉（隔离的证据）
    const innerApi = inner.holder.api;
    if (!innerApi) throw new Error('inner api 未注入');
    innerApi.message.success('inner-only');
    await flush();
    expect(document.body.querySelectorAll('[role="alert"]')).toHaveLength(1);

    outer.holder.api!.message.destroy();
    await flush();
    expect(document.body.querySelectorAll('[role="alert"]')).toHaveLength(1);

    inner.holder.api!.message.destroy();
    await flush();
    expect(document.body.querySelectorAll('[role="alert"]')).toHaveLength(0);
    w.unmount();
  });

  it('[G] App 卸载 ⇒ 通知容器一起卸载（不留残余节点）', async () => {
    const { w, holder } = mountApp();
    await flush();
    holder.api!.message.success('temp');
    await flush();
    expect(document.body.innerHTML).toContain('apollo-message');

    w.unmount();
    await flush();
    expect(document.body.innerHTML).not.toContain('apollo-message');
  });

  it('[H] 守卫：component=false 时仍不渲染根元素，但 API 照常可用', async () => {
    const { Child, holder } = createChild();
    const w = mount(App, {
      props: { component: false } as never,
      slots: { default: () => h(Child) },
      attachTo: document.body,
    });
    await flush();
    expect(document.body.querySelector('.apollo-app')).toBeNull();

    holder.api!.message.success('no-root');
    await flush();
    expect(document.body.querySelectorAll('[role="alert"]')).toHaveLength(1);
    w.unmount();
  });
});
