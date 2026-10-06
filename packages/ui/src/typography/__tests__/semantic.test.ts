/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/typography.dom.json`，由 `tests/compat/baseline/typography.mjs`
 * **直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Typography` 家族**
 * 产出。是机械 oracle，不是「我们读了源码之后写下的期望值」—— 后者的差分通过只能说明
 * 两边都想通了，连上游的缺陷都会被一起写进断言。
 *
 * ── 三条本组件特有的比对要点 ───────────────────────────────────────────────────
 *
 *   1. **装饰的嵌套顺序**（`strong → u → del → code → mark → kbd → i`）由
 *      `text:decorations-all` / `text:mark+code` / `text:strong+underline` 钉住。
 *      顺序反了「看起来一样」，只有 DOM 契约会红。
 *   2. **`-link` 的判据是 `component === 'a'`**：`link:type-danger` 同时有
 *      `-danger` 与 `-link`；而 `text:component-a`（Text 覆盖成 span）**没有** `-link`。
 *   3. **`level` 非法退回 `h1`**：`title:level-invalid`（`level: 6`）与
 *      `title:level-zero`（`level: 0`）都必须是 `<h1>`，不是 `<h6>` / 不渲染。
 *
 * ── 图标前缀：两侧必须显式对齐 ────────────────────────────────────────────────
 *
 * `copyable` / `editable` 的按钮里是图标组件。antd 的默认图标前缀是 `anticon`，
 * 我们的默认是 `apollo-icon`（`COMPATIBILITY.md` D14，与 `prefix-cls-default` 同源）。
 * 与 `packages/icons` 的 L4 同一手法：**两侧都用同一个前缀**（这里取 antd 的默认值
 * `anticon`），类名于是可以逐字比对。Vue 侧靠 `IconProvider` 覆盖。
 *
 * ⚠️ 这**不是**「为测试特制的一条路径」：`IconProvider` 是 `@apollo-design/icons`
 *    公开导出的、对应 antd `<IconProvider value={{prefixCls}}>` 的等价物。
 *
 * ── 为什么基线里**没有** JS 测量路径的 `ellipsis` 用例 ─────────────────────────
 *
 * 基线是 `renderToStaticMarkup` 的产物（**无 effect**）：antd 的 `cssEllipsis` 初值
 * 是 `mergedEnableEllipsis`（真），于是 SSR 输出 `-ellipsis-single-line`；Vue 侧是
 * **挂载后**渲染，`needMeasureEllipsis` 为真时 `cssEllipsis` 会被 effect 置假，类名消失。
 * 这是「SSR 快照 vs 挂载后快照」的通道差异，不是组件行为差异 —— 写进基线只会得到一条
 * 永远需要豁免的噪音。那条路径由 L1/L2（`index.test.ts` 的二分裁剪用例）与
 * L6（真实浏览器）覆盖。基线里只放**纯 CSS 路径**的用例。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明**像素**一致（那是 L6，见 `tests/visual`）
 *   - 没证明 `ellipsis` 的真实排版结果（jsdom 无布局引擎）
 *   - 没证明 `Tooltip` 的浮层 —— Tooltip 组件未落地，缺口登记在 README §7
 */

import { IconProvider } from '@apollo-design/icons';
import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { type Component, defineComponent, h, provide, type VNode, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/typography.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Link, Paragraph, Text, Title, Typography } from '../index';

/** 两侧共用的前缀。与 `tests/compat/baseline/typography.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/** 两侧共用的图标前缀。antd 的默认值（我们的默认是 `apollo-icon`，见文件头）。 */
const ICON_PREFIX = 'anticon';

/** 长文本。与基线生成器里的 `LONG` 必须**逐字相同**（正文进契约）。 */
const LONG =
  'Ant Design, a design language for background applications, is refined by Ant UED Team.';

type Props = Record<string, unknown>;

/**
 * 所有用例的统一外壳：提供图标前缀（`anticon`）+ 可选的 ConfigProvider 配置。
 *
 * 为什么**每个**用例都过这一层（而不是只给图标用例）：比对是**对称**的，
 * 给一半用例换前缀、另一半不换，等于让「前缀从哪来」这件事在两侧不可比。
 */
function wrap(children: () => VNodeChild, config: Partial<ConfigContextValue> = {}) {
  return defineComponent({
    name: 'ATypographyCompatProbe',
    setup() {
      provide(configContextKey, {
        ...DEFAULT_CONFIG_CONTEXT,
        iconPrefixCls: ICON_PREFIX,
        ...config,
      });
      return () =>
        h(IconProvider, { value: { prefixCls: ICON_PREFIX } }, { default: () => children() });
    },
  });
}

