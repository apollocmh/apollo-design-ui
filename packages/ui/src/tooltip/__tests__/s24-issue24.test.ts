/**
 * Tooltip · Issue #24 回归（7 项，先复现后修）。
 *
 * ⚠️ 与 index.test.ts 同款约束：jsdom 无布局 ⇒ 定位断言不在此层；必须禁
 *    VTU 的 teleport-stub（会重建 slot 内容）。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import Popover from '../../popover/Popover';
import Tooltip from '../Tooltip';

const triggerEl = (cls = 'tt-target') => document.querySelector<HTMLElement>(`.${cls}`);
const containers = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tooltip"]'));

function mountTooltip(props: Record<string, unknown>, slots?: Record<string, () => unknown>) {
  return mount(Tooltip, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { title: 'tips', mouseEnterDelay: 0, mouseLeaveDelay: 0, ...props } as never,
    slots: slots ?? { default: () => h('button', { class: 'tt-target' }, 'target') },
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('#24.1 一次开合只通知一次', () => {
  it('[A] hover 打开：onOpenChange 只调 1 次，update:open 只发 1 次', async () => {
    const onOpenChange = vi.fn();
    const w = mountTooltip({ onOpenChange });
    triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await nextTick();
    await nextTick();

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(w.emitted('update:open')).toEqual([[true]]);
    w.unmount();
  });

  it('[B] 离开：onOpenChange 也只调 1 次（open → close）', async () => {
    const onOpenChange = vi.fn();
    const w = mountTooltip({ onOpenChange, defaultOpen: true });
    await nextTick();
    triggerEl()!.dispatchEvent(new Event('mouseleave'));
    await nextTick();
    await nextTick();

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    w.unmount();
  });

  it('[C] 受控模式同样只通知 1 次', async () => {
    const onOpenChange = vi.fn();
    const w = mountTooltip({ open: false, onOpenChange });
    triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await nextTick();
    await nextTick();

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('[D] 守卫：noTitle 时**不**发回调（既有语义不能被双调修复破坏）', async () => {
    const onOpenChange = vi.fn();
    const w = mountTooltip({ title: '', onOpenChange });
    triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await nextTick();
    await nextTick();

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(w.emitted('update:open')).toBeUndefined();
    w.unmount();
  });
});

describe('#24.2 未显式传 id 的实例要有唯一 ID', () => {
  it('[A] 两个实例同时打开 ⇒ 容器 id 不同且各自 aria-describedby 对应', async () => {
    // ⚠️ 两个 Tooltip 必须在**同一个 app** 里：`useId()` 的序号挂在
    //    `instance.ids`（由父级继承）上，跨 app 会各自从 0 开始。
    const Host = defineComponent({
      setup: () => () => [
        h(Tooltip as never, { title: 'a', defaultOpen: true, mouseEnterDelay: 0 } as never, {
          default: () => h('button', { class: 'tt-a' }, 'A'),
        }),
        h(Tooltip as never, { title: 'b', defaultOpen: true, mouseEnterDelay: 0 } as never, {
          default: () => h('button', { class: 'tt-b' }, 'B'),
        }),
      ],
    });
    const w = mount(Host, { attachTo: document.body, global: { stubs: { teleport: false } } });
    await nextTick();
    await nextTick();

    const boxes = containers();
    expect(boxes.length).toBe(2);
    const box1 = boxes[0];
    const box2 = boxes[1];
    expect(box1).toBeTruthy();
    expect(box2).toBeTruthy();
    const id1 = box1?.getAttribute('id');
    const id2 = box2?.getAttribute('id');
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);

    const described1 = document.querySelector('.tt-a')?.getAttribute('aria-describedby');
    const described2 = document.querySelector('.tt-b')?.getAttribute('aria-describedby');
    expect(described1).toBe(id1);
    expect(described2).toBe(id2);
    w.unmount();
  });

  it('[B] 守卫：显式 id 仍然优先', async () => {
    const w = mountTooltip({ defaultOpen: true, id: 'my-tip' });
    await nextTick();
    await nextTick();
    const box = containers()[0];
    expect(box).toBeTruthy();
    expect(box?.getAttribute('id')).toBe('my-tip');
    expect(triggerEl()?.getAttribute('aria-describedby')).toBe('my-tip');
    w.unmount();
  });
});

describe('#24.3 默认 Slot 多个节点不能只留第一个', () => {
  it('[A] 两个兄弟元素都渲染，且包在触发器包装元素里', async () => {
    const w = mountTooltip({ defaultOpen: true }, {
      default: () => [h('span', { class: 'sib-1' }, 'one'), h('span', { class: 'sib-2' }, 'two')],
    } as never);
    await nextTick();

    expect(document.querySelector('.sib-1')).not.toBeNull();
    expect(document.querySelector('.sib-2')).not.toBeNull();
    // 包装元素承载 aria-describedby（触发器本体）
    const wrapper = document.querySelector<HTMLElement>('[aria-describedby]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.contains(document.querySelector('.sib-1'))).toBe(true);
    w.unmount();
  });

  it('[B] 守卫：单元素不额外包 span', async () => {
    mountTooltip({ defaultOpen: true });
    await nextTick();
    expect(triggerEl()?.tagName).toBe('BUTTON');
    expect(triggerEl()!.parentElement?.classList.contains('apollo-tooltip')).toBe(false);
  });
});

describe('#24.4 Popover/Popconfirm 注入时不吃 Tooltip 专属配置', () => {
  it('[A] ConfigProvider 的 tooltip 配置不泄漏进 Popover', async () => {
    const Host = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider as never,
          {
            components: {
              tooltip: {
                className: 'leak-class',
                style: { opacity: 0.11 },
                classNames: { root: 'leak-root' },
                styles: { root: { zIndex: 999 } },
                arrow: true,
                trigger: 'click',
                mouseEnterDelay: 5,
              },
            },
          } as never,
          {
            default: () =>
              h(
                Popover as never,
                {
                  open: true,
                  content: 'pop',
                  mouseEnterDelay: 0,
                  getPopupContainer: () => document.body,
                } as never,
                { default: () => h('button', { class: 'pv-target' }, 'p') },
              ),
          },
        ),
    });
    const w = mount(Host, { attachTo: document.body, global: { stubs: { teleport: false } } });
    await nextTick();
    await nextTick();

    const pv = document.querySelector<HTMLElement>('.apollo-popover');
    expect(pv).not.toBeNull();
    const html = document.body.innerHTML;
    expect(html).not.toContain('leak-class');
    expect(html).not.toContain('leak-root');
    // 公共通道（getPopupContainer / direction）不受影响 ⇒ 浮层仍挂到 body
    expect(pv!.closest('body')).not.toBeNull();
    w.unmount();
  });
});

describe('#24.6 classNames.arrow / styles.arrow 要落到 Arrow', () => {
  it('[A] 语义 arrow 的 class 与 style 出现在箭头 DOM 上', async () => {
    const w = mountTooltip({
      defaultOpen: true,
      classNames: { arrow: 'arrow-x' },
      styles: { arrow: { opacity: 0.4 } },
    });
    await nextTick();
    await nextTick();

    const arrow = document.querySelector<HTMLElement>('.apollo-tooltip-arrow');
    expect(arrow).not.toBeNull();
    expect(arrow!.classList.contains('arrow-x')).toBe(true);
    expect(arrow!.style.opacity).toBe('0.4');
    w.unmount();
  });
});

describe('#24.7 子元素的对象/数组 class 也要追加 -open', () => {
  it('[A] 数组 class 打开后同时保留用户 class 与 -open', async () => {
    const w = mountTooltip({ open: true }, {
      default: () => h('button', { class: ['u-a', { 'u-on': true }] }, 't'),
    } as never);
    await nextTick();

    const btn = document.querySelector<HTMLElement>('button');
    expect(btn).not.toBeNull();
    expect(btn!.classList.contains('u-a')).toBe(true);
    expect(btn!.classList.contains('u-on')).toBe(true);
    expect(btn!.classList.contains('apollo-tooltip-open')).toBe(true);
    w.unmount();
  });

  it('[B] 对象 class 同理，且不覆写用户 class', async () => {
    const w = mountTooltip({ open: true }, {
      default: () => h('button', { class: { 'obj-a': true, 'obj-b': false } }, 't'),
    } as never);
    await nextTick();

    const btn = document.querySelector<HTMLElement>('button');
    expect(btn!.classList.contains('obj-a')).toBe(true);
    expect(btn!.classList.contains('obj-b')).toBe(false);
    expect(btn!.classList.contains('apollo-tooltip-open')).toBe(true);
    w.unmount();
  });
});
