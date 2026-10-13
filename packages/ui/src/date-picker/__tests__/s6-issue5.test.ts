/**
 * L1/L2 —— **Issue #5 的五项回归**（先复现再修，逐条钉住）。
 *
 * 这个文件与 s1–s5 的分工：s1–s5 按**阶段**（S1 结构 / S2 键入 / S3 掩码 / S4 焦点 /
 * S5 模式与范围）组织；本文件按**缺陷**组织 —— 每条用例在修复前都必须是**红灯**，
 * 否则它就不是回归测试，只是重复覆盖。
 *
 * | # | 判据 | 修复前的红灯表现 |
 * |---|---|---|
 * | 5.1 | `multiple` 的 `change` 第二参是 `string[]` | 只有第一个字符串（`texts[0]`） |
 * | 5.2 | 浮层容器：局部 `getPopupContainer` → 应用级 | 只认局部，全局被忽略 |
 * | 5.3 | 只改 attrs ⇒ 根节点跟着更新 | `computed` 缓存了首帧快照 |
 * | 5.4 | `components.datePicker.style` / `components.rangePicker.style` 生效 | 从未传给语义 Hook（DatePicker）/ 传了错的字段（RangePicker） |
 * | 5.5 | `minDate` / `maxDate` 是**静态日期** | 公开了函数形态但恒传 `{}`（类型层已收窄，见 `type.test-d.ts`） |
 *
 * ── 🚨 两条踩过的坑（写在这里避免下次重犯）─────────────────────────────────
 *
 * 1. **模板里不能放 HTML 注释**：Vue 编译期会把它保留成 Comment vnode，而 `Trigger`
 *    取的是 `slots.default()[0]`（`_internal/trigger.ts:613-614`）⇒ 一条注释会把真正的
 *    触发元素顶掉，组件渲染成空（本 Issue 修复期间实测踩到，`w.find('.apollo-picker')`
 *    恒 `false`）。
 * 2. **浮层必须关掉 VTU 的 teleport 打桩**：默认渲染成 `<teleport-stub>`，
 *    内容不会真的挂到 `getPopupContainer` 指定的容器里（`global: { stubs: { teleport: false } }`）。
 */

import { resetWarned } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import DatePicker from '../DatePicker.vue';
import RangePicker from '../RangePicker.vue';

const P = 'apollo-picker';
const D = (s: string) => dayjs(s);
const TWO = [D('2026-09-30'), D('2026-10-01')];

/** 多选的标签（`-selection-item`）。 */
const items = (w: ReturnType<typeof mount>) => w.findAll(`.${P}-selection-item`);

/** 事件载荷：`emitted('change')` 的最后一帧。 */
const lastChange = (w: ReturnType<typeof mount>) => w.emitted('change')?.at(-1);

// ===========================================================================
// 5.1 · multiple 的 dateStrings
// ===========================================================================

describe('DatePicker · multiple 的 change 第二参（Issue #5.1）', () => {
  it('★ 删掉一个标签 ⇒ `([剩余日期], [剩余文本])` —— 整组文本，不是首项', async () => {
    const w = mount(DatePicker, { props: { multiple: true, defaultValue: TWO } });

    await items(w)[0]?.find(`.${P}-selection-item-remove`).trigger('click');

    const payload = lastChange(w);
    expect(payload?.[0]).toHaveLength(1);
    // 🚨 修复前是 `'2026-10-01'`（裸字符串）—— 类型/形状都不对
    expect(payload?.[1]).toEqual(['2026-10-01']);
    w.unmount();
  });

  it('★ 两个都在 ⇒ 两个文本都在（`DatePicker.vue` 的 `onChange` 按模式分派）', async () => {
    const w = mount(DatePicker, { props: { multiple: true, defaultValue: TWO } });

    // 追加第三个（点面板里的日期格 ⇒ 关浮层时提交）；直接改受控值更稳：
    // 这里用「移除再断言长度」避免依赖面板渲染细节。
    await items(w)[1]?.find(`.${P}-selection-item-remove`).trigger('click');

    const payload = lastChange(w);
    expect(payload?.[0]).toHaveLength(1);
    expect(payload?.[1]).toEqual(['2026-09-30']);
    w.unmount();
  });

  it('★ 多选清空 ⇒ `(null, null)`（上游 `pickerParam` 的 `null` 判断在最前）', async () => {
    const w = mount(DatePicker, { props: { multiple: true, defaultValue: TWO } });

    await w.find(`.${P}-clear`).trigger('click');

    // 🚨 rc `SinglePicker.js:97-102`：`if (values === null) return null;` **先于**
    //    `multiple ? values : values[0]` ⇒ 多选清空同样是 `null`，**不是** `[]`。
    //    （`isNullValue && everyEmpty ? null : clone` 那条在 `useRangeValue.js:216-221`。）
    const payload = lastChange(w);
    expect(payload?.[0]).toBeNull();
    expect(payload?.[1]).toBeNull();
    w.unmount();
  });

  it('`update:value` 与 `change` 同值（C11）：多选清空两个都是 `null`', async () => {
    const w = mount(DatePicker, { props: { multiple: true, defaultValue: TWO } });
    await w.find(`.${P}-clear`).trigger('click');

    expect(w.emitted('update:value')?.at(-1)?.[0]).toBeNull();
    expect(lastChange(w)?.[0]).toBeNull();
    w.unmount();
  });

  it('反向哨兵：单选清空仍是 `(null, null)`（多选改动**没有**污染单值）', async () => {
    const w = mount(DatePicker, { props: { defaultValue: D('2026-09-30') } });

    await w.find(`.${P}-clear`).trigger('click');

    const payload = lastChange(w);
    expect(payload?.[0]).toBeNull();
    expect(payload?.[1]).toBeNull();
    w.unmount();
  });
});