/**
 * 带默认插槽。
 *
 * ⚠️ `component` 的类型是 `Component` 而不是 `typeof Text`：`Link` 的 props 多出
 *    `rel` / `target`，`Title` 的 `strong` 被 `Omit` 掉 —— 四者本来就**不是**同一个
 *    props 类型，写 `typeof Text` 会让 `Link` 无法赋值（TS2345）。
 *    这里真正要保证的不是「props 类型相同」，而是「同一份基线在两侧被同一组 props 驱动」。
 */
const withText = (component: Component, props: Props, text: VNodeChild = 'Text'): VNode =>
  h(component, props, { default: () => text });

/** 不带插槽（`slots.default` 必须是 `undefined`，否则 `copyable` 的仅图标模式测不到）。 */
const noText = (component: Component, props: Props): VNode => h(component, props);

/**
 * 用例 id → Vue 侧构造。**必须覆盖基线里的每一个 id**（少渲染一条会失败）。
 *
 * props 必须与 `tests/compat/baseline/typography.mjs` 里同名用例**逐项一致** ——
 * 这是「同一份规格驱动两侧」的含义。
 */
const CASES: Record<string, () => DomRenderResult> = {
  // ---- 1. Typography 本体 ----
  'typography:default': () =>
    wrap(() => h(Typography, { prefixCls: PREFIX }, { default: () => 'Text' })),
  'typography:component-section': () =>
    wrap(() =>
      h(Typography, { prefixCls: PREFIX, component: 'section' }, { default: () => 'Text' }),
    ),
  // 本体不支持 type / ellipsis / strong —— 传了也不产生类名（antd 的形状）
  'typography:unsupported-props': () =>
    wrap(() =>
      h(
        Typography,
        { prefixCls: PREFIX, type: 'danger', ellipsis: true, strong: true },
        { default: () => 'Text' },
      ),
    ),
  'typography:class-both': () =>
    wrap(() => h(Typography, { prefixCls: PREFIX, class: ['a', 'b'] }, { default: () => 'x' })),
  'typography:attrs-passthrough': () =>
    wrap(() => h(Typography, { prefixCls: PREFIX, id: 'my-typo' }, { default: () => 'x' })),
  'typography:style-over-root': () =>
    wrap(() =>
      h(
        Typography,
        { prefixCls: PREFIX, style: { color: 'green' }, styles: { root: { color: 'red' } } },
        { default: () => 'x' },
      ),
    ),
  'typography:no-style': () =>
    wrap(() => h(Typography, { prefixCls: PREFIX }, { default: () => 'x' })),

  // ---- 2. Text · 标签与语义色 ----
  'text:default': () => wrap(() => withText(Text, { prefixCls: PREFIX })),
  'text:type-secondary': () => wrap(() => withText(Text, { prefixCls: PREFIX, type: 'secondary' })),
  'text:type-success': () => wrap(() => withText(Text, { prefixCls: PREFIX, type: 'success' })),
  'text:type-warning': () => wrap(() => withText(Text, { prefixCls: PREFIX, type: 'warning' })),
  'text:type-danger': () => wrap(() => withText(Text, { prefixCls: PREFIX, type: 'danger' })),
  'text:disabled': () => wrap(() => withText(Text, { prefixCls: PREFIX, disabled: true })),
  'text:disabled+danger': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, disabled: true, type: 'danger' }, 'T')),
  'text:component-a': () => wrap(() => withText(Text, { prefixCls: PREFIX, component: 'a' })),

  // ---- 3. 七个装饰 · 单个 + 嵌套顺序 ----
  'text:strong': () => wrap(() => withText(Text, { prefixCls: PREFIX, strong: true }, 'x')),
  'text:underline': () => wrap(() => withText(Text, { prefixCls: PREFIX, underline: true }, 'x')),
  'text:delete': () => wrap(() => withText(Text, { prefixCls: PREFIX, delete: true }, 'x')),
  'text:code': () => wrap(() => withText(Text, { prefixCls: PREFIX, code: true }, 'x')),
  'text:mark': () => wrap(() => withText(Text, { prefixCls: PREFIX, mark: true }, 'x')),
  'text:keyboard': () => wrap(() => withText(Text, { prefixCls: PREFIX, keyboard: true }, 'x')),
  'text:italic': () => wrap(() => withText(Text, { prefixCls: PREFIX, italic: true }, 'x')),
  // ★ 顺序契约：strong 最内、i 最外
  'text:decorations-all': () =>
    wrap(() =>
      withText(
        Text,
        {
          prefixCls: PREFIX,
          strong: true,
          underline: true,
          delete: true,
          code: true,
          mark: true,
          keyboard: true,
          italic: true,
        },
        'x',
      ),
    ),
  'text:mark+code': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, code: true, mark: true }, 'x')),
  'text:strong+underline': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, strong: true, underline: true }, 'x')),

  // ---- 4. Title ----
  'title:default': () => wrap(() => withText(Title, { prefixCls: PREFIX }, 'Title')),
  'title:level-2': () => wrap(() => withText(Title, { prefixCls: PREFIX, level: 2 }, 'T')),
  'title:level-3': () => wrap(() => withText(Title, { prefixCls: PREFIX, level: 3 }, 'T')),
  'title:level-4': () => wrap(() => withText(Title, { prefixCls: PREFIX, level: 4 }, 'T')),
  'title:level-5': () => wrap(() => withText(Title, { prefixCls: PREFIX, level: 5 }, 'T')),
  // ★ 非法 level 退回 h1
  'title:level-invalid': () => wrap(() => withText(Title, { prefixCls: PREFIX, level: 6 }, 'T')),
  'title:level-zero': () => wrap(() => withText(Title, { prefixCls: PREFIX, level: 0 }, 'T')),
  // `strong` 不在 TitleProps 里，但运行时仍透传到 Base（上游的 `{...restProps}` 形状）
  'title:strong-passthrough': () =>
    wrap(() => withText(Title, { prefixCls: PREFIX, strong: true }, 'T')),
  'title:type-danger': () =>
    wrap(() => withText(Title, { prefixCls: PREFIX, type: 'danger' }, 'T')),

  // ---- 5. Paragraph ----
  'paragraph:default': () => wrap(() => withText(Paragraph, { prefixCls: PREFIX }, 'P')),
  'paragraph:type-danger': () =>
    wrap(() => withText(Paragraph, { prefixCls: PREFIX, type: 'danger' }, 'P')),

  // ---- 6. Link ----
  'link:default': () => wrap(() => withText(Link, { prefixCls: PREFIX, href: 'https://x' }, 'L')),
  'link:type-danger': () =>
    wrap(() => withText(Link, { prefixCls: PREFIX, href: 'https://x', type: 'danger' }, 'L')),
  'link:target-blank': () =>
    wrap(() => withText(Link, { prefixCls: PREFIX, href: 'https://x', target: '_blank' }, 'L')),
  'link:rel-explicit': () =>
    wrap(() =>
      withText(Link, { prefixCls: PREFIX, href: 'https://x', target: '_blank', rel: 'me' }, 'L'),
    ),
  'link:rel-empty': () =>
    wrap(() =>
      withText(Link, { prefixCls: PREFIX, href: 'https://x', target: '_blank', rel: '' }, 'L'),
    ),
  'link:underline': () =>
    wrap(() => withText(Link, { prefixCls: PREFIX, href: 'https://x', underline: true }, 'L')),

  // ---- 7. copyable ----
  'copyable:true': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, copyable: true }, 'copy me')),
  'copyable:icon-false': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, copyable: { icon: false } }, 'copy me')),
  'copyable:tooltips-false': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, copyable: { tooltips: false } }, 'copy me')),
  'copyable:no-content': () => wrap(() => noText(Text, { prefixCls: PREFIX, copyable: true })),

  // ---- 8. editable ----
  'editable:true': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, editable: true }, 'Edit me')),
  'editable:trigger-icon': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, editable: { triggerType: ['icon'] } }, 'E')),
  'editable:trigger-text': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, editable: { triggerType: ['text'] } }, 'E')),
  'editable:tab-index': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, editable: { tabIndex: 3 } }, 'E')),

  // ---- 9. actions.placement ----
  'actions:placement-start': () =>
    wrap(() =>
      withText(
        Text,
        { prefixCls: PREFIX, copyable: true, actions: { placement: 'start' } },
        'copy me',
      ),
    ),
  'actions:placement-end': () =>
    wrap(() =>
      withText(
        Text,
        { prefixCls: PREFIX, copyable: true, actions: { placement: 'end' } },
        'copy me',
      ),
    ),

  // ---- 10. ellipsis（**只放 CSS 路径**，理由见文件头）----
  'ellipsis:true': () => wrap(() => withText(Text, { prefixCls: PREFIX, ellipsis: true }, LONG)),
  'ellipsis:rows-1': () =>
    wrap(() => withText(Paragraph, { prefixCls: PREFIX, ellipsis: { rows: 1 } }, LONG)),
  'ellipsis:rows-2': () =>
    wrap(() => withText(Paragraph, { prefixCls: PREFIX, ellipsis: { rows: 2 } }, LONG)),
  'ellipsis:rows-3': () =>
    wrap(() => withText(Paragraph, { prefixCls: PREFIX, ellipsis: { rows: 3 } }, LONG)),
  'ellipsis:false': () => wrap(() => withText(Text, { prefixCls: PREFIX, ellipsis: false }, LONG)),
  'ellipsis:tooltip': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, ellipsis: { tooltip: true } }, LONG)),
  'ellipsis:text-rows-stripped': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, ellipsis: { rows: 3 } }, LONG)),

  // ---- 11. 根节点原生 class / 属性透传 ----
  'class:className': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, class: 'my-class' }, 'x')),
  'class:rootClassName': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, class: 'root-class' }, 'x')),
  'class:both': () => wrap(() => withText(Text, { prefixCls: PREFIX, class: ['a', 'b'] }, 'x')),
  'attrs:passthrough': () => wrap(() => withText(Text, { prefixCls: PREFIX, id: 'my-text' }, 'x')),
  'attrs:title': () => wrap(() => withText(Text, { prefixCls: PREFIX, title: 'hover me' }, 'x')),

  // ---- 12. 语义化 classNames / styles ----
  'semantic:classNames-root': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX, classNames: { root: 'cn-root' } }, 'x')),
  'semantic:classNames-all': () =>
    wrap(() =>
      withText(
        Text,
        {
          prefixCls: PREFIX,
          copyable: true,
          classNames: { root: 'cn-root', actions: 'cn-actions', action: 'cn-action' },
        },
        'x',
      ),
    ),
  // 函数式：`info.props` 是**合并后**的 props（`prefixCls` 已解析成 `apollo`）
  'semantic:classNames-fn': () =>
    wrap(() =>
      withText(
        Text,
        {
          prefixCls: PREFIX,
          classNames: (info: { props: { prefixCls?: string; type?: string } }) => ({
            root: `fn-${String(info.props.prefixCls)}-${String(info.props.type)}`,
          }),
        },
        'x',
      ),
    ),
  'semantic:styles-all': () =>
    wrap(() =>
      withText(
        Text,
        {
          prefixCls: PREFIX,
          copyable: true,
          styles: {
            root: { color: 'red' },
            actions: { opacity: '0.5' },
            action: { padding: '2px' },
          },
        },
        'x',
      ),
    ),
  'semantic:styles-fn': () =>
    wrap(() =>
      withText(Text, { prefixCls: PREFIX, styles: () => ({ root: { color: 'blue' } }) }, 'x'),
    ),

  // ---- 13. style 合并顺序 ----
  'style:style-over-root': () =>
    wrap(() =>
      withText(
        Text,
        { prefixCls: PREFIX, style: { color: 'green' }, styles: { root: { color: 'red' } } },
        'x',
      ),
    ),
  'style:with-line-clamp': () =>
    wrap(() =>
      withText(
        Paragraph,
        { prefixCls: PREFIX, style: { color: 'green' }, ellipsis: { rows: 2 } },
        LONG,
      ),
    ),

  // ---- 14. ConfigProvider ----
  'config:className': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX }, 'x'), {
      components: { typography: { className: 'cfg-class' } },
    }),
  'config:classNames': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX }, 'x'), {
      components: { typography: { classNames: { root: 'cfg-root' } } },
    }),
  'config:style': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX }, 'x'), {
      components: { typography: { style: { color: 'purple' } } },
    }),
  'direction:rtl': () =>
    wrap(() => withText(Text, { prefixCls: PREFIX }, 'x'), { direction: 'rtl' }),

  // ---- 15. 多子组件并列 ----
  'composite:family': () =>
    wrap(() => [
      h(Title, { prefixCls: PREFIX, level: 2 }, { default: () => 'T' }),
      h(Paragraph, { prefixCls: PREFIX, type: 'secondary' }, { default: () => 'P' }),
      h(Text, { prefixCls: PREFIX, strong: true, mark: true }, { default: () => 'S' }),
      h(Link, { prefixCls: PREFIX, href: 'https://x' }, { default: () => 'L' }),
    ]),
};

/**
 * 允许的差异，**逐条列出**且断言「恰好等于这些」。
 *
 * 这是 `domContractTest` 的 `allow` 契约：`expect(actualDiff).toEqual(allowed)`。
 * 所以「这是唯一差异」本身是可证伪的 —— 任何**额外**的漂移都会让用例红。
 */
const ALLOW = {} as const;

domContractTest('Typography', {
  baseline,
  // `render` 必须覆盖基线里的每一个 id —— 少一条会让测试失败，而不是静默跳过。
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Typography semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
  keepStyle: true,
  allow: ALLOW,
});

/** `CASES` 里多出来的 id 会让「少测一条」表现为「测试通过」，所以反向也校验一次。 */
describe('Typography · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
