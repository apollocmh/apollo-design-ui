import { diffHtml } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { type Component, createApp, defineComponent, h, type VNode } from 'vue';
import baseline from '../../../../tests/compat/baselines/icons.dom.json';
import { DEFAULT_ICON_PREFIX_CLS } from '../context';
import * as Icons from '../icons';
import { Icon, IconProvider } from '../index';

/**
 * L4 · DOM 契约（与 React 参考实现的实测 DOM 比对）
 *
 * ── 这个测试的落点 ────────────────────────────────────────────────────────────
 * 基准是 `tests/compat/baselines/icons.dom.json`，由 `tests/compat/baseline/icons.mjs`
 * **直接调用 `react-dom/server.renderToStaticMarkup` 渲染 `@ant-design/icons` 6.3.4**
 * 产出 —— 是机械 oracle，不是「我们读了源码之后写下的期望值」。
 * 后者的差分通过只能说明两边都想通了，连上游的缺陷都会被一起写进断言。
 *
 * ── 归一化（已提取到共享包，T2）────────────────────────────────────────────────
 * 两侧的 HTML 都走 `@apollo-design/test-utils` 的 `parse → project` 流水线：
 * 属性按名排序（属性顺序无语义）、`style` 归一化为声明集合（序列化格式不同）、
 * 剔除与无前缀项等价的厂商前缀（D16）。归一化是**对称**的，见该模块头注释。
 *
 * ⚠️ 本包用 **`profile: 'full'`**（投影全部属性），而不是默认的 `'contract'`
 *    （`TESTING.md` T10 的 class + data-* + role/aria-* 子集）。理由：
 *    对图标来说 `viewBox` / `d` / `fill` / `width` / `height` **不是**"无关属性"，
 *    它们就是交付物本身 —— 只投影 class + aria-* 会让「图标画错了」这类最严重的
 *    回归完全测不出来。这是**登记过的加强**（`docs/foundation/icons-contract.md` §6.1）。
 *
 *    `full` 档同时保留 `id` 原样（基线里有 `props:passthrough` 用例专门断言
 *    `id="my-icon"` 的透传），而 `contract` 档会把 `id` 归一化掉 ——
 *    用错档位会让那条用例静默失去意义。
 *
 * **类名不做事后归一化**：本文件给两侧传**同一个** `prefixCls`（默认 `'anticon'`），
 * 所以类名可以逐字比对。这比"先渲染成 apollo-icon 再替换成 anticon"更强 ——
 * 后者会把「我们根本没读 prefixCls」这个 bug 一起归一化掉。
 * 默认前缀（`apollo-icon`）由本文件最后一个 describe 单独覆盖。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明**像素**一致（那是 L6 视觉回归；本包不产出组件级样式，
 *     图标基础样式由 `getIconStyle` 交给 ui 的静态样式层，见 `style.test.ts`）
 *   - 没证明键盘可达性（那是 L5，见 `a11y.test.ts`）
 *   - 没证明 848 个图标的**路径数据**是"对的" —— 只证明我们渲染出的 DOM
 *     与 React 渲染出的 DOM 相同。若 `@ant-design/icons-svg` 本身画错，
 *     这个测试会跟着一起错（这正是"对齐上游"的定义）
 */

/** 投影档。两侧共用同一个对象 —— 归一化必须对称。 */
const PROJECTION = { profile: 'full' } as const;

/**
 * 按名字动态取图标（848 全量比对用）。
 *
 * 具名访问一律走 `Icons.HomeOutlined` 而不是这张表 —— namespace import 的
 * 具名成员保留**具体组件类型**，而 `Record<string, Component>` 在
 * `noUncheckedIndexedAccess` 下索引出来是 `Component | undefined`，
 * 会让 `h()` 的重载解析失败。这里保留 `| undefined` 是**有意的**：
 * 它逼调用方显式处理「图标没生成出来」这种失败。
 */
const ICON_EXPORTS = Icons as unknown as Record<string, Component | undefined>;

/** 把 vnode 渲染成客户端 DOM 的 HTML 串（与基线同为字符串，便于同一条归一化流水线）。 */
function renderToHtml(vnode: VNode): string {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const app = createApp({ render: () => vnode });
  app.mount(host);
  const html = host.innerHTML;
  app.unmount();
  host.remove();
  return html;
}