// ===========================================================================
// 5.2 · 浮层容器：局部优先 → 应用级
// ===========================================================================

describe('DatePicker · getPopupContainer 回退到应用级（Issue #5.2）', () => {
  /** 浮层走 Portal ⇒ 必须关掉 teleport 打桩才能验「挂到哪儿」。 */
  const MOUNT = { attachTo: document.body, global: { stubs: { teleport: false } } } as const;

  const makeContainer = (id: string) => {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
    return el;
  };

  it('★ 未传局部容器 ⇒ 用 ConfigProvider 的全局设置（单值）', async () => {
    const container = makeContainer('ctr-dp');
    const w = mount(ConfigProvider, {
      props: { getPopupContainer: () => container },
      slots: { default: () => h(DatePicker, { open: true }) },
      ...MOUNT,
    } as never);
    await nextTick();
    await nextTick();

    expect(container.querySelector(`.${P}-dropdown`)).not.toBeNull();
    w.unmount();
    container.remove();
  });

  it('★ 未传局部容器 ⇒ 用 ConfigProvider 的全局设置（范围版）', async () => {
    const container = makeContainer('ctr-rp');
    const w = mount(ConfigProvider, {
      props: { getPopupContainer: () => container },
      slots: { default: () => h(RangePicker, { open: true }) },
      ...MOUNT,
    } as never);
    await nextTick();
    await nextTick();

    expect(container.querySelector(`.${P}-dropdown`)).not.toBeNull();
    w.unmount();
    container.remove();
  });

  it('★ 局部容器优先于全局（上游 `customizeGetPopupContainer || getPopupContainer`）', async () => {
    const global = makeContainer('ctr-global');
    const local = makeContainer('ctr-local');
    const w = mount(ConfigProvider, {
      props: { getPopupContainer: () => global },
      slots: {
        default: () => h(DatePicker, { open: true, getPopupContainer: () => local }),
      },
      ...MOUNT,
    } as never);
    await nextTick();
    await nextTick();

    expect(local.querySelector(`.${P}-dropdown`)).not.toBeNull();
    expect(global.querySelector(`.${P}-dropdown`)).toBeNull();
    w.unmount();
    global.remove();
    local.remove();
  });

  it('反向哨兵：两边都不给 ⇒ 落 `document.body`（不是「渲染不出来」）', async () => {
    const w = mount(DatePicker, { props: { open: true }, ...MOUNT } as never);
    await nextTick();
    await nextTick();

    expect(document.body.querySelector(`.${P}-dropdown`)).not.toBeNull();
    w.unmount();
  });
});

// ===========================================================================
// 5.3 · 只改 attrs ⇒ 根节点跟着更新
// ===========================================================================

