/**
 * L1 · 单元测试 + L2 的适用性说明
 *
 * ── 为什么没有 L2（交互）────────────────────────────────────────────────────
 *
 * Divider 是**纯展示组件**：没有事件、没有状态、没有受控/非受控语义、没有键盘交互、
 * 没有禁用态。`TESTING.md` 的 L2 要求覆盖「鼠标 / 键盘 / 焦点 / 受控 / 禁用」六类 ——
 * 这里一类都不适用。所以 L2 判 `n/a`（依据写进 `registry/components.json` 的
 * `layerNotes`），而不是「写几个 `expect(exists()).toBe(true)` 把格子填上」（反模式 A1）。
 *
 * ── 前缀约定（本文件所有断言的前提）──────────────────────────────────────────
 *
 * `prefixCls` 是**完整前缀**，不是后缀：`getPrefixCls('divider', 'apollo')` 直接返回
 * `'apollo'`，于是根类名是 `apollo`、子结构是 `apollo-rail`（**没有** `divider` 这一段）。
 * 所以本文件默认**不传** `prefixCls`，走兜底值 `apollo-divider` —— 这也是用户最常看到的形态。
 * 需要显式前缀的用例单独写在 `prefixCls 贯穿` 一节里。
 *
 * ── 本文件的三个重心 ─────────────────────────────────────────────────────────
 *
 * 1. **方向合并表**（`describe('方向合并')`）—— 逐条镜像 antd 自己的
 *    `components/divider/__tests__/index.test.tsx` 里的 `testCases` 表。
 *    它是上游对「orientation > vertical > type」这条优先级的**可执行规格**。
 *
 * 2. **`vertical` 未传 ≠ `false`** —— PITFALLS 第 46 条 / D21：Vue 的 Boolean prop
 *    转换会把未传的 `vertical` 变成 `false`，而 `useOrientation()` 的判据是
 *    `typeof vertical === 'boolean'`。少了 `withDefaults` 里的 `vertical: undefined`，
 *    `type="vertical"` 会**静默失效**。
 *
 * 3. **`orientationMargin` 的 px 补全**（PITFALLS 第 32 条）—— Vue 运行时的
 *    `setStyle` 不像 React 的 `dangerousStyleValue` 那样补单位，裸数字会被
 *    jsdom 与浏览器**静默丢弃**。这里用「内联样式真的出现了」把它钉住。
 *
 * ── 这个文件没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明与 antd 的 DOM 一致（那是 L4，见 `semantic.test.ts`）
 *   - 没证明像素一致（那是 L6，见 `tests/visual`）
 *   - 没证明 `size` 会读 ConfigProvider 的 `componentSize`（ConfigProvider 组件未落地，
 *     缺口登记在 `README.md` §7）
 */

import { mountTest, resetWarned } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { Divider } from '../index';
import type { Orientation, TitlePlacement } from '../interface';

/** 兜底前缀 —— 不传 `prefixCls` 时 `getPrefixCls('divider')` 的结果。 */
const P = 'apollo-divider';

const mountDivider = (props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) =>
  mount(Divider, {
    props,
    ...(slots ? { slots } : {}),
  });

const withText = (props: Record<string, unknown> = {}, text = 'Text') =>
  mountDivider(props, { default: () => text });

/** 带 ConfigProvider 上下文挂载（Vue 侧对应物是 `provide`）。 */
const mountWithConfig = (
  config: Partial<typeof DEFAULT_CONFIG_CONTEXT>,
  props: Record<string, unknown> = {},
  slots?: Record<string, () => unknown>,
) =>
  mount(Divider, {
    props,
    ...(slots ? { slots } : {}),
    global: {
      provide: {
        [configContextKey as unknown as string]: { ...DEFAULT_CONFIG_CONTEXT, ...config },
      },
    },
  });

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

mountTest('Divider', { render: () => h(Divider) });