/** 用例的 Vue 侧构造。`prefixCls` 必须与 oracle 里 React 侧用的值相同。 */
interface CaseSpec {
  prefixCls: string;
  rootClassName?: string;
  render: () => VNode;
}

const ANTICON = 'anticon';

const withProvider = (spec: CaseSpec): VNode => {
  const value: { prefixCls: string; rootClassName?: string } = { prefixCls: spec.prefixCls };
  if (spec.rootClassName !== undefined) value.rootClassName = spec.rootClassName;
  return h(IconProvider, { value }, { default: () => spec.render() });
};

/**
 * 34 个用例的 Vue 侧对应物。顺序与 `baseline.cases` 一致（下面按 id 建索引，不靠顺序）。
 *
 * 每一行都刻意与 oracle 里的 React 构造**一一对应** —— 如果这里偷偷少传一个 prop，
 * 差分就会指向那个 prop，而不是被"反正结果不一样"掩盖。
 */
const CASES: Record<string, CaseSpec> = {
  // 1. 默认渲染
  'plain:AccountBookOutlined': { prefixCls: ANTICON, render: () => h(Icons.AccountBookOutlined) },
  'plain:AccountBookFilled': { prefixCls: ANTICON, render: () => h(Icons.AccountBookFilled) },
  'plain:AccountBookTwoTone': { prefixCls: ANTICON, render: () => h(Icons.AccountBookTwoTone) },
  'plain:LoadingOutlined': { prefixCls: ANTICON, render: () => h(Icons.LoadingOutlined) },
  'plain:HomeOutlined': { prefixCls: ANTICON, render: () => h(Icons.HomeOutlined) },

  // 2-8. props
  'props:className': {
    prefixCls: ANTICON,
    render: () => h(Icons.HomeOutlined, { class: 'my-cls' }),
  },
  'props:spin': { prefixCls: ANTICON, render: () => h(Icons.HomeOutlined, { spin: true }) },
  'props:rotate:90': { prefixCls: ANTICON, render: () => h(Icons.HomeOutlined, { rotate: 90 }) },
  'props:rotate:180': { prefixCls: ANTICON, render: () => h(Icons.HomeOutlined, { rotate: 180 }) },
  // rotate:0 —— antd 用真值判断，0 不产生 style。这条把该分支钉死。
  'props:rotate:0': { prefixCls: ANTICON, render: () => h(Icons.HomeOutlined, { rotate: 0 }) },
  'props:onClick': {
    prefixCls: ANTICON,
    render: () => h(Icons.HomeOutlined, { onClick: () => {} }),
  },
  'props:tabIndex:0': { prefixCls: ANTICON, render: () => h(Icons.HomeOutlined, { tabIndex: 0 }) },
  'props:passthrough': {
    prefixCls: ANTICON,
    render: () =>
      h(Icons.HomeOutlined, { style: { color: 'red' }, 'data-testid': 'x', id: 'my-icon' }),
  },
  'props:rotate+class': {
    prefixCls: ANTICON,
    render: () => h(Icons.HomeOutlined, { rotate: 45, class: 'a b' }),
  },

  // 9-12. TwoTone
  'twotone:default': { prefixCls: ANTICON, render: () => h(Icons.AccountBookTwoTone) },
  'twotone:single': {
    prefixCls: ANTICON,
    render: () => h(Icons.AccountBookTwoTone, { twoToneColor: '#f5222d' }),
  },
  'twotone:pair': {
    prefixCls: ANTICON,
    render: () => h(Icons.AccountBookTwoTone, { twoToneColor: ['#f5222d', '#52c41a'] }),
  },
  // 非 TwoTone 图标收到 twoToneColor 时必须**吞掉**它（不能泄漏成 DOM 属性）
  'twotone:ignored-on-outlined': {
    prefixCls: ANTICON,
    render: () => h(Icons.HomeOutlined, { twoToneColor: '#f5222d' }),
  },

  // 13. loading 名字本身触发 spin
  'loading:implicit-spin': { prefixCls: ANTICON, render: () => h(Icons.LoadingOutlined) },

  // 14. 基础 Icon 收到陌生的 `icon` 属性 —— antd 的 Icon 不消费它，原样落到 span 上
  'invalid:icon-null': { prefixCls: ANTICON, render: () => h(Icon, { icon: null }) },
  'invalid:icon-string': { prefixCls: ANTICON, render: () => h(Icon, { icon: 'nope' }) },

  // 15. IconProvider
  'provider:prefix-cls': { prefixCls: 'my', render: () => h(Icons.HomeOutlined) },
  'provider:root-class': {
    prefixCls: ANTICON,
    rootClassName: 'root-x',
    render: () => h(Icons.HomeOutlined),
  },
  'provider:twotone-prefix': { prefixCls: 'zz', render: () => h(Icons.AccountBookTwoTone) },

  // 16. 基础 Icon（children 形态）
  'icon:children': {
    prefixCls: ANTICON,
    render: () =>
      h(Icon, { viewBox: '0 0 1024 1024' }, () => h('path', { d: 'M0 0h1024v1024H0z' })),
  },
  'icon:children-no-viewbox': {
    prefixCls: ANTICON,
    render: () => h(Icon, null, () => h('use', { 'xlink:href': '#foo' })),
  },
  'icon:children-spin': {
    prefixCls: ANTICON,
    render: () =>
      h(Icon, { viewBox: '0 0 1024 1024', spin: true }, () => h('path', { d: 'M0 0h1v1H0z' })),
  },
  'icon:children-rotate+class': {
    prefixCls: ANTICON,
    render: () =>
      h(Icon, { viewBox: '0 0 1024 1024', rotate: 30, class: 'k' }, () =>
        h('path', { d: 'M0 0h1v1H0z' }),
      ),
  },

  // 17. 用户传入的 aria-* / role 覆盖内置值
  'props:aria-label-override': {
    prefixCls: ANTICON,
    render: () => h(Icons.HomeOutlined, { 'aria-label': 'My home' }),
  },
  'props:role-override': {
    prefixCls: ANTICON,
    render: () => h(Icons.HomeOutlined, { role: 'presentation' }),
  },
  'props:aria-hidden-false': {
    prefixCls: ANTICON,
    render: () => h(Icons.HomeOutlined, { 'aria-hidden': false }),
  },

  // 17b. D17：antd 的 Icon 声明了 ariaLabel 却不消费它
  'props:ariaLabel-prop': { prefixCls: ANTICON, render: () => h(Icon, { ariaLabel: 'My home' }) },

  // 17c. 基础 Icon 的 component 路径：自定义 svg 组件收到的就是 innerSvgProps
  'icon:component': {
    prefixCls: ANTICON,
    render: () => h(Icon, { component: CustomSvg, viewBox: '0 0 8 8', color: 'red' }),
  },
  'icon:component-no-viewbox': {
    prefixCls: ANTICON,
    render: () => h(Icon, { component: CustomSvg }),
  },

  // 17d. `component` **与** children 同时存在 —— 走的是「传默认插槽」那一支。
  // 只有 `icon:component`（无 children）会漏掉这支，所以必须单独测。
  'icon:component-with-children': {
    prefixCls: ANTICON,
    render: () =>
      h(Icon, { component: CustomSvgEcho, viewBox: '0 0 8 8' }, () => [
        h('circle', { cx: 4, cy: 4, r: 3 }),
      ]),
  },
  'icon:component-empty-children': {
    prefixCls: ANTICON,
    render: () => h(Icon, { component: CustomSvgEcho, viewBox: '0 0 8 8' }, () => []),
  },
};