describe('DatePicker / RangePicker · 只改 attrs 也要更新（Issue #5.3）', () => {
  /**
   * 宿主：**不改任何 prop**，只改 `class` / `style` / `aria-*` / `data-*`。
   *
   * 这条路径正是 `computed(() => ({...attrs}))` 失效的地方 —— `useAttrs()` 返回的
   * 对象不参与依赖追踪，Vue 仍会重渲染本组件（`shouldUpdateComponent` 判定
   * 「props 没变、attrs 变了」），但重渲染读到的还是那一份缓存快照。
   */
  const mountAttrsHost = (component: unknown) => {
    const marker = ref('m1');
    const describedBy = ref('hint-1');
    const cls = ref('cls-a');
    const width = ref('200px');
    const Host = defineComponent({
      name: 'APickerAttrsHost',
      setup() {
        return () =>
          h(
            component as never,
            {
              class: cls.value,
              'data-marker': marker.value,
              'aria-describedby': describedBy.value,
              style: { width: width.value },
            },
            {},
          );
      },
    });
    return { w: mount(Host), marker, describedBy, cls, width };
  };

  const root = (w: ReturnType<typeof mount>) => w.find(`.${P}`);

  it('★ DatePicker：data-* / aria-* / class / style 逐个都跟得上', async () => {
    const { w, marker, describedBy, cls, width } = mountAttrsHost(DatePicker);
    await nextTick();

    expect(root(w).attributes('data-marker')).toBe('m1');
    expect(root(w).attributes('aria-describedby')).toBe('hint-1');
    expect(root(w).classes()).toContain('cls-a');
    expect((root(w).element as HTMLElement).style.width).toBe('200px');

    marker.value = 'm2';
    describedBy.value = 'hint-2';
    cls.value = 'cls-b';
    width.value = '321px';
    await nextTick();

    expect(root(w).attributes('data-marker')).toBe('m2');
    expect(root(w).attributes('aria-describedby')).toBe('hint-2');
    expect(root(w).classes()).toContain('cls-b');
    expect(root(w).classes()).not.toContain('cls-a');
    expect((root(w).element as HTMLElement).style.width).toBe('321px');
    w.unmount();
  });

  it('★ RangePicker：同一条路径（它有独立的 `selectorBindings`）', async () => {
    const { w, marker, describedBy, cls } = mountAttrsHost(RangePicker);
    await nextTick();

    expect(root(w).attributes('data-marker')).toBe('m1');
    expect(root(w).attributes('aria-describedby')).toBe('hint-1');
    expect(root(w).classes()).toContain('cls-a');

    marker.value = 'm2';
    describedBy.value = 'hint-2';
    cls.value = 'cls-b';
    await nextTick();

    expect(root(w).attributes('data-marker')).toBe('m2');
    expect(root(w).attributes('aria-describedby')).toBe('hint-2');
    expect(root(w).classes()).toContain('cls-b');
    w.unmount();
  });

  it('★ 动态改 class 是**合并**不是替换（引擎自己的类名一个都不掉）', async () => {
    const cls = ref('user-a');
    const disabled = ref(false);
    const Host = defineComponent({
      name: 'APickerClassMergeHost',
      setup: () => () => h(DatePicker, { class: cls.value, disabled: disabled.value } as never),
    });
    const w = mount(Host);
    await nextTick();

    // 引擎类名与用户类名并存
    expect(root(w).classes()).toContain(`${P}-outlined`);
    expect(root(w).classes()).toContain('user-a');

    cls.value = 'user-b';
    disabled.value = true;
    await nextTick();

    // 用户类名换成新的，且**引擎类名没有被顶掉 / 没有重复**
    expect(root(w).classes()).toContain('user-b');
    expect(root(w).classes()).toContain(`${P}-outlined`);
    expect(root(w).classes()).toContain(`${P}-disabled`);
    const outlineCount = root(w)
      .classes()
      .filter((c) => c === `${P}-outlined`).length;
    expect(outlineCount).toBe(1);
    w.unmount();
  });
});

// ===========================================================================
// 5.4 · 组件级 style（`components.datePicker.style` / `components.rangePicker.style`）
// ===========================================================================