describe('Divider · 基本结构', () => {
  it('默认渲染：根 div + role=separator + 方向类名 + 无 children 时根上带 -rail', () => {
    const w = mountDivider();
    expect(w.element.tagName).toBe('DIV');
    expect(w.attributes('role')).toBe('separator');
    expect(w.classes()).toContain(P);
    expect(w.classes()).toContain(`${P}-horizontal`);
    // `-rail` 类名只在**没有 children** 时落到根元素上（有 children 时落到两个 rail 子元素）。
    expect(w.classes()).toContain(`${P}-rail`);
    expect(w.find(`.${P}-inner-text`).exists()).toBe(false);
  });

  it('有 children：根上不再有 -rail，改为 start / end 两个 rail 子元素 + inner-text', () => {
    const w = withText();
    expect(w.classes()).not.toContain(`${P}-rail`);
    const rails = w.findAll(`.${P}-rail`);
    expect(rails).toHaveLength(2);
    expect(rails[0]?.classes()).toContain(`${P}-rail-start`);
    expect(rails[1]?.classes()).toContain(`${P}-rail-end`);
    expect(w.find(`.${P}-inner-text`).text()).toBe('Text');
  });

  it('★ 垂直模式下 children 整块不渲染（与 antd 的 `children && !mergedVertical` 一致）', () => {
    const w = withText({ orientation: 'vertical' });
    expect(w.find(`.${P}-inner-text`).exists()).toBe(false);
    expect(w.findAll(`.${P}-rail`)).toHaveLength(0);
  });

  it('不传 prefixCls 时兜底为 `apollo-divider`（与 antd 的 `ant-divider` 同构）', () => {
    const w = mount(Divider);
    expect(w.classes()).toContain('apollo-divider');
    expect(w.classes()).toContain('apollo-divider-rail');
  });

  it('显式 prefixCls 是**完整前缀**，贯穿根与全部子结构类名（T12）', () => {
    const w = withText({ prefixCls: 'my' });
    expect(w.classes()).toContain('my');
    expect(w.classes()).toContain('my-horizontal');
    expect(w.find('.my-rail-start').exists()).toBe(true);
    expect(w.find('.my-inner-text').exists()).toBe(true);
  });
});

/**
 * 方向合并表 —— **逐条镜像** antd `components/divider/__tests__/index.test.tsx`
 * 的 `testCases`。这是上游对优先级顺序的可执行规格，不是我们自己想出来的用例。
 *
 * 参数顺序与 antd 一致：`[orientation, vertical, type, titlePlacement, orientationMargin]`。
 */
describe('Divider · 方向合并（orientation > vertical > type）', () => {
  const cases: Array<
    [
      params: [
        Orientation | TitlePlacement | undefined,
        boolean | undefined,
        Orientation | undefined,
        TitlePlacement | undefined,
        number | undefined,
      ],
      expected: string,
    ]
  > = [
    [['right', undefined, undefined, undefined, undefined], `.${P}-with-text-end`],
    [['vertical', undefined, 'horizontal', undefined, undefined], `.${P}-vertical`],
    [[undefined, undefined, 'vertical', undefined, undefined], `.${P}-vertical`],
    [['center', undefined, undefined, 'left', undefined], `.${P}-with-text-start`],
    [['horizontal', true, undefined, undefined, undefined], `.${P}-horizontal`],
    [[undefined, true, 'horizontal', undefined, undefined], `.${P}-vertical`],
    [['center', undefined, 'horizontal', 'left', 20], `.${P}-with-text-start`],
  ];

  it.each(cases)('with args %j should have %s node', (params, expected) => {
    const w = withText({
      orientation: params[0],
      vertical: params[1],
      type: params[2],
      titlePlacement: params[3],
      ...(params[4] ? { orientationMargin: params[4] } : {}),
    });
    expect(w.find(expected).exists()).toBe(true);
    if (params[4]) {
      expect(w.find(`.${P}-inner-text`).attributes('style')).toContain(
        `margin-inline-start: ${params[4]}px`,
      );
    }
  });

  it('★ 不传 vertical 时它必须是 `undefined`（否则 `type` 静默失效 —— PITFALLS 46）', () => {
    // 这条用例与上面的表互为冗余的**独立**保护：表用 `type` 断言，这条直接断言
    // 「未传 ≠ false」这件事本身。若 `withDefaults` 里的 `vertical: undefined` 被删掉，
    // `type="vertical"` 会被判成 `vertical === false` ⇒ `horizontal`。
    const w = mountDivider({ type: 'vertical' });
    expect(w.classes()).toContain(`${P}-vertical`);
    expect(w.classes()).not.toContain(`${P}-horizontal`);
  });

  it('显式传 vertical=false 时**压过** type（判据是 `typeof === boolean`，不是真值）', () => {
    const w = mountDivider({ type: 'vertical', vertical: false });
    expect(w.classes()).toContain(`${P}-horizontal`);
  });

  it('三者都不传时兜底 horizontal', () => {
    expect(mountDivider().classes()).toContain(`${P}-horizontal`);
  });
});

