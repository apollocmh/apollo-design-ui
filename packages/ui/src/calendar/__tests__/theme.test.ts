/**
 * L7 主题 —— Calendar 的 Component Token 与规则体。
 *
 * 契约来源：antd 6.6.4 `es/calendar/style/index.js` 的**真实产物**
 * （`node tests/visual/debug/extract-calendar-css.mjs`）。
 *
 * 这组用例钉三件事：
 *   1. **27 个** `--apollo-calendar-*` 的**名字与顺序**（含 `internal_fixed_item_margin` 这条
 *      —— 它是 PITFALLS 229 的哨兵，探针正则漏 `_` 时会读成 26）。
 *   2. **B7 双向比对**：规则引用的自有变量必须全部在声明清单里（拼错/换名漏了会红）。
 *   3. **前缀参数化**：`genCalendarStyle('ant')` 必须产出 `.ant-picker-calendar` 选择器
 *      —— 这是 `date-picker` 的已知缺口（它的规则写死 `.apollo-`），本组件**不复刻**。
 */
import { describe, expect, it } from 'vitest';
import { genCalendarStyle, genCalendarTokenDecls } from '../style';
import { CALENDAR_DERIVED, type CalendarSeedToken, prepareComponentToken } from '../style/token';

const DECLS = genCalendarTokenDecls('apollo');
/** 声明清单（`--apollo-calendar-xxx`）。 */
const DECLARED = DECLS.map((d) => d.trim().replace(/:.*$/, ''));
const CSS = genCalendarStyle('apollo');

describe('Calendar · L7 token 声明块（27 条）', () => {
  it('恰好 27 条 = 6 自有 + 21 面板（含内部量）', () => {
    // 🚨 27 而不是 26 —— 探针正则漏下划线会把 `internal_fixed_item_margin` 丢掉
    expect(DECLS).toHaveLength(27);
    expect(new Set(DECLARED).size).toBe(27);
  });

  it('前 6 条是自有 token，第 7 条是内部量（`...initPanelComponentToken` 的键序）', () => {
    expect(DECLARED.slice(0, 6)).toEqual([
      '--apollo-calendar-full-bg',
      '--apollo-calendar-full-panel-bg',
      '--apollo-calendar-item-active-bg',
      '--apollo-calendar-year-control-width',
      '--apollo-calendar-month-control-width',
      '--apollo-calendar-mini-content-height',
    ]);
    // `initPanelComponentToken` 返回的 21 个键里第一个就是它
    expect(DECLARED[6]).toBe('--apollo-calendar-internal_fixed_item_margin');
  });

  it('`internal_fixed_item_margin` 保留下划线（不是 `internal-fixed-item-margin`）', () => {
    expect(DECLARED.includes('--apollo-calendar-internal_fixed_item_margin')).toBe(true);
    expect(DECLARED.includes('--apollo-calendar-internal-fixed-item-margin')).toBe(false);
    // 值是 `Math.floor(paddingXXS / 2)` = 2
    expect(DECLS.find((d) => d.includes('internal_fixed_item_margin'))).toContain('2px');
  });

  it('6 个自有 token 的解析值', () => {
    const byName = new Map(
      DECLS.map((d) => {
        const [k, v] = d.trim().replace(/;$/, '').split(':');
        return [k ?? '', v ?? ''];
      }),
    );
    // 别名 → `var(--apollo-*)`（有意差异，见 token.ts 文件头）
    expect(byName.get('--apollo-calendar-full-bg')).toBe('var(--apollo-color-bg-container)');
    expect(byName.get('--apollo-calendar-full-panel-bg')).toBe('var(--apollo-color-bg-container)');
    expect(byName.get('--apollo-calendar-item-active-bg')).toBe(
      'var(--apollo-control-item-bg-active)',
    );
    // 字面量 → 补 px
    expect(byName.get('--apollo-calendar-year-control-width')).toBe('80px');
    expect(byName.get('--apollo-calendar-month-control-width')).toBe('70px');
    expect(byName.get('--apollo-calendar-mini-content-height')).toBe('256px');
  });

  it('面板的 21 个键与 date-picker 的 `initPanelComponentToken` 逐字相同（只是换了命名空间）', () => {
    const panelKeys = DECLARED.slice(6).map((k) => k.replace('--apollo-calendar-', ''));
    expect(panelKeys).toEqual([
      'internal_fixed_item_margin',
      'cell-hover-bg',
      'cell-active-with-range-bg',
      'cell-hover-with-range-bg',
      'cell-range-border-color',
      'cell-bg-disabled',
      'time-column-width',
      'time-column-height',
      'time-cell-height',
      'cell-width',
      'cell-height',
      'text-height',
      'without-time-cell-height',
      'multiple-item-bg',
      'multiple-item-border-color',
      'multiple-item-height',
      'multiple-item-height-sm',
      'multiple-item-height-lg',
      'multiple-selector-bg-disabled',
      'multiple-item-color-disabled',
      'multiple-item-border-color-disabled',
    ]);
  });
});