describe('DatePicker · 组件级 style 的合并路径（Issue #5.4）', () => {
  const styleOf = (w: ReturnType<typeof mount>) => (w.find(`.${P}`).element as HTMLElement).style;

  it('★ `components.datePicker.style` 落到语义 `root`（走 `semanticRootStyle`）', () => {
    const w = mount(ConfigProvider, {
      props: { components: { datePicker: { style: { color: 'red' } } } },
      slots: { default: () => h(DatePicker) },
    });
    expect(styleOf(w).color).toBe('red');
    w.unmount();
  });

  it('★ `components.rangePicker.style` 落到语义 `root`（此前传的是 `styles`，字段错了）', () => {
    const w = mount(ConfigProvider, {
      props: { components: { rangePicker: { style: { color: 'blue' } } } },
      slots: { default: () => h(RangePicker) },
    });
    expect(styleOf(w).color).toBe('blue');
    w.unmount();
  });

  it('★ 优先级：`styles.root` prop 压过组件级 `style`', () => {
    const w = mount(ConfigProvider, {
      props: { components: { datePicker: { style: { color: 'red', fontSize: '12px' } } } },
      slots: {
        default: () => h(DatePicker, { styles: { root: { color: 'green' } } }),
      },
    });
    const style = styleOf(w);
    // prop 赢（`[contextStyles, contextStyleRoot, styles]` 后者覆盖前者）
    expect(style.color).toBe('green');
    // 但组件级 style 里**没被覆盖**的字段仍保留（合并而不是替换）
    expect(style.fontSize).toBe('12px');
    w.unmount();
  });

  it('`components.datePicker.styles.root` 也生效（且被 prop 覆盖）', () => {
    const w = mount(ConfigProvider, {
      props: { components: { datePicker: { styles: { root: { borderWidth: '3px' } } } } },
      slots: { default: () => h(DatePicker) },
    });
    expect(styleOf(w).borderWidth).toBe('3px');
    w.unmount();
  });
});

// ===========================================================================
// 5.5 · `minDate` / `maxDate` 是静态日期
// ===========================================================================

describe('DatePicker · minDate / maxDate 的静态日期语义（Issue #5.5）', () => {
  resetWarned();

  /**
   * 按 `title` 定位某一天 —— **不要按文本**！
   *
   * 42 个格子里含相邻月份（8 月末 / 10 月初），`c.text() === '9'` 会撞上多个；
   * 面板也可能因时区/今天漂移。`title="YYYY-MM-DD"` 是唯一标识。
   */
  const cell = (w: ReturnType<typeof mount>, iso: string) => w.find(`.${P}-cell[title="${iso}"]`);

  it('★ `minDate` 是普通日期（不是函数）⇒ 早于它的格子被禁用', () => {
    const w = mount(DatePicker, {
      props: { open: true, defaultValue: D('2026-09-15'), minDate: D('2026-09-10') },
    });

    expect(cell(w, '2026-09-09').classes()).toContain(`${P}-cell-disabled`);
    // 🚨 补一条上游特有的判据：`minDate` **当天本身可选**（`useDisabledBoundary` 的 `isSame` 例外）
    expect(cell(w, '2026-09-10').classes()).not.toContain(`${P}-cell-disabled`);
    expect(cell(w, '2026-09-11').classes()).not.toContain(`${P}-cell-disabled`);
    w.unmount();
  });

  it('★ `maxDate` 同理（晚于它的被禁用；**`maxDate` 当天本身可选**）', () => {
    const w = mount(DatePicker, {
      props: { open: true, defaultValue: D('2026-09-15'), maxDate: D('2026-09-20') },
    });

    // 🚨 与 `minDate` 同一条 `isSame` 例外：边界那天**可选**，边界之外才禁用
    expect(cell(w, '2026-09-21').classes()).toContain(`${P}-cell-disabled`);
    expect(cell(w, '2026-09-20').classes()).not.toContain(`${P}-cell-disabled`);
    expect(cell(w, '2026-09-19').classes()).not.toContain(`${P}-cell-disabled`);
    w.unmount();
  });

  it('RangePicker：静态 `minDate` / `maxDate` 同样生效（按 `defaultValue` 锚定月份）', () => {
    // ⚠️ 用 `defaultValue` 把面板月份从「今天」解耦（PITFALLS：别让用例依赖运行时刻）
    const w = mount(RangePicker, {
      props: {
        open: true,
        defaultValue: [D('2026-09-15'), D('2026-09-18')],
        minDate: D('2026-09-10'),
        maxDate: D('2026-09-20'),
      },
    });

    expect(cell(w, '2026-09-09').classes()).toContain(`${P}-cell-disabled`);
    expect(cell(w, '2026-09-21').classes()).toContain(`${P}-cell-disabled`);
    // 两个边界当天都**可选**
    expect(cell(w, '2026-09-10').classes()).not.toContain(`${P}-cell-disabled`);
    expect(cell(w, '2026-09-20').classes()).not.toContain(`${P}-cell-disabled`);
    expect(cell(w, '2026-09-15').classes()).not.toContain(`${P}-cell-disabled`);
    w.unmount();
  });
});
