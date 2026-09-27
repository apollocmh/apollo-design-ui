/**
 * L1 · 单元测试 + L2 · 交互（本项目对 Space 的 L2 适用面说明见下）
 *
 * ── 为什么 L2 只有很少的内容 ───────────────────────────────────────────────────
 *
 * Space / Space.Compact / Space.Addon 都是**布局容器**：没有事件、没有受控/非受控、
 * 没有键盘交互、没有禁用态、没有浮层。`TESTING.md` 的 L2 六类里只有
 * 「**动态更新**」适用（子节点增删后 `latestIndex` 要跟着变、`ConfigProvider`
 * 的 `direction` / `componentSize` 变化要传导），这一部分写在本文件的
 * `L2 · 动态更新` 一节，用的是真实的 `setProps` / `nextTick` 路径。
 * 其余五类判 `n/a`（依据写进 `registry/components.json` 的 `layerNotes`），
 * 而不是「写几个 `expect(exists()).toBe(true)` 把格子填上」（反模式 A1）。
 *
 * ── 前缀约定 ─────────────────────────────────────────────────────────────────
 *
 * `prefixCls` 是**完整前缀**，不是后缀：`getPrefixCls('space', 'apollo')` 直接返回
 * `'apollo'`，于是根类名是 `apollo`、子结构是 `apollo-item`
 * （**没有** `space` 这一段）。所以本文件默认**不传** `prefixCls`，
 * 走兜底值 `apollo-space` —— 这也是用户最常看到的形态。
 *
 * ⚠️ 但 `Space.Compact` 的兜底是 `apollo-space-compact`，`Space.Addon` 是
 *    `apollo-space-addon`（后缀不同）—— 这是本组件最容易抄错的一处。
 *
 * ── 本文件的五个重心 ─────────────────────────────────────────────────────────
 *
 * 1. **方向合并表** —— 逐条镜像 antd 的 `space/__tests__/index.test.tsx` 里的
 *    `testCases` 表（5 条），它是上游对「orientation > vertical > direction」
 *    这条优先级的**可执行规格**。
 *
 * 2. **`vertical` 未传 ≠ `false`** —— PITFALLS 46 / D21。`useOrientation` 的判据是
 *    `typeof vertical === 'boolean'`，少了 `withDefaults` 里的 `vertical: undefined`，
 *    `<Space direction="vertical">` 会**静默**变成 horizontal。
 *
 * 3. **`size` 的四条取值路径** —— 预设串走类名、非零数字走内联 gap（且**自己补 px**，
 *    PITFALLS 32）、元组两向分别取、`0` 取用但不产生任何 gap。
 *    其中「`size: 0` 不回落成 `'small'`」靠 `??` 而不是 `||`。
 *
 * 4. **`separator ?? split` 与真值渲染判据** —— 包括上游那个 `separator={0}`
 *    会把数字 `0` 漏成文本节点的缺陷（我们有意不复刻，见下面的 DEFECT 用例）。
 *
 * 5. **`Space.Compact` 的跨组件协议** —— 首/末项的合取、嵌套、`NoCompactStyle` 隔离、
 *    `size` 与 `componentSize` 的优先级。协议本身由 `useCompactItemContext` 的
 *    直接单测钉住，DOM 上的落点由 L4 的探针用例钉住。
 *
 * ── 这个文件没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明与 antd 的 DOM 一致（那是 L4，见 `semantic.test.ts`）
 *   - 没证明像素一致（那是 L6，见 `tests/visual`）
 *   - 没证明真实的 Button / Input 能被 `Space.Compact` 驱动 —— 那要等它们落地，
 *     缺口登记在 `README.md` §7
 */

import { mountTest, resetWarned } from '@apollo-design/test-utils';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  computed,
  defineComponent,
  h,
  nextTick,
  type PropType,
  provide,
  ref,
  type VNodeChild,
} from 'vue';
import { ConfigProvider } from '../../config-provider';
import { type SizeType, sizeContextKey } from '../../config-provider/size-context';
import { isPresetSize, isValidGapNumber } from '../gapSize';
import { NoCompactStyle, Space, SpaceAddon, SpaceCompact, useCompactItemContext } from '../index';
import { getStatusClassNames, type InputStatus } from '../statusUtils';
import { isValidOrientation, useOrientation } from '../useOrientation';

/** `Space` 的兜底前缀（不传 `prefixCls` 时）。 */
const P = 'apollo-space';
/** `Space.Compact` 的兜底前缀 —— 后缀是 `space-compact`，不是 `compact`。 */
const PC = 'apollo-space-compact';
/** `Space.Addon` 的兜底前缀 —— 后缀是 `space-addon`。 */
const PA = 'apollo-space-addon';

const twoSpans = (): VNodeChild[] => [h('span', null, '1'), h('span', null, '2')];

/** 挂载 `Space`。`children` 为 `undefined` 时**不传** `slots`（`slots.default` 才是 `undefined`）。 */
const mountSpace = (
  props: Record<string, unknown> = {},
  children?: VNodeChild[],
  extraSlots?: Record<string, () => unknown>,
) =>
  mount(Space, {
    props,
    ...(children === undefined && extraSlots === undefined
      ? {}
      : {
          slots: { ...(children === undefined ? {} : { default: () => children }), ...extraSlots },
        }),
  });

const mountCompact = (props: Record<string, unknown> = {}, children?: VNodeChild[]) =>
  mount(SpaceCompact, {
    props,
    ...(children === undefined ? {} : { slots: { default: () => children } }),
  });

const mountAddon = (props: Record<string, unknown> = {}, children: VNodeChild = 'Addon') =>
  mount(SpaceAddon, { props, slots: { default: () => children } });

/**
 * 取某个选择器命中元素的 `style`。
 *
 * ⚠️ 为什么需要这个收窄：`@vue/test-utils` 的 `DOMWrapper.element` 类型是
 *    `VueNode<Element>`（它要同时覆盖元素与文本节点），所以 `.style` 在类型层不可见。
 *    `wrapper.element`（根 wrapper）没有这个问题 —— 它的类型是具体元素。
 *    直接写 `(w.find(s).element as HTMLElement)` 也能过，但重复 6 次之后
 *    「为什么这里要断言」就丢了；收在一个有注释的函数里，理由只写一遍。
 */
const styleOf = (w: VueWrapper, selector: string): CSSStyleDeclaration =>
  (w.find(selector).element as HTMLElement).style;

