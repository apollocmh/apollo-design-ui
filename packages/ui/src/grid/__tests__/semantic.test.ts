/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Grid（Row + Col）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/grid.dom.json`，由 `tests/compat/baseline/grid.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 Row/Col 产出。
 * 机械 oracle。`keepStyle: true`：gutter 的 margin/padding、flex、minWidth hack
 * 的内联样式是本组件最容易写错的地方（docs/analysis/grid.md §2.3/2.5）。
 *
 * ── 前缀约定（同 divider/flex）────────────────────────────────────────────────
 *
 * Row 用例传 `prefixCls: 'apollo'`（根类名 'apollo'），Col 用例传
 * `prefixCls: 'apollo-col'`（根类名 'apollo-col'）—— 两侧传同一个值，逐字比对。
 * 默认前缀由 `*:prefix-cls:no-props` 两条用例覆盖（D6）。
 *
 * ── 刻意不在基线里的用例 ─────────────────────────────────────────────────────
 *
 * **响应式 gutter 对象**：React SSR screens=null（useLayoutEffect 不执行）→
 * useGutter 兜底全命中；我们 jsdom 真实挂载 subscribe 立即回调 screens={全 false}。
 * 两条路径的 screens 语义不同，不是实现差异 —— 由 L1 的 matchMedia mock 驱动覆盖。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明 media query 在真实浏览器的行为（L6 固定 viewport 截图）
 *   - 没证明 24 栏 CSS 的宽度百分比正确（L6）
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/grid.dom.json';
import { Col, Row } from '../index';

/** Row 用例的全前缀。与 baseline 脚本的 `ROW` 一致。 */
const ROW_PREFIX = 'apollo';
/** Col 用例的全前缀。与 baseline 脚本的 `COLP` 一致。 */
const COL_PREFIX = 'apollo-col';

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'row:basic': { render: () => h(Row, { prefixCls: ROW_PREFIX }, () => h('div', null, 'x')) },
  'row:prefix-cls:no-props': { render: () => h(Row, {}, () => h('div', null, 'x')) },
  'row:wrap-false': {
    render: () => h(Row, { prefixCls: ROW_PREFIX, wrap: false }, () => h('div', null, 'x')),
  },
  'row:justify-center': {
    render: () => h(Row, { prefixCls: ROW_PREFIX, justify: 'center' }, () => h('div', null, 'x')),
  },
  'row:align-middle': {
    render: () => h(Row, { prefixCls: ROW_PREFIX, align: 'middle' }, () => h('div', null, 'x')),
  },
  'row:justify-align': {
    render: () =>
      h(Row, { prefixCls: ROW_PREFIX, justify: 'space-between', align: 'bottom' }, () =>
        h('div', null, 'x'),
      ),
  },
  'row:justify-invalid': {
    render: () =>
      h(Row, { prefixCls: ROW_PREFIX, justify: 'invalid' as never }, () => h('div', null, 'x')),
  },
  'row:gutter-number': {
    render: () => h(Row, { prefixCls: ROW_PREFIX, gutter: 16 }, () => h('div', null, 'x')),
  },
  'row:gutter-array': {
    render: () => h(Row, { prefixCls: ROW_PREFIX, gutter: [16, 24] }, () => h('div', null, 'x')),
  },
  'row:gutter-string': {
    render: () => h(Row, { prefixCls: ROW_PREFIX, gutter: '1rem' }, () => h('div', null, 'x')),
  },
  'row:gutter-zero': {
    render: () => h(Row, { prefixCls: ROW_PREFIX, gutter: [0, 16] }, () => h('div', null, 'x')),
  },
  'col:basic': {
    render: () => h(Col, { prefixCls: COL_PREFIX, span: 6 }, () => h('div', null, 'x')),
  },
  'col:prefix-cls:no-props': { render: () => h(Col, {}, () => h('div', null, 'x')) },
  'col:span-0': {
    render: () => h(Col, { prefixCls: COL_PREFIX, span: 0 }, () => h('div', null, 'x')),
  },
  'col:offset-push-pull-order': {
    render: () =>
      h(Col, { prefixCls: COL_PREFIX, span: 6, offset: 4, push: 2, pull: 1, order: 3 }, () =>
        h('div', null, 'x'),
      ),
  },
  'col:offset-zero': {
    render: () => h(Col, { prefixCls: COL_PREFIX, span: 6, offset: 0 }, () => h('div', null, 'x')),
  },
  'col:flex-auto': {
    render: () => h(Col, { prefixCls: COL_PREFIX, flex: 'auto' }, () => h('div', null, 'x')),
  },
  'col:flex-number': {
    render: () => h(Col, { prefixCls: COL_PREFIX, flex: 2 }, () => h('div', null, 'x')),
  },
  'col:flex-length': {
    render: () => h(Col, { prefixCls: COL_PREFIX, flex: '100px' }, () => h('div', null, 'x')),
  },
  'col:flex-zero': {
    render: () => h(Col, { prefixCls: COL_PREFIX, flex: 0 }, () => h('div', null, 'x')),
  },
  'col:responsive-number': {
    render: () => h(Col, { prefixCls: COL_PREFIX, xs: 2, sm: 4, md: 6 }, () => h('div', null, 'x')),
  },
  'col:responsive-obj': {
    render: () =>
      h(
        Col,
        { prefixCls: COL_PREFIX, xs: { span: 5, offset: 1 }, lg: { span: 6, offset: 2 } },
        () => h('div', null, 'x'),
      ),
  },
  'col:responsive-flex': {
    render: () =>
      h(Col, { prefixCls: COL_PREFIX, sm: { flex: 'auto' }, md: { flex: '100px' } }, () =>
        h('div', null, 'x'),
      ),
  },
  'grid:row-col-min-width-hack': {
    render: () =>
      h(Row, { prefixCls: 'rowp', wrap: false, gutter: 16 }, () =>
        h(Col, { prefixCls: 'colp', flex: 'auto' }, () => h('div', null, 'x')),
      ),
  },
};

