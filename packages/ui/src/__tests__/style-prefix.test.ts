/**
 * 「前缀守恒」—— 每个组件的 `gen(prefixCls)` 必须对**传入的前缀**产出
 * **对应前缀**的选择器。
 *
 * ── 为什么需要这条 ──────────────────────────────────────────────────────────
 *
 * 静态 CSS 是构建期产物（`STATIC_PREFIX_CLS` 里每个前缀各生成一份）。
 * 若某个 `gen(p)` 把 `.apollo-` **写死**在静态串里、忽略入参 `p`，那么给它的第二个前缀
 * 会产出「类名对、但样式空」的一份 —— 用户切过去就**完全没样式**，且不报错。
 *
 * ⇒ 判据：`gen(PROBE)` 里 `.PROBE-` 的出现次数必须与 `gen(DEFAULT)` 里 `.DEFAULT-` 的
 * 出现次数**相等**（只换前缀，不增不减）。不相等就说明有一批规则的前缀被写死了。
 *
 * ── 🚨 这条测试是怎么来的（2026-10-02）────────────────────────────────────────
 *
 * 起因是 date-picker 的**用户可见**缺口：`dist/date-picker/style.css` 里
 * `.ant-picker-*` 规则 **0 条**，只有 45 条没人用的 `--ant-date-picker-*` 声明
 * ⇒ `prefixCls="ant"` 下 DatePicker **完全没有样式**。
 * 修完 date-picker 后顺手全仓扫了一遍，发现**另有 24 个组件**同类
 * （其中 7 个是「规则体完全静态」，换前缀后几乎为空）。
 *
 * ── ⚠️ 2026-10-07：为什么改用「探针前缀」而不是 `STATIC_PREFIX_CLS[1]` ──────────
 *
 * 裁决 `css-ant-prefix-cost` = **B**：`STATIC_PREFIX_CLS` 从 `['apollo','ant']` 缩成
 * `['apollo']`（砍掉 `ant`，组件 CSS 因此少了 32.8%）。
 *
 * **但「`gen(p)` 必须吃 `p`」这条不变量不能跟着一起删** —— 一旦删除，
 * 将来谁想加第二个前缀，就会在**没有任何预警**的情况下再踩一次 2026-10-02 那个坑。
 * 所以比对改成拿一个**不在产物里的探针前缀**（`PROBE_PREFIX`）去跑：
 * 护栏照旧生效，只是不再把第二份 CSS 打进产物。
 *
 * ⇒ 换句话说：`KNOWN_GAPS` 里那 24 条的语义变了 ——
 *    从「`prefixCls="ant"` 现在是坏的」变成「**加第二个前缀前必须先修这些**」。
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

/** 产物里的默认前缀（`STATIC_PREFIX_CLS` 的第一个）。 */
const DEFAULT_PREFIX = STATIC_PREFIX_CLS[0];

/**
 * 只用于**校验**的前缀：刻意不在 `STATIC_PREFIX_CLS` 里，所以不会进产物。
 * ⚠️ 别改成已存在的前缀 —— 那会让本测试退化成「什么都没测」。
 */
const PROBE_PREFIX = 'zzprobe';

/**
 * 已知缺口（**待修**）。键 = 组件名，值 = 一句话原因 + 实测的两个计数
 * （`DEFAULT_PREFIX → PROBE_PREFIX`）。
 *
 * ⚠️ 修好之后**必须**把对应行删掉（否则本测试的第二条断言会红）。
 */