/** 挂一层真的 `ConfigProvider`（与用户在应用里的用法完全一致）。 */
const mountWithProvider = (
  providerProps: Record<string, unknown>,
  component: unknown,
  props: Record<string, unknown> = {},
  children?: VNodeChild[],
) =>
  mount(
    defineComponent({
      name: 'ASpaceProviderHost',
      /**
       * ⚠️ `providerProps` **必须显式声明成 prop**，不能靠属性透传（`inheritAttrs` 的默认行为）。
       *
       * 靠透传**也能跑通**：宿主没有声明任何 props，于是 `providerProps` 的键会作为
       * attr 落到它渲染的 `ConfigProvider` 上（Vue 的单根组件 attrs 透传）。
       * 但那条路径有两个问题：
       *   1. **类型层看不见** —— `setProps` 只能接受宿主**声明过**的 props，
       *      于是「挂载后切换 direction」的用例过不了 `vue-tsc`；
       *   2. **静默脆弱** —— 一旦宿主多渲染一个根元素（哪怕是个 `div`），透传立刻失效，
       *      而测试只会红在「类名没变」上，根因很难定位。
       *
       * 显式声明之后，「切换 ConfigProvider 的 direction 真的会传导到 Space」
       * 变成一条有类型保障、且不依赖透传规则的断言。
       */
      props: {
        providerProps: { type: Object as PropType<Record<string, unknown>>, required: true },
      },
      setup(hostProps) {
        return () =>
          h(ConfigProvider, hostProps.providerProps as never, {
            default: () =>
              h(component as never, props, {
                default: () => (children ?? twoSpans()) as VNodeChild,
              }),
          });
      },
    }),
    { props: { providerProps } },
  );

/** 捕获 `console.error` 并返回拼接后的文本（`warning()` 走 error 通道）。 */
async function capturedWarnings(run: () => unknown): Promise<string> {
  resetWarned();
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await run();
    await nextTick();
    return spy.mock.calls.map((args) => String(args[0])).join('\n');
  } finally {
    spy.mockRestore();
    resetWarned();
  }
}

mountTest('Space', { render: () => h(Space, null, { default: () => twoSpans() }) });
mountTest('Space.Compact', { render: () => h(SpaceCompact, null, { default: () => twoSpans() }) });
mountTest('Space.Addon', { render: () => h(SpaceAddon, null, { default: () => 'Addon' }) });

// ---------------------------------------------------------------------------
// 基本结构
// ---------------------------------------------------------------------------

describe('Space · 基本结构', () => {
  it('默认渲染：根 div + -horizontal + -align-center + 两个 gap 类名 + 每个子节点一个 -item', () => {
    const w = mountSpace({}, twoSpans());
    expect(w.element.tagName).toBe('DIV');
    expect(w.classes()).toContain(P);
    expect(w.classes()).toContain(`${P}-horizontal`);
    // 水平且不传 align ⇒ 折成 center
    expect(w.classes()).toContain(`${P}-align-center`);
    // 不传 size ⇒ 'small' ⇒ 两个方向都是预设串 ⇒ 两个 gap 类名，**没有**内联 gap
    expect(w.classes()).toContain(`${P}-gap-row-small`);
    expect(w.classes()).toContain(`${P}-gap-col-small`);
    expect(w.attributes('style')).toBeUndefined();
    expect(w.findAll(`.${P}-item`)).toHaveLength(2);
  });

  it('★ 没有 children 时**整个根元素都不渲染**（与 antd 的 `childNodes.length === 0` 一致）', () => {
    // ⚠️ 断言的是「没有根**元素**」而不是「html 是空串」：Vue 的 `v-if` 为假时会留下
    //    一个注释节点（`<!--v-if-->`），而 L4 的投影只取元素节点（`parseFragment`
    //    用 `el.children`）—— 所以注释节点不是差异，两边都看不见。
    const w = mountSpace();
    expect(w.find(`.${P}`).exists()).toBe(false);
    expect(w.element.nodeType).toBe(Node.COMMENT_NODE);
    expect(w.findAll('div')).toHaveLength(0);
  });

  it('★ `false` / `null` 子节点**占位**但不产生 `-item`（`keepEmpty: true`）', () => {
    // React 的 `toArray(children, {keepEmpty: true})` 保留占位 ⇒ 根元素仍然渲染
    const w = mountSpace({}, [false as unknown as VNodeChild]);
    expect(w.classes()).toContain(P);
    expect(w.findAll(`.${P}-item`)).toHaveLength(0);
  });

  it('★ `<Null/>`（组件本身渲染 null）**是**可渲染的 ⇒ 渲染出空的 `-item`', () => {
    const Null = defineComponent({ name: 'ANull', setup: () => () => null });
    const w = mountSpace({}, [h(Null)]);
    const items = w.findAll(`.${P}-item`);
    expect(items).toHaveLength(1);
    expect(items[0]?.element.textContent).toBe('');
  });

  it('文本子节点会被包进 `-item`', () => {
    const w = mountSpace({}, ['text']);
    expect(w.find(`.${P}-item`).text()).toBe('text');
  });

  it('不传 prefixCls 时兜底为 `apollo-space`（与 antd 的 `ant-space` 同构）', () => {
    expect(mountSpace({}, twoSpans()).classes()).toContain('apollo-space');
  });

  it('传完整 prefixCls 时直接采用（不拼 `-space` 后缀）', () => {
    const w = mountSpace({ prefixCls: 'apollo' }, twoSpans());
    expect(w.classes()).toContain('apollo');
    expect(w.classes()).toContain('apollo-horizontal');
    expect(w.find('.apollo-item').exists()).toBe(true);
  });

  it('expose：`nativeElement` 指向根元素', () => {
    const w = mountSpace({}, twoSpans());
    expect(w.vm.nativeElement).toBe(w.element);
  });
});

// ---------------------------------------------------------------------------
// 方向合并（orientation > vertical > direction）
// ---------------------------------------------------------------------------

describe('Space · 方向合并（orientation > vertical > direction）', () => {
  /** 逐条镜像 antd `space/__tests__/index.test.tsx` 的 `orientation attribute` 表。 */
  const testCases: Array<
    [string, 'horizontal' | 'vertical' | undefined, 'horizontal' | 'vertical' | undefined]
  > = [
    ['unset / unset', undefined, undefined],
    ['unset / vertical', undefined, 'vertical'],
    ['vertical / horizontal', 'vertical', 'horizontal'],
    ['vertical / unset', 'vertical', undefined],
    ['horizontal / vertical', 'horizontal', 'vertical'],
  ];

  it.each(testCases)('%s ⇒ 期望类名', (_name, orientation, direction) => {
    const expected = orientation ?? direction ?? 'horizontal';
    const w = mountSpace({ orientation, direction }, twoSpans());
    expect(w.classes()).toContain(`${P}-${expected}`);
  });

  it('`vertical: true` ⇒ vertical', () => {
    expect(mountSpace({ vertical: true }, twoSpans()).classes()).toContain(`${P}-vertical`);
  });

  it('★ `vertical: false` **压过** `direction="vertical"`（判据是 `typeof === boolean`，不是真值）', () => {
    const w = mountSpace({ direction: 'vertical', vertical: false }, twoSpans());
    expect(w.classes()).toContain(`${P}-horizontal`);
    expect(w.classes()).not.toContain(`${P}-vertical`);
  });

  it('★ 合法 `orientation` 压过 `vertical`（哪怕 `vertical` 是显式 `false`）', () => {
    const w = mountSpace({ orientation: 'vertical', vertical: false }, twoSpans());
    expect(w.classes()).toContain(`${P}-vertical`);
  });

  it('★★ 未传 `vertical` **不能**被 Vue 转成 `false`（PITFALLS 46 / D21）', () => {
    // 这条是 `withDefaults` 里 `vertical: undefined` 的守门用例：
    // 删掉它，Vue 的 Boolean prop 转换会把「未传」变成 `false`，
    // 于是 `direction="vertical"` 会**静默**渲染成 horizontal。
    const w = mountSpace({ direction: 'vertical' }, twoSpans());
    expect(w.classes()).toContain(`${P}-vertical`);
  });

  it('非法 orientation 值不参与方向合并（`isValidOrientation` 判据）', () => {
    const w = mountSpace({ orientation: 'diagonal' as never, direction: 'vertical' }, twoSpans());
    expect(w.classes()).toContain(`${P}-vertical`);
  });
});

