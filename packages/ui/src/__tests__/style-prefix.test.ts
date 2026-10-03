/**
 * 「前缀守恒」—— 每个组件的 `gen(prefixCls)` 必须对**每个静态前缀**都产出
 * **对应前缀**的选择器。
 *
 * ── 为什么需要这条 ──────────────────────────────────────────────────────────
 *
 * `packages/ui/src/style/index.ts` 的 `STATIC_PREFIX_CLS = ['apollo', 'ant']`
 * ⇒ `genComponentStyleSheet` 会调 `entry.gen(prefix)` **两次**，两份都进
 * `dist/<component>/style.css`。用户把 `ConfigProvider prefixCls="ant"` 打开时，
 * 组件渲染出 `.ant-*` 类名 ⇒ **只有第二份能命中**。
 *
 * ⇒ 判据：`gen('ant')` 里 `.ant-` 的出现次数必须与 `gen('apollo')` 里 `.apollo-` 的
 * 出现次数**相等**（只换前缀，不增不减）。不相等就说明有一批规则的前缀被写死了。
 *
 * ── 🚨 这条测试是怎么来的（2026-10-02）────────────────────────────────────────
 *
 * 起因是 date-picker 的**用户可见**缺口：`dist/date-picker/style.css` 里
 * `.ant-picker-*` 规则 **0 条**，只有 45 条没人用的 `--ant-date-picker-*` 声明
 * ⇒ `prefixCls="ant"` 下 DatePicker **完全没有样式**。
 * 修完 date-picker 后顺手全仓扫了一遍，发现**22 个组件**同类
 * （其中 7 个是「规则体完全静态」，`ant` 版几乎为空）。
 *
 * ── 豁免清单的用法 ──────────────────────────────────────────────────────────
 *
 * `KNOWN_GAPS` 是**待修的缺口**，不是「允许」：修好一个就从清单里删一条，
 * 本测试会**双向**校验 ——
 *   - 清单里没登记、却出现不一致 ⇒ **红**（新引入的缺口，或修完忘了删登记）；
 *   - 清单里登记了、但实际已经一致 ⇒ **红**（豁免项没出现 ⇒ 豁免可自证，不能空转）。
 */

import { describe, expect, it } from 'vitest';
import { COMPONENT_STYLES, STATIC_PREFIX_CLS } from '../style';

/**
 * 已知缺口（**待修**）。键 = 组件名，值 = 一句话原因 + 实测的两个计数。
 *
 * ⚠️ 修好之后**必须**把对应行删掉（否则本测试的第二条断言会红）。
 */
const KNOWN_GAPS: Record<string, string> = {
  // ---- 规则体是**完全静态串**（`.apollo-*` 写死，`gen(p)` 忽略 `p`）⇒ `ant` 版几乎为空
  tabs: '规则体静态串 885→1',
  input: '规则体静态串 734→3',
  upload: '规则体静态串 1051→1',
  tooltip: '规则体静态串 213→0',
  form: '规则体静态串 322→2',
  pagination: '规则体静态串 477→1',
  slider: '规则体静态串 136→1',
  // ---- 部分：**跨组件类名**（`.apollo-icon` / `.apollo-wave` / 别的组件的类）写成字面量
  button: '跨组件类名 2129→2122',
  'float-button': '跨组件类名 108→89',
  progress: '跨组件类名 104→101',
  result: '跨组件类名 29→28',
  popover: '跨组件类名 189→175',
  menu: '跨组件类名 1568→1487',
  dropdown: '跨组件类名 617→488',
  drawer: '跨组件类名 262→261',
  image: '跨组件类名 123→121',
  message: '跨组件类名 385→383',
  notification: '跨组件类名 452→450',
  modal: '跨组件类名 188→147',
  select: '跨组件类名 630→535',
  cascader: '跨组件类名 718→623',
  'tree-select': '跨组件类名 950→851',
  // table：机械移植产物（antd 200 条真实 CSS）；跨组件类名 = filter 下拉里的
  // `.apollo-dropdown/.apollo-dropdown-menu`、嵌套 tree/checkbox/radio/icon 等
  // （与 select/cascader/tree-select 同判 —— 跨组件前缀随消费组件的默认前缀走）。
  table: '跨组件类名（dropdown/tree/menu/icon 子类名，机械移植产物）',
  // transfer：rename 只改 transfer 自身类名/变量名；跨组件引用（icon/btn/pagination-
  // options/table/input，与 antd `${antCls}-table` 同构）随消费组件默认前缀走。
  transfer: '跨组件类名（icon/btn/pagination-options/table/input，机械移植产物）',
};

