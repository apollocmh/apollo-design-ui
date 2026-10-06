/**
 * L1 单元 + L2 交互 —— Pagination（antd 6.6.4 壳 + rc-pagination@1.4.0 内核）。
 *
 * 判据来源：`docs/analysis/pagination.md`；判定值来源见下。
 *
 * ── 本文件的重心 ───────────────────────────────────────────────────────────────
 *
 * 1. **状态机的三个变化入口**（`describe('值变化')`）：`handleChange` 的钳制与 `isValid`、
 *    `changePageSize` 的「越界回退 + 三个事件」、简化模式输入框的 Enter/↑/↓。
 *
 * 2. **Options 的两条链路**（`describe('快速跳转')` / `describe('尺寸切换器')`）：
 *    `/^\d*$/` 过滤、blur 的「relatedTarget 是自己的 item 就不提交」、选项追加并升序。
 *
 * ⚠️ **页码列表算法的判定表不在本文件**：它在 `pagers.test.ts`（224 行判定表 + 纯函数，
 *    与「几十处组件挂载」同文件会让 vitest 的 worker 起不来 —— 实测 60s 超时）。
 *
 * ── 这个文件没有证明什么 ───────────────────────────────────────────────────────
 *   - 没证明与 antd 的像素一致（L6）；没证明完整 DOM 一致（L4，见 `semantic.test.ts`）
 *   - 尺寸切换器内部的 Select 行为属于 select 自己的测试范围（这里只断言接线与类名）
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';

import Pagination from '../Pagination.vue';

const P = 'apollo-pagination';

const mountPg = (props: Record<string, unknown> = {}) =>
  mount(h(Pagination as never, { total: 500, ...props } as never), { attachTo: document.body });

/** HTML 里的 `li` 类名列表。 */
const itemClasses = (w: ReturnType<typeof mountPg>): string[] =>
  w.findAll('li').map((li) => li.attributes('class') ?? '');

// ---------------------------------------------------------------------------
// L2 · 结构与类名
// ---------------------------------------------------------------------------