describe('Divider · titlePlacement', () => {
  it('center / start / end 各自映射到 -with-text-{placement}', () => {
    expect(withText({ titlePlacement: 'center' }).classes()).toContain(`${P}-with-text-center`);
    expect(withText({ titlePlacement: 'start' }).classes()).toContain(`${P}-with-text-start`);
    expect(withText({ titlePlacement: 'end' }).classes()).toContain(`${P}-with-text-end`);
  });

  it('left / right 按文字方向折算：LTR 下 left→start、right→end', () => {
    expect(withText({ titlePlacement: 'left' }).classes()).toContain(`${P}-with-text-start`);
    expect(withText({ titlePlacement: 'right' }).classes()).toContain(`${P}-with-text-end`);
  });

  it('RTL 下互换：left→end、right→start', () => {
    expect(
      mountWithConfig(
        { direction: 'rtl' },
        { titlePlacement: 'left' },
        { default: () => 'T' },
      ).classes(),
    ).toContain(`${P}-with-text-end`);
    expect(
      mountWithConfig(
        { direction: 'rtl' },
        { titlePlacement: 'right' },
        { default: () => 'T' },
      ).classes(),
    ).toContain(`${P}-with-text-start`);
  });

  it('不传时兜底 center（且不从 orientation 借值）', () => {
    expect(withText().classes()).toContain(`${P}-with-text-center`);
  });

  it('`orientation` 取标题位置值时被当作**旧版标题位置**（titlePlacement 未传时）', () => {
    expect(withText({ orientation: 'start' }).classes()).toContain(`${P}-with-text-start`);
  });

  it('★ titlePlacement 优先于 orientation 的旧版语义', () => {
    const w = withText({ orientation: 'start', titlePlacement: 'end' });
    expect(w.classes()).toContain(`${P}-with-text-end`);
    expect(w.classes()).not.toContain(`${P}-with-text-start`);
  });

  it('无 children 时不加 -with-text-* 类名（哪怕传了 titlePlacement）', () => {
    expect(mountDivider({ titlePlacement: 'start' }).classes()).not.toContain(
      `${P}-with-text-start`,
    );
  });
});

/**
 * `orientationMargin` —— PITFALLS 第 32 条的正脸。
 *
 * ⚠️ 断言的是**内联样式真的出现了**，而不是「组件收到了这个 prop」。
 *    Vue 运行时的 `setStyle` 不做 px 补全，裸数字 `20` 会被 jsdom 与浏览器
 *    静默丢弃 —— DOM 结构全对，只有 margin 是空的。所以这里必须读 style 属性。
 */
describe('Divider · orientationMargin（px 补全）', () => {
  const styleOf = (props: Record<string, unknown>) =>
    withText(props).find(`.${P}-inner-text`).attributes('style') ?? '';

  it('数值：补 px，落在 margin-inline-start（titlePlacement=start）', () => {
    expect(styleOf({ titlePlacement: 'start', orientationMargin: 20 })).toContain(
      'margin-inline-start: 20px',
    );
  });

  it('数值：落在 margin-inline-end（titlePlacement=end）', () => {
    expect(styleOf({ titlePlacement: 'end', orientationMargin: 20 })).toContain(
      'margin-inline-end: 20px',
    );
  });

  it('纯数字字符串：按数字处理并补 px（与 antd 的 `/^\\d+$/` 分支一致）', () => {
    expect(styleOf({ titlePlacement: 'end', orientationMargin: '10' })).toContain(
      'margin-inline-end: 10px',
    );
  });

  it('带单位的字符串：原样输出，不重复补单位', () => {
    expect(styleOf({ titlePlacement: 'start', orientationMargin: '2em' })).toContain(
      'margin-inline-start: 2em',
    );
  });

  it('★ 数值 0 仍然产生声明（判据是 `!= null`，不是真值 —— 0 不能被判为「没传」）', () => {
    // 若把 `orientationMargin != null` 写成 `!!orientationMargin`，这条会红：
    // 0 是唯一能把「!= null」与「真值判断」区分开的输入。
    const style = styleOf({ titlePlacement: 'start', orientationMargin: 0 });
    expect(style).toContain('margin-inline-start');
  });

  it('titlePlacement=center 时**不**输出 margin（两个 hasMargin 都是 false）', () => {
    const style = styleOf({ titlePlacement: 'center', orientationMargin: 20 });
    expect(style).not.toContain('margin-inline-start');
    expect(style).not.toContain('margin-inline-end');
  });

  it('不传 orientationMargin 时不输出 margin', () => {
    const style = styleOf({ titlePlacement: 'start' });
    expect(style).not.toContain('margin-inline-start');
  });

  it('同时带 -no-default-orientation-margin-{start,end} 类名', () => {
    expect(withText({ titlePlacement: 'start', orientationMargin: 20 }).classes()).toContain(
      `${P}-no-default-orientation-margin-start`,
    );
    expect(withText({ titlePlacement: 'end', orientationMargin: 20 }).classes()).toContain(
      `${P}-no-default-orientation-margin-end`,
    );
  });
});

