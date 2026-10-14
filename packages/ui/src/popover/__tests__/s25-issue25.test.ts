/**
 * Popover · Issue #25 回归（5 项，先复现后修）。
 *
 * ⚠️ 与 index.test.ts 同款约束：必须禁 VTU 的 teleport-stub（翻转 open 会重挂子树）。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import Popover from '../Popover';
import { genPopoverStyle } from '../style';

const popup = () => document.querySelector<HTMLElement>('.apollo-popover');
const container = () => document.querySelector<HTMLElement>('.apollo-popover-container');
const triggerEl = () => document.querySelector<HTMLElement>('.popover-target');

function mountPopover(props: Record<string, unknown>) {
  return mount(Popover, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: {
      title: 'Title',
      content: 'Content',
      mouseEnterDelay: 0,
      mouseLeaveDelay: 0,
      ...props,
    } as never,
    slots: { default: () => h('button', { class: 'popover-target' }, 'target') },
  });
}

/** 打开浮层（受控 open=true，跳过延迟时序）。 */
async function opened(props: Record<string, unknown> = {}) {
  const w = mountPopover({ open: true, ...props });
  await nextTick();
  await nextTick();
  return w;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('#25.1 PopoverProps 继承 Tooltip 的公共配置要真的下传', () => {
  it('[A] getPopupContainer：浮层挂到指定容器', async () => {
    const box = document.createElement('div');
    box.className = 'my-container';
    document.body.appendChild(box);
    const w = await opened({ getPopupContainer: () => box });
    expect(popup()).not.toBeNull();
    expect(popup()?.parentElement?.className).toBe('my-container');
    w.unmount();
    box.remove();
  });

  it('[B] onPopupClick：点浮层时回调', async () => {
    const onPopupClick = vi.fn();
    const w = await opened({ onPopupClick });
    const el = container();
    expect(el).not.toBeNull();
    el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(onPopupClick).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('[C] openClassName：自定义打开态类名（替代默认 -open）', async () => {
    const w = await opened({ openClassName: 'my-open' });
    expect(triggerEl()?.classList.contains('my-open')).toBe(true);
    w.unmount();
  });

  it('[D] 未声明的 Tooltip 字段不能落到触发器 DOM 上', async () => {
    const w = await opened({ getPopupContainer: () => document.body });
    const html = triggerEl()?.outerHTML ?? '';
    expect(html).not.toContain('getPopupContainer');
    expect(html).not.toContain('onPopupClick');
    w.unmount();
  });
});

describe('#25.2 预设色背景选择器要命中真实容器', () => {
  it('[A] 13 个预设色的背景规则指向 -container（不是不存在的 -inner）', () => {
    const css = genPopoverStyle('apollo');
    const presets = [
      'blue',
      'purple',
      'cyan',
      'green',
      'magenta',
      'pink',
      'red',
      'orange',
      'yellow',
      'volcano',
      'geekblue',
      'lime',
      'gold',
    ];
    for (const preset of presets) {
      expect(css).toContain(`.apollo-popover.apollo-popover-${preset} .apollo-popover-container{`);
    }
    expect(css).not.toContain('.apollo-popover-inner{');
  });

  it('[B] 自定义 HEX 色走内联变量（container 背景 + 明暗文本）', async () => {
    const w = await opened({ color: '#2F54EB' });
    const el = container();
    expect(el).not.toBeNull();
    expect(el?.style.background).toBeTruthy();
    w.unmount();
  });
});

describe('#25.3 原生 class/style 落在弹层根，不污染触发器', () => {
  it('[A] class 只落在 Popup 根，触发器不带', async () => {
    const w = await opened({ class: 'my-popover' });
    expect(popup()?.classList.contains('my-popover')).toBe(true);
    expect(triggerEl()?.classList.contains('my-popover')).toBe(false);
    w.unmount();
  });

  it('[B] style 只落在 Popup 根，触发器不带', async () => {
    const w = await opened({ style: { maxWidth: '320px' } });
    expect(popup()?.style.maxWidth).toBe('320px');
    expect(triggerEl()?.style.maxWidth).toBe('');
    w.unmount();
  });
});

describe('#25.4 ConfigProvider.popover.className 要合并进根类名', () => {
  it('[A] 只拿自己的配置，且不叠加 tooltip 的配置', async () => {
    const Host = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider as never,
          {
            components: {
              popover: { className: 'cfg-popover' },
              tooltip: { className: 'cfg-tooltip' },
            },
          } as never,
          {
            default: () =>
              h(
                Popover as never,
                {
                  title: 'T',
                  content: 'C',
                  open: true,
                  mouseEnterDelay: 0,
                  mouseLeaveDelay: 0,
                } as never,
                { default: () => h('button', { class: 'popover-target' }, 'target') },
              ),
          },
        ),
    });
    const w = mount(Host, { attachTo: document.body, global: { stubs: { teleport: false } } });
    await nextTick();
    await nextTick();
    expect(popup()?.classList.contains('cfg-popover')).toBe(true);
    expect(popup()?.classList.contains('cfg-tooltip')).toBe(false);
    w.unmount();
  });
});

describe('#25.5 Overlay 不额外包一层 div', () => {
  it('[A] container 的直接子元素就是 title / content（antd 同构）', async () => {
    const w = await opened();
    const el = container();
    expect(el).not.toBeNull();
    const children = Array.from(el?.children ?? []);
    expect(children.length).toBe(2);
    expect(children[0]?.classList.contains('apollo-popover-title')).toBe(true);
    expect(children[1]?.classList.contains('apollo-popover-content')).toBe(true);
    w.unmount();
  });

  it('[B] 只有 content 时 container 也只有 1 个直接子元素', async () => {
    const w = await opened({ title: undefined });
    const el = container();
    const children = Array.from(el?.children ?? []);
    expect(children.length).toBe(1);
    expect(children[0]?.classList.contains('apollo-popover-content')).toBe(true);
    w.unmount();
  });
});