describe('Pagination 渲染（L2）', () => {
  it('根是 ul，带 aria/data 透传，其余未知属性丢弃', () => {
    const w = mount(
      h(
        Pagination as never,
        { total: 100, 'data-x': 'y', 'aria-label': '分页', id: 'nope' } as never,
      ),
    );
    expect(w.element.tagName).toBe('UL');
    expect(w.attributes('data-x')).toBe('y');
    expect(w.attributes('aria-label')).toBe('分页');
    expect(w.attributes('id')).toBeUndefined(); // ⚠️ pickAttrs 只放行 aria/data
  });

  it('align / size 落类名；disabled 落根类', () => {
    expect(mountPg({ align: 'center' }).classes()).toContain(`${P}-center`);
    expect(mountPg({ align: 'end' }).classes()).toContain(`${P}-end`);
    expect(mountPg({ size: 'small' }).classes()).toContain(`${P}-small`);
    expect(mountPg({ size: 'large' }).classes()).toContain(`${P}-large`);
    expect(mountPg({ disabled: true }).classes()).toContain(`${P}-disabled`);
  });

  it('页码项的类名：`-item -item-{n}`，当前页额外 `-active`', () => {
    const classes = itemClasses(mountPg({ defaultCurrent: 3 }));
    expect(classes).toContain(`${P}-item ${P}-item-3 ${P}-item-active`);
    expect(classes).toContain(`${P}-item ${P}-item-1`);
  });

  it('allPages=0 ⇒ 一个 disabled 的占位页码（total=0）', () => {
    const w = mountPg({ total: 0 });
    expect(w.findAll(`.${P}-item`).length).toBe(1);
    expect(w.find(`.${P}-item-1`).classes()).toContain(`${P}-item-disabled`);
  });

  it('prev / next 的 disabled 与 tabIndex（不可用时 tabIndex 移除）', () => {
    const first = mountPg({ defaultCurrent: 1 });
    const prev = first.find(`.${P}-prev`);
    expect(prev.classes()).toContain(`${P}-disabled`);
    expect(prev.attributes('aria-disabled')).toBe('true');
    expect(prev.attributes('tabindex')).toBeUndefined();
    expect(first.find(`.${P}-next`).attributes('tabindex')).toBe('0');

    const last = mountPg({ defaultCurrent: 50 });
    expect(last.find(`.${P}-next`).classes()).toContain(`${P}-disabled`);
    expect(last.find(`.${P}-next`).attributes('tabindex')).toBeUndefined();
  });

  it('showTitle=false ⇒ 所有 li 都没有 title', () => {
    const w = mountPg({ defaultCurrent: 3, showTitle: false });
    expect(w.findAll('li').every((li) => li.attributes('title') === undefined)).toBe(true);
  });

  it('跳页项的类名与文案（±5 / ±3）', () => {
    const normal = mountPg({ defaultCurrent: 10 });
    expect(normal.find(`.${P}-jump-prev`).classes()).toContain(`${P}-jump-prev-custom-icon`);
    expect(normal.find(`.${P}-jump-prev`).attributes('title')).toBe('Previous 5 Pages');

    const less = mountPg({ defaultCurrent: 10, showLessItems: true });
    expect(less.find(`.${P}-jump-prev`).attributes('title')).toBe('Previous 3 Pages');
  });

  it('跳页项的目标页 = current ∓ 5（点一下看 emit 的页号）', async () => {
    const w = mountPg({ defaultCurrent: 10 });
    await w.find(`.${P}-jump-prev`).trigger('click');
    expect(w.emitted('change')?.[0]).toEqual([5, 10]);
  });

  it('showPrevNextJumpers=false ⇒ 没有跳页项', () => {
    const w = mountPg({ defaultCurrent: 10, showPrevNextJumpers: false });
    expect(w.find(`.${P}-jump-prev`).exists()).toBe(false);
    expect(w.find(`.${P}-jump-next`).exists()).toBe(false);
  });

  it('hideOnSinglePage：只有一页时整体不渲染', () => {
    expect(mountPg({ total: 5, hideOnSinglePage: true }).find(`.${P}`).exists()).toBe(false);
    expect(mountPg({ total: 50, hideOnSinglePage: true }).find(`.${P}`).exists()).toBe(true);
  });

  it('responsive 且 xs 时根带 -mini（jsdom 无 matchMedia 命中 ⇒ 靠 size 显式验证 -small）', () => {
    expect(mountPg({ responsive: true, size: 'small' }).classes()).toContain(`${P}-small`);
  });
});

// ---------------------------------------------------------------------------
// L2 · 值变化（三个入口）
// ---------------------------------------------------------------------------

