/**
 * extract-calendar-css.mjs — dump antd 6.6.4 Calendar 的 CSS 产物 / Component Token。
 *
 * 用法：
 *   node tests/visual/debug/extract-calendar-css.mjs            # 原始 CSS 产物
 *   node tests/visual/debug/extract-calendar-css.mjs --tokens   # Component Token + 变量声明
 *
 * ── 与 date-picker 提取脚本的一处关键不同 ──────────────────────────────────────
 *
 * `Calendar` **没有浮层**（面板是**内联**的：`<CalendarHeader/> + <PickerPanel hideHeader/>`）
 * ⇒ SSR 就能拿到全量产物，**不需要** `PurePanel` 那套绕过 Portal 的手法。
 *
 * ⚠️ `Calendar` 的 `prefixCls` 是 **`getPrefixCls('picker')`** ⇒ 类名是
 * `ant-picker-calendar`（**不是** `ant-calendar`），且面板规则复用 `ant-picker-panel` 那套。
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const antdPath = require.resolve('antd');
const antdRoot = antdPath.slice(
  0,
  antdPath.indexOf('antd/es') >= 0 ? antdPath.indexOf('antd/es') : antdPath.indexOf('antd/dist'),
);
const cssinjsPath = require.resolve('@ant-design/cssinjs', { paths: [antdRoot] });

const { createCache, extractStyle, StyleProvider } = require(cssinjsPath);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { Calendar, ConfigProvider } = require('antd');

const cache = createCache();
const h = React.createElement;
const dayjs = require(
  require.resolve('dayjs', {
    paths: [
      antdRoot.slice(
        0,
        antdRoot.indexOf('antd/es') >= 0
          ? antdRoot.indexOf('antd/es')
          : antdRoot.indexOf('antd/dist'),
      ),
    ],
  }),
);

const V = dayjs('2026-09-30');

const el = h(
  StyleProvider,
  { cache },
  h(
    ConfigProvider,
    { theme: { cssVar: true } },
    h(
      'div',
      null,
      // 全屏（默认）
      h(Calendar, { value: V }),
      // 迷你
      h(Calendar, { value: V, fullscreen: false }),
      // 年模式（header 里多一个 month-select）
      h(Calendar, { value: V, mode: 'year' }),
      // 周号
      h(Calendar, { value: V, showWeek: true }),
      // validRange（年份下拉的范围分支）
      h(Calendar, { value: V, validRange: [dayjs('2020-01-01'), dayjs('2027-12-31')] }),
      // 语义化槽（root/header 由 Calendar 用，body/content/item/itemContent 给面板）
      h(Calendar, {
        value: V,
        classNames: {
          root: 'my-root',
          header: 'my-header',
          body: 'my-body',
          itemContent: 'my-item-content',
        },
      }),
    ),
  ),
);
renderToStaticMarkup(el);
const css = extractStyle(cache);

const tokens = process.argv.includes('--tokens');

if (!tokens) {
  console.log(css);
} else {
  // 只打印 `--ant-calendar-*` 的声明（按出现顺序去重）
  const decls = [];
  for (const m of css.matchAll(/--ant-calendar-([a-z0-9-]+):([^;}]+)[;}]/g)) {
    const pair = [m[1], m[2]];
    if (!decls.some((d) => d[0] === pair[0] && d[1] === pair[1])) decls.push(pair);
  }
  console.log('### --ant-calendar-* 声明');
  for (const [k, v] of decls) console.log(`--ant-calendar-${k} = ${v}`);

  // 引用面（`var(--ant-calendar-*)`）
  const refs = new Set();
  for (const m of css.matchAll(/var\(--ant-calendar-([a-z0-9-]+)/g)) refs.add(m[1]);
  console.log('\n### 引用但**未声明**的 --ant-calendar-*');
  console.log([...refs].filter((r) => !decls.some((d) => d[0] === r)).join(', ') || '（无）');

  // 规则数
  const ruleCount = (css.match(/\{/g) ?? []).length;
  const calendarRules = (css.match(/\.ant-picker-calendar/g) ?? []).length;
  console.log(
    `\n### 规模\n总 '{' 数 = ${ruleCount}；含 .ant-picker-calendar 的规则片段 = ${calendarRules}`,
  );
}