describe('Divider · dashed / variant / plain / size', () => {
  it('dashed 加 -dashed 类名', () => {
    expect(mountDivider({ dashed: true }).classes()).toContain(`${P}-dashed`);
  });

  it('variant 非 solid 时加 `-{variant}` 类名', () => {
    expect(mountDivider({ variant: 'dashed' }).classes()).toContain(`${P}-dashed`);
    expect(mountDivider({ variant: 'dotted' }).classes()).toContain(`${P}-dotted`);
  });

  it('variant 默认 solid：不加类名（`-solid` 会污染 DOM）', () => {
    expect(mountDivider().classes()).not.toContain(`${P}-solid`);
  });

  it('★ `dashed` 与 `variant="dashed"` 同时给只产生**一个**类名', () => {
    // antd 用 `clsx(对象)`，同名字段天然去重；我们靠「两个计算键落在同一个对象字面量里」
    // 得到同样效果。这条用例把那个巧合钉成契约 —— 否则数组拼接会输出两次类名。
    const classes = mountDivider({ dashed: true, variant: 'dashed' }).classes();
    expect(classes.filter((c) => c === `${P}-dashed`)).toHaveLength(1);
  });

  it('plain 加 -plain 类名', () => {
    expect(withText({ plain: true }).classes()).toContain(`${P}-plain`);
  });

  it('size：small→-sm、medium/middle→-md、large 无额外类名', () => {
    expect(mountDivider({ size: 'small' }).classes()).toContain(`${P}-sm`);
    expect(mountDivider({ size: 'medium' }).classes()).toContain(`${P}-md`);
    // `middle` 是 antd 已废弃的写法，与 `medium` 落到同一个类名。
    expect(mountDivider({ size: 'middle' }).classes()).toContain(`${P}-md`);
    const large = mountDivider({ size: 'large' }).classes();
    expect(large).not.toContain(`${P}-md`);
    expect(large).not.toContain(`${P}-sm`);
  });
});

describe('Divider · class / style / 属性透传', () => {
  it('className 与 rootClassName 都落在根元素', () => {
    const w = mountDivider({ className: 'a', rootClassName: 'b' });
    expect(w.classes()).toContain('a');
    expect(w.classes()).toContain('b');
  });

  it('未声明的属性透传到根元素，且 `role` 恒为 separator（用户传的 role 会被覆盖）', () => {
    const w = mountDivider({ 'data-testid': 'x', id: 'my-divider' });
    expect(w.attributes('data-testid')).toBe('x');
    expect(w.attributes('id')).toBe('my-divider');
    // antd 的 `{...restProps}` 在 `role="separator"` 之前 ⇒ 用户的 role 被覆盖。
    expect(mountDivider({ role: 'presentation' }).attributes('role')).toBe('separator');
  });

  it('★ `style` 覆盖 `styles.root`（合并顺序里最反直觉的一条）', () => {
    const w = withText({ style: { color: 'green' }, styles: { root: { color: 'red' } } });
    const style = w.attributes('style') ?? '';
    expect(style).toContain('color: green');
    expect(style).not.toContain('red');
  });

  it('★ 无 children 时根元素额外吃到 `styles.rail`（有 children 时不吃）', () => {
    const withoutText = mountDivider({ styles: { rail: { margin: '4px' } } });
    expect(withoutText.attributes('style') ?? '').toContain('margin: 4px');

    const withTextEl = withText({ styles: { rail: { margin: '4px' } } });
    expect(withTextEl.attributes('style')).toBeUndefined();
    // 有 children 时它落在两个 rail 子元素上
    expect(withTextEl.find(`.${P}-rail-start`).attributes('style') ?? '').toContain('margin: 4px');
  });

  it('★ 没有任何样式时**不输出** `style` 属性（antd 也不输出）', () => {
    // 这条差异 L4 **测不出来**：投影会把「没有 style 属性」与 `style=""` 都归一化成空串。
    // 反例：直接绑 `:style="mergedStyles.root"`（恒是对象）会输出 `style=""`。
    const w = withText();
    expect(w.attributes('style')).toBeUndefined();
    expect(w.find(`.${P}-rail-start`).attributes('style')).toBeUndefined();
    expect(w.find(`.${P}-inner-text`).attributes('style')).toBeUndefined();
  });
});