describe('Pagination 值变化（L2）', () => {
  it('点页码：发 update:current + change（载荷 = [页, 页大小]）', async () => {
    const w = mountPg({ defaultCurrent: 3 });
    await w.find(`.${P}-item-5`).trigger('click');
    expect(w.emitted('update:current')?.[0]).toEqual([5]);
    expect(w.emitted('change')?.[0]).toEqual([5, 10]);
  });

  it('受控：DOM 不自己动，但事件照发', async () => {
    const w = mountPg({ current: 3 });
    await w.find(`.${P}-item-5`).trigger('click');
    expect(w.find(`.${P}-item-3`).classes()).toContain(`${P}-item-active`);
    expect(w.emitted('change')?.[0]).toEqual([5, 10]);
  });

  it('点已激活的页码不发事件（`isValid` 要求 page !== current）', async () => {
    const w = mountPg({ defaultCurrent: 3 });
    await w.find(`.${P}-item-3`).trigger('click');
    expect(w.emitted('change')).toBeFalsy();
  });

  it('disabled 时点击不生效；没有页码可点（只剩占位）', async () => {
    const w = mountPg({ defaultCurrent: 3, disabled: true });
    await w.find(`.${P}-item-5`).trigger('click');
    expect(w.emitted('change')).toBeFalsy();
  });

  it('current 超界 ⇒ 钳到 allPages（受控传 999）', () => {
    const w = mountPg({ current: 999 });
    expect(w.find(`.${P}-item-50`).classes()).toContain(`${P}-item-active`);
  });

  it('prev / next 改值为 ±1，并在边界处不生效', async () => {
    const w = mountPg({ defaultCurrent: 3 });
    await w.find(`.${P}-next`).trigger('click');
    expect(w.emitted('change')?.[0]).toEqual([4, 10]);
    // ⚠️ 非受控：上一次点击已把内部 current 改成 4 ⇒ 再点 prev 得到 3（不是 2）
    await w.find(`.${P}-prev`).trigger('click');
    expect(w.emitted('change')?.at(-1)).toEqual([3, 10]);

    const first = mountPg({ defaultCurrent: 1 });
    await first.find(`.${P}-prev`).trigger('click');
    expect(first.emitted('change')).toBeFalsy();
  });

  it('键盘 Enter 触发上一页/下一页（rc 的 runIfEnter）', async () => {
    const w = mountPg({ defaultCurrent: 3 });
    const next = w.find(`.${P}-next`);
    next.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual([4, 10]);
  });

  it('total=0 ⇒ 点占位项也不改值（total > 0 才 isValid）', async () => {
    const w = mountPg({ total: 0 });
    await w.find(`.${P}-item-1`).trigger('click');
    expect(w.emitted('change')).toBeFalsy();
  });

  it('total 变小导致当前页越界时，渲染自动钳到最后页', async () => {
    const w = mount(h(Pagination as never, { total: 500, current: 50 } as never));
    expect(w.find(`.${P}-item-50`).classes()).toContain(`${P}-item-active`);
    await w.setProps({ total: 30 });
    expect(w.find(`.${P}-item-3`).classes()).toContain(`${P}-item-active`);
  });
});

// ---------------------------------------------------------------------------
// L2 · showTotal / itemRender（prop 与 slot 两条通道）
// ---------------------------------------------------------------------------

describe('Pagination showTotal（L2）', () => {
  it('prop 形态：range = [起始项, 结束项]，末页会截到 total', () => {
    const w = mountPg({
      defaultCurrent: 1,
      showTotal: (t: number, r: number[]) => `${r[0]}-${r[1]} of ${t}`,
    });
    expect(w.find(`.${P}-total-text`).text()).toBe('1-10 of 500');

    const last = mountPg({
      defaultCurrent: 50,
      showTotal: (t: number, r: number[]) => `${r[0]}-${r[1]} of ${t}`,
    });
    expect(last.find(`.${P}-total-text`).text()).toBe('491-500 of 500');
  });

  it('total=0 时 range 的第一项是 0', () => {
    const w = mountPg({ total: 0, showTotal: (_t: number, r: number[]) => `${r[0]}-${r[1]}` });
    expect(w.find(`.${P}-total-text`).text()).toBe('0-0');
  });

  it('slot 形态（#total）优先，且同样拿到 (total, range)', () => {
    const w = mount(h(Pagination as never, { total: 100, defaultCurrent: 2 } as never), {
      slots: { total: (t: number, r: number[]) => h('em', {}, `${t}:${r[0]}-${r[1]}`) },
    });
    expect(w.find(`.${P}-total-text em`).text()).toBe('100:11-20');
  });

  it('simple 模式下也渲染 showTotal（上游用例）', () => {
    const w = mountPg({
      simple: true,
      total: 100,
      showTotal: (t: number, r: number[]) => `${r[0]}-${r[1]} of ${t} items`,
    });
    expect(w.find(`.${P}-total-text`).text()).toBe('1-10 of 100 items');
  });
});