/** 统计某个产物里 `.apollo-` / `.ant-` 的出现次数。 */
const countOf = (css: string, prefix: string): number =>
  (css.match(new RegExp(`\\.${prefix}-`, 'g')) ?? []).length;

const measure = (name: string): { apollo: number; ant: number } => {
  const entry = COMPONENT_STYLES.find((item) => item.name === name);
  if (!entry) throw new Error(`未知组件 ${name}`);
  const [a = 'apollo', b = 'ant'] = STATIC_PREFIX_CLS as readonly string[];
  return { apollo: countOf(entry.gen(a), a), ant: countOf(entry.gen(b), b) };
};

describe('样式前缀守恒（`gen(p)` 对每个静态前缀都要产出对应选择器）', () => {
  it('两个静态前缀恰好是 `apollo` / `ant`（改这里要同步改本文件）', () => {
    expect([...STATIC_PREFIX_CLS]).toEqual(['apollo', 'ant']);
  });

  it('实际不一致的组件集合 == `KNOWN_GAPS` 的键集合（双向）', () => {
    const actual = COMPONENT_STYLES.filter((entry) => {
      const [a = 'apollo', b = 'ant'] = STATIC_PREFIX_CLS as readonly string[];
      return countOf(entry.gen(a), a) !== countOf(entry.gen(b), b);
    }).map((entry) => entry.name);

    // 方向 A：没登记却出现不一致 ⇒ 新引入的缺口
    const unregistered = actual.filter((n) => !(n in KNOWN_GAPS));
    expect(unregistered, `未登记的前缀缺口（新增的？）: ${unregistered.join(', ')}`).toEqual([]);

    // 方向 B：登记了却已经一致 ⇒ 豁免空转（修完忘了删）
    const stale = Object.keys(KNOWN_GAPS).filter((n) => !actual.includes(n));
    expect(stale, `已修好但仍登记在 KNOWN_GAPS: ${stale.join(', ')}`).toEqual([]);
  });

  it('🚨 已修的组件不在清单里：`date-picker` / `calendar`', () => {
    // date-picker：2026-10-02 修（`genDatePickerRules`）
    const dp = measure('date-picker');
    expect(dp.apollo).toBeGreaterThan(200);
    expect(dp.ant).toBe(dp.apollo);
    // calendar：同日修（`genCalendarPanelRules`）
    const cal = measure('calendar');
    expect(cal.apollo).toBeGreaterThan(200);
    expect(cal.ant).toBe(cal.apollo);
  });

  it('`ant` 版必须**零** `.apollo-` 残留（这两个组件）', () => {
    const [a = 'apollo', b = 'ant'] = STATIC_PREFIX_CLS as readonly string[];
    for (const name of ['date-picker', 'calendar']) {
      const entry = COMPONENT_STYLES.find((item) => item.name === name);
      if (!entry) throw new Error(`未知组件 ${name}`);
      expect(entry.gen(a).includes('.apollo-'), `${name} apollo 版应含 .apollo-`).toBe(true);
      expect(entry.gen(b).includes('.apollo-'), `${name} ant 版不应含 .apollo-`).toBe(false);
    }
  });

  it('`ant` 版必须**保留**全局别名变量（`tokens.css` 只声明 `--apollo-*`）', () => {
    const [b = 'ant'] = [...STATIC_PREFIX_CLS].slice(1);
    for (const name of ['date-picker', 'calendar']) {
      const entry = COMPONENT_STYLES.find((item) => item.name === name);
      if (!entry) throw new Error(`未知组件 ${name}`);
      const ant = entry.gen(b);
      expect(ant.includes('--apollo-color-text'), `${name} 丢了全局别名`).toBe(true);
      expect(ant.includes('--ant-color-text'), `${name} 错改了全局别名`).toBe(false);
    }
  });

  it('缺口清单的规模被钉住（24 个，修一个删一条）', () => {
    expect(Object.keys(KNOWN_GAPS)).toHaveLength(24);
  });
});
