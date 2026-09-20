/**
 * L1 · 单元测试 + L2 · 交互测试
 *
 * ── 本文件的五个重心 ─────────────────────────────────────────────────────────
 *
 * 1. **装饰的嵌套顺序**（`strong → u → del → code → mark → kbd → i`）。看起来「反了也一样」，
 *    但 DOM 契约会红 —— 而且它决定了 `mark` 里的 `code` 到底有没有底色。
 * 2. **`-link` 的判据是 `component === 'a'`**，不是「有没有 `type`」。
 *    所以 `<Link type="danger">` 同时有 `-danger` 与 `-link`；而 `<Text component="a">`
 *    仍然是 `span`（Text 显式覆盖 `component`）⇒ **没有** `-link`。
 * 3. **三个子组件的「显式覆盖」语义**：`Text` 覆盖成 `span`、`Paragraph` 覆盖成 `div`、
 *    `Link` 覆盖成 `a`，且 `Title` 的非法 `level` 退回 `h1`。
 * 4. **`editable` 的按键门槛**：`trim()`、IME 组合中不提交、带修饰键的 Enter 不提交。
 *    这三条任意一条错了都会让中文用户或 `Ctrl+Enter` 用户误提交。
 * 5. **`ellipsis` 的两种路径**：CSS 路径（`rows` + 无附加要求）与 JS 二分裁剪路径
 *    （`suffix` / `expandable` / `onEllipsis` / `copyable` / `editable` 之一）。
 *    jsdom 没有布局引擎，JS 路径通过**打桩 `clientHeight` / `scrollHeight`** 驱动 ——
 *    见 `installLayoutMock` 的说明。**真实排版结果不在本文件证明**，由 L6 覆盖。
 *
 * ── 这个文件没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明与 antd 的 DOM 结构一致（那是 L4，见 `semantic.test.ts`）
 *   - 没证明像素一致（那是 L6，见 `tests/visual`）
 *   - 没证明 `ellipsis` 的真实排版结果（jsdom 无布局，见上）
 *   - 没证明 Tooltip 的悬浮气泡（Tooltip 未落地，缺口登记在 README §7）
 */

import { flushAll, mountTest, resetWarned } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';

import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { Link, Paragraph, Text, Title, Typography } from '../index';

/** 兜底前缀 —— 不传 `prefixCls` 时 `getPrefixCls('typography')` 的结果。 */
const P = 'apollo-typography';

/** 长文本：长度远大于打桩布局下的「一行 10 个字符」，保证一定溢出。 */
const LONG_TEXT =
  'Ant Design, a design language for background applications, is refined by Ant UED Team.';

/** 省略号文案。与 `Base` 里的 `ELLIPSIS_STR` 一致（上游也是写死的 `'...'`）。 */
const ELLIPSIS_STR = '...';

const mountText = (props: Record<string, unknown> = {}, text: unknown = 'Text') =>
  mount(Text, { props, slots: { default: () => text as never } });

/**
 * `Paragraph` 版。
 *
 * ⚠️ 多行（`rows > 1`）与 `expandable` 的用例**必须**用 `Paragraph`：
 *    `Text` 会把 `expandable` / `rows` **剥掉并告警**（行内文本没有多行概念，见 `Text.vue`），
 *    拿 `Text` 测这两件事只会测到「被剥掉」这个行为本身。
 */
const mountParagraph = (props: Record<string, unknown> = {}, text: unknown = 'Text') =>
  mount(Paragraph, { props, slots: { default: () => text as never } });