describe('Pagination itemRender（L2）', () => {
  it('prop 形态：拿到 (page, type, element)，可替换节点', () => {
    const w = mountPg({
      defaultCurrent: 3,
      itemRender: (page: number, type: string, element: unknown) =>
        type === 'page' ? h('b', {}, `p${page}`) : (element as never),
    });
    expect(w.find(`.${P}-item-3 b`).text()).toBe('p3');
  });

  it('prev/next 的 type 是 prev / next', () => {
    const types: string[] = [];
    mountPg({
      defaultCurrent: 3,
      itemRender: (_page: number, type: string, element: unknown) => {
        types.push(type);
        return element as never;
      },
    });
    expect(types).toContain('prev');
    expect(types).toContain('next');
  });

  it('slot 形态（#itemRender）优先于 prop', () => {
    const w = mount(h(Pagination as never, { total: 100, defaultCurrent: 2 } as never), {
      slots: {
        itemRender: (page: number, type: string) =>
          type === 'page' ? h('i', {}, `s${page}`) : null,
      },
    });
    expect(w.find(`.${P}-item-2 i`).text()).toBe('s2');
  });
});

// ---------------------------------------------------------------------------
// L2 · 简化模式
// ---------------------------------------------------------------------------

describe('Pagination 简化模式（L2）', () => {
  it('根带 -simple；页码区是 `输入 / 总页数`', () => {
    const w = mountPg({ defaultCurrent: 3, simple: true });
    expect(w.classes()).toContain(`${P}-simple`);
    expect(w.find(`.${P}-simple-pager input`).exists()).toBe(true);
    expect(w.find(`.${P}-slash`).text()).toBe('/');
    expect(w.findAll(`.${P}-item`).length).toBe(0);
  });

  it('输入框 Enter 提交（钳到 allPages）', async () => {
    const w = mountPg({ defaultCurrent: 3, simple: true });
    const input = w.find(`.${P}-simple-pager input`);
    await input.setValue('999');
    input.element.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 13, bubbles: true }));
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual([50, 10]);
  });

  it('输入框 ↑ / ↓ 是 ∓1', async () => {
    const w = mountPg({ defaultCurrent: 3, simple: true });
    const input = w.find(`.${P}-simple-pager input`);
    await input.setValue('5');
    input.element.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 38, bubbles: true }));
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual([4, 10]);

    const down = mountPg({ defaultCurrent: 3, simple: true });
    const input2 = down.find(`.${P}-simple-pager input`);
    await input2.setValue('5');
    input2.element.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 40, bubbles: true }));
    await nextTick();
    expect(down.emitted('change')?.[0]).toEqual([6, 10]);
  });

  it('readOnly（`simple={{readOnly:true}}`）时是纯文本，没有 input', () => {
    const w = mountPg({ defaultCurrent: 3, simple: { readOnly: true } });
    expect(w.find(`.${P}-simple-pager input`).exists()).toBe(false);
    expect(w.find(`.${P}-simple-pager`).text()).toContain('3/50');
  });

  it('简化模式的 goButton：`showQuickJumper:{{goButton:true}}` 渲染确认按钮', () => {
    const w = mountPg({ defaultCurrent: 3, simple: true, showQuickJumper: { goButton: true } });
    expect(w.find(`.${P}-simple-pager button`).exists()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// L2 · 快速跳转
// ---------------------------------------------------------------------------

describe('Pagination 快速跳转（L2）', () => {
  it('可见性：`total > pageSize` 才显示（一页时不显示）', () => {
    expect(
      mountPg({ total: 500, showQuickJumper: true }).find(`.${P}-options-quick-jumper`).exists(),
    ).toBe(true);
    expect(
      mountPg({ total: 5, showQuickJumper: true }).find(`.${P}-options-quick-jumper`).exists(),
    ).toBe(false);
  });

  it('文案与可访问名来自 locale（en_US 默认）', () => {
    const w = mountPg({ total: 500, showQuickJumper: true });
    const box = w.find(`.${P}-options-quick-jumper`);
    expect(box.text()).toContain('Go to');
    expect(w.find(`.${P}-options-quick-jumper input`).attributes('aria-label')).toBe('Page');
  });

  it('只接受数字（非数字字符被吞掉）', async () => {
    const w = mountPg({ total: 500, showQuickJumper: true });
    const input = w.find(`.${P}-options-quick-jumper input`);
    await input.setValue('a1b');
    expect((input.element as HTMLInputElement).value).toBe('');
    await input.setValue('12');
    expect((input.element as HTMLInputElement).value).toBe('12');
  });

  it('Enter 提交并清空输入', async () => {
    const w = mountPg({ total: 500, showQuickJumper: true });
    const input = w.find(`.${P}-options-quick-jumper input`);
    await input.setValue('12');
    input.element.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 13, bubbles: true }));
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual([12, 10]);
    expect((input.element as HTMLInputElement).value).toBe('');
  });

  it('blur 提交，但 relatedTarget 是自己的 item 时不提交（rc 逐字）', async () => {
    const w = mountPg({ total: 500, showQuickJumper: true });
    const input = w.find(`.${P}-options-quick-jumper input`);
    await input.setValue('7');
    // relatedTarget 指向页码 ⇒ 视为「点了页码」，不提交
    input.element.dispatchEvent(
      new FocusEvent('blur', { relatedTarget: w.find(`.${P}-item-3`).element }),
    );
    await nextTick();
    expect(w.emitted('change')).toBeFalsy();

    // 干净地失焦 ⇒ 提交
    const w2 = mountPg({ total: 500, showQuickJumper: true });
    const input2 = w2.find(`.${P}-options-quick-jumper input`);
    await input2.setValue('7');
    input2.element.dispatchEvent(new FocusEvent('blur', { relatedTarget: null }));
    await nextTick();
    expect(w2.emitted('change')?.[0]).toEqual([7, 10]);
  });

  it('空输入不提交', async () => {
    const w = mountPg({ total: 500, showQuickJumper: true });
    const input = w.find(`.${P}-options-quick-jumper input`);
    input.element.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 13, bubbles: true }));
    await nextTick();
    expect(w.emitted('change')).toBeFalsy();
  });

  it('goButton=true ⇒ 渲染确认按钮，点击也能提交', async () => {
    const w = mountPg({ total: 500, showQuickJumper: { goButton: true } });
    const input = w.find(`.${P}-options-quick-jumper input`);
    await input.setValue('9');
    await w.find(`.${P}-options-quick-jumper-button`).trigger('click');
    expect(w.emitted('change')?.[0]).toEqual([9, 10]);
  });
});