/** 对应 oracle 里的 React `CustomSvg`：把收到的 props 原样铺到 svg 上，再加一个标记属性。 */
const CustomSvg = {
  name: 'CustomSvg',
  inheritAttrs: false,
  setup(_props: Record<string, unknown>, { attrs }: { attrs: Record<string, unknown> }) {
    return () => h('svg', { ...attrs, 'data-custom': 'yes' }, [h('path', { d: 'M0 0h1v1H0z' })]);
  },
};

/**
 * 对应 oracle 里的 React `CustomSvgEcho`：**渲染收到的内容**。
 *
 * Vue 侧的对应物是默认插槽（React 是 `props.children`）—— 通道不同、可观察结果相同，
 * 这正是 `icon:component-with-children` 要测的东西：内容有没有真的送到自定义组件手里。
 */
const CustomSvgEcho = defineComponent({
  name: 'CustomSvgEcho',
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    return () => h('svg', { ...attrs, 'data-custom': 'echo' }, slots.default?.() ?? undefined);
  },
});

const CASES_BY_ID = new Map(baseline.cases.map((c) => [c.id, c.html]));

describe('L4 DOM 契约：与 @ant-design/icons 的机械 oracle 逐条比对', () => {
  it('基线本身来自 @ant-design/icons 6.3.4，且覆盖 848 个图标', () => {
    expect(baseline.iconsVersion).toBe('6.3.4');
    expect(baseline.iconCount).toBe(848);
    expect(Object.keys(baseline.all)).toHaveLength(848);
    expect(baseline.themed).toEqual({ filled: 251, outlined: 447, twoTone: 150, other: 0 });
  });

  it('每个基线用例都有对应的 Vue 侧构造（防止漏测）', () => {
    const missing = baseline.cases.map((c) => c.id).filter((id) => !(id in CASES));
    expect(missing).toEqual([]);
    // 反向也查：多出来的构造说明用例被改名而这里没跟上
    const extra = Object.keys(CASES).filter((id) => !CASES_BY_ID.has(id));
    expect(extra).toEqual([]);
  });

  // 唯一的有意差异：D17。单独列出，断言差异**恰好**是它，而不是"反正有差异"。
  const INTENTIONAL_DIFF: Record<string, { contains: string[]; count: number }> = {
    'props:ariaLabel-prop': { contains: ['aria-label="My home"', 'arialabel="My home"'], count: 2 },
  };

  for (const c of baseline.cases) {
    const spec = CASES[c.id];
    const expected = INTENTIONAL_DIFF[c.id];

    it(`用例 ${c.id}`, () => {
      if (spec === undefined) throw new Error(`用例 ${c.id} 缺少 Vue 侧构造`);
      const diff = diffHtml(c.html, renderToHtml(withProvider(spec)), PROJECTION);

      if (expected === undefined) {
        expect(diff).toEqual([]);
        return;
      }

      // 有意差异：断言「差异集合恰好等于登记的那一条」（AGENTS.md §4.3 / C24）
      expect(diff).toHaveLength(expected.count);
      const joined = diff.join('\n');
      for (const fragment of expected.contains) expect(joined).toContain(fragment);
    });
  }
});