const mountWithConfig = (
  config: Partial<typeof DEFAULT_CONFIG_CONTEXT>,
  component: typeof Text,
  props: Record<string, unknown> = {},
  slots?: Record<string, () => unknown>,
) =>
  mount(component, {
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

// ===========================================================================
// 共享契约
// ===========================================================================

mountTest('Typography', { render: () => h(Typography, null, () => 'text') });
mountTest('Typography.Text', { render: () => h(Text, null, () => 'text') });
mountTest('Typography.Title', { render: () => h(Title, null, () => 'title') });
mountTest('Typography.Paragraph', { render: () => h(Paragraph, null, () => 'para') });
mountTest('Typography.Link', { render: () => h(Link, { href: '#' }, () => 'link') });

// ===========================================================================
// Typography 本体
// ===========================================================================

describe('Typography · 本体', () => {
  it('默认渲染 `<article>`，类名是 apollo-typography', () => {
    const w = mount(Typography, { slots: { default: () => 'hi' } });
    expect(w.element.tagName).toBe('ARTICLE');
    expect(w.classes()).toEqual([P]);
    expect(w.text()).toBe('hi');
  });

  it('`component` 覆盖标签（antd 的默认值是 article）', () => {
    const w = mount(Typography, { props: { component: 'section' }, slots: { default: () => 'x' } });
    expect(w.element.tagName).toBe('SECTION');
  });

  it('★ 本体**不支持**装饰/语义色 —— 传了也不会有类名（antd 的形状）', () => {
    // `TypographyProps` 就是 `BaseTypographyProps`，没有 `type` / `strong` / `ellipsis`。
    // 传了它们只会作为未知属性落到根元素上，**不会**产生类名。这不是我们漏了。
    const w = mount(Typography, {
      props: { type: 'danger', ellipsis: true, strong: true },
      slots: { default: () => 'x' },
    });
    expect(w.classes()).toEqual([P]);
    expect(w.classes()).not.toContain(`${P}-danger`);
    expect(w.classes()).not.toContain(`${P}-ellipsis`);
  });

  it('`className` 与 `rootClassName` 都落在根元素，且顺序是 className 在前', () => {
    const w = mount(Typography, {
      props: { className: 'a', rootClassName: 'b' },
      slots: { default: () => 'x' },
    });
    expect(w.classes()).toEqual([P, 'a', 'b']);
  });

  it('`style` 覆盖 `styles.root`（合并顺序里最反直觉的一条）', () => {
    const w = mount(Typography, {
      props: { style: { color: 'green' }, styles: { root: { color: 'red' } } },
      slots: { default: () => 'x' },
    });
    const style = w.attributes('style') ?? '';
    expect(style).toContain('color: green');
    expect(style).not.toContain('red');
  });

  it('★ 没有任何样式时**不输出** `style` 属性（antd 也不输出）', () => {
    const w = mount(Typography, { slots: { default: () => 'x' } });
    expect(w.attributes('style')).toBeUndefined();
  });

  it('未声明的属性透传到根元素', () => {
    const w = mount(Typography, {
      props: { 'data-testid': 'x', id: 'my-typo' },
      slots: { default: () => 'x' },
    });
    expect(w.attributes('data-testid')).toBe('x');
    expect(w.attributes('id')).toBe('my-typo');
  });

  it('暴露 `nativeElement` 指向根元素', () => {
    const w = mount(Typography, { slots: { default: () => 'x' } });
    const exposed = w.vm as unknown as { nativeElement: HTMLElement | null };
    expect(exposed.nativeElement).toBe(w.element);
  });

  it('★ 四个子组件也暴露 `nativeElement`（antd 的 forwardRef 等价物）', () => {
    // 少了它，`<Text ref="x">` 拿不到任何东西 —— 那是契约缺失。
    // 实测踩过：`Typography` 曾把「子组件的暴露对象」当成元素暴露出去（类型在撒谎）。
    const cases: Array<[typeof Text, Record<string, unknown>]> = [
      [Text, {}],
      [Title, {}],
      [Paragraph, {}],
      [Link, { href: '#x' }],
    ];
    for (const [component, props] of cases) {
      const w = mount(component, { props, slots: { default: () => 'x' } });
      const exposed = w.vm as unknown as { nativeElement: HTMLElement | null };
      expect(exposed.nativeElement, component.name).toBe(w.element);
    }
  });

  it('静态子组件与具名导出指向**同一个对象**（否则 withInstall 会注册两份）', () => {
    expect(Typography.Text).toBe(Text);
    expect(Typography.Title).toBe(Title);
    expect(Typography.Paragraph).toBe(Paragraph);
    expect(Typography.Link).toBe(Link);
  });

  it('复合写法 `<Typography.Text>` 渲染同一棵 DOM', () => {
    const composite = mount(Typography.Text as typeof Text, { slots: { default: () => 'x' } });
    const named = mount(Text, { slots: { default: () => 'x' } });
    expect(composite.html()).toBe(named.html());
  });
});

// ===========================================================================
// Text
// ===========================================================================

describe('Text · 标签与类名', () => {
  it('渲染 `<span>`，根类名只有 apollo-typography', () => {
    const w = mountText();
    expect(w.element.tagName).toBe('SPAN');
    expect(w.classes()).toEqual([P]);
  });

  it('★ `component` 被显式覆盖成 `span` —— 传 `component="a"` 也不会变成链接', () => {
    const w = mountText({ component: 'a' });
    expect(w.element.tagName).toBe('SPAN');
    // `-link` 的判据是 `component === 'a'`，而 Base 收到的永远是 `span`
    expect(w.classes()).not.toContain(`${P}-link`);
  });

  it('`type` 映射到 `-{type}` 类名（四个语义色）', () => {
    for (const type of ['secondary', 'success', 'warning', 'danger'] as const) {
      expect(mountText({ type }).classes(), type).toContain(`${P}-${type}`);
    }
  });

  it('`disabled` 加 `-disabled`', () => {
    expect(mountText({ disabled: true }).classes()).toContain(`${P}-disabled`);
  });

  it('★ 未传 `disabled` 时不能出现 `-disabled`（Boolean prop 转换的落点 —— PITFALLS 46）', () => {
    expect(mountText().classes()).not.toContain(`${P}-disabled`);
  });
});

describe('Text · 装饰嵌套顺序', () => {
  it('★ 七个开关全开时的嵌套顺序是 strong→u→del→code→mark→kbd→i', () => {
    const w = mountText({
      strong: true,
      underline: true,
      delete: true,
      code: true,
      mark: true,
      keyboard: true,
      italic: true,
    });
    expect(w.html()).toBe(
      `<span class="${P}"><i><kbd><mark><code><del><u><strong>Text</strong></u></del></code></mark></kbd></i></span>`,
    );
  });

  it('单个开关只包一层', () => {
    expect(mountText({ mark: true }).html()).toBe(`<span class="${P}"><mark>Text</mark></span>`);
    expect(mountText({ code: true }).html()).toBe(`<span class="${P}"><code>Text</code></span>`);
  });

  it('★ 顺序反了会红：`mark` 必须在 `code` **外面**', () => {
    const html = mountText({ mark: true, code: true }).html();
    expect(html.indexOf('<mark>')).toBeLessThan(html.indexOf('<code>'));
  });

  it('不传任何开关时**不产生**包裹元素', () => {
    expect(mountText().html()).toBe(`<span class="${P}">Text</span>`);
  });

  it('装饰与语义色共存：类名在根、标签在内部', () => {
    const w = mountText({ type: 'danger', strong: true });
    expect(w.classes()).toContain(`${P}-danger`);
    expect(w.html()).toBe(`<span class="${P} ${P}-danger"><strong>Text</strong></span>`);
  });
});

// ===========================================================================
// Title
// ===========================================================================

describe('Title · level', () => {
  it('level 1~5 映射到 h1~h5', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      const w = mount(Title, { props: { level }, slots: { default: () => 'H' } });
      expect(w.element.tagName, `level ${level}`).toBe(`H${level}`);
    }
  });

  it('★ 不传 level 时默认是 `1`（不是 `undefined`）', () => {
    const w = mount(Title, { slots: { default: () => 'H' } });
    expect(w.element.tagName).toBe('H1');
  });

  it('★ 非法 level 退回 `h1`（而不是渲染 h6）', () => {
    const w = mount(Title, { props: { level: 6 }, slots: { default: () => 'H' } });
    expect(w.element.tagName).toBe('H1');
  });

  it('非法 level 会告警，合法 level 不告警', async () => {
    expect(
      await capturedWarnings(() =>
        mount(Title, { props: { level: 6 }, slots: { default: () => 'H' } }),
      ),
    ).toContain('Title only accept `1 | 2 | 3 | 4 | 5` as `level` value');
    expect(
      await capturedWarnings(() =>
        mount(Title, { props: { level: 5 }, slots: { default: () => 'H' } }),
      ),
    ).not.toContain('Title only accept');
  });

  it('告警带 `[apollo: Typography.Title]` 前缀', async () => {
    const out = await capturedWarnings(() =>
      mount(Title, { props: { level: 9 }, slots: { default: () => 'H' } }),
    );
    expect(out).toContain('[apollo: Typography.Title]');
  });

  it('`level` 变化后标签跟着变（响应式）', async () => {
    const w = mount(Title, { props: { level: 1 }, slots: { default: () => 'H' } });
    await w.setProps({ level: 3 });
    expect(w.element.tagName).toBe('H3');
  });

  it('`strong` 不在 TitleProps 里，但运行时仍会透传（上游形状）', () => {
    // `strong` 走 `$attrs` → Base → wrapperDecorations 仍然包一层 `<strong>`。
    // 这不是漏洞：antd 的 `{...restProps}` 也如此。
    const w = mount(Title, { props: { level: 2, strong: true }, slots: { default: () => 'H' } });
    expect(w.html()).toContain('<strong>');
  });
});

// ===========================================================================
// Paragraph
// ===========================================================================