describe('Divider · 语义化 classNames / styles', () => {
  it('对象式：root / rail / content 三个槽位各自落位', () => {
    const w = withText({
      classNames: { root: 'cn-root', rail: 'cn-rail', content: 'cn-content' },
      styles: {
        root: { color: 'rgb(255, 0, 0)' },
        rail: { color: 'rgb(0, 0, 255)' },
        content: { color: 'rgb(0, 255, 0)' },
      },
    });
    expect(w.classes()).toContain('cn-root');
    expect(w.attributes('style') ?? '').toContain('color: rgb(255, 0, 0)');
    expect(w.find(`.${P}-rail-start`).classes()).toContain('cn-rail');
    expect(w.find(`.${P}-rail-start`).attributes('style') ?? '').toContain('color: rgb(0, 0, 255)');
    expect(w.find(`.${P}-inner-text`).classes()).toContain('cn-content');
    expect(w.find(`.${P}-inner-text`).attributes('style') ?? '').toContain('color: rgb(0, 255, 0)');
  });

  it('★ rail 槽位在无 children 时落到**根元素**（不是子元素 —— 上游行为）', () => {
    const w = mountDivider({ classNames: { root: 'cn-root', rail: 'cn-rail' } });
    expect(w.classes()).toContain('cn-rail');
    expect(w.classes()).toContain('cn-root');
  });

  it('★ 函数式：被调用且收到**合并后**的 `{ props }`', () => {
    const classNames = vi.fn(
      (info: { props: { titlePlacement?: string; orientation?: string } }) => ({
        root: `fn-${String(info.props.titlePlacement)}-${String(info.props.orientation)}`,
      }),
    );
    const w = withText({ classNames, titlePlacement: 'left' });
    expect(classNames).toHaveBeenCalled();
    // `left` 已被折成 `start`、`orientation` 已被合并成 `horizontal` —— 证明拿到的是
    // `mergedProps` 而不是原始 props（原始值是 `left` / `undefined`）。
    expect(w.classes()).toContain('fn-start-horizontal');
    expect(Object.keys(classNames.mock.calls[0]?.[0] ?? {})).toEqual(['props']);
  });

  it('★ 函数式 styles 收到的是实时值：props 更新后重算（antd 每次渲染都重建 mergedProps）', async () => {
    const styles = vi.fn((info: { props: { size?: string } }) => ({
      root: { opacity: info.props.size === 'small' ? '0.5' : '1' },
    }));
    const w = withText({ styles, size: 'small' });
    expect(w.attributes('style') ?? '').toContain('opacity: 0.5');

    await w.setProps({ size: 'large' });
    expect(w.attributes('style') ?? '').toContain('opacity: 1');
  });

  it('classNames 是**拼接**而非覆盖（与 styles 的语义不同）', () => {
    const w = mountDivider({ className: 'user-class', classNames: { root: 'semantic-class' } });
    expect(w.classes()).toContain('user-class');
    expect(w.classes()).toContain('semantic-class');
  });
});