describe('L4 DOM 契约：848 个图标的默认渲染', () => {
  const names = Object.keys(baseline.all).sort();

  // ⚠️ 848 个图标逐个 SSR + 比对，在 CI 机器上远超 vitest 默认的 5s ——
  //    「偶发超时」会污染 verify:full 的结论（红灯不是真失败）。给足超时，
  //    正确性由比对本身保证，不由时间保证。
  it(`全部 ${names.length} 个图标与 React 渲染一致`, () => {
    const failures: string[] = [];
    for (const name of names) {
      const component = ICON_EXPORTS[name];
      if (component === undefined) {
        failures.push(`${name}: 本包未导出该图标`);
        continue;
      }
      const diff = diffHtml(
        baseline.all[name as keyof typeof baseline.all],
        renderToHtml(withProvider({ prefixCls: ANTICON, render: () => h(component) })),
        PROJECTION,
      );
      if (diff.length > 0) failures.push(`${name}: ${diff.join(' | ')}`);
      if (failures.length >= 5) break;
    }
    expect(failures).toEqual([]);
  }, 120_000);

  it('导出的图标集合与基线集合完全一致（不多不少）', () => {
    const exported = names.filter((n) => ICON_EXPORTS[n] !== undefined);
    expect(exported).toHaveLength(848);
  });
});

describe('L4 DOM 契约：默认前缀与自定义前缀（T12）', () => {
  it('无 IconProvider 时使用 apollo-icon（D14）', () => {
    const html = renderToHtml(h(Icons.HomeOutlined));
    expect(html).toContain(`class="${DEFAULT_ICON_PREFIX_CLS} ${DEFAULT_ICON_PREFIX_CLS}-home"`);
    expect(html).not.toContain('anticon');
  });

  it('IconProvider 传自定义 prefixCls 时全部类名被替换（T12）', () => {
    const html = renderToHtml(
      withProvider({ prefixCls: 'custom', render: () => h(Icons.LoadingOutlined) }),
    );
    // 类名 + 名字派生类 + spin 类，三者都要跟着换
    expect(html).toContain('class="custom custom-loading custom-spin"');
    expect(html).not.toContain('anticon');
    expect(html).not.toContain(DEFAULT_ICON_PREFIX_CLS);
  });

  it('rootClassName 排在最前（与 antd 的 clsx 参数顺序一致）', () => {
    const html = renderToHtml(
      withProvider({ prefixCls: 'p', rootClassName: 'root', render: () => h(Icons.HomeOutlined) }),
    );
    expect(html).toContain('class="root p p-home"');
  });
});
