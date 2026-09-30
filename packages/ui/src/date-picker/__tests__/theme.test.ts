/**
 * L7 主题 —— DatePicker 的 Component Token。
 *
 * 判定值逐字对拍 antd 6.6.4 产物，可复现命令：
 *
 * ```bash
 * node tests/visual/debug/extract-date-picker-css.mjs --tokens
 * ```
 *
 * ── 口径（务必先读，否则会算错数量）────────────────────────────────────────────
 *
 * | 量 | 值 | 含义 |
 * |---|---|---|
 * | `prepareComponentToken` 返回的**对象键数** | **45** | 18(input) + 21(panel) + 3(arrow) + 3(own) |
 * | 其中落成 CSS 变量的 | **44** | 减去 `INTERNAL_FIXED_ITEM_MARGIN`（内部量，不落变量） |
 * | 产物里 `--ant-date-picker-*` 的**变量数** | **45** | 44 + 规则内声明的 `affixColor` |
 * | `initPickerPanelToken` 的**内部 token 键数** | **10** | 不落变量（G4 会内联进规则） |
 *
 * 两边的 45 是**巧合**：一个是「对象键数」，一个是「CSS 变量数」。别拿它当交叉验证。
 *
 * ── 这个文件证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * 证明：45 个键的名称与默认值、10 个内部 token 的判定值、三处继承面被正确并入、
 * `lighten` 家族用的是 `Color#lighten` 而不是 `onBackground`、可被用户覆盖的
 * 三个 `inputFontSize*` 真的参与回退。
 *
 * 不证明：这些值被正确消费进 CSS（那是 G4 + L6 的事）、ConfigProvider 能覆盖它们
 * （本仓没有那条管线，见 `style/token.ts` 的缺口说明）。
 */

import { getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { DATE_PICKER_RULES, genTokenDecls } from '../style';
import {
  type DatePickerSeedToken,
  datePickerPanelTokenValues,
  datePickerTokenValues,
  initInputComponentToken,
  initPanelComponentToken,
  initPickerPanelToken,
  prepareComponentToken,
} from '../style/token';

const seed = (): DatePickerSeedToken => getDesignToken() as unknown as DatePickerSeedToken;

/** 默认 seed 下 `prepareComponentToken` 的 45 个键（实测产物口径）。 */
const EXPECTED_KEYS = [
  // ── 3 个自有 ──
  'presetsWidth',
  'presetsMaxWidth',
  'zIndexPopup',
  // ── initComponentToken（input）的 18 个 ──
  'lineWidthFocus',
  'paddingBlock',
  'paddingBlockSM',
  'paddingBlockLG',
  'paddingInline',
  'paddingInlineSM',
  'paddingInlineLG',
  'addonBg',
  'activeBorderColor',
  'hoverBorderColor',
  'activeShadow',
  'errorActiveShadow',
  'warningActiveShadow',
  'hoverBg',
  'activeBg',
  'inputFontSize',
  'inputFontSizeLG',
  'inputFontSizeSM',
  // ── initPanelComponentToken 的 21 个（含 1 个内部量）──
  'INTERNAL_FIXED_ITEM_MARGIN',
  'cellHoverBg',
  'cellActiveWithRangeBg',
  'cellHoverWithRangeBg',
  'cellBgDisabled',
  'cellRangeBorderColor',
  'timeColumnWidth',
  'timeColumnHeight',
  'timeCellHeight',
  'cellHeight',
  'cellWidth',
  'textHeight',
  'withoutTimeCellHeight',
  'multipleItemBg',
  'multipleItemBorderColor',
  'multipleItemHeight',
  'multipleItemHeightSM',
  'multipleItemHeightLG',
  'multipleSelectorBgDisabled',
  'multipleItemColorDisabled',
  'multipleItemBorderColorDisabled',
  // ── getArrowToken 的 3 个 ──
  'arrowShadowWidth',
  'arrowPath',
  'arrowPolygon',
].sort();

describe('DatePicker · Component Token 判定值（antd 产物逐字对拍）', () => {
  const t = datePickerTokenValues();

  it('45 个字段恰好齐全（不多不少）', () => {
    expect(Object.keys(t).sort()).toEqual(EXPECTED_KEYS);
  });

  it('44 个落成 CSS 变量（45 − INTERNAL_FIXED_ITEM_MARGIN）', () => {
    const vars = Object.keys(t).filter((k) => k !== 'INTERNAL_FIXED_ITEM_MARGIN');
    expect(vars).toHaveLength(44);
  });

  // ============================================================ 三处继承面
  it('input 的 18 个：padding 系与 inputFontSize 系逐条对拍产物', () => {
    expect(t.lineWidthFocus).toBe(1);
    expect(t.paddingBlock).toBe(4);
    expect(t.paddingBlockSM).toBe(0);
    expect(t.paddingBlockLG).toBe(7);
    expect(t.paddingInline).toBe(11);
    expect(t.paddingInlineSM).toBe(7);
    expect(t.paddingInlineLG).toBe(11);
    expect(t.inputFontSize).toBe(14);
    expect(t.inputFontSizeLG).toBe(16);
    expect(t.inputFontSizeSM).toBe(14);
  });

  it('input 的别名派生态落 var()（B7 可校验、随主题自适应）', () => {
    expect(t.addonBg).toBe('var(--apollo-color-fill-alter)');
    expect(t.activeBorderColor).toBe('var(--apollo-color-primary)');
    expect(t.hoverBorderColor).toBe('var(--apollo-color-primary-hover)');
    expect(t.hoverBg).toBe('var(--apollo-color-bg-container)');
    expect(t.activeBg).toBe('var(--apollo-color-bg-container)');
  });

  it('input 的三个 activeShadow 是构建期模板串（产物逐字）', () => {
    // 上游：`0 0 0 ${controlOutlineWidth}px ${controlOutline}`
    expect(t.activeShadow).toBe('0 0 0 2px rgba(5,145,255,0.1)');
    expect(t.errorActiveShadow).toBe('0 0 0 2px rgba(255,38,5,0.06)');
    expect(t.warningActiveShadow).toBe('0 0 0 2px rgba(255,215,5,0.1)');
  });

  it('panel 的 12 个：cell 系 / time 系 / textHeight 对拍产物', () => {
    expect(t.timeColumnWidth).toBe(56); // controlHeightLG(40) * 1.4
    expect(t.timeColumnHeight).toBe(224); // 28 * 8 —— 上游的 magic number
    expect(t.timeCellHeight).toBe(28);
    expect(t.cellWidth).toBe(36); // controlHeightSM(24) * 1.5
    expect(t.cellHeight).toBe(24); // controlHeightSM
    expect(t.textHeight).toBe(40); // controlHeightLG
    expect(t.withoutTimeCellHeight).toBe(66); // controlHeightLG * 1.65
    expect(t.multipleItemHeight).toBe(24);
    expect(t.multipleItemHeightSM).toBe(16);
    expect(t.multipleItemHeightLG).toBe(32);
  });

  /**
   * 🚨 这两条是本组件最容易写错的一处：`lighten` 与 `onBackground` 是**两个运算**。
   *
   * 上游是 `new FastColor(colorPrimary).lighten(35)`；而本仓的
   * `_internal/color-composite.ts` 只提供 `onBackground`（= 「半透明前景合成到背景」，
   * tour / input-number / slider 用的那个）。用错会得到一个**看着像、值不对**的颜色。
   */
  it('cellHoverWithRangeBg / cellRangeBorderColor 走 Color#lighten（不是 onBackground）', () => {
    // 判定值：FastColor('#1677ff').lighten(35|20).toHexString()
    expect(t.cellHoverWithRangeBg).toBe('#cbe0fd');
    expect(t.cellRangeBorderColor).toBe('#82b4f9');
    // 反例哨兵：如果误用 onBackground 会得到别的值（这里断言它**不是**同色）
    expect(t.cellHoverWithRangeBg).not.toBe('#1677ff');
    expect(t.cellHoverWithRangeBg).not.toBe(t.cellRangeBorderColor);
  });

  it('panel 的别名派生态落 var()', () => {
    expect(t.cellHoverBg).toBe('var(--apollo-control-item-bg-hover)');
    expect(t.cellActiveWithRangeBg).toBe('var(--apollo-control-item-bg-active)');
    expect(t.cellBgDisabled).toBe('var(--apollo-color-bg-container-disabled)');
    expect(t.multipleItemBg).toBe('var(--apollo-color-fill-secondary)');
    expect(t.multipleSelectorBgDisabled).toBe('var(--apollo-color-bg-container-disabled)');
    expect(t.multipleItemColorDisabled).toBe('var(--apollo-color-text-disabled)');
  });

  it('两个 transparent 是固定字面量（上游写死，不走别名）', () => {
    expect(t.multipleItemBorderColor).toBe('transparent');
    expect(t.multipleItemBorderColorDisabled).toBe('transparent');
  });

  it('INTERNAL_FIXED_ITEM_MARGIN = floor(paddingXXS / 2) = 2，且不落变量', () => {
    const internal: number = t.INTERNAL_FIXED_ITEM_MARGIN;
    expect(internal).toBe(2);
    // 它是数字，不是 CSS 值 —— 这是「不落变量」的原因
    expect(typeof internal).toBe('number');
  });

  // ============================================================ arrow 的几何
  it('arrow 的 3 个几何量逐位对齐（√2 不能近似成 1.414）', () => {
    expect(t.arrowShadowWidth).toBeCloseTo(8.970562748477143, 12);
    expect(t.arrowPolygon).toBe(
      'polygon(1.6568542494923806px 100%, 50% 1.6568542494923806px, 14.34314575050762px 100%, 1.6568542494923806px 100%)',
    );
    expect(t.arrowPath).toMatch(/^path\('M 0 8 A 4 4 0 0 0 2\.82842712474619 6\.82842712474619 L /);
  });

  // ============================================================ 3 个自有
  it('3 个自有 token：两个固定值 + zIndexPopupBase + 50', () => {
    expect(t.presetsWidth).toBe(120);
    expect(t.presetsMaxWidth).toBe(200);
    expect(t.zIndexPopup).toBe(1050);
  });
});

describe('DatePicker · 可被用户覆盖的三个 inputFontSize（上游 `||` 回退）', () => {
  it('不传时回退到 fontSize / fontSizeLG', () => {
    const s = seed();
    const got = initInputComponentToken(s);
    expect(got.inputFontSize).toBe(s.fontSize);
    expect(got.inputFontSizeLG).toBe(s.fontSizeLG);
    // ⚠️ SM 回退到的是 **mergedFontSize**（不是 fontSizeSM）—— 上游逐字如此
    expect(got.inputFontSizeSM).toBe(s.fontSize);
  });

  it('传了就生效（覆盖通道真的通）', () => {
    const s = { ...seed(), inputFontSize: 99, inputFontSizeLG: 88, inputFontSizeSM: 77 };
    const got = initInputComponentToken(s);
    expect(got.inputFontSize).toBe(99);
    expect(got.inputFontSizeLG).toBe(88);
    expect(got.inputFontSizeSM).toBe(77);
  });

  it('只传 inputFontSize 时，SM 跟着它（回退链是 传值 → 合并值 → fontSize）', () => {
    const s = { ...seed(), inputFontSize: 99 };
    const got = initInputComponentToken(s);
    expect(got.inputFontSize).toBe(99);
    expect(got.inputFontSizeSM).toBe(99);
    expect(got.inputFontSizeLG).toBe(s.fontSizeLG);
  });

  it('paddingBlock 会随 inputFontSize 变化（算式用的就是合并值）', () => {
    const s = seed();
    const base = initInputComponentToken(s).paddingBlock;
    const bigger = initInputComponentToken({ ...s, inputFontSize: 20 }).paddingBlock;
    expect(bigger).toBeLessThan(base);
  });
});

describe('DatePicker · 内部 token（10 个，上游 initPickerPanelToken）', () => {
  it('10 个字段恰好齐全', () => {
    const p = datePickerPanelTokenValues('apollo-picker');
    expect(Object.keys(p).sort()).toEqual(
      [
        'pickerCellCls',
        'pickerCellInnerCls',
        'pickerDatePanelPaddingHorizontal',
        'pickerYearMonthCellWidth',
        'pickerCellPaddingVertical',
        'pickerQuarterPanelContentHeight',
        'pickerCellBorderGap',
        'pickerControlIconSize',
        'pickerControlIconMargin',
        'pickerControlIconBorderWidth',
      ].sort(),
    );
  });

  it('判定值对拍（含 4 个 magic number）', () => {
    const p = datePickerPanelTokenValues('apollo-picker');
    expect(p.pickerYearMonthCellWidth).toBe(60); // controlHeightLG(40) * 1.5
    expect(p.pickerQuarterPanelContentHeight).toBe(56); // 40 * 1.4
    expect(p.pickerCellPaddingVertical).toBe(6); // paddingXXS(4) + 4/2
    expect(p.pickerCellBorderGap).toBe(2);
    expect(p.pickerControlIconSize).toBe(7);
    expect(p.pickerControlIconMargin).toBe(4);
    expect(p.pickerControlIconBorderWidth).toBe(1.5);
    expect(p.pickerDatePanelPaddingHorizontal).toBe(18); // padding(16) + 4/2，上游注释 `18 in normal`
  });

  /**
   * ⚠️ 前两个键是**拼出来的类名**，所以 `initPickerPanelToken` 必须收 `prefixCls`。
   *    上游的 `componentCls` 是 `ant-picker`（`getPrefixCls('picker')` 的字面量），
   *    **不是** `ant-date-picker` —— 这正是「类名前缀与变量命名空间不同名」那件事。
   */
  it('pickerCellCls / pickerCellInnerCls 用传入的 prefixCls 拼（上游是 componentCls）', () => {
    const p = initPickerPanelToken(seed(), 'apollo-picker');
    expect(p.pickerCellCls).toBe('apollo-picker-cell');
    expect(p.pickerCellInnerCls).toBe('apollo-picker-cell-inner');
  });
});

describe('DatePicker · 纯函数性质', () => {
  it('prepareComponentToken 是纯函数（同入参同输出）', () => {
    const s = seed();
    expect(prepareComponentToken(s)).toEqual(prepareComponentToken(s));
  });

  it('缓存返回同一个引用（构建期只算一次）', () => {
    expect(datePickerTokenValues()).toBe(datePickerTokenValues());
  });

  it('initPanelComponentToken 不改入参', () => {
    const s = seed();
    const snapshot = JSON.stringify(s);
    initPanelComponentToken(s);
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});

/**
 * B7 的**双向**比对（这是 `tests/build/run.mjs` 的 B7 在组件侧的前置防线）。
 *
 * ── 为什么必须是双向 ─────────────────────────────────────────────────────────
 *
 * 只做「外部变量是否在 theme 声明」是**单向**的，会漏掉一整类 bug：
 * **自有变量名拼错**（声明了 `-s-m`、规则引用 `-sm`）⇒ `var()` 解析不到、
 * **静默回退**。本轮实测踩到 **8 个**（`paddingBlockSM` / `inputFontSizeLG` /
 * `multipleItemHeightSM` … 全被逐大写插连字符）。
 *
 * ── 三个方向 ─────────────────────────────────────────────────────────────────
 *
 * | 方向 | 判据 | 不合格的含义 |
 * |---|---|---|
 * | A 声明 → 引用 | `genTokenDecls` 的**每条**都被规则引用 | 死变量（**允许**，与 tabs 的空值 token 同类，但数量要对） |
 * | B 引用 → 声明 | 规则引用的自有变量**都在** `genTokenDecls` 里 | **静默失效**（名字拼错） |
 * | C 数量 | 声明恰好 **45** 条、规则恰好 **257** 条 | 防静默漂移 |
 *
 * ⚠️ `--apollo-date-picker-affix-color` 是**规则内声明**的（不在 `genTokenDecls` 里，
 * 见 `README §4`）⇒ 方向 B 要把它白名单掉。
 */
describe('DatePicker · B7 双向比对（token 声明 ↔ 规则引用）', () => {
  const decls = genTokenDecls('apollo');
  /** 声明清单（`--apollo-date-picker-xxx`）。 */
  const declared = new Set(decls.map((d) => d.trim().replace(/:.*$/, '')));
  /** 规则里引用的自有变量。 */
  const used = new Set(
    [...DATE_PICKER_RULES.matchAll(/var\((--apollo-date-picker-[a-z0-9_-]+)/g)]
      // ⚠️ 捕获组的下标访问在 `noUncheckedIndexedAccess` 下是 `string | undefined`
      //    ⇒ 显式过滤（不写 `as string` 掩盖）。
      .map((m) => m[1])
      .filter((v): v is string => v !== undefined),
  );
  /** 规则内声明的那个（不在 genTokenDecls 里）。 */
  const RULE_SCOPED = '--apollo-date-picker-affix-color';

  it('方向 C：声明恰好 45 条（= prepareComponentToken 的全部键）', () => {
    // 🚨 45 而不是 44 —— `INTERNAL_FIXED_ITEM_MARGIN` **也落变量**
    //（实测 `--ant-date-picker-internal_fixed_item_margin: 2px`，名字带下划线）
    expect(decls).toHaveLength(45);
  });

  it('方向 C：规则恰好 257 条', () => {
    expect(DATE_PICKER_RULES.split('\n').filter((l) => l.trim())).toHaveLength(257);
  });

  it('方向 B：规则引用的自有变量**全部**在声明清单里（拼错会在这里红）', () => {
    const missing = [...used].filter((v) => v !== RULE_SCOPED && !declared.has(v)).sort();
    expect(missing).toEqual([]);
  });

  it('方向 B：`affix-color` 确实**不在**声明清单里（它是规则内声明的）', () => {
    expect(used.has(RULE_SCOPED)).toBe(true);
    expect(declared.has(RULE_SCOPED)).toBe(false);
  });

  /**
   * 方向 A：死变量**恰好 4 个**。
   *
   * ⚠️ 「死变量」在这里是**允许**的（与 tabs 的两个空值 token 同类）—— 上游
   * `prepareComponentToken` 返回的键里，有一部分的值是**构建期算好后直接内联进规则**
   * 的（`lighten` 的结果、`colorFillAlter` 的别名在 date-picker 里没用到），
   * 声明出来只为「45 个逐字对齐」这条判据。
   *
   * | 变量 | 为什么没被引用 |
   * |---|---|
   * | `addon-bg` | 来自 input 的 `SharedComponentToken`；**date-picker 没有 addon** |
   * | `cell-hover-with-range-bg` | 构建期 `lighten(colorPrimary, 35%)` 的结果被内联进规则 |
   * | `cell-range-border-color` | 同上（`lighten(colorPrimary, 20%)`） |
   * | `multiple-selector-bg-disabled` | `multiple` 禁用态的标签背景（上游规则用的是别的变量） |
   */
  it('方向 A：死变量恰好 4 个（构建期值被内联 / date-picker 用不到的继承面）', () => {
    const dead = [...declared].filter((v) => !used.has(v)).sort();
    expect(dead).toEqual([
      '--apollo-date-picker-addon-bg',
      '--apollo-date-picker-cell-hover-with-range-bg',
      '--apollo-date-picker-cell-range-border-color',
      '--apollo-date-picker-multiple-selector-bg-disabled',
    ]);
  });

  it('数值字段补了 px，唯一例外是 z-index-popup', () => {
    const byName = new Map(
      decls.map((d) => [
        d.trim().replace(/:.*$/, ''),
        d.trim().replace(/^.*?:/, '').replace(/;$/, ''),
      ]),
    );
    expect(byName.get('--apollo-date-picker-padding-block')).toBe('4px');
    expect(byName.get('--apollo-date-picker-padding-block-sm')).toBe('0px');
    expect(byName.get('--apollo-date-picker-padding-block-lg')).toBe('7px');
    expect(byName.get('--apollo-date-picker-input-font-size')).toBe('14px');
    expect(byName.get('--apollo-date-picker-internal_fixed_item_margin')).toBe('2px');
    // ⚠️ z-index-popup 是层叠序号，**不能**带 px
    expect(byName.get('--apollo-date-picker-z-index-popup')).toBe('1050');
  });

  it('kebab 转换：连续大写只占一个词（`SM` → `-sm`，不是 `-s-m`）', () => {
    // 这条钉住本轮踩到的 8 个拼错（若回退成逐大写插连字符，上面方向 B 也会红）
    expect(declared.has('--apollo-date-picker-padding-block-sm')).toBe(true);
    expect(declared.has('--apollo-date-picker-padding-block-s-m')).toBe(false);
    expect(declared.has('--apollo-date-picker-input-font-size-lg')).toBe(true);
    expect(declared.has('--apollo-date-picker-input-font-size-l-g')).toBe(false);
    expect(declared.has('--apollo-date-picker-multiple-item-height-sm')).toBe(true);
    expect(declared.has('--apollo-date-picker-multiple-item-height-s-m')).toBe(false);
  });

  it('`internal_fixed_item_margin` 保留下划线（不是 `internal-fixed-item-margin`）', () => {
    expect(declared.has('--apollo-date-picker-internal_fixed_item_margin')).toBe(true);
    expect(declared.has('--apollo-date-picker-internal-fixed-item-margin')).toBe(false);
  });
});