describe('Paragraph', () => {
  it('渲染 `<div>`（antd 5.0 起 Paragraph 的标签是 div，不是 p）', () => {
    const w = mount(Paragraph, { slots: { default: () => 'P' } });
    expect(w.element.tagName).toBe('DIV');
    expect(w.classes()).toEqual([P]);
  });

  it('`component` 被显式覆盖成 `div`', () => {
    const w = mount(Paragraph, { props: { component: 'p' }, slots: { default: () => 'P' } });
    expect(w.element.tagName).toBe('DIV');
  });
});

// ===========================================================================
// Link
// ===========================================================================

describe('Link · rel 兜底与属性', () => {
  it('渲染 `<a>` 且带 `-link` 类名', () => {
    const w = mount(Link, { props: { href: '#x' }, slots: { default: () => 'L' } });
    expect(w.element.tagName).toBe('A');
    expect(w.classes()).toContain(`${P}-link`);
  });

  it('★ `target="_blank"` 且未传 `rel` 时补 `noopener noreferrer`', () => {
    const w = mount(Link, {
      props: { href: '#x', target: '_blank' },
      slots: { default: () => 'L' },
    });
    expect(w.attributes('rel')).toBe('noopener noreferrer');
  });

  it('★ 显式传 `rel=""` 时**不**补（判据是 `=== undefined`，不是真值）', () => {
    const w = mount(Link, {
      props: { href: '#x', target: '_blank', rel: '' },
      slots: { default: () => 'L' },
    });
    expect(w.attributes('rel')).toBe('');
  });

  it('`target` 不是 `_blank` 时不补 `rel`', () => {
    const w = mount(Link, {
      props: { href: '#x', target: '_self' },
      slots: { default: () => 'L' },
    });
    expect(w.attributes('rel')).toBeUndefined();
  });

  it('★ `navigate` 被剥掉（react-router 复制粘贴的常见残留）', () => {
    const w = mount(Link, {
      props: { href: '#x', navigate: '/foo' },
      slots: { default: () => 'L' },
    });
    expect(w.attributes('navigate')).toBeUndefined();
  });

  it('★ `Link` + `type="danger"` 同时有 `-danger` 与 `-link`', () => {
    const w = mount(Link, { props: { type: 'danger' }, slots: { default: () => 'L' } });
    expect(w.classes()).toContain(`${P}-danger`);
    expect(w.classes()).toContain(`${P}-link`);
  });

  it('`ellipsis` 传对象时告警，且仍然按 `!!ellipsis` 处理（启用省略号）', async () => {
    const out = await capturedWarnings(() =>
      mount(Link, { props: { ellipsis: {} }, slots: { default: () => 'L' } }),
    );
    expect(out).toContain('`ellipsis` only supports boolean value.');
    // `{}` 为真 ⇒ 启用省略号 ⇒ 根上有 `-ellipsis`
    expect(
      mount(Link, { props: { ellipsis: {} }, slots: { default: () => 'L' } }).classes(),
    ).toContain(`${P}-ellipsis`);
  });

  it('`ellipsis` 不传时不告警、也不加 `-ellipsis`', async () => {
    expect(
      await capturedWarnings(() => mount(Link, { slots: { default: () => 'L' } })),
    ).not.toContain('only supports boolean value');
    expect(mount(Link, { slots: { default: () => 'L' } }).classes()).not.toContain(`${P}-ellipsis`);
  });
});

// ===========================================================================
// copyable
// ===========================================================================

