/**
 * 探针：antd 6.6.4 `TimePicker` 的**告警矩阵**与**ConfigProvider 上下文路由**。
 *
 * 用法：
 *   node tests/visual/debug/probe-time-picker-antd.mjs
 *
 * ── 为什么需要它（G1 的实测，不凭印象）────────────────────────────────────────
 *
 * `TimePicker` 是 `DatePicker` 的薄壳，但**哪一层吞掉哪个 prop**决定了告警的有无，
 * 而这一点从 `.d.ts` 完全看不出来（三个 prop 都标着 `@deprecated`，却只有一部分真发告警）：
 *
 * | prop | 单个 `TimePicker` | `TimePicker.RangePicker` |
 * |---|---|---|
 * | `addon` | ✅ 发（`[antd: TimePicker]`） | —（类型上就没有） |
 * | `onSelect` | ✅ 发（`[antd: TimePicker]`） | ✅ 发（`[antd: DatePicker.RangePicker]`） |
 * | `popupClassName` | ❌ **不发**（外层解构掉了） | ✅ 发（外层 `{...props}` 原样透传） |
 * | `popupStyle` | ❌ **不发**（同上） | ✅ 发 |
 * | `bordered` | ❌ **不发**（外层解构掉了，只用来算 `variant`） | ✅ 发 |
 *
 * 另一半是**上下文路由**（决定了我们该把哪份 `ConfigProvider` 配置接给谁）：
 *
 * | 场景 | 结果 |
 * |---|---|
 * | `timePicker={{classNames:{root:'ctx-root'}}}` + `<TimePicker/>` | 根类名出现 **`ctx-root` 两次**（外层 + 内层各合并一次） |
 * | `datePicker={{classNames:{root:'dp-root'}}}` + `<TimePicker/>` | **不出现** `dp-root` |
 * | `timePicker={{classNames:{root:'ctx-root'}}}` + `<DatePicker picker="time"/>` | **不出现** `ctx-root`（它读 `datePicker`） |
 *
 * ⇒ 内层 `DatePicker.TimePicker` 的 `pickerType` 是 **`'timePicker'`**（不是 `datePicker`），
 * 判据是 `generateSinglePicker.tsx` 的
 * `const pickerType = displayName === TIMEPICKER ? 'timePicker' : 'datePicker'`。
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const antdPath = require.resolve('antd');
const antdRoot = antdPath.slice(
  0,
  antdPath.indexOf('antd/es') >= 0 ? antdPath.indexOf('antd/es') : antdPath.indexOf('antd/dist'),
);

const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { ConfigProvider, DatePicker, TimePicker } = require(antdPath);

const h = React.createElement;
const noop = () => {};

/** 只把**根元素**的 class 抽出来（第一个 `class="..."`）。 */
const rootClass = (html) => {
  const m = html.match(/class="([^"]*)"/);
  return m ? m[1] : '(none)';
};

const cases = [
  ['TimePicker · 裸', h(TimePicker, {})],
  ['TimePicker · bordered=false', h(TimePicker, { bordered: false })],
  ['TimePicker · popupClassName', h(TimePicker, { popupClassName: 'x' })],
  ['TimePicker · popupStyle', h(TimePicker, { popupStyle: { color: 'red' } })],
  ['TimePicker · onSelect', h(TimePicker, { onSelect: noop })],
  ['TimePicker · addon', h(TimePicker, { addon: () => h('span') })],
  ['TimePicker · renderExtraFooter', h(TimePicker, { renderExtraFooter: () => h('span') })],
  ['TimePicker · dropdownClassName', h(TimePicker, { dropdownClassName: 'x' })],
  ['TimePicker · variant=filled', h(TimePicker, { variant: 'filled' })],
  ['TimePicker · mode=month（应被 mode={undefined} 覆盖）', h(TimePicker, { mode: 'month' })],
  ['TimePicker.RangePicker · 裸', h(TimePicker.RangePicker, {})],
  ['TimePicker.RangePicker · bordered=false', h(TimePicker.RangePicker, { bordered: false })],
  ['TimePicker.RangePicker · popupClassName', h(TimePicker.RangePicker, { popupClassName: 'x' })],
  ['TimePicker.RangePicker · onSelect', h(TimePicker.RangePicker, { onSelect: noop })],
  [
    'ConfigProvider timePicker.suffixIcon + TimePicker',
    h(
      ConfigProvider,
      { timePicker: { suffixIcon: h('i', { className: 'tp-suffix' }) } },
      h(TimePicker, {}),
    ),
  ],
  [
    'ConfigProvider datePicker.suffixIcon + TimePicker',
    h(
      ConfigProvider,
      { datePicker: { suffixIcon: h('i', { className: 'dp-suffix' }) } },
      h(TimePicker, {}),
    ),
  ],
  [
    'ConfigProvider timePicker.classNames + TimePicker',
    h(ConfigProvider, { timePicker: { classNames: { root: 'ctx-root' } } }, h(TimePicker, {})),
  ],
  [
    'ConfigProvider datePicker.classNames + TimePicker',
    h(ConfigProvider, { datePicker: { classNames: { root: 'dp-root' } } }, h(TimePicker, {})),
  ],
  [
    'ConfigProvider timePicker.classNames + DatePicker picker=time',
    h(
      ConfigProvider,
      { timePicker: { classNames: { root: 'ctx-root' } } },
      h(DatePicker, { picker: 'time' }),
    ),
  ],
  [
    'ConfigProvider datePicker.classNames + DatePicker picker=time',
    h(
      ConfigProvider,
      { datePicker: { classNames: { root: 'dp-root' } } },
      h(DatePicker, { picker: 'time' }),
    ),
  ],
];

for (const [name, el] of cases) {
  const warnings = [];
  const original = console.error;
  console.error = (...args) => warnings.push(args.join(' '));
  let html = '';
  try {
    html = renderToStaticMarkup(el);
  } catch (error) {
    html = `ERR ${error.message}`;
  } finally {
    console.error = original;
  }

  console.log(`### ${name}`);
  console.log(`  warn       : ${warnings.length ? warnings.join(' | ') : '(none)'}`);
  console.log(`  root class : ${rootClass(html)}`);
}