// ---------------------------------------------------------------------------
// L2 · 尺寸切换器
// ---------------------------------------------------------------------------

describe('Pagination 尺寸切换器（L2）', () => {
  it('默认可见性由 `total > totalBoundaryShowSizeChanger`（默认 50）决定', () => {
    expect(mountPg({ total: 500 }).find(`.${P}-options`).exists()).toBe(true);
    expect(mountPg({ total: 30 }).find(`.${P}-options`).exists()).toBe(false);
    expect(
      mountPg({ total: 30, totalBoundaryShowSizeChanger: 10 }).find(`.${P}-options`).exists(),
    ).toBe(true);
  });

  it('渲染成本仓的 Select（类名走原生 class 通道）', () => {
    const w = mountPg({ showSizeChanger: true });
    expect(w.find(`.${P}-options`).exists()).toBe(true);
    expect((w.find(`.${P}-options-size-changer`).element.outerHTML ?? '').length).toBeGreaterThan(
      0,
    );
  });

  it('切换 pageSize：越界回退 + 三个事件（update:pageSize / showSizeChange / change）', async () => {
    const w = mountPg({ defaultCurrent: 50, showSizeChanger: true });
    // 50 页 × 10 = 500 条；换成 100/页 ⇒ 只有 5 页 ⇒ 当前页回退到 5
    // ⚠️ 本仓 Select 用 **`onChange` prop**（不是 emits）—— `$emit('change')` 打不到它。
    //    这里直接调 prop，等价于 Select 内部 commit 时的 `props.onChange(outValue, outOption)`。
    const select = w.findComponent({ name: 'ASelect' });
    (select.props('onChange') as (v: number) => void)(100);
    await nextTick();
    expect(w.emitted('update:pageSize')?.[0]).toEqual([100]);
    expect(w.emitted('showSizeChange')?.[0]).toEqual([50, 100]);
    expect(w.emitted('change')?.[0]).toEqual([5, 100]);
  });

  it('未越界时当前页保持不变', async () => {
    const w = mountPg({ defaultCurrent: 3, showSizeChanger: true });
    const select = w.findComponent({ name: 'ASelect' });
    (select.props('onChange') as (v: number) => void)(20);
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual([3, 20]);
  });

  it('#sizeChanger 槽接管渲染（拿到 value/onChange/disabled/options/aria-label）', () => {
    let captured: Record<string, unknown> | null = null;
    const w = mount(h(Pagination as never, { total: 500, showSizeChanger: true } as never), {
      slots: {
        sizeChanger: (info: Record<string, unknown>) => {
          captured = info;
          return h('div', { class: 'my-changer' }, `${info.value}`);
        },
      },
    });
    expect(w.find('.my-changer').text()).toBe('10');
    expect(captured).not.toBeNull();
    expect((captured as unknown as { disabled: boolean }).disabled).toBe(false);
    // ⚠️ rc 口径叫 `onSizeChange`、antd 的 `components.sizeChanger` 口径叫 `onChange` ⇒ 两个都给
    expect(typeof (captured as unknown as { onSizeChange: unknown }).onSizeChange).toBe('function');
    expect(typeof (captured as unknown as { onChange: unknown }).onChange).toBe('function');
    expect(
      (captured as unknown as { options: { value: number }[] }).options.map((o) => o.value),
    ).toEqual([10, 20, 50, 100]);
  });

  it('pageSize 不在选项里时追加并按数值升序（rc 逐字）', () => {
    let options: number[] = [];
    mount(
      h(Pagination as never, { total: 500, pageSize: 15, pageSizeOptions: [50, 10, 15] } as never),
      {
        slots: {
          sizeChanger: (info: { options: { value: number }[] }) => {
            options = info.options.map((o) => o.value);
            return h('div');
          },
        },
      },
    );
    expect(options).toEqual([50, 10, 15]); // 已包含 ⇒ 原样（不排序）

    mount(
      h(Pagination as never, { total: 500, pageSize: 15, pageSizeOptions: [50, 10] } as never),
      {
        slots: {
          sizeChanger: (info: { options: { value: number }[] }) => {
            options = info.options.map((o) => o.value);
            return h('div');
          },
        },
      },
    );
    expect(options).toEqual([10, 15, 50]); // 追加 + 升序
  });

  it('sizeChangerRender prop 优先于槽', () => {
    const w = mount(h(Pagination as never, { total: 500, showSizeChanger: true } as never), {
      props: {
        sizeChangerRender: () => h('div', { class: 'prop-changer' }),
      } as never,
      slots: { sizeChanger: () => h('div', { class: 'slot-changer' }) },
    });
    expect(w.find('.prop-changer').exists()).toBe(true);
    expect(w.find('.slot-changer').exists()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// L2 · ConfigProvider 双源合并
// ---------------------------------------------------------------------------

describe('Pagination · showSizeChanger 的 props↔ConfigProvider 合并（L2）', () => {
  it('props 优先于 context；只有 context 时用 context', async () => {
    const { configContextKey, DEFAULT_CONFIG_CONTEXT } = await import(
      '../../config-provider/context'
    );
    const withContext = (
      paginationConfig: Record<string, unknown>,
      props: Record<string, unknown>,
    ) =>
      mount(h(Pagination as never, { total: 30, ...props } as never), {
        global: {
          provide: {
            // ⚠️ 组件配置收在 `components.{name}` 下（不是顶层 `pagination`）——
            //    `useComponentConfig('pagination')` 读的是 `context.components.pagination`
            [configContextKey as unknown as string]: {
              ...DEFAULT_CONFIG_CONTEXT,
              components: { pagination: paginationConfig },
            },
          },
        },
      });

    // total=30 < 50 ⇒ 默认不显示；context 显式 true ⇒ 显示
    expect(withContext({ showSizeChanger: true }, {}).find(`.${P}-options`).exists()).toBe(true);
    // props 显式 false ⇒ 压过 context 的 true
    expect(
      withContext({ showSizeChanger: true }, { showSizeChanger: false })
        .find(`.${P}-options`)
        .exists(),
    ).toBe(false);
  });
});
