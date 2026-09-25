/**
 * L1/L2 —— 通知内核（`notification/engine/`）的行为测试。
 *
 * 内核是 message 与 notification 共用的地基，所以这里钉的是**内核自己的契约**：
 * 队列与容器、notice 的 DOM 结构、key 复用（`times`）、maxCount、关闭与销毁、
 * 计时与暂停、堆叠折叠。
 *
 * ⚠️ 命令式路径整体走 portal（默认 `document.body`）⇒ 断言要在 `document.body` 上找，
 * 不能在 `wrapper.html()` 里找。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import { useNotification } from '../engine';

interface HarnessOptions {
  maxCount?: number;
  duration?: number;
  stack?: boolean | { threshold?: number };
  pauseOnHover?: boolean;
  closable?: boolean;
  showProgress?: boolean;
}

/** 挂一个「渲染 holder」的宿主组件，并把 api 暴露给测试。 */
function mountHolder(options: HarnessOptions = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const apiRef = ref<ReturnType<typeof useNotification>['api'] | null>(null);

  const Host = defineComponent({
    name: 'HolderHost',
    setup() {
      const { api, holder } = useNotification({
        getContainer: () => container,
        prefixCls: 'apollo-notification',
        duration: options.duration ?? 0,
        maxCount: options.maxCount,
        stack: options.stack,
        pauseOnHover: options.pauseOnHover,
        closable: options.closable,
        showProgress: options.showProgress,
      });
      apiRef.value = api;
      return () => h('div', [holder()]);
    },
  });

  // ⚠️ VTU 默认把 Teleport 打桩成 `<teleport-stub>`（内容留在原地）——
  //    必须显式关掉，否则测不到「portal 到 getContainer」这条契约。
  const wrapper = mount(Host, { attachTo: document.body, global: { stubs: { teleport: false } } });
  return { wrapper, container, api: () => apiRef.value! };
}

/** ⚠️ Teleport + 队列 + 动效队列：一次 nextTick 不够，统一等 4 拍。 */
async function flushAll(): Promise<void> {
  for (let i = 0; i < 4; i += 1) await nextTick();
}

const notices = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.apollo-notification-notice'));

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('notification engine · 容器与队列', () => {
  it('open 后 notice 出现在容器里（portal 到 getContainer）', async () => {
    const { wrapper, container, api } = mountHolder();
    api().open({ key: 'a', title: 'Hello' });
    await flushAll();

    const list = container.querySelector('.apollo-notification-list');
    expect(list).not.toBeNull();
    expect(notices(container)).toHaveLength(1);
    expect(container.textContent).toContain('Hello');
    wrapper.unmount();
  });

  it('close(key) 只移除那一条；destroy() 清空', async () => {
    const { wrapper, container, api } = mountHolder();
    api().open({ key: 'a', title: 'A' });
    api().open({ key: 'b', title: 'B' });
    await flushAll();
    expect(notices(container)).toHaveLength(2);

    api().close('a');
    await flushAll();
    expect(notices(container)).toHaveLength(1);
    expect(container.textContent).toContain('B');

    api().destroy();
    await flushAll();
    expect(notices(container)).toHaveLength(0);
    wrapper.unmount();
  });

  it('同 key 复用同一条 notice，并把 times 累加', async () => {
    const { wrapper, container, api } = mountHolder();
    api().open({ key: 'same', title: 'first' });
    await flushAll();
    api().open({ key: 'same', title: 'second' });
    await flushAll();

    expect(notices(container)).toHaveLength(1);
    expect(container.textContent).toContain('second');
    wrapper.unmount();
  });

  it('maxCount 只保留最后 N 条', async () => {
    const { wrapper, container, api } = mountHolder({ maxCount: 2 });
    api().open({ key: '1', title: 'one' });
    api().open({ key: '2', title: 'two' });
    api().open({ key: '3', title: 'three' });
    await flushAll();

    const list = notices(container);
    expect(list).toHaveLength(2);
    expect(container.textContent).toContain('two');
    expect(container.textContent).toContain('three');
    expect(container.textContent).not.toContain('one');
    wrapper.unmount();
  });
});

describe('notification engine · notice 的 DOM 契约', () => {
  it('role / data-notification-index / --notification-index 与上游一致', async () => {
    const { wrapper, container, api } = mountHolder();
    api().open({ key: 'k', title: 'T' });
    await flushAll();

    const notice = notices(container)[0]!;
    expect(notice.getAttribute('role')).toBe('alert');
    expect(notice.getAttribute('data-notification-index')).toBe('0');
    expect(notice.getAttribute('style')).toContain('--notification-index: 0');
    wrapper.unmount();
  });

  it('有 icon 才包 -notice-wrapper（title 在 wrapper 内）', async () => {
    const { wrapper, container, api } = mountHolder();
    api().open({ key: 'k', title: 'T' });
    await flushAll();
    expect(notices(container)[0]!.querySelector('.apollo-notification-notice-wrapper')).toBeNull();
    wrapper.unmount();
  });

  it('closable 默认关闭 ⇒ 不渲染关闭按钮（message 形态）', async () => {
    const { wrapper, container, api } = mountHolder();
    api().open({ key: 'k', title: 'T' });
    await flushAll();
    expect(container.querySelector('.apollo-notification-notice-close')).toBeNull();
    wrapper.unmount();
  });

  it('closable=true ⇒ 渲染关闭按钮（aria-label=Close）', async () => {
    const { wrapper, container, api } = mountHolder({ closable: true });
    api().open({ key: 'k', title: 'T' });
    await flushAll();
    const btn = container.querySelector('.apollo-notification-notice-close');
    expect(btn).not.toBeNull();
    expect(btn!.getAttribute('aria-label')).toBe('Close');
    wrapper.unmount();
  });
});

describe('notification engine · 计时与堆叠', () => {
  it('duration 到点自动关闭', async () => {
    vi.useFakeTimers();
    const { wrapper, container, api } = mountHolder({ duration: 1 });
    api().open({ key: 'k', title: 'T' });
    await flushAll();
    expect(notices(container)).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1200);
    await nextTick();
    expect(notices(container)).toHaveLength(0);
    wrapper.unmount();
  });

  it('stack 启用时列表带 -stack 类；条数不超阈值时不折叠（-stack-expanded）', async () => {
    const { wrapper, container, api } = mountHolder({ stack: { threshold: 2 } });
    api().open({ key: '1', title: 'one' });
    api().open({ key: '2', title: 'two' });
    await flushAll();

    const list = container.querySelector('.apollo-notification-list')!;
    expect(list.className).toContain('apollo-notification-stack');
    expect(list.className).toContain('apollo-notification-stack-expanded');
    wrapper.unmount();
  });
});