describe('Typography · copyable', () => {
  it('渲染操作区 + 一个复制按钮，带 `-copy` 类名与 `aria-label`', () => {
    const w = mountText({ copyable: true }, 'copy me');
    const actions = w.find(`.${P}-actions`);
    expect(actions.exists()).toBe(true);
    const button = actions.find(`.${P}-copy`);
    expect(button.exists()).toBe(true);
    expect(button.attributes('aria-label')).toBe('Copy');
    expect(button.attributes('type')).toBe('button');
  });

  it('★ 有内容时不加 `-copy-icon-only`；无内容时加', () => {
    expect(mountText({ copyable: true }, 'x').find(`.${P}-copy`).classes()).not.toContain(
      `${P}-copy-icon-only`,
    );
    expect(
      mount(Text, { props: { copyable: true } })
        .find(`.${P}-copy`)
        .classes(),
    ).toContain(`${P}-copy-icon-only`);
  });

  it('★ 点击后进入「已复制」态，3 秒后自动复原', async () => {
    vi.useFakeTimers();
    try {
      const w = mountText({ copyable: true }, 'copy me');
      await w.find(`.${P}-copy`).trigger('click');
      await flushAll();

      expect(w.find(`.${P}-copy`).classes()).toContain(`${P}-copy-success`);
      expect(w.find(`.${P}-copy`).attributes('aria-label')).toBe('Copied');

      // 3 秒后复原（`useDelayState(false, { ms: 3000 })`）
      vi.advanceTimersByTime(3000);
      await flushAll();
      expect(w.find(`.${P}-copy`).classes()).not.toContain(`${P}-copy-success`);
      expect(w.find(`.${P}-copy`).attributes('aria-label')).toBe('Copy');
    } finally {
      vi.useRealTimers();
    }
  });

  it('★ 点击会阻止冒泡 —— `triggerType: ["text"]` 下不会顺带进入编辑态', async () => {
    const w = mountText({ copyable: true, editable: { triggerType: ['text'] } }, 'copy me');
    await w.find(`.${P}-copy`).trigger('click');
    await flushAll();
    expect(w.find('textarea').exists()).toBe(false);
  });

  it('`copyable.onCopy` 被调用', async () => {
    const onCopy = vi.fn();
    const w = mountText({ copyable: { onCopy } }, 'x');
    await w.find(`.${P}-copy`).trigger('click');
    await flushAll();
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('`tooltips` 给字符串时它成为 `aria-label`', () => {
    const w = mountText({ copyable: { tooltips: 'Click to copy' } }, 'x');
    expect(w.find(`.${P}-copy`).attributes('aria-label')).toBe('Click to copy');
  });

  it('★ `tooltips` 给非字符串节点时 `aria-label` 退回语言包文案（不能是空）', () => {
    const w = mountText({ copyable: { tooltips: h('span', 'node') } }, 'x');
    expect(w.find(`.${P}-copy`).attributes('aria-label')).toBe('Copy');
  });

  it('★ `icon: false` 在**两种状态**下都仍渲染默认图标（`needDom` 为真 ⇒ `false || 默认`）', async () => {
    // ⚠️ 这不是笔误：antd 的 `getNode(iconNodes[i], <默认/>, true)` 里 `needDom` 恒为 `true`，
    //    所以 `icon: false` **不是**「不画图标」的开关。断言它渲染默认图标，
    //    是为了防止有人把它「修」成不渲染而偏离上游。
    vi.useFakeTimers();
    try {
      const w = mountText({ copyable: { icon: false } }, 'x');
      expect(w.find(`.${P}-copy`).find('svg').exists()).toBe(true);
      await w.find(`.${P}-copy`).trigger('click');
      await flushAll();
      expect(w.find(`.${P}-copy`).classes()).toContain(`${P}-copy-success`);
      expect(w.find(`.${P}-copy`).find('svg').exists()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('★ `tooltips: false` 时 `aria-label` 退回语言包文案（`needDom` 为假 ⇒ 真的取到 `false`）', () => {
    const w = mountText({ copyable: { tooltips: false } }, 'x');
    expect(w.find(`.${P}-copy`).attributes('aria-label')).toBe('Copy');
  });
});

// ===========================================================================
// editable
// ===========================================================================

describe('Typography · editable', () => {
  const mountEditable = (props: Record<string, unknown> = {}, text = 'Click to edit') =>
    mountText({ editable: true, ...props }, text);

  it('渲染编辑按钮（`-edit`），`aria-label` 默认取语言包的 Edit', () => {
    const w = mountEditable();
    const button = w.find(`.${P}-edit`);
    expect(button.exists()).toBe(true);
    expect(button.attributes('aria-label')).toBe('Edit');
  });

  it('`tooltip: "Custom"` 时 `aria-label` 用它', () => {
    const w = mountEditable({ editable: { tooltip: 'Custom edit' } });
    expect(w.find(`.${P}-edit`).attributes('aria-label')).toBe('Custom edit');
  });

  it('★ 点击图标进入编辑态：渲染 `-edit-content` + `<textarea>`，初值是 children', async () => {
    const w = mountEditable();
    await w.find(`.${P}-edit`).trigger('click');
    await flushAll();

    const content = w.find(`.${P}-edit-content`);
    expect(content.exists()).toBe(true);
    expect(content.classes()).toContain(P);
    const textarea = w.find('textarea');
    expect(textarea.exists()).toBe(true);
    expect(textarea.attributes('rows')).toBe('1');
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Click to edit');
  });

  it('★ Enter 保存：`onChange` 收到 **trim 后**的值，并退出编辑态', async () => {
    const onChange = vi.fn();
    const onEnd = vi.fn();
    const w = mountText({ editable: { onChange, onEnd } }, 'Click to edit');

    await w.find(`.${P}-edit`).trigger('click');
    await flushAll();
    const textarea = w.find('textarea');
    await textarea.setValue('  New value  ');
    await textarea.trigger('keydown', { keyCode: 13 });
    await textarea.trigger('keyup', { keyCode: 13 });
    await flushAll();

    expect(onChange).toHaveBeenCalledWith('New value');
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(w.find('textarea').exists()).toBe(false);
  });

  it('★ Esc 取消：`onCancel` 被调用，`onChange` 不被调用，退出编辑态', async () => {
    const onChange = vi.fn();
    const onCancel = vi.fn();
    const w = mountText({ editable: { onChange, onCancel } }, 'Click to edit');

    await w.find(`.${P}-edit`).trigger('click');
    await flushAll();
    const textarea = w.find('textarea');
    await textarea.setValue('discarded');
    await textarea.trigger('keydown', { keyCode: 27 });
    await textarea.trigger('keyup', { keyCode: 27 });
    await flushAll();

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expect(w.find('textarea').exists()).toBe(false);
  });

  it('★ 失焦保存', async () => {
    const onChange = vi.fn();
    const w = mountText({ editable: { onChange } }, 'Click to edit');
    await w.find(`.${P}-edit`).trigger('click');
    await flushAll();
    const textarea = w.find('textarea');
    await textarea.setValue('blurred');
    await textarea.trigger('blur');
    await flushAll();
    expect(onChange).toHaveBeenCalledWith('blurred');
  });

  it('★ IME 组合中的 Enter **不**提交（中文选词不会误保存）', async () => {
    const onChange = vi.fn();
    const w = mountText({ editable: { onChange } }, 'Click to edit');
    await w.find(`.${P}-edit`).trigger('click');
    await flushAll();
    const textarea = w.find('textarea');
    await textarea.setValue('组合中');
    await textarea.trigger('compositionstart');
    await textarea.trigger('keydown', { keyCode: 13 });
    await textarea.trigger('keyup', { keyCode: 13 });
    await flushAll();
    expect(onChange).not.toHaveBeenCalled();
    expect(w.find('textarea').exists()).toBe(true);

    // 组合结束后再按一次就能提交
    await textarea.trigger('compositionend');
    await textarea.trigger('keydown', { keyCode: 13 });
    await textarea.trigger('keyup', { keyCode: 13 });
    await flushAll();
    expect(onChange).toHaveBeenCalledWith('组合中');
  });

  it('★ 带修饰键的 Enter 不提交（Ctrl / Alt / Meta / Shift）', async () => {
    for (const modifier of ['ctrlKey', 'altKey', 'metaKey', 'shiftKey'] as const) {
      const onChange = vi.fn();
      const w = mountText({ editable: { onChange } }, 'Click to edit');
      await w.find(`.${P}-edit`).trigger('click');
      await flushAll();
      const textarea = w.find('textarea');
      await textarea.setValue('x');
      await textarea.trigger('keydown', { keyCode: 13 });
      await textarea.trigger('keyup', { keyCode: 13, [modifier]: true });
      await flushAll();
      expect(onChange, modifier).not.toHaveBeenCalled();
    }
  });

  it('★ keyup 与 keydown 不是同一个键时不提交', async () => {
    const onChange = vi.fn();
    const w = mountText({ editable: { onChange } }, 'Click to edit');
    await w.find(`.${P}-edit`).trigger('click');
    await flushAll();
    const textarea = w.find('textarea');
    await textarea.setValue('x');
    await textarea.trigger('keydown', { keyCode: 13 });
    await textarea.trigger('keyup', { keyCode: 65 }); // 松开的却是 A
    await flushAll();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('★ 换行符被剥掉（单行编辑：Enter 是保存，不是换行）', async () => {
    const w = mountText({ editable: true }, 'Click to edit');
    await w.find(`.${P}-edit`).trigger('click');
    await flushAll();
    const textarea = w.find('textarea');
    await textarea.setValue('a\nb\rc');
    expect((textarea.element as HTMLTextAreaElement).value).toBe('abc');
  });

  it('`triggerType: ["icon"]` 时不渲染按钮；`["text"]` 时点击文字进入编辑态', async () => {
    const iconOnly = mountText({ editable: { triggerType: ['text'] } }, 'Click me');
    expect(iconOnly.find(`.${P}-edit`).exists()).toBe(false);
    await iconOnly.trigger('click');
    await flushAll();
    expect(iconOnly.find('textarea').exists()).toBe(true);
  });

  it('★ 退出编辑态后焦点回到编辑图标', async () => {
    // ⚠️ 必须 `attachTo: document.body`：jsdom 里 `focus()` 只对**在文档中**的元素生效，
    //    游离节点上 `document.activeElement` 恒为 `<body>` —— 那样测到的是「没挂载」，
    //    而不是「焦点没回来」。
    const w = mount(Text, {
      props: { editable: true },
      slots: { default: () => 'Click to edit' },
      attachTo: document.body,
    });
    try {
      await w.find(`.${P}-edit`).trigger('click');
      await flushAll();
      const textarea = w.find('textarea');
      await textarea.trigger('keydown', { keyCode: 27 });
      await textarea.trigger('keyup', { keyCode: 27 });
      await flushAll();
      expect(document.activeElement).toBe(w.find(`.${P}-edit`).element);
    } finally {
      w.unmount();
    }
  });

  it('受控 `editing` 为真时直接渲染编辑态', async () => {
    const w = mountText({ editable: { editing: true, text: 'preset' } }, 'display');
    expect(w.find('textarea').exists()).toBe(true);
    expect((w.find('textarea').element as HTMLTextAreaElement).value).toBe('preset');
  });

  it('`enterIcon: null` 时不渲染确认图标', async () => {
    const w = mountText({ editable: { enterIcon: null } }, 'x');
    await w.find(`.${P}-edit`).trigger('click');
    await flushAll();
    expect(w.find(`.${P}-edit-content-confirm`).exists()).toBe(false);
  });

  it('默认渲染确认图标且带 `-edit-content-confirm` 类名', async () => {
    const w = mountText({ editable: true }, 'x');
    await w.find(`.${P}-edit`).trigger('click');
    await flushAll();
    expect(w.find(`.${P}-edit-content-confirm`).exists()).toBe(true);
  });
});

// ===========================================================================
// actions.placement
// ===========================================================================

describe('Typography · actions.placement', () => {
  it('默认（end）时操作区在内容**之后**', () => {
    const w = mountText({ copyable: true }, 'content');
    const html = w.html();
    expect(html.indexOf('content')).toBeLessThan(html.indexOf(`${P}-actions`));
  });

  it('★ start 时操作区在内容**之前**，且带 `-actions-start`', () => {
    const w = mountText({ copyable: true, actions: { placement: 'start' } }, 'content');
    const actions = w.find(`.${P}-actions`);
    expect(actions.classes()).toContain(`${P}-actions-start`);
    const html = w.html();
    expect(html.indexOf(`${P}-actions`)).toBeLessThan(html.indexOf('content'));
  });

  it('没有任何操作能力时**不渲染**操作区', () => {
    expect(mountText().find(`.${P}-actions`).exists()).toBe(false);
  });
});

// ===========================================================================
// ellipsis
// ===========================================================================

/**
 * jsdom **没有布局引擎**：所有元素的 `clientHeight` / `scrollHeight` 恒为 0。
 * `Ellipsis` 的测量完全依赖这两个值，所以「真实测量」在 jsdom 下不可达 ——
 * 这是**已登记的缺口**（README §7），不是「我们偷懒没测」。
 *
 * 本文件的做法是**打桩布局**：给测量容器一个由文本长度推出的确定高度，
 * 从而真正驱动状态机（PREPARE → START → NEED_ELLIPSIS → 二分 → 收敛）。
 * 于是「状态机与二分算法正确」被证明，「像素结果」仍归 L6。
 *
 * 判定「哪个元素是测量容器」的判据：**同时**有 `aria-hidden` 与内联 `width`
 * （`measureStyle` 里写了 `width: ${props.width}px`）。正文里的省略号 `span` 只有
 * `aria-hidden` 而没有 `width`，不会被误判。
 */
const LINE_HEIGHT = 20;
const CHARS_PER_LINE = 10;

function naturalHeight(el: HTMLElement): number {
  const len = (el.textContent ?? '').length;
  return Math.max(LINE_HEIGHT, Math.ceil(len / CHARS_PER_LINE) * LINE_HEIGHT);
}

function isMeasureBox(el: HTMLElement): boolean {
  return el.hasAttribute('aria-hidden') && (el.style.width ?? '') !== '';
}

/** 打桩布局的可变状态。`overflowing` 可以在用例中途翻转，用来验证「只在变化时上报」。 */
interface LayoutState {
  overflowing: boolean;
}

/**
 * 装上布局桩。
 *
 * `clientHeight`：有 `-webkit-line-clamp: N` 的盒子被**裁到** N 行；没有的（二分中点）取自然高度。
 * `scrollHeight`：恒取自然高度（`overflowing` 为假时与 `clientHeight` 相等 ⇒ 不溢出）。
 */
function installLayoutMock(state: LayoutState = { overflowing: true }) {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  const originClient = Object.getOwnPropertyDescriptor(proto, 'clientHeight');
  const originScroll = Object.getOwnPropertyDescriptor(proto, 'scrollHeight');

  Object.defineProperty(proto, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      if (!isMeasureBox(this)) return 0;
      const clamp = Number(this.style.webkitLineClamp);
      const natural = naturalHeight(this);
      // 有 `-webkit-line-clamp` 的盒子被**裁到** N 行；没有的（二分中点）取自然高度。
      return clamp ? Math.min(clamp * LINE_HEIGHT, natural) : natural;
    },
  });
  Object.defineProperty(proto, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      if (!isMeasureBox(this)) return 0;
      const natural = naturalHeight(this);
      return state.overflowing ? natural : (this as HTMLElement).clientHeight;
    },
  });

  return {
    state,
    restore() {
      // jsdom 把 `clientHeight` / `scrollHeight` 定义在 `Element.prototype` 上，
      // 所以这里 `HTMLElement.prototype` 上通常**没有**自有描述符 —— `delete` 即可复原。
      if (originClient) Object.defineProperty(proto, 'clientHeight', originClient);
      else delete proto.clientHeight;
      if (originScroll) Object.defineProperty(proto, 'scrollHeight', originScroll);
      else delete proto.scrollHeight;
    },
  };
}

/** 正文里的省略号节点（`<span aria-hidden>...</span>`）是否存在。 */
function hasEllipsisNode(wrapper: ReturnType<typeof mount>): boolean {
  return wrapper.findAll('span[aria-hidden="true"]').some((node) => node.text() === ELLIPSIS_STR);
}

/** 可见正文 = 整棵树的文本减去省略号（用例里不带 suffix）。 */
function visibleText(wrapper: ReturnType<typeof mount>): string {
  return wrapper.text().replace(ELLIPSIS_STR, '');
}

/**
 * 打桩规则下的**解析解**：二分收敛到「高度不超过 `ellipsisHeight` 的最大字符数」。
 *
 * 测量容器里的文本 = 可见的 n 个字符 + 插槽追加的 `...`（`extraChars` 个字符），
 * 高度 = `max(1, ceil(字符数 / CHARS_PER_LINE))` 行 × `LINE_HEIGHT`。
 *
 * 而 `ellipsisHeight` 由 `Base` 侧决定：`max(base 的 1 行, descRows(rows===1 时为 0)
 * + symbolRow 的 1 行) + 1` = `LINE_HEIGHT + 1`。
 *
 * ⚠️ 它是**打桩规则的推论**，不是从实现里抄来的常量 —— 断言的是「二分找到了最大的那个 n」，
 *    而「8 个字符就放不下」由下一条用例单独反证。
 */
function maxFittingChars(availableHeight: number, extraChars: number): number {
  let best = 0;
  for (let n = 0; n <= 1000; n += 1) {
    const lines = Math.max(1, Math.ceil((n + extraChars) / CHARS_PER_LINE));
    if (lines * LINE_HEIGHT > availableHeight) break;
    best = n;
  }
  return best;
}

/** 打桩规则下的「一行高度 + 1px」（`Base` 里 `maxRowsHeight + 1` 的落点）。 */
const MOCK_ELLIPSIS_HEIGHT = LINE_HEIGHT + 1;

/** 给根元素一个非零 `offsetWidth` 并触发一次 `ResizeObserver`。 */
async function measureWithWidth(wrapper: ReturnType<typeof mount>, width: number) {
  await flushAll();
  const root = wrapper.element as HTMLElement;
  Object.defineProperty(root, 'offsetWidth', { value: width, configurable: true });
  const Observer = globalThis.ResizeObserver as unknown as {
    instances: Set<{ trigger: () => void }>;
  };
  for (const instance of Observer.instances) instance.trigger();
  await flushAll();
  await flushAll();
  await flushAll();
}

describe('Typography · ellipsis（CSS 路径）', () => {
  it('rows=1 且无附加要求时走 CSS：加 `-ellipsis-single-line`', () => {
    const w = mountText({ ellipsis: true }, LONG_TEXT);
    expect(w.classes()).toContain(`${P}-ellipsis`);
    expect(w.classes()).toContain(`${P}-ellipsis-single-line`);
    expect(w.classes()).not.toContain(`${P}-ellipsis-multiple-line`);
  });

  it('★ rows>1 时走 `-webkit-line-clamp`：加 `-ellipsis-multiple-line` 且内联 `WebkitLineClamp`', () => {
    const w = mountParagraph({ ellipsis: { rows: 2 } }, LONG_TEXT);
    expect(w.classes()).toContain(`${P}-ellipsis-multiple-line`);
    expect(w.classes()).not.toContain(`${P}-ellipsis-single-line`);
    expect(w.attributes('style') ?? '').toContain('-webkit-line-clamp: 2');
  });

  it('★ `Text` 会把 `rows` 剥掉，所以它永远是单行（行内文本没有多行概念）', () => {
    const w = mountText({ ellipsis: { rows: 3 } }, LONG_TEXT);
    expect(w.classes()).toContain(`${P}-ellipsis-single-line`);
    expect(w.classes()).not.toContain(`${P}-ellipsis-multiple-line`);
  });

  it('★ CSS 路径下内容**不被裁剪**、也不加省略号节点', () => {
    const w = mountText({ ellipsis: true }, LONG_TEXT);
    expect(w.text()).toBe(LONG_TEXT);
    expect(w.find(`span[aria-hidden="true"]`).exists()).toBe(false);
  });

  it('不传 ellipsis 时没有 `-ellipsis` 类名', () => {
    expect(mountText({}, LONG_TEXT).classes()).not.toContain(`${P}-ellipsis`);
  });
});

describe('Typography · ellipsis（JS 二分裁剪路径）', () => {
  let layout: { state: LayoutState; restore: () => void } | null = null;

  afterEach(() => {
    layout?.restore();
    layout = null;
  });

  it('★ 溢出时进入 JS 路径：内容被裁到「恰好不超一行」，并追加省略号', async () => {
    layout = installLayoutMock();
    const onEllipsis = vi.fn();
    const w = mountText({ ellipsis: { onEllipsis } }, LONG_TEXT);

    // `suffix`/`onEllipsis`/`expandable`/`copyable`/`editable` 任一存在 ⇒ needMeasureEllipsis
    // ⇒ 放弃 CSS，走 JS。此时宽度还是 0，测量不启动。
    expect(w.classes()).not.toContain(`${P}-ellipsis-single-line`);

    await measureWithWidth(w, 220);

    expect(onEllipsis).toHaveBeenCalledWith(true);
    expect(w.text()).not.toBe(LONG_TEXT);
    expect(hasEllipsisNode(w)).toBe(true);
    // 裁出来的是**前缀**（不是任意子串）
    expect(LONG_TEXT.startsWith(visibleText(w))).toBe(true);
  });

  it('★ 二分收敛到「能放下的最大字符数」（不是随便切一刀）', async () => {
    layout = installLayoutMock();
    const w = mountText({ ellipsis: { onEllipsis: () => {} } }, LONG_TEXT);
    await measureWithWidth(w, 220);

    const expected = maxFittingChars(MOCK_ELLIPSIS_HEIGHT, ELLIPSIS_STR.length);
    expect(visibleText(w).length).toBe(expected);

    // 反证「最大」：再多一个字符就放不下了（会多出一行 ⇒ 超出 ellipsisHeight）
    const oneMore = Math.max(1, Math.ceil((expected + 1 + ELLIPSIS_STR.length) / CHARS_PER_LINE));
    expect(oneMore * LINE_HEIGHT).toBeGreaterThan(MOCK_ELLIPSIS_HEIGHT);
  });

  it('★ 未溢出时内容完整、没有省略号节点（且**不**上报 —— 初始值就是 false）', async () => {
    layout = installLayoutMock({ overflowing: false });
    const onEllipsis = vi.fn();
    const w = mountText({ ellipsis: { onEllipsis } }, LONG_TEXT);
    await measureWithWidth(w, 220);

    expect(w.text()).toBe(LONG_TEXT);
    expect(hasEllipsisNode(w)).toBe(false);
    // `onJsEllipsis` 只在**变化时**上报，而初始 `isJsEllipsis` 就是 `false` ⇒ 不调用。
    // 这是 antd 的既定行为（`if (isJsEllipsis !== jsEllipsis) onEllipsis?.(...)`）。
    expect(onEllipsis).not.toHaveBeenCalled();
  });

  it('★ 宽度为 0 时不启动测量（还没量到就裁会裁错）', async () => {
    layout = installLayoutMock();
    const onEllipsis = vi.fn();
    const w = mountText({ ellipsis: { onEllipsis } }, LONG_TEXT);
    await flushAll();
    await flushAll();
    expect(onEllipsis).not.toHaveBeenCalled();
    expect(w.text()).toBe(LONG_TEXT);
  });

  it('★ `onEllipsis` 只在**变化时**上报：同一个结果重测不重复上报', async () => {
    layout = installLayoutMock();
    const onEllipsis = vi.fn();
    const w = mountText({ ellipsis: { onEllipsis } }, LONG_TEXT);
    await measureWithWidth(w, 220);
    expect(onEllipsis).toHaveBeenCalledTimes(1);
    expect(onEllipsis).toHaveBeenLastCalledWith(true);

    // 换个宽度触发一次重测（结果不变）—— 不应再上报
    await measureWithWidth(w, 221);
    expect(onEllipsis).toHaveBeenCalledTimes(1);
  });

  it('★ 从「溢出」变成「不溢出」时上报 `false`', async () => {
    layout = installLayoutMock();
    const onEllipsis = vi.fn();
    const w = mountText({ ellipsis: { onEllipsis } }, LONG_TEXT);
    await measureWithWidth(w, 220);
    expect(onEllipsis).toHaveBeenLastCalledWith(true);

    layout.state.overflowing = false;
    await measureWithWidth(w, 221);

    expect(onEllipsis).toHaveBeenCalledTimes(2);
    expect(onEllipsis).toHaveBeenLastCalledWith(false);
    expect(w.text()).toBe(LONG_TEXT);
    expect(hasEllipsisNode(w)).toBe(false);
  });

  it('★ `suffix` 追加在省略号之后', async () => {
    layout = installLayoutMock();
    const w = mountText({ ellipsis: { suffix: '--more' } }, LONG_TEXT);
    await measureWithWidth(w, 220);
    expect(hasEllipsisNode(w)).toBe(true);
    expect(w.text()).toContain('--more');
  });

  it('★ 溢出的根元素带 `aria-label`（可访问名用**完整**文本），内容被 `aria-hidden` 包住', async () => {
    layout = installLayoutMock();
    const w = mountText({ ellipsis: { onEllipsis: () => {} } }, LONG_TEXT);
    await measureWithWidth(w, 220);

    expect(w.attributes('aria-label')).toBe(LONG_TEXT);
    // 内容外面那层 `aria-hidden` span 正是为此存在（屏幕阅读器别把截断后的文字再读一遍）
    const cut = visibleText(w);
    expect(cut.length).toBeGreaterThan(0);
    expect(w.findAll('span[aria-hidden="true"]').some((node) => node.text() === cut)).toBe(true);
  });

  it('★ `ellipsis.tooltip` 单独存在**不**触发 JS 测量（它不是 needMeasureEllipsis 的判据）', () => {
    const w = mountText({ ellipsis: { tooltip: true } }, LONG_TEXT);
    expect(w.classes()).toContain(`${P}-ellipsis-single-line`);
    // 走 CSS 省略号 ⇒ `topAriaLabel` 恒为 undefined（上游行为：CSS 截断由浏览器负责可访问名）
    expect(w.attributes('aria-label')).toBeUndefined();
  });

  it('★ `expandable`：溢出时渲染展开按钮，点击后显示完整内容', async () => {
    layout = installLayoutMock();
    const onExpand = vi.fn();
    const w = mountParagraph({ ellipsis: { expandable: true, onExpand } }, LONG_TEXT);
    await measureWithWidth(w, 220);

    const expandBtn = w.find(`.${P}-expand`);
    expect(expandBtn.exists()).toBe(true);
    expect(expandBtn.attributes('aria-label')).toBe('Expand');
    expect(w.text()).not.toBe(LONG_TEXT);

    await expandBtn.trigger('click');
    await flushAll();

    expect(onExpand).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ expanded: true }),
    );
    expect(w.text()).toBe(LONG_TEXT);
    // ⚠️ `expandable: true`（非 collapsible）展开后**按钮整个消失**，不是变成「收起」。
    //    链条：`expanded` ⇒ `mergedEnableEllipsis = enableEllipsis && (!expanded ||
    //    expandable === 'collapsible')` 变假 ⇒ `Ellipsis` 的 `enableMeasure` 变假 ⇒
    //    渲染属性拿到的 `canEllipsis` 恒为 `false` ⇒ `renderOperations(false)` 里
    //    `canEllipsis && renderExpand()` 短路。想能收回去必须用 `expandable: 'collapsible'`
    //    （上游的既定形状，见 antd `Base/index.js` 的 `renderOperations`）。
    expect(w.find(`.${P}-collapse`).exists()).toBe(false);
    expect(w.find(`.${P}-expand`).exists()).toBe(false);
  });

  it('★ `expandable: "collapsible"` 时展开后仍保留 `-ellipsis`，按钮变成「收起」且可再收起', async () => {
    layout = installLayoutMock();
    const w = mountParagraph({ ellipsis: { expandable: 'collapsible' } }, LONG_TEXT);
    await measureWithWidth(w, 220);

    await w.find(`.${P}-expand`).trigger('click');
    await flushAll();

    expect(w.classes()).toContain(`${P}-ellipsis`);
    // `collapsible` 下 `mergedEnableEllipsis` 仍为真 ⇒ `canEllipsis` 仍为真 ⇒ 按钮在
    expect(w.find(`.${P}-expand`).exists()).toBe(false);
    const collapseBtn = w.find(`.${P}-collapse`);
    expect(collapseBtn.exists()).toBe(true);
    expect(collapseBtn.attributes('aria-label')).toBe('Collapse');

    // 还能收回去
    await collapseBtn.trigger('click');
    await flushAll();
    expect(w.find(`.${P}-expand`).exists()).toBe(true);
  });

  it('★ `-ellipsis` 的判据是 `enableEllipsis`（不是 `mergedEnableEllipsis`）：展开后仍在', async () => {
    layout = installLayoutMock();
    const w = mountParagraph({ ellipsis: { expandable: true } }, LONG_TEXT);
    await measureWithWidth(w, 220);

    // 走 JS 测量 ⇒ `cssEllipsis` 为假 ⇒ `-ellipsis-single-line` **从来没有过**
    // （它的判据 `cssTextOverflow` 里含 `cssEllipsis`）。
    expect(w.classes()).toContain(`${P}-ellipsis`);
    expect(w.classes()).not.toContain(`${P}-ellipsis-single-line`);

    await w.find(`.${P}-expand`).trigger('click');
    await flushAll();

    // ⚠️ 展开后 `-ellipsis` **不会**消失：它的判据是 `enableEllipsis`（=「传了 `ellipsis`」），
    //    与 `mergedEnableEllipsis`（含 `expanded` 与 `collapsible` 的与）**不是一回事**。
    //    antd 的根类名逐字相同（`[`${prefixCls}-ellipsis`]: enableEllipsis`）。
    expect(w.classes()).toContain(`${P}-ellipsis`);
  });

  it('★ 受控 `expanded` 时以 prop 为准（绕过测量，直接渲染完整内容 + 收起按钮）', async () => {
    // ⚠️ 必须用 `collapsible`：`expandable: true` 时 `expanded` 为真会把 `enableMeasure`
    //    整个关掉（见上一条），那样测到的只是「测量被关掉」，证明不了「受控值生效」。
    //    `collapsible` 下测量**仍然在跑**，`expanded` 却让渲染属性拿到完整节点 ——
    //    这才是「以 prop 为准」。
    layout = installLayoutMock();
    const w = mountParagraph(
      { ellipsis: { expandable: 'collapsible', expanded: true } },
      LONG_TEXT,
    );
    await measureWithWidth(w, 220);

    // ⚠️ `w.text()` 里还含操作区的按钮文案（`Collapse`，来自 en-US 语言包），
    //    所以用 `startsWith` 判「正文完整」，而不是 `toBe(LONG_TEXT)`。
    expect(w.text().startsWith(LONG_TEXT)).toBe(true);
    expect(hasEllipsisNode(w)).toBe(false);
    expect(w.find(`.${P}-collapse`).exists()).toBe(true);

    // 反证「是受控值在起作用」：把它翻回 false，内容立刻被裁掉
    await w.setProps({ ellipsis: { expandable: 'collapsible', expanded: false } });
    await flushAll();
    await flushAll();
    expect(w.text().startsWith(LONG_TEXT)).toBe(false);
    expect(hasEllipsisNode(w)).toBe(true);
  });

  it('★ `Text` 会剥掉 `expandable` / `rows` 并告警', async () => {
    const out = await capturedWarnings(() =>
      mount(Text, {
        props: { ellipsis: { expandable: true } },
        slots: { default: () => 'x' },
      }),
    );
    expect(out).toContain('`ellipsis` do not support `expandable` or `rows` props.');
  });

  it('★ 判据是 `in`：`{ rows: undefined }` 也会告警', async () => {
    const out = await capturedWarnings(() =>
      mount(Text, {
        props: { ellipsis: { rows: undefined } },
        slots: { default: () => 'x' },
      }),
    );
    expect(out).toContain('do not support `expandable` or `rows`');
  });

  it('合法的 `ellipsis`（无 expandable/rows）不告警', async () => {
    const out = await capturedWarnings(() =>
      mount(Text, {
        props: { ellipsis: { suffix: '…' } },
        slots: { default: () => 'x' },
      }),
    );
    expect(out).not.toContain('do not support');
  });
});

// ===========================================================================
// ConfigProvider
// ===========================================================================

describe('Typography · ConfigProvider', () => {
  it('context 的 `className` 落在根元素', () => {
    const w = mountWithConfig(
      { components: { typography: { className: 'cfg-class' } } },
      Text,
      {},
      {
        default: () => 'T',
      },
    );
    expect(w.classes()).toContain('cfg-class');
  });

  it('context 的 `classNames.root` 落在根元素', () => {
    const w = mountWithConfig(
      { components: { typography: { classNames: { root: 'cfg-root' } } } },
      Text,
      {},
      { default: () => 'T' },
    );
    expect(w.classes()).toContain('cfg-root');
  });

  it('★ context 的 `style` 进根样式，且被组件自己的 `styles.root` 覆盖', () => {
    const w = mountWithConfig(
      { components: { typography: { style: { color: 'rgb(1, 1, 1)' } } } },
      Text,
      { styles: { root: { color: 'rgb(3, 3, 3)' } } },
      { default: () => 'T' },
    );
    const style = w.attributes('style') ?? '';
    expect(style).toContain('color: rgb(3, 3, 3)');
    expect(style).not.toContain('rgb(1, 1, 1)');
  });

  it('★ `direction=rtl` 时加 `-rtl`（且每个子组件都加）', () => {
    for (const component of [Text, Paragraph, Title, Link, Typography] as const) {
      const w = mountWithConfig({ direction: 'rtl' }, component, {}, { default: () => 'T' });
      expect(w.classes(), component.name).toContain(`${P}-rtl`);
    }
  });

  it('无 context 时不加 `-rtl`', () => {
    expect(mountText().classes()).not.toContain(`${P}-rtl`);
  });

  it('★ 函数式 `classNames` 的 `info.props.prefixCls` 是**解析后**的值', () => {
    const classNames = vi.fn((info: { props: { prefixCls?: string } }) => ({
      root: `fn-${String(info.props.prefixCls)}`,
    }));
    const w = mountText({ classNames });
    expect(w.classes()).toContain(`fn-${P}`);
    expect(Object.keys(classNames.mock.calls[0]?.[0] ?? {})).toEqual(['props']);
  });

  it('★ 函数式 `classNames` 在 props 变化后重算', async () => {
    const classNames = vi.fn((info: { props: { disabled?: boolean } }) => ({
      root: info.props.disabled ? 'is-disabled' : 'is-enabled',
    }));
    const w = mountText({ classNames });
    expect(w.classes()).toContain('is-enabled');
    await w.setProps({ disabled: true });
    expect(w.classes()).toContain('is-disabled');
  });

  it('`classNames` 是**拼接**而非覆盖', () => {
    const w = mountText({ className: 'user-class', classNames: { root: 'semantic-class' } });
    expect(w.classes()).toContain('user-class');
    expect(w.classes()).toContain('semantic-class');
  });

  it('四个语义槽位各自落位（root / actions / action）', () => {
    const w = mountText(
      {
        copyable: true,
        classNames: { root: 'cn-root', actions: 'cn-actions', action: 'cn-action' },
        styles: { root: { opacity: '0.9' }, actions: { marginInlineStart: '4px' } },
      },
      'x',
    );
    expect(w.classes()).toContain('cn-root');
    expect(w.attributes('style') ?? '').toContain('opacity: 0.9');
    expect(w.find(`.${P}-actions`).classes()).toContain('cn-actions');
    expect(w.find(`.${P}-actions`).attributes('style') ?? '').toContain('margin-inline-start: 4px');
    expect(w.find(`.${P}-copy`).classes()).toContain('cn-action');
  });

  it('`prefixCls` 是**完整前缀**，贯穿根与全部子结构类名（T12）', () => {
    const w = mountText({ prefixCls: 'my', copyable: true, type: 'danger' }, 'x');
    expect(w.classes()).toContain('my');
    expect(w.classes()).toContain('my-danger');
    expect(w.find('.my-actions').exists()).toBe(true);
    expect(w.find('.my-copy').exists()).toBe(true);
  });

  it('★ 显式 `prefixCls` 会压过 ConfigProvider 的默认前缀解析', () => {
    const w = mountWithConfig(
      { components: { typography: { className: 'cfg' } } },
      Text,
      { prefixCls: 'my' },
      { default: () => 'x' },
    );
    expect(w.classes()).toContain('my');
    expect(w.classes()).toContain('cfg');
  });
});

describe('Typography · 开发期告警', () => {
  it('告警只在**非法用法**时出现，正常用法静默', async () => {
    const out = await capturedWarnings(() => mountText({ type: 'danger', copyable: true }, 'x'));
    expect(out).not.toContain('[apollo: Typography');
  });
});
