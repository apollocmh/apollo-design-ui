/**
 * 2026-10-22 通知动效审计 MN-03：尺寸 ref 必须按 key 稳定，不能被每轮渲染清空。
 *
 * 判据：NoticeList 因文案更新而重渲染时，`setNodeSize` **不能**收到 `(key, null)`。
 * 反向哨兵：首次挂载必须收到元素；ResizeObserver 触发时必须重新测量。
 */
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

const probe = vi.hoisted(() => ({
  calls: [] as Array<[string, unknown]>,
}));

vi.mock('../engine/hooks/useListPosition', async () => {
  const { computed: makeComputed } = await import('vue');
  return {
    useListPosition: () => ({
      position: makeComputed(() => new Map<string, number>()),
      setNodeSize: (key: string, node: unknown) => {
        probe.calls.push([key, node]);
      },
      totalHeight: makeComputed(() => 0),
      topNoticeHeight: makeComputed(() => 0),
      topNoticeWidth: makeComputed(() => 0),
    }),
  };
});

import NoticeList from '../engine/NoticeList';

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(public callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }
  trigger(target: Element): void {
    this.callback([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
}

beforeEach(() => {
  probe.calls = [];
  FakeResizeObserver.instances = [];
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

const configList = [
  { key: 'a', title: 'A' },
  { key: 'b', title: 'B' },
];

describe('通知内核 MN-03 · 尺寸测量通道', () => {
  it('重渲染不清空 sizeMap；ResizeObserver 变化时会重测', async () => {
    const wrapper = mount(NoticeList, {
      props: { placement: 'topRight', configList } as never,
    });
    await nextTick();
    await nextTick();

    // 首挂必须测量到两个元素
    const mounted = probe.calls.filter(([, node]) => node !== null);
    expect(new Set(mounted.map(([key]) => key))).toEqual(new Set(['a', 'b']));
    const observer = FakeResizeObserver.instances[0];
    expect(observer).toBeDefined();
    expect(observer?.observe).toHaveBeenCalledTimes(2);

    // 文案更新（同 key）⇒ 重渲染；稳定 ref 不应产生 null 清除
    probe.calls = [];
    await wrapper.setProps({
      configList: [
        { key: 'a', title: 'A updated with a much longer title' },
        { key: 'b', title: 'B updated' },
      ],
    } as never);
    await nextTick();
    await nextTick();

    expect(probe.calls.filter(([, node]) => node === null)).toEqual([]);

    // ResizeObserver 推来新尺寸 ⇒ 重新写 sizeMap
    probe.calls = [];
    const el = wrapper.find('.apollo-notification-notice').element;
    observer?.trigger(el);
    expect(probe.calls).toContainEqual(['a', el]);
    wrapper.unmount();
  });
});
