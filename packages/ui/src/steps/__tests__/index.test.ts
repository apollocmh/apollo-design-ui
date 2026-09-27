/**
 * Steps · L1/L2 —— 判据：rc-steps Steps.js/Step.js 逐层 + antd index.tsx 壳。
 *
 * 覆盖：状态推导 / 可点击（键盘）/ DOM 契约 / C8-R2 插槽（iconRender/itemRender/
 * itemWrapperRender/progressDot）/ deprecated 告警 / maxCount 折叠。
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import type { StepItem } from '../interface';
import Steps from '../Steps';
import { getCollapsedIndexes } from '../useDisplaySteps';

const BASIC_ITEMS: StepItem[] = [
  { title: 'Login', content: 'Enter your credentials' },
  { title: 'Pay', content: 'Pay the bill' },
  { title: 'Done', content: 'All finished' },
];
const P = 'apollo-steps';

const mountSteps = (
  props: Record<string, unknown> = {},
  slots: Record<string, (...args: unknown[]) => unknown> = {},
) =>
  mount(Steps, {
    props: { items: BASIC_ITEMS, ...props } as never,
    slots: slots as never,
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });

const flush = () => new Promise((r) => setTimeout(r, 20));

describe('Steps · 状态推导', () => {
  it('current=1 ⇒ item0=finish / item1=process / item2=wait', () => {
    const w = mountSteps({ current: 1 });
    const items = w.findAll(`.${P}-item`);
    expect(items[0]?.classes()).toContain(`${P}-item-finish`);
    expect(items[1]?.classes()).toContain(`${P}-item-process`);
    expect(items[2]?.classes()).toContain(`${P}-item-wait`);
    w.unmount();
  });

  it('status="error" 覆盖当前步；item.status 优先级最高', () => {
    const w = mountSteps({ current: 1, status: 'error' });
    expect(w.findAll(`.${P}-item`)[1]?.classes()).toContain(`${P}-item-error`);
    w.unmount();

    const w2 = mountSteps({
      items: [...BASIC_ITEMS, { title: 'X', status: 'error' }],
      current: 1,
    });
    expect(w2.findAll(`.${P}-item`)[3]?.classes()).toContain(`${P}-item-error`);
    w2.unmount();
  });

  it('initial 偏移：process 落在 current-initial 展示位；序号从 initial+1 开始', () => {
    const w = mountSteps({ current: 2, initial: 1 });
    const items = w.findAll(`.${P}-item`);
    expect(items[0]?.classes()).toContain(`${P}-item-finish`);
    expect(items[1]?.classes()).toContain(`${P}-item-process`);
    expect(w.find(`.${P}-item-icon-number`).text()).toBe('3');
    w.unmount();
  });

  it('DOM 契约：-item > -wrapper > (-item-icon + -section > (-header > -title + -rail) + -content)；rail 在 header 内；末步无 rail', () => {
    const w = mountSteps({ current: 1 });
    const first = w.findAll(`.${P}-item`)[0]!;
    expect(first.find(`.${P}-item-wrapper > .${P}-item-icon`).exists()).toBe(true);
    expect(first.find(`.${P}-item-header .${P}-item-rail`).exists()).toBe(true);
    expect(first.find(`.${P}-item-content`).text()).toBe('Enter your credentials');
    const last = w.findAll(`.${P}-item`)[2]!;
    expect(last.find(`.${P}-item-rail`).exists()).toBe(false);
    w.unmount();
  });

  it('可点击步 role=button + tabIndex=0；disabled 步无 role；点击相同 current 不触发', async () => {
    const onChange = vi.fn();
    const w = mountSteps({
      current: 0,
      onChange,
      items: BASIC_ITEMS.map((it, i) => (i === 1 ? { ...it, disabled: true } : it)),
    });
    const items = w.findAll(`.${P}-item`);
    expect(items[0]?.attributes('role')).toBe('button');
    expect(items[0]?.attributes('tabindex')).toBe('0');
    expect(items[1]?.attributes('role')).toBeUndefined();
    await items[1]!.trigger('click');
    expect(onChange).not.toHaveBeenCalled();
    await items[0]!.trigger('click');
    expect(onChange).not.toHaveBeenCalled(); // current 相同
    await items[0]!.trigger('keydown', { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled(); // 仍是 0
    w.unmount();
  });

  it('onChange 点击第二项 ⇒ onChange(1)；Enter/Space 触发', async () => {
    const onChange = vi.fn();
    const w = mountSteps({ current: 0, onChange });
    const items = w.findAll(`.${P}-item`);
    await items[1]!.trigger('click');
    expect(onChange).toHaveBeenCalledWith(1);
    await items[1]!.trigger('keydown', { key: 'Enter' });
    await items[1]!.trigger('keydown', { key: ' ' });
    expect(onChange).toHaveBeenCalledTimes(3);
    w.unmount();
  });
});

describe('Steps · C8-R2 插槽（render fn → scoped slot，无同名 prop）', () => {
  it('#iconRender：接收 iconNode/index/active/item，返回值替换图标', async () => {
    const w = mountSteps(
      { current: 1 },
      {
        iconRender: (info: unknown) => {
          const { index, item } = info as { index: number; item: StepItem };
          return h('span', { class: 'my-icon' }, `${index}-${String(item.title)}`);
        },
      },
    );
    await flush();
    const icons = w.findAll('.my-icon');
    expect(icons.length).toBe(3);
    expect(icons[1]?.text()).toBe('1-Pay');
    expect(w.find(`.${P}-item-icon-number`).exists()).toBe(false);
    w.unmount();
  });

  it('#itemRender：包装整步节点', async () => {
    const w = mountSteps(
      {},
      {
        itemRender: (p: unknown) =>
          h('div', { class: 'wrapped' }, [(p as { itemNode: never }).itemNode]),
      },
    );
    await flush();
    expect(w.findAll('.wrapped')).toHaveLength(3);
    w.unmount();
  });

  it('#itemWrapperRender：包装 wrapper 层', async () => {
    const w = mountSteps(
      {},
      {
        itemWrapperRender: (p: unknown) =>
          h('div', { class: 'wrapper-wrap' }, [(p as { itemNode: never }).itemNode]),
      },
    );
    await flush();
    expect(w.findAll('.wrapper-wrap .apollo-steps-item-wrapper')).toHaveLength(3);
    w.unmount();
  });

  it('percent ⇒ process 步渲染进度环（progressbar role + aria-valuenow）', async () => {
    const w = mountSteps({ current: 1, percent: 60 });
    await flush();
    const bar = w.find('[role="progressbar"]');
    expect(bar.exists()).toBe(true);
    expect(bar.attributes('aria-valuenow')).toBe('60');
    w.unmount();
  });

  it('type="dot" + #progressDot：函数形态走作用域插槽', async () => {
    const w = mountSteps(
      { type: 'dot', current: 1 },
      {
        progressDot: (p: unknown) => {
          const { index, status } = p as { index: number; status: string };
          return h('i', { class: 'dot-render' }, `${index}-${String(status)}`);
        },
      },
    );
    await flush();
    const dots = w.findAll('.dot-render');
    expect(dots.length).toBe(3);
    expect(dots[1]?.text()).toBe('1-process');
    w.unmount();
  });

  it('progressDot 布尔形态 ⇒ type=dot（deprecated 告警）', () => {
    const w = mountSteps({ progressDot: true, current: 0 });
    expect(w.find(`.${P}-dot`).exists()).toBe(true);
    w.unmount();
  });
});

describe('Steps · deprecated / usage 告警', () => {
  it('direction / labelPlacement / items.description / maxCount<3 / size=default', () => {
    const warnings: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => {
      warnings.push(a.map(String).join(' '));
    });
    mountSteps({ direction: 'vertical', labelPlacement: 'vertical', maxCount: 2, size: 'default' });
    mountSteps({ items: [...BASIC_ITEMS, { title: 'x', description: 'legacy' }] });
    spy.mockRestore();
    const all = warnings.join('\n');
    expect(all).toContain('`direction` is deprecated');
    expect(all).toContain('`labelPlacement` is deprecated');
    expect(all).toContain('`items.description` is deprecated');
    expect(all).toContain('`maxCount` should be greater than or equal to 3.');
    expect(all).toContain('`size="default"` is deprecated');
  });
});

describe('Steps · maxCount 折叠（useDisplaySteps）', () => {
  const MANY = Array.from({ length: 6 }, (_, i) => ({ title: `Step${i + 1}`, content: `c${i}` }));

  it('折叠类名 + 省略步（disabled）+ 首/末/当前保留', async () => {
    const w = mountSteps({ current: 4, maxCount: 4, items: MANY });
    await flush();
    expect(w.find(`.${P}-max-count`).exists()).toBe(true);
    expect(w.findAll(`.${P}-item-ellipsis`).length).toBeGreaterThanOrEqual(1);
    const items = w.findAll(`.${P}-item`);
    expect(items[0]?.text()).toContain('Step1');
    w.unmount();
  });

  it('getCollapsedIndexes：首/末/当前恒在，非连续处插 null', () => {
    const idx = getCollapsedIndexes(10, 4, 4);
    expect(idx[0]).toBe(0);
    expect(idx).toContain(4);
    expect(idx).toContain(9);
    expect(idx).toContain(null);
    expect(idx.filter((v) => v !== null)).toHaveLength(4);
  });

  it('折叠后 onChange 映射回原始索引', async () => {
    const onChange = vi.fn();
    const w = mountSteps({ current: 4, maxCount: 4, onChange, items: MANY });
    await flush();
    const items = w.findAll(`.${P}-item`);
    await items[items.length - 1]!.trigger('click');
    expect(onChange).toHaveBeenCalledWith(5);
    w.unmount();
  });
});

describe('Steps · 布局类', () => {
  it('orientation=vertical ⇒ -vertical + title 恒 horizontal', () => {
    const w = mountSteps({ orientation: 'vertical' });
    expect(w.find(`.${P}-vertical`).exists()).toBe(true);
    expect(w.find(`.${P}-title-horizontal`).exists()).toBe(true);
    w.unmount();
  });

  it('type=navigation / panel（恒 horizontal + 箭头）/ inline（-dot -inline）', () => {
    const nav = mountSteps({ type: 'navigation' });
    expect(nav.find(`.${P}-navigation`).exists()).toBe(true);
    nav.unmount();

    const panel = mountSteps({ type: 'panel' });
    expect(panel.find(`.${P}-horizontal`).exists()).toBe(true);
    expect(panel.find(`.${P}-panel-arrow`).exists()).toBe(true);
    panel.unmount();

    const inline = mountSteps({ type: 'inline' });
    expect(inline.find(`.${P}-dot`).exists()).toBe(true);
    expect(inline.find(`.${P}-inline`).exists()).toBe(true);
    inline.unmount();
  });

  it('size=small / variant=outlined 落类；offset ⇒ CSS 变量', () => {
    const w = mountSteps({ size: 'small', variant: 'outlined' });
    expect(w.find(`.${P}-small`).exists()).toBe(true);
    expect(w.find(`.${P}-outlined`).exists()).toBe(true);
    w.unmount();

    const w2 = mountSteps({ type: 'inline', offset: 2 });
    expect(w2.find(`.${P}`).attributes('style') ?? '').toContain('items-offset: 2');
    w2.unmount();
  });

  it('responsive=false ⇒ horizontal 不被断点翻转', () => {
    const w = mountSteps({ responsive: false });
    expect(w.find(`.${P}-horizontal`).exists()).toBe(true);
    w.unmount();
  });
});