describe('Divider · ConfigProvider', () => {
  it('context 的 className 落在根元素', () => {
    const w = mountWithConfig(
      { components: { divider: { className: 'cfg-class' } } },
      {},
      {
        default: () => 'T',
      },
    );
    expect(w.classes()).toContain('cfg-class');
  });

  it('context 的 classNames.root 落在根元素', () => {
    const w = mountWithConfig(
      { components: { divider: { classNames: { root: 'cfg-root' } } } },
      {},
      { default: () => 'T' },
    );
    expect(w.classes()).toContain('cfg-root');
  });

  it('context 的 style 与 styles.root 都进根样式，且被 `styles` prop 覆盖', () => {
    const w = mountWithConfig(
      {
        components: {
          divider: {
            style: { color: 'rgb(1, 1, 1)' },
            styles: { root: { color: 'rgb(2, 2, 2)' } },
          },
        },
      },
      { styles: { root: { color: 'rgb(3, 3, 3)' } } },
      { default: () => 'T' },
    );
    const style = w.attributes('style') ?? '';
    expect(style).toContain('color: rgb(3, 3, 3)');
    expect(style).not.toContain('rgb(2, 2, 2)');
    expect(style).not.toContain('rgb(1, 1, 1)');
  });

  it('direction=rtl 时根元素加 -rtl', () => {
    expect(mountWithConfig({ direction: 'rtl' }, {}, { default: () => 'T' }).classes()).toContain(
      `${P}-rtl`,
    );
  });

  it('无 context 时不加 -rtl', () => {
    expect(withText().classes()).not.toContain(`${P}-rtl`);
  });
});

describe('Divider · 开发期告警', () => {
  it('垂直模式下带 children → 告警（且 children 不渲染）', async () => {
    const out = await capturedWarnings(() => withText({ orientation: 'vertical' }));
    expect(out).toContain('`children` not working in `vertical` mode.');
  });

  it('垂直模式但**没有** children → 不告警', async () => {
    const out = await capturedWarnings(() => mountDivider({ orientation: 'vertical' }));
    expect(out).not.toContain('not working in `vertical` mode');
  });

  it('`orientation` 取标题位置值（旧 API）→ 告警', async () => {
    const out = await capturedWarnings(() => withText({ orientation: 'left' }));
    expect(out).toContain('`orientation` is used for direction');
  });

  it('`orientation` 取方向值 / 不传 → 不告警', async () => {
    expect(await capturedWarnings(() => withText({ orientation: 'vertical' }))).not.toContain(
      '`orientation` is used for direction',
    );
    expect(await capturedWarnings(() => withText())).not.toContain(
      '`orientation` is used for direction',
    );
  });

  it('传 `type` → deprecated 告警；不传 → 不告警', async () => {
    expect(await capturedWarnings(() => mountDivider({ type: 'vertical' }))).toContain(
      '`type` is deprecated. Please use `orientation` instead.',
    );
    expect(await capturedWarnings(() => mountDivider())).not.toContain('`type` is deprecated');
  });

  it('传 `orientationMargin` → deprecated 告警；不传 → 不告警', async () => {
    expect(
      await capturedWarnings(() => withText({ titlePlacement: 'start', orientationMargin: 20 })),
    ).toContain('`orientationMargin` is deprecated. Please use `styles.content.margin` instead.');
    expect(await capturedWarnings(() => withText())).not.toContain(
      '`orientationMargin` is deprecated',
    );
  });

  it('★ 告警在**每次渲染**求值：挂载后更新成非法用法也会告警', async () => {
    // antd 把告警写在渲染体里。若我们只在 setup 期求值一次（早先的写法），
    // 「挂载时合法、之后更新成非法」会永远静默 —— 这条用例就是那个差异的回归防护。
    const w = mountDivider();
    const out = await capturedWarnings(async () => {
      await w.setProps({ type: 'vertical' });
    });
    expect(out).toContain('`type` is deprecated');
  });

  it('告警带 `[apollo: Divider]` 前缀', async () => {
    const out = await capturedWarnings(() => mountDivider({ type: 'vertical' }));
    expect(out).toContain('[apollo: Divider]');
  });
});

describe('Divider · expose', () => {
  it('nativeElement 指向根 div', () => {
    const w = mountDivider();
    const exposed = w.vm as unknown as { nativeElement: HTMLDivElement | null };
    expect(exposed.nativeElement).toBe(w.element);
  });
});