// ---------------------------------------------------------------------------
// align
// ---------------------------------------------------------------------------

describe('Space · align', () => {
  it.each(['start', 'end', 'center', 'baseline'])('显式 `align="%s"` 产生对应类名', (align) => {
    expect(mountSpace({ align }, twoSpans()).classes()).toContain(`${P}-align-${align}`);
  });

  it('★ 水平且不传 `align` ⇒ 折成 `center`', () => {
    expect(mountSpace({}, twoSpans()).classes()).toContain(`${P}-align-center`);
  });

  it('★★ 垂直且不传 `align` ⇒ **不产生**任何 `-align-*` 类名（判据是 `=== undefined`）', () => {
    const w = mountSpace({ orientation: 'vertical' }, twoSpans());
    expect(w.classes()).toContain(`${P}-vertical`);
    expect(w.classes().filter((c) => c.startsWith(`${P}-align-`))).toEqual([]);
  });

  it('垂直且显式传 `align` 仍然生效', () => {
    const w = mountSpace({ orientation: 'vertical', align: 'center' }, twoSpans());
    expect(w.classes()).toContain(`${P}-align-center`);
  });
});

// ---------------------------------------------------------------------------
// size 的四条取值路径
// ---------------------------------------------------------------------------

describe('Space · size', () => {
  it.each(['small', 'medium', 'middle', 'large'])(
    '预设串 `%s` ⇒ 两个方向的 gap 类名，且**没有**内联 gap',
    (size) => {
      const w = mountSpace({ size }, twoSpans());
      expect(w.classes()).toContain(`${P}-gap-row-${size}`);
      expect(w.classes()).toContain(`${P}-gap-col-${size}`);
      expect(w.attributes('style')).toBeUndefined();
    },
  );

  it('★ 非零数字 ⇒ 内联 gap，且**自己补了 `px`**（PITFALLS 32）', () => {
    const w = mountSpace({ size: 10 }, twoSpans());
    // 少了补 px 这一步，jsdom 与浏览器都会把裸数字 `10` 静默丢弃
    expect(w.element.style.columnGap).toBe('10px');
    expect(w.element.style.rowGap).toBe('10px');
    // 数字走内联，**不**产生 gap 类名
    expect(w.classes().filter((c) => c.startsWith(`${P}-gap-`))).toEqual([]);
  });

  it("★★ `size: 0` 是**有效值**（不回落成 `'small'`）但两条判据都为假 ⇒ 什么都不加", () => {
    const w = mountSpace({ size: 0 }, twoSpans());
    expect(w.classes().filter((c) => c.startsWith(`${P}-gap-`))).toEqual([]);
    expect(w.attributes('style')).toBeUndefined();
  });

  it('`NaN` ⇒ 无 gap（上游 `gap.test.tsx` 的 `should NaN work`）', () => {
    const w = mountSpace({ size: [Number.NaN, Number.NaN] }, twoSpans());
    expect(w.classes().filter((c) => c.startsWith(`${P}-gap-`))).toEqual([]);
    expect(w.attributes('style')).toBeUndefined();
  });

  it('元组 `[horizontal, vertical]`：两向分别取（预设串走类名）', () => {
    const w = mountSpace({ size: ['small', 'large'] }, twoSpans());
    expect(w.classes()).toContain(`${P}-gap-col-small`);
    expect(w.classes()).toContain(`${P}-gap-row-large`);
  });

  it('元组混合：横向数字走内联、纵向预设走类名（两条路径可以同时命中）', () => {
    const w = mountSpace({ size: [10, 'large'] }, twoSpans());
    expect(w.element.style.columnGap).toBe('10px');
    expect(w.element.style.rowGap).toBe('');
    expect(w.classes()).toContain(`${P}-gap-row-large`);
    expect(w.classes()).not.toContain(`${P}-gap-col-10`);
  });

  it("字符串数字 `'10'` ⇒ 不是 `number` ⇒ 什么都不加", () => {
    const w = mountSpace({ size: '10' as never }, twoSpans());
    expect(w.classes().filter((c) => c.startsWith(`${P}-gap-`))).toEqual([]);
    expect(w.attributes('style')).toBeUndefined();
  });

  it('★ 负数是合法的 gap 数字（`isValidGapNumber` 没有 `> 0` 这一条）', () => {
    // ⚠️ 这里断言的是**判据**而不是 DOM —— jsdom 的 cssstyle 按 CSS 规范把负 gap
    //    整个丢掉（`el.style.columnGap = '-5px'` → `style` 属性为 null），
    //    所以 L4 的 `size:negative` 用例在那条通道上不可观测（见 `semantic.test.ts`
    //    的 ALLOW 说明）。这条断言补上了那个缺口。
    expect(isValidGapNumber(-5)).toBe(true);
    // 组件本身仍然按同一条判据走（不抛错、不产生类名）
    const w = mountSpace({ size: -5 }, twoSpans());
    expect(w.classes().filter((c) => c.startsWith(`${P}-gap-`))).toEqual([]);
  });

  it('`wrap` ⇒ 内联 `flex-wrap: wrap`（且与数字 gap 共存）', () => {
    const w = mountSpace({ wrap: true, size: 10 }, twoSpans());
    expect(w.element.style.flexWrap).toBe('wrap');
    expect(w.element.style.columnGap).toBe('10px');
  });

  it('`wrap: false` 不产生 `flex-wrap`', () => {
    expect(mountSpace({ wrap: false }, twoSpans()).attributes('style')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// gapSize 的两条判据（叶子函数直接单测）
// ---------------------------------------------------------------------------

describe('Space · gapSize 叶子判据', () => {
  it('`isPresetSize` 命中四个预设串（含已废弃的 `middle`）', () => {
    for (const size of ['small', 'middle', 'medium', 'large']) {
      expect(isPresetSize(size)).toBe(true);
    }
  });

  it('`isPresetSize` 不命中数字 / 其它字符串 / 空值', () => {
    for (const size of [10, 0, -5, 'huge', '', undefined, null]) {
      expect(isPresetSize(size as never)).toBe(false);
    }
  });

  it('★ `isValidGapNumber` 的真值短路：`0` 被排除，负数**不被**排除', () => {
    expect(isValidGapNumber(0)).toBe(false);
    expect(isValidGapNumber(-5)).toBe(true);
    expect(isValidGapNumber(10)).toBe(true);
  });

  it('`isValidGapNumber` 要求 `typeof === number` 且非 `NaN`', () => {
    expect(isValidGapNumber(Number.NaN)).toBe(false);
    expect(isValidGapNumber('10' as never)).toBe(false);
    expect(isValidGapNumber(undefined)).toBe(false);
    expect(isValidGapNumber(null as never)).toBe(false);
    expect(isValidGapNumber('small' as never)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// separator / split
// ---------------------------------------------------------------------------

describe('Space · separator / split', () => {
  it('分隔符渲染在**每两个有内容的 item 之间**（最后一项之后没有）', () => {
    const w = mountSpace({ separator: '-' }, ['a', 'b', 'c']);
    expect(w.findAll(`.${P}-item-separator`)).toHaveLength(2);
  });

  it('不可渲染的子节点不参与 `latestIndex`（分隔符仍然只落在有内容的项之间）', () => {
    const w = mountSpace({ separator: '-' }, ['a', null, 'c']);
    expect(w.findAll(`.${P}-item`)).toHaveLength(2);
    expect(w.findAll(`.${P}-item-separator`)).toHaveLength(1);
  });

  it('★ 渲染判据是**真值**：`separator=""` 不渲染 span', () => {
    const w = mountSpace({ separator: '' }, ['a', 'b']);
    expect(w.findAll(`.${P}-item-separator`)).toHaveLength(0);
  });

  it('★★ 上游缺陷（DEFECT）：`separator={0}` 在 antd 里会把数字 `0` 漏成文本节点，我们**不复刻**', () => {
    // antd：`{index < latestIndex && separator && (<span>…</span>)}` 在 `separator === 0`
    // 时求值成数字 `0`，React 把它渲染成文本 ⇒ DOM 是 `<div>a</div>0<div>b</div>`。
    // C8-R2 后富内容走 `#separator` 插槽：显式渲染 `0` 会得到 **span 包裹**的 0
    // （仍是「不产生裸文本节点」的 D40 意图），空插槽归一为 '' ⇒ 不渲染 span。
    const w = mountSpace({ separator: 0 as unknown as string }, ['a', 'b']);
    expect(w.findAll(`.${P}-item-separator`)).toHaveLength(0);
    expect(w.element.textContent).toBe('ab');
  });

  it('富内容分隔符走 `#separator` 插槽（C8-R2：VNode 不再是 prop）', () => {
    const w = mountSpace({}, ['a', 'b'], { separator: () => h('b', null, '|') });
    expect(w.find(`.${P}-item-separator`).element.innerHTML).toBe('<b>|</b>');
  });

  it('★ `separator ?? split`：`separator` 优先', () => {
    const w = mountSpace({ separator: '-', split: '|' }, ['a', 'b']);
    expect(w.find(`.${P}-item-separator`).text()).toBe('-');
  });

  it('★ `split`（废弃）单独传时生效', () => {
    const w = mountSpace({ split: '-' }, ['a', 'b']);
    expect(w.find(`.${P}-item-separator`).text()).toBe('-');
  });

  it('★★ 用 `??` 而不是 `||`：`separator=""` **不**回落到 `split`', () => {
    const w = mountSpace({ separator: '', split: '-' }, ['a', 'b']);
    expect(w.findAll(`.${P}-item-separator`)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// latestIndex 的广播（SpaceContext）
// ---------------------------------------------------------------------------

describe('Space · latestIndex（SpaceContext）', () => {
  it('reduce 初值是 0：全是空子节点时没有分隔符', () => {
    const w = mountSpace({ separator: '-' }, [null, null]);
    expect(w.findAll(`.${P}-item-separator`)).toHaveLength(0);
  });

  it('单个有内容的子节点：它是 latestIndex ⇒ 自己后面没有分隔符', () => {
    const w = mountSpace({ separator: '-' }, ['a']);
    expect(w.findAll(`.${P}-item-separator`)).toHaveLength(0);
  });

  it('子节点里有空占位时，分隔符跳过它（只按有内容的项算）', () => {
    const w = mountSpace({ separator: '-' }, ['a', null, null, 'b']);
    const items = w.findAll(`.${P}-item`);
    expect(items).toHaveLength(2);
    expect(w.findAll(`.${P}-item-separator`)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// class / style / 属性透传
// ---------------------------------------------------------------------------

describe('Space · class / style / 属性透传', () => {
  it('`className` 与 `rootClassName` 都落在根元素上', () => {
    const w = mountSpace({ className: 'a', rootClassName: 'b' }, twoSpans());
    expect(w.classes()).toContain('a');
    expect(w.classes()).toContain('b');
  });

  it('原生属性经 `$attrs` 透传到根元素', () => {
    const w = mountSpace({ 'data-testid': 'x', title: 'tip' }, twoSpans());
    expect(w.attributes('data-testid')).toBe('x');
    expect(w.attributes('title')).toBe('tip');
  });

  it('`style` 参与根样式合并（与 `gapStyle` 共存，`style` 覆盖 gap）', () => {
    const w = mountSpace({ size: 10, style: { columnGap: '3px', color: 'red' } }, twoSpans());
    expect(w.element.style.columnGap).toBe('3px');
    expect(w.element.style.rowGap).toBe('10px');
    expect(w.element.style.color).toBe('red');
  });

  it('`class`（Vue 的 attrs 通道）与 `:class` 拼接，都在根元素上', () => {
    const w = mount(Space, {
      props: {},
      attrs: { class: 'from-attrs' },
      slots: { default: () => twoSpans() },
    });
    expect(w.classes()).toContain('from-attrs');
    expect(w.classes()).toContain(P);
  });
});

// ---------------------------------------------------------------------------
// 语义化 classNames / styles
// ---------------------------------------------------------------------------

describe('Space · 语义化 classNames / styles', () => {
  it('三个槽位各自落到对应元素上', () => {
    const w = mountSpace(
      { classNames: { root: 'cn-root', item: 'cn-item', separator: 'cn-sep' }, separator: '-' },
      ['a', 'b'],
    );
    expect(w.classes()).toContain('cn-root');
    expect(w.find(`.${P}-item`).classes()).toContain('cn-item');
    expect(w.find(`.${P}-item-separator`).classes()).toContain('cn-sep');
  });

  it('三个样式槽位各自落到对应元素上', () => {
    const w = mountSpace(
      {
        styles: { root: { color: 'red' }, item: { color: 'green' }, separator: { color: 'blue' } },
        separator: '-',
      },
      ['a', 'b'],
    );
    expect(w.element.style.color).toBe('red');
    expect(styleOf(w, `.${P}-item`).color).toBe('green');
    expect(styleOf(w, `.${P}-item-separator`).color).toBe('blue');
  });

  it('★★ `style` **覆盖** `styles.root`（合并顺序里最反直觉的一条）', () => {
    const w = mountSpace(
      { style: { color: 'green' }, styles: { root: { color: 'red' } } },
      twoSpans(),
    );
    expect(w.element.style.color).toBe('green');
  });

  it('★ `classNames` 是**拼接**（同名键连起来），不是覆盖', () => {
    const w = mountWithProvider(
      { components: { space: { classNames: { root: 'ctx-root' } } } },
      Space,
      { classNames: { root: 'own-root' } },
      twoSpans(),
    );
    const root = w.find(`.${P}`);
    expect(root.classes()).toContain('ctx-root');
    expect(root.classes()).toContain('own-root');
  });

  it('★ `styles` 是**逐键浅合并、后者胜**（与 classNames 的拼接语义不同）', () => {
    const w = mountWithProvider(
      { components: { space: { styles: { root: { color: 'red', margin: '1px' } } } } },
      Space,
      { styles: { root: { color: 'blue' } } },
      twoSpans(),
    );
    // ⚠️ 必须 `find` 到根元素：`mountWithProvider` 挂的是宿主组件，
    //    `wrapper.element` 是宿主渲染出的第一个 DOM 节点，不保证是 Space 的根。
    expect(styleOf(w, `.${P}`).color).toBe('blue');
    expect(styleOf(w, `.${P}`).margin).toBe('1px');
  });

  it('★ 函数式 `classNames` 收到的 `info.props` 是**合并后**的 props', () => {
    const seen: Array<Record<string, unknown>> = [];
    mountSpace(
      {
        orientation: 'vertical',
        classNames: (info: { props: Record<string, unknown> }) => {
          seen.push({ ...info.props });
          return { root: 'fn-root' };
        },
      },
      twoSpans(),
    );
    expect(seen.length).toBeGreaterThan(0);
    // 合并后的三个字段：orientation 取合并结果、align 保持 undefined、size 兜底成 'small'
    expect(seen[0]?.orientation).toBe('vertical');
    expect(seen[0]?.align).toBeUndefined();
    expect(seen[0]?.size).toBe('small');
  });

  it('★ 函数式 `classNames` 在 props 变化后能读到**新值**（不是 setup 期快照）', async () => {
    const seen: unknown[] = [];
    const w = mountSpace(
      {
        classNames: (info: { props: Record<string, unknown> }) => {
          seen.push(info.props.orientation);
          return {};
        },
      },
      twoSpans(),
    );
    expect(seen.at(-1)).toBe('horizontal');
    await w.setProps({ orientation: 'vertical' });
    expect(seen.at(-1)).toBe('vertical');
  });

  it('函数式 `styles` 被支持', () => {
    const w = mountSpace({ styles: () => ({ root: { color: 'blue' } }) }, twoSpans());
    expect(w.element.style.color).toBe('blue');
  });

  it('★ 空的语义化样式**不产生** `style` 属性（SSR 的 `style=""` 缺口）', () => {
    // `mergeStyles()` 恒返回对象（可能是 `{}`），必须过 `styleAttrs()` 才能绑；
    // 直接绑 `:style` 时 SSR 会渲染出 `style=""`（见 use-merge-semantic 的注释）。
    expect(mountSpace({ styles: { root: {} } }, twoSpans()).attributes('style')).toBeUndefined();
    expect(mountSpace({}, twoSpans()).attributes('style')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// ConfigProvider
// ---------------------------------------------------------------------------

describe('Space · ConfigProvider', () => {
  it('`components.space.size` 作为兜底（prop 不传时生效）', () => {
    const w = mountWithProvider(
      { components: { space: { size: 'large' } } },
      Space,
      {},
      twoSpans(),
    );
    expect(w.find(`.${P}`).classes()).toContain(`${P}-gap-row-large`);
  });

  it('★ prop 的 `size` 压过 ConfigProvider 的', () => {
    const w = mountWithProvider(
      { components: { space: { size: 'large' } } },
      Space,
      { size: 'medium' },
      twoSpans(),
    );
    expect(w.find(`.${P}`).classes()).toContain(`${P}-gap-row-medium`);
  });

  it("★ `components.space.size = 0` ⇒ `0 ?? 'small'` 取 `0` ⇒ 不产生 gap 类名", () => {
    const w = mountWithProvider({ components: { space: { size: 0 } } }, Space, {}, twoSpans());
    expect(
      w
        .find(`.${P}`)
        .classes()
        .filter((c) => c.startsWith(`${P}-gap-`)),
    ).toEqual([]);
  });

  it('`components.space.className` 落在根元素上（在 `-{orientation}` 之后）', () => {
    const w = mountWithProvider(
      { components: { space: { className: 'cfg-class' } } },
      Space,
      {},
      twoSpans(),
    );
    expect(w.find(`.${P}`).classes()).toContain('cfg-class');
  });

  it('`components.space.style` 与 prop 的 `style` 合并（prop 胜）', () => {
    const w = mountWithProvider(
      { components: { space: { style: { color: 'red', margin: '1px' } } } },
      Space,
      { style: { color: 'green' } },
      twoSpans(),
    );
    expect(styleOf(w, `.${P}`).color).toBe('green');
    expect(styleOf(w, `.${P}`).margin).toBe('1px');
  });

  it('`direction="rtl"` ⇒ 根元素多一个 `-rtl` 类名', () => {
    const w = mountWithProvider({ direction: 'rtl' }, Space, {}, twoSpans());
    expect(w.find(`.${P}`).classes()).toContain(`${P}-rtl`);
  });

  it('★ RTL 在挂载后切换也能传导（`useDirection()` 返回 `ComputedRef`，D27）', async () => {
    const w = mountWithProvider({ direction: 'ltr' }, Space, {}, twoSpans());
    expect(w.find(`.${P}`).classes()).not.toContain(`${P}-rtl`);
    await w.setProps({ providerProps: { direction: 'rtl' } });
    expect(w.find(`.${P}`).classes()).toContain(`${P}-rtl`);
  });
});

// ---------------------------------------------------------------------------
// L2 · 动态更新
// ---------------------------------------------------------------------------

describe('L2 · Space 动态更新', () => {
  it('★ 子节点增删后 `latestIndex` 跟着变（分隔符随之增减）', async () => {
    // 用真实的响应式插槽增删子节点 —— `setProps` 动不了插槽，所以这里必须包一层宿主组件。
    const count = ref(3);
    const host = mount(
      defineComponent({
        name: 'ADynamicChildrenHost',
        setup() {
          return () =>
            h(
              Space,
              { separator: '-' },
              {
                default: () =>
                  Array.from({ length: count.value }, (_, i) => h('span', { key: i }, String(i))),
              },
            );
        },
      }),
    );
    expect(host.findAll(`.${P}-item`)).toHaveLength(3);
    expect(host.findAll(`.${P}-item-separator`)).toHaveLength(2);

    count.value = 1;
    await nextTick();
    expect(host.findAll(`.${P}-item`)).toHaveLength(1);
    expect(host.findAll(`.${P}-item-separator`)).toHaveLength(0);

    count.value = 0;
    await nextTick();
    // 没有子节点 ⇒ 整个根元素消失
    expect(host.find(`.${P}`).exists()).toBe(false);
  });

  it('★ `size` 变化时 gap 类名与内联样式同步更新', async () => {
    const w = mountSpace({ size: 'small' }, twoSpans());
    expect(w.classes()).toContain(`${P}-gap-row-small`);
    await w.setProps({ size: 10 });
    expect(w.classes()).not.toContain(`${P}-gap-row-small`);
    expect(w.element.style.columnGap).toBe('10px');
    await w.setProps({ size: 0 });
    expect(w.attributes('style')).toBeUndefined();
  });

  it('★ `align` 从水平折成 center 到显式值再到垂直不产生类名', async () => {
    const w = mountSpace({}, twoSpans());
    expect(w.classes()).toContain(`${P}-align-center`);
    await w.setProps({ align: 'baseline' });
    expect(w.classes()).toContain(`${P}-align-baseline`);
    await w.setProps({ align: undefined, orientation: 'vertical' });
    expect(w.classes().filter((c) => c.startsWith(`${P}-align-`))).toEqual([]);
  });

  it('★ `separator` 从无到有再到 `undefined`（回落到 `split`）', async () => {
    const w = mountSpace({ split: '-' }, ['a', 'b']);
    expect(w.findAll(`.${P}-item-separator`)).toHaveLength(1);
    await w.setProps({ separator: '|' });
    expect(w.find(`.${P}-item-separator`).text()).toBe('|');
    await w.setProps({ separator: undefined });
    expect(w.find(`.${P}-item-separator`).text()).toBe('-');
  });
});

// ---------------------------------------------------------------------------
// 开发期告警
// ---------------------------------------------------------------------------

describe('Space · 开发期告警', () => {
  it('★ 传 `direction` 会告警，提示改用 `orientation`', async () => {
    const out = await capturedWarnings(() => mountSpace({ direction: 'vertical' }, twoSpans()));
    expect(out).toContain('[apollo: Space]');
    expect(out).toContain('`direction` is deprecated');
    expect(out).toContain('`orientation`');
  });

  it('不传 `direction` 时**不**告警（判据是 `!== undefined`，不是 `in`）', async () => {
    const out = await capturedWarnings(() => mountSpace({ orientation: 'vertical' }, twoSpans()));
    expect(out).not.toContain('`direction` is deprecated');
  });

  it('★ 传 `split` 会告警，提示改用 `#separator` 插槽', async () => {
    const out = await capturedWarnings(() => mountSpace({ split: '-' }, ['a', 'b']));
    expect(out).toContain('`split` is deprecated');
    expect(out).toContain('#separator slot');
  });

  it('不传 `split` 时**不**告警', async () => {
    const out = await capturedWarnings(() => mountSpace({ separator: '-' }, ['a', 'b']));
    expect(out).not.toContain('`split` is deprecated');
  });

  it('★ `Space.Compact` 的告警前缀是 `[apollo: Space.Compact]`（不是 `[apollo: Space]`）', async () => {
    const out = await capturedWarnings(() => mountCompact({ direction: 'vertical' }, twoSpans()));
    expect(out).toContain('[apollo: Space.Compact]');
    expect(out).toContain('`direction` is deprecated');
  });
});

// ---------------------------------------------------------------------------
// Space.Compact
// ---------------------------------------------------------------------------

describe('Space.Compact · 基本结构', () => {
  it('默认前缀是 `apollo-space-compact`（后缀是 `space-compact`，不是 `compact`）', () => {
    const w = mountCompact({}, twoSpans());
    expect(w.element.tagName).toBe('DIV');
    expect(w.classes()).toContain(PC);
  });

  it('★ 没有 children 时整个根元素都不渲染', () => {
    // 同 `Space`：`v-if` 留下的是注释节点，不是元素（L4 的投影看不见它）。
    const w = mountCompact();
    expect(w.find(`.${PC}`).exists()).toBe(false);
    expect(w.element.nodeType).toBe(Node.COMMENT_NODE);
    expect(w.findAll('div')).toHaveLength(0);
  });

  it('★ `toArray` **不带** `keepEmpty`：假值子节点被丢弃，也不影响 `isLastItem`', () => {
    const w = mountCompact({}, [h('i', { class: 'p0' }), false as unknown as VNodeChild]);
    expect(w.findAll('.p0')).toHaveLength(1);
    expect(w.element.children).toHaveLength(1);
  });

  it('`block` ⇒ `-block` 类名', () => {
    expect(mountCompact({ block: true }, twoSpans()).classes()).toContain(`${PC}-block`);
  });

  it('`orientation="vertical"` / `direction="vertical"` / `vertical` 都产生 `-vertical`', () => {
    expect(mountCompact({ orientation: 'vertical' }, twoSpans()).classes()).toContain(
      `${PC}-vertical`,
    );
    expect(mountCompact({ direction: 'vertical' }, twoSpans()).classes()).toContain(
      `${PC}-vertical`,
    );
    expect(mountCompact({ vertical: true }, twoSpans()).classes()).toContain(`${PC}-vertical`);
  });

  it('★★ 未传 `vertical` 不能被 Vue 转成 `false`（PITFALLS 46 / D21）', () => {
    expect(mountCompact({ direction: 'vertical' }, twoSpans()).classes()).toContain(
      `${PC}-vertical`,
    );
    expect(mountCompact({ vertical: false }, twoSpans()).classes()).not.toContain(`${PC}-vertical`);
  });

  it('`className` / `rootClassName` / `style` / attrs 都落在根元素上', () => {
    const w = mountCompact(
      { className: 'cc', rootClassName: 'cc-root', style: { color: 'red' }, id: 'my-compact' },
      twoSpans(),
    );
    expect(w.classes()).toContain('cc');
    expect(w.classes()).toContain('cc-root');
    expect(w.element.style.color).toBe('red');
    expect(w.attributes('id')).toBe('my-compact');
  });

  it('RTL ⇒ 根元素多一个 `-rtl` 类名', () => {
    const w = mountWithProvider({ direction: 'rtl' }, SpaceCompact, {}, twoSpans());
    expect(w.find(`.${PC}`).classes()).toContain(`${PC}-rtl`);
  });

  it('expose：`nativeElement` 指向根元素', () => {
    const w = mountCompact({}, twoSpans());
    expect(w.vm.nativeElement).toBe(w.element);
  });
});

describe('Space.Compact · 尺寸继承', () => {
  /** 用探针读出 Compact 广播出去的 `compactSize`。 */
  const SizeProbe = defineComponent({
    name: 'ACompactSizeProbe',
    setup() {
      const { compactSize, compactDirection, compactItemClassnames } = useCompactItemContext(
        'probe',
        'ltr',
      );
      return () =>
        h('i', {
          class: [
            'probe',
            `probe-size-${String(compactSize.value)}`,
            `probe-dir-${String(compactDirection.value)}`,
            compactItemClassnames.value,
          ],
        });
    },
  });

  const mountProbe = (props: Record<string, unknown> = {}) =>
    mount(SpaceCompact, { props, slots: { default: () => h(SizeProbe) } });

  it('`size` 经上下文广播给子项', () => {
    expect(mountProbe({ size: 'small' }).find('.probe').classes()).toContain('probe-size-small');
    expect(mountProbe({ size: 'large' }).find('.probe').classes()).toContain('probe-size-large');
  });

  it('★ 不传 `size` 时 `compactSize` 是 `undefined`（不是 `false`）', () => {
    expect(mountProbe().find('.probe').classes()).toContain('probe-size-undefined');
  });

  it('★ 继承 ConfigProvider 的 `componentSize`', () => {
    const w = mountWithProvider({ componentSize: 'large' }, SpaceCompact, {}, [h(SizeProbe)]);
    expect(w.find('.probe').classes()).toContain('probe-size-large');
  });

  it('★ Compact 自己的 `size` 压过 `componentSize`', () => {
    const w = mountWithProvider({ componentSize: 'large' }, SpaceCompact, { size: 'small' }, [
      h(SizeProbe),
    ]);
    expect(w.find('.probe').classes()).toContain('probe-size-small');
  });

  it('`compactDirection` 与 `vertical` 同步', () => {
    expect(mountProbe().find('.probe').classes()).toContain('probe-dir-horizontal');
    expect(mountProbe({ vertical: true }).find('.probe').classes()).toContain('probe-dir-vertical');
  });

  it('★ 单独挂载 `sizeContextKey` 时也生效（`useSize` 的直接落点）', () => {
    const w = mount(
      defineComponent({
        name: 'ASizeHost',
        setup() {
          provide(
            sizeContextKey,
            computed<SizeType | undefined>(() => 'small'),
          );
          return () => h(SpaceCompact, null, { default: () => h(SizeProbe) });
        },
      }),
    );
    expect(w.find('.probe').classes()).toContain('probe-size-small');
  });
});

describe('Space.Compact · 首项 / 末项 / 嵌套', () => {
  const ItemProbe = defineComponent({
    name: 'ACompactItemProbe',
    setup() {
      const { compactItemClassnames } = useCompactItemContext('probe', 'ltr');
      return () => h('i', { class: ['probe', compactItemClassnames.value] });
    },
  });

  const three = () => [
    h(ItemProbe, { key: 'a' }),
    h(ItemProbe, { key: 'b' }),
    h(ItemProbe, { key: 'c' }),
  ];

  it('三个子项：首项带 `-first-item`、末项带 `-last-item`、中间项都不带', () => {
    const w = mount(SpaceCompact, { slots: { default: () => three() } });
    const probes = w.findAll('.probe');
    expect(probes[0]?.classes()).toContain('probe-compact-first-item');
    expect(probes[0]?.classes()).not.toContain('probe-compact-last-item');
    expect(probes[1]?.classes()).not.toContain('probe-compact-first-item');
    expect(probes[1]?.classes()).not.toContain('probe-compact-last-item');
    expect(probes[2]?.classes()).toContain('probe-compact-last-item');
  });

  it('单个子项同时是首项与末项', () => {
    const w = mount(SpaceCompact, { slots: { default: () => h(ItemProbe) } });
    expect(w.find('.probe').classes()).toContain('probe-compact-first-item');
    expect(w.find('.probe').classes()).toContain('probe-compact-last-item');
  });

  it('垂直方向的类名分隔符是 `-vertical-`（不是 `-`）', () => {
    const w = mount(SpaceCompact, {
      props: { orientation: 'vertical' },
      slots: { default: () => three() },
    });
    const probes = w.findAll('.probe');
    expect(probes[0]?.classes()).toContain('probe-compact-vertical-first-item');
    expect(probes[2]?.classes()).toContain('probe-compact-vertical-last-item');
  });

  it('★ 嵌套：内层整体作为**第 2 个**子项时，内层的首项**不**带 `-first-item`', () => {
    const w = mount(SpaceCompact, {
      slots: {
        default: () => [
          h(ItemProbe, { key: 'p0' }),
          h(SpaceCompact, { key: 'inner' }, { default: () => three() }),
        ],
      },
    });
    const inner = w.find(`.${PC} .${PC}`);
    const innerProbes = inner.findAll('.probe');
    expect(innerProbes[0]?.classes()).not.toContain('probe-compact-first-item');
    expect(innerProbes[2]?.classes()).toContain('probe-compact-last-item');
  });

  it('★ 嵌套：内层整体作为**第 1 个**子项时，内层的首项**带** `-first-item`', () => {
    const w = mount(SpaceCompact, {
      slots: {
        default: () => [
          h(SpaceCompact, { key: 'inner' }, { default: () => three() }),
          h(ItemProbe, { key: 'p0' }),
        ],
      },
    });
    const inner = w.find(`.${PC} .${PC}`);
    expect(inner.findAll('.probe')[0]?.classes()).toContain('probe-compact-first-item');
    // 内层的末项在外层不是末项 ⇒ 不带 `-last-item`
    expect(inner.findAll('.probe')[2]?.classes()).not.toContain('probe-compact-last-item');
  });

  it('★ `NoCompactStyle` 把子树从上下文里隔离出去', () => {
    const w = mount(SpaceCompact, {
      slots: {
        default: () => [
          h(ItemProbe, { key: 'p0' }),
          h(NoCompactStyle, { key: 'n' }, { default: () => h(ItemProbe) }),
        ],
      },
    });
    const probes = w.findAll('.probe');
    expect(probes[0]?.classes()).toContain('probe-compact-item');
    // 被隔离的那一个：一个紧凑类名都没有
    expect(probes[1]?.classes()).toEqual(['probe']);
  });

  it('★ RTL 时下游类名末尾多一个 `-item-rtl`（与 Compact 根的 `-rtl` 是两回事）', () => {
    const RtlProbe = defineComponent({
      name: 'ARtlProbe',
      setup() {
        const { compactItemClassnames } = useCompactItemContext('probe', 'rtl');
        return () => h('i', { class: ['probe', compactItemClassnames.value] });
      },
    });
    const w = mount(SpaceCompact, { slots: { default: () => h(RtlProbe) } });
    expect(w.find('.probe').classes()).toContain('probe-compact-item-rtl');
  });
});

// ---------------------------------------------------------------------------
// useCompactItemContext（跨组件协议的直接单测）
// ---------------------------------------------------------------------------

describe('Space · useCompactItemContext 协议', () => {
  /** 探针把三个返回值都渲染成可断言的字符串。 */
  const ProtocolProbe = defineComponent({
    name: 'AProtocolProbe',
    props: { dir: { type: String, default: 'ltr' } },
    setup(props) {
      const { compactSize, compactDirection, compactItemClassnames } = useCompactItemContext(
        'probe',
        () => props.dir as 'ltr' | 'rtl',
      );
      return () =>
        h('i', {
          class: [
            `size-${String(compactSize.value)}`,
            `dir-${String(compactDirection.value)}`,
            compactItemClassnames.value,
          ],
        });
    },
  });

  it('★ 不在 Compact 里时：类名是**空串**，size / direction 是 `undefined`', () => {
    const w = mount(ProtocolProbe);
    expect(w.classes()).toContain('size-undefined');
    expect(w.classes()).toContain('dir-undefined');
    expect(w.classes()).not.toContain('probe-compact-item');
  });

  it('在 Compact 里：类名用**自己的**前缀拼（不是 Compact 的前缀）', () => {
    const w = mount(SpaceCompact, { slots: { default: () => h(ProtocolProbe) } });
    expect(w.find('.size-horizontal')).toBeTruthy();
    expect(w.find('.probe-compact-item').exists()).toBe(true);
    expect(w.find('.probe-compact-first-item').exists()).toBe(true);
    expect(w.find('.probe-compact-last-item').exists()).toBe(true);
  });

  it('★ 类名顺序：`item` → `first-item` → `last-item` → `item-rtl`（与 antd 的 clsx 逐字一致）', () => {
    const w = mount(SpaceCompact, {
      slots: { default: () => h(ProtocolProbe, { dir: 'rtl' }) },
    });
    const classes = w.find('.probe-compact-item').classes();
    expect(classes).toEqual([
      'size-undefined',
      'dir-horizontal',
      'probe-compact-item',
      'probe-compact-first-item',
      'probe-compact-last-item',
      'probe-compact-item-rtl',
    ]);
  });
});

// ---------------------------------------------------------------------------
// Space.Addon
// ---------------------------------------------------------------------------

describe('Space.Addon', () => {
  it('默认：`apollo-space-addon` + `-variant-outlined`', () => {
    const w = mountAddon();
    expect(w.element.tagName).toBe('DIV');
    expect(w.classes()).toContain(PA);
    expect(w.classes()).toContain(`${PA}-variant-outlined`);
    expect(w.text()).toBe('Addon');
  });

  it('`variant` 的四种取值都产生对应类名', () => {
    for (const variant of ['outlined', 'borderless', 'filled', 'underlined'] as const) {
      expect(mountAddon({ variant }).classes()).toContain(`${PA}-variant-${variant}`);
    }
  });

  it('`status` 的四种取值产生对应状态类名，空串不产生', () => {
    for (const status of ['success', 'warning', 'error', 'validating'] as const) {
      expect(mountAddon({ status }).classes()).toContain(`${PA}-status-${status}`);
    }
    expect(
      mountAddon({ status: '' })
        .classes()
        .filter((c) => c.startsWith(`${PA}-status-`)),
    ).toEqual([]);
  });

  it('`disabled` ⇒ `-disabled` 类名', () => {
    expect(mountAddon({ disabled: true }).classes()).toContain(`${PA}-disabled`);
  });

  it('`className` / `style` / attrs 都落在根元素上', () => {
    const w = mountAddon({ className: 'my-addon', style: { color: 'red' }, id: 'my-addon' });
    expect(w.classes()).toContain('my-addon');
    expect(w.element.style.color).toBe('red');
    expect(w.attributes('id')).toBe('my-addon');
  });

  it('★ 在 Compact 里：紧凑类名长在 **Addon 自己的前缀**上（`-space-addon-compact-*`）', () => {
    const w = mount(SpaceCompact, {
      slots: {
        default: () => [
          h(SpaceAddon, { key: 'a0' }, { default: () => 'A0' }),
          h(SpaceAddon, { key: 'a1' }, { default: () => 'A1' }),
        ],
      },
    });
    const addons = w.findAll(`.${PA}`);
    expect(addons[0]?.classes()).toContain(`${PA}-compact-item`);
    expect(addons[0]?.classes()).toContain(`${PA}-compact-first-item`);
    expect(addons[1]?.classes()).toContain(`${PA}-compact-last-item`);
    // ⚠️ 不是 Compact 的前缀
    expect(addons[0]?.classes()).not.toContain(`${PC}-compact-item`);
  });

  it('★ 在 Compact 里：`compactSize` 产生 `-{size}` 类名；不在 Compact 里则没有', () => {
    const w = mount(SpaceCompact, {
      props: { size: 'small' },
      slots: { default: () => h(SpaceAddon, { key: 'a0' }, { default: () => 'A0' }) },
    });
    expect(w.find(`.${PA}`).classes()).toContain(`${PA}-small`);
    expect(mountAddon().classes()).not.toContain(`${PA}-small`);
  });

  it('垂直 Compact ⇒ Addon 的紧凑类名用 `-vertical-` 分隔符', () => {
    const w = mount(SpaceCompact, {
      props: { orientation: 'vertical' },
      slots: { default: () => h(SpaceAddon, { key: 'a0' }, { default: () => 'A0' }) },
    });
    expect(w.find(`.${PA}`).classes()).toContain(`${PA}-compact-vertical-item`);
  });

  it('expose：`nativeElement` 指向根元素', () => {
    const w = mountAddon();
    expect(w.vm.nativeElement).toBe(w.element);
  });
});

// ---------------------------------------------------------------------------
// 叶子函数：useOrientation / getStatusClassNames / isValidOrientation
// ---------------------------------------------------------------------------

describe('Space · 叶子函数', () => {
  it('`isValidOrientation` 只认 horizontal / vertical', () => {
    expect(isValidOrientation('horizontal')).toBe(true);
    expect(isValidOrientation('vertical')).toBe(true);
    expect(isValidOrientation('left')).toBe(false);
    expect(isValidOrientation(undefined)).toBe(false);
    expect(isValidOrientation(null)).toBe(false);
    expect(isValidOrientation('')).toBe(false);
  });

  it('★ `useOrientation` 的三条优先级（在组件里直接求值）', () => {
    const read = (
      orientation?: 'horizontal' | 'vertical',
      vertical?: boolean,
      direction?: 'horizontal' | 'vertical',
    ) => {
      let pair: [string, boolean] | undefined;
      mount(
        defineComponent({
          name: 'AOrientationProbe',
          setup() {
            const result = useOrientation(
              () => orientation,
              () => vertical,
              () => direction,
            );
            pair = result.value;
            return () => null;
          },
        }),
      );
      return pair;
    };

    expect(read(undefined, undefined, undefined)).toEqual(['horizontal', false]);
    expect(read(undefined, undefined, 'vertical')).toEqual(['vertical', true]);
    // `vertical` 是布尔（哪怕 false）⇒ 压过 `direction`
    expect(read(undefined, false, 'vertical')).toEqual(['horizontal', false]);
    // 合法 `orientation` 压过 `vertical`
    expect(read('horizontal', true, 'vertical')).toEqual(['horizontal', false]);
    // 非法 `orientation` 被忽略，退回 `vertical`
    expect(read('diagonal' as never, true, undefined)).toEqual(['vertical', true]);
  });

  it('`getStatusClassNames` 的五个键与固定顺序', () => {
    // ⚠️ `InputStatus` 的取值集合是**五**个（含空串），不是两个 ——
    //    antd 的 `_InputStatuses = ['warning','error','','success','validating']`。
    //    这行 `InputStatus[]` 注解是它的可执行判据：少一个会红、多一个也会红。
    const allStatuses: InputStatus[] = ['', 'success', 'warning', 'error', 'validating'];
    expect(allStatuses).toHaveLength(5);

    expect(getStatusClassNames('x', 'success')).toBe('x-status-success');
    expect(getStatusClassNames('x', 'warning')).toBe('x-status-warning');
    expect(getStatusClassNames('x', 'error')).toBe('x-status-error');
    expect(getStatusClassNames('x', 'validating')).toBe('x-status-validating');
    // `''` 是**合法输入**（「显式传了一个空状态」），只是不产生任何类名。
    expect(getStatusClassNames('x', '')).toBe('');
    expect(getStatusClassNames('x')).toBe('');
    // ⚠️ 这里**不能**写 `undefined as InputStatus`：`InputStatus` 不含 `undefined`，
    //    那个强转会被 `vue-tsc` 判成 TS2352（两个类型没有重叠）。
    //    直接传 `undefined` 就是真实调用形态 —— 参数本身是可选（`status?`）。
    expect(getStatusClassNames('x', undefined)).toBe('');
  });

  it('`getStatusClassNames` 的 `hasFeedback` 追加在最后', () => {
    expect(getStatusClassNames('x', 'error', true)).toBe('x-status-error x-has-feedback');
    expect(getStatusClassNames('x', undefined, true)).toBe('x-has-feedback');
  });
});