domContractTest('Grid', {
  baseline,
  keepStyle: true,
  allow: {
    // 默认前缀不同（D6）：antd `ant-row`/`ant-col` vs 我们 `apollo-row`/`apollo-col`。
    'row:prefix-cls:no-props': {
      reason: 'D6 · 默认前缀 apollo-row vs ant-row',
      deviationId: 'D6',
      diff: ['$/div[0]: 类名不同 [ant-row] vs [apollo-row]'],
    },
    'col:prefix-cls:no-props': {
      reason: 'D6 · 默认前缀 apollo-col vs ant-col',
      deviationId: 'D6',
      diff: ['$/div[0]: 类名不同 [ant-col] vs [apollo-col]'],
    },
    // 响应式 flex 的 CSS 变量名跟根前缀走（getPrefixCls() 的返回值）：
    // React 侧 `--ant-col-*`、我们 `--apollo-col-*`。D6 的连带效应。
    'col:responsive-flex': {
      reason: 'D6 · 响应式 flex 的 CSS 变量名含根前缀（--ant-col-* vs --apollo-col-*）',
      deviationId: 'D6',
      diff: [
        '$/div[0]: style 不同 [--ant-col-md-flex:00100px;--ant-col-sm-flex:11auto] vs [--apollo-col-md-flex:00100px;--apollo-col-sm-flex:11auto]',
      ],
    },
    // 字符串 gutter 的 calc：React SSR 原样输出 `calc(1rem / -2)`；我们经真实 DOM 的
    // CSSOM 读回被化简为 `calc(-0.5rem)`。CSS 语义等价，序列化路径差异（PLATFORM）。
    'row:gutter-string': {
      reason: 'PLATFORM · CSSOM 化简 calc(1rem / -2) → calc(-0.5rem)，语义等价',
      diff: ['$/div[0]: style 不同 [margin-inline:calc(1rem/-2)] vs [margin-inline:calc(-0.5rem)]'],
    },
    // 同上：CSSOM 把 min-width:0 规范化为 0px（语义等价）。
    'grid:row-col-min-width-hack': {
      reason: 'PLATFORM · CSSOM 规范化 min-width:0 → 0px，语义等价',
      diff: [
        '$/div[0]/div[0]: style 不同 [flex:11auto;min-width:0;padding-inline:8px] vs [flex:11auto;min-width:0px;padding-inline:8px]',
      ],
    },
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`[Grid L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