describe('Calendar · L7 B7 双向比对（声明 ↔ 规则引用）', () => {
  const used = new Set(
    [...CSS.matchAll(/var\((--apollo-calendar-[a-z0-9_-]+)/g)]
      .map((m) => m[1] as string)
      .filter((x): x is string => x !== undefined),
  );
  const declaredSet = new Set(DECLARED);

  it('规则引用的自有变量**全部**在声明清单里', () => {
    const missing = [...used].filter((u) => !declaredSet.has(u)).sort();
    expect(missing).toEqual([]);
  });

  it('规则确实引用了自有变量（否则上一条是空转）', () => {
    expect(used.size).toBeGreaterThanOrEqual(10);
    expect(used.has('--apollo-calendar-text-height')).toBe(true);
    expect(used.has('--apollo-calendar-cell-width')).toBe(true);
    expect(used.has('--apollo-calendar-full-bg')).toBe(true);
  });

  it('死变量清单是固定的（允许存在，但数量与名字要钉住）', () => {
    // 与 date-picker 同判：「死变量」是**允许**的 —— 有一部分值被构建期内联进规则
    //（`cellHoverWithRangeBg` 的 `lighten(35)` / `cellRangeBorderColor` 的 `lighten(20)`），
    // 声明出来只为「27 个逐字对齐」这条判据。Calendar 没有 `multiple`，
    // 所以 `multiple-*` 那一族 + 内部量也是死的。实测 **11** 个。
    const dead = DECLARED.filter((d) => !used.has(d)).sort();
    expect(dead).toEqual([
      '--apollo-calendar-cell-hover-with-range-bg',
      '--apollo-calendar-cell-range-border-color',
      '--apollo-calendar-internal_fixed_item_margin',
      '--apollo-calendar-multiple-item-bg',
      '--apollo-calendar-multiple-item-border-color',
      '--apollo-calendar-multiple-item-border-color-disabled',
      '--apollo-calendar-multiple-item-color-disabled',
      '--apollo-calendar-multiple-item-height',
      '--apollo-calendar-multiple-item-height-lg',
      '--apollo-calendar-multiple-item-height-sm',
      '--apollo-calendar-multiple-selector-bg-disabled',
    ]);
  });
});

describe('Calendar · L7 规则体（前缀参数化 + 面板复用）', () => {
  it('🚨 `genCalendarStyle("ant")` 产出 `.ant-picker-calendar` 选择器（不复刻 date-picker 的缺口）', () => {
    const ant = genCalendarStyle('ant');
    expect((ant.match(/\.ant-picker-calendar/g) ?? []).length).toBeGreaterThan(100);
    expect(ant.includes('.apollo-picker-calendar')).toBe(false);
    // 变量命名空间也跟着换
    expect(ant.includes('--ant-calendar-full-bg:')).toBe(true);
    expect(ant.includes('--apollo-calendar-full-bg:')).toBe(false);
  });

  it('🚨 `ant` 版**一个 `.apollo-` 类名都不剩**（含面板规则的其余类名）', () => {
    // ⚠️ 这条是本文件最初漏掉的判据：只断言了 `.apollo-picker-calendar` 不在，
    //    而面板规则的其余类名（`.apollo-picker-panel` / `-header` / `-cell` …）没换，
    //    实测 `apollo` 517 处 vs `ant` 264 处 ⇒ `ant` 下面板样式完全不生效。
    const ant = genCalendarStyle('ant');
    expect(ant.includes('.apollo-')).toBe(false);
    // 反向哨兵：`apollo` 版确实有（否则是空转）
    expect(CSS.includes('.apollo-')).toBe(true);
    // 类名总数守恒（只换前缀，不增不减）
    const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;
    expect(count(ant, /\.ant-/g)).toBe(count(CSS, /\.apollo-/g));
  });

  it('🚨 **全局别名变量不动**（`tokens.css` 只声明 `--apollo-*`）', () => {
    const ant = genCalendarStyle('ant');
    expect(ant.includes('--apollo-color-text')).toBe(true);
    expect(ant.includes('--ant-color-text')).toBe(false);
    // 而组件自有变量跟着换
    expect(ant.includes('--ant-calendar-cell-width')).toBe(true);
    expect(ant.includes('--apollo-calendar-cell-width')).toBe(false);
    // ⚠️ 面板规则里引用的 `--apollo-date-picker-*` 也必须换成 `--ant-calendar-*`
    expect(ant.includes('--apollo-date-picker-')).toBe(false);
  });

  it('🚨 面板规则换过 token 命名空间：`--apollo-date-picker-*` 一个不剩', () => {
    expect(CSS.includes('--apollo-date-picker-')).toBe(false);
    // 而面板规则确实被复用了（否则是空转）—— 抽查两条面板独有的
    expect(CSS.includes('.apollo-picker-calendar .apollo-picker-header{')).toBe(true);
    expect(CSS.includes('.apollo-picker-calendar .apollo-picker-time-panel')).toBe(true);
  });

  it('声明块挂在根与 `-css-var` 两个选择器上', () => {
    expect(CSS.startsWith('.apollo-picker-calendar,.apollo-picker-calendar-css-var{')).toBe(true);
  });

  it('根规则带 `background: var(--apollo-calendar-full-bg)`', () => {
    expect(CSS).toContain('background:var(--apollo-calendar-full-bg);');
  });

  it('三个派生表达式由 `CALENDAR_DERIVED` 提供（不是手抄的字面量）', () => {
    expect(CALENDAR_DERIVED.dateValueHeight).toBe('var(--apollo-control-height-sm)');
    expect(CALENDAR_DERIVED.weekHeight).toBe('calc(var(--apollo-control-height-sm) * 0.75)');
    expect(CALENDAR_DERIVED.dateContentHeight).toBe(
      'calc((var(--apollo-font-height-sm) + var(--apollo-margin-xs)) * 3 + var(--apollo-line-width) * 2)',
    );
    expect(CSS.includes(`line-height:${CALENDAR_DERIVED.weekHeight};`)).toBe(true);
    expect(CSS.includes(`height:${CALENDAR_DERIVED.dateContentHeight};`)).toBe(true);
  });

  it('🚨 每条规则的**圆括号必须配平**（本轮漏过一个多余的 `)`）', () => {
    // 2026-10-02 实测踩到：`-full .-cell-week .-cell-inner` 的
    // `height: calc(... + var(--apollo-line-width-bold)))` 多了一个右括号
    // ⇒ `calc()` 非法 ⇒ 浏览器**丢弃整条 `height`** ⇒ 回退到面板的 24px
    // ⇒ `calendar/week` 三张基线 block-diff（0.03%~0.12%）。
    // ⚠️ 这类「多一个字符」的错误**类型与结构断言都抓不到**，只有括号配平能抓。
    for (const line of CSS.split('\n')) {
      const open = line.indexOf('{');
      const close = line.lastIndexOf('}');
      if (open < 0 || close <= open) continue;
      const body = line.slice(open + 1, close);
      const l = (body.match(/\(/g) ?? []).length;
      const r = (body.match(/\)/g) ?? []).length;
      expect(l, `${line.slice(0, 70)} … 括号不配平（${l} vs ${r}）`).toBe(r);
    }
  });

  it('媒体查询在产物里（`max-width: 480px`，与 antd 同值）', () => {
    expect(CSS).toContain('@media only screen and (max-width: 480px)');
    expect(CSS).toContain('.apollo-picker-calendar .apollo-picker-calendar-header{display:block;}');
  });

  it('`prepareComponentToken` 的键数 = 27（6 自有 + 21 面板）', () => {
    // 用一份最小的 seed 触发（值不重要，只看键集）
    const seed = {
      controlHeight: 32,
      controlHeightSM: 24,
      controlHeightLG: 40,
      fontSize: 14,
      fontSizeLG: 16,
      lineHeight: 1.57,
      lineHeightLG: 1.5,
      lineWidth: 1,
      lineWidthFocus: 4,
      paddingSM: 12,
      paddingXXS: 4,
      padding: 16,
      controlPaddingHorizontal: 12,
      controlPaddingHorizontalSM: 8,
      controlOutlineWidth: 2,
      controlOutline: 'rgba(5,145,255,0.1)',
      colorErrorOutline: 'rgba(255,38,5,0.06)',
      colorWarningOutline: 'rgba(255,215,5,0.1)',
      colorFillAlter: 'rgba(0,0,0,0.02)',
      colorFillSecondary: 'rgba(0,0,0,0.06)',
      colorPrimary: '#1677ff',
      colorPrimaryHover: '#4096ff',
      colorBgContainer: '#ffffff',
      colorBgContainerDisabled: 'rgba(0,0,0,0.04)',
      colorTextDisabled: 'rgba(0,0,0,0.25)',
      controlItemBgHover: 'rgba(0,0,0,0.04)',
      controlItemBgActive: '#e6f4ff',
      sizePopupArrow: 16,
      borderRadiusXS: 2,
      borderRadiusOuter: 4,
      zIndexPopupBase: 1000,
    } as unknown as CalendarSeedToken;
    expect(Object.keys(prepareComponentToken(seed))).toHaveLength(27);
  });
});