const KNOWN_GAPS: Record<string, string> = {
  // ---- 规则体是**完全静态串**（`.apollo-*` 写死，`gen(p)` 忽略 `p`）⇒ 换前缀后几乎为空
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

/**
 * `apollo` 版里**硬编码** `.ant-*` 选择器的组件。**当前为空 —— 保持为空。**
 *
 * ── 历史（2026-10-07 发现并修完）──────────────────────────────────────────────
 *
 * 砍掉 `ant` 前缀变体（裁决 `css-ant-prefix-cost` = B）之后，暴露出 2 个组件在
 * **`apollo` 版**里硬编码了 `.ant-*`：
 *   · `menu`     → `.ant-typography-ellipsis-single-line` / `.ant-layout-header`
 *   · `dropdown` → `.ant-btn` / `.ant-btn-icon`（「触发器是 Button 时下拉箭头的字号」）
 *
 * 判据：这些都是**跨组件**类名（Typography / Layout / Button），而对应组件在本仓渲染的是
 * `.apollo-*` ⇒ 在默认前缀下**永远命中不了**，是死规则。
 * 追到 antd 源头是 `transfer/Section.js` 那类 `antCls` 常量 —— 但 antd 那边 `antCls`
 * 恰好等于它自己的默认前缀所以能命中，我们照搬字面量就永远不命中 ⇒ **是端口错误，不是照搬有理**。
 *
 * 修法：改成 `.apollo-*`。这些规则随后会**真的开始匹配**，所以必须跑 L6 确认
 * （实测：menu / dropdown / layout / table / select / cascader 全量 1134 张仍逐像素一致）。
 *
 * ⚠️ 注释里提到的 `.ant-menu-css-var` / `.ant-dropdown-css-var` 是**注释文字**，
 *    不是选择器 —— 本断言会先剥注释再比对，不会误报。
 */
const HARDCODED_ANT_IN_DEFAULT: Record<string, string> = {};

/** 剥掉 CSS 注释（否则注释里提到的 `.ant-` 会被误判成选择器）。 */
const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** 统计某个产物里 `.${prefix}-` 的出现次数。 */
const countOf = (css: string, prefix: string): number =>
  (css.match(new RegExp(`\\.${prefix}-`, 'g')) ?? []).length;

const genOf = (name: string): ((p: string) => string) => {
  const entry = COMPONENT_STYLES.find((item) => item.name === name);
  if (!entry) throw new Error(`未知组件 ${name}`);
  return entry.gen;
};

const measure = (name: string): { base: number; probe: number } => {
  const gen = genOf(name);
  return {
    base: countOf(gen(DEFAULT_PREFIX), DEFAULT_PREFIX),
    probe: countOf(gen(PROBE_PREFIX), PROBE_PREFIX),
  };
};

describe('样式前缀守恒（`gen(p)` 必须对入参前缀产出对应选择器）', () => {
  it('静态前缀只有 `apollo`（裁决 `css-ant-prefix-cost` = B 砍掉 ant）', () => {
    // 钉住产物约定：加第二个前缀会让组件 CSS 线性翻倍，必须先跑通本文件的探针比对。
    expect([...STATIC_PREFIX_CLS]).toEqual(['apollo']);
  });

  it('探针前缀不在 `STATIC_PREFIX_CLS` 里（否则本测试会退化成空转）', () => {
    expect([...STATIC_PREFIX_CLS]).not.toContain(PROBE_PREFIX);
  });

  it('实际不一致的组件集合 == `KNOWN_GAPS` 的键集合（双向）', () => {
    const actual = COMPONENT_STYLES.filter(
      (entry) =>
        countOf(entry.gen(DEFAULT_PREFIX), DEFAULT_PREFIX) !==
        countOf(entry.gen(PROBE_PREFIX), PROBE_PREFIX),
    ).map((entry) => entry.name);

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
    expect(dp.base).toBeGreaterThan(200);
    expect(dp.probe).toBe(dp.base);
    // calendar：同日修（`genCalendarPanelRules`）
    const cal = measure('calendar');
    expect(cal.base).toBeGreaterThan(200);
    expect(cal.probe).toBe(cal.base);
  });

  it('换前缀后必须**零** `.apollo-` 残留（这两个组件）', () => {
    for (const name of ['date-picker', 'calendar']) {
      const gen = genOf(name);
      expect(
        gen(DEFAULT_PREFIX).includes(`.${DEFAULT_PREFIX}-`),
        `${name} 默认版应含 .${DEFAULT_PREFIX}-`,
      ).toBe(true);
      expect(gen(PROBE_PREFIX).includes('.apollo-'), `${name} 换前缀后不应含 .apollo-`).toBe(false);
    }
  });

  it('换前缀后必须**保留**全局别名变量（`tokens.css` 只声明 `--apollo-*`）', () => {
    for (const name of ['date-picker', 'calendar']) {
      const probe = genOf(name)(PROBE_PREFIX);
      expect(probe.includes('--apollo-color-text'), `${name} 丢了全局别名`).toBe(true);
      expect(
        probe.includes(`--${PROBE_PREFIX}-color-text`),
        `${name} 错改了全局别名（全局别名必须不动）`,
      ).toBe(false);
    }
  });

  it('缺口清单的规模被钉住（24 个，修一个删一条）', () => {
    expect(Object.keys(KNOWN_GAPS)).toHaveLength(24);
  });

  it('`apollo` 版里不得硬编码 `.ant-` 选择器（清单当前为空，防回归）', () => {
    // 为什么值得钉：默认前缀下 `.ant-*` 永不命中，是死规则（2026-10-07 修完 2 个组件）。
    // 清单为空时「双向」退化为单向断言，但仍然拦得住回归 —— 别因为空就删掉这条测试。
    const actual = COMPONENT_STYLES.filter((entry) =>
      stripComments(entry.gen(DEFAULT_PREFIX)).includes('.ant-'),
    ).map((entry) => entry.name);

    const unregistered = actual.filter((n) => !(n in HARDCODED_ANT_IN_DEFAULT));
    expect(unregistered, `新出现的硬编码 .ant- 选择器: ${unregistered.join(', ')}`).toEqual([]);

    const stale = Object.keys(HARDCODED_ANT_IN_DEFAULT).filter((n) => !actual.includes(n));
    expect(stale, `已修好但仍登记在 HARDCODED_ANT_IN_DEFAULT: ${stale.join(', ')}`).toEqual([]);
  });

  it('全组件 CSS 不得引用 cssinjs 开发态占位动画名（U-KEYFRAMES，2026-10-08）', () => {
    // `css-dev-only-do-not-override-…` 是 cssinjs **运行时**注入时才有的哈希壳：
    // 静态 CSS 里照抄它 ⇒ `@keyframes` 永远对不上 ⇒ 动画不跑、`animationend`
    // 不触发、motion 类名卡死在 appear/enter 态（dom-probe upload/basic 实测）。
    // 已修：upload(fade/inline) / tabs / date-picker(slide) / tree(node-fx)。
    const offenders = COMPONENT_STYLES.filter((entry) =>
      entry.gen(DEFAULT_PREFIX).includes('css-dev-only-do-not-override'),
    ).map((entry) => entry.name);
    expect(offenders, `仍在引用占位动画名的组件: ${offenders.join(', ')}`).toEqual([]);
  });
});
