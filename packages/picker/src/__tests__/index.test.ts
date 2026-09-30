import { describe, expect, it } from 'vitest';
import * as picker from '../index';

/**
 * 公开 API 面锁定。
 *
 * 为什么要有这个测试（两个理由，都不是凑覆盖率）：
 *
 * 1. 契约 §5 定的 API 面必须**可执行**地钉住。`index.ts` 只有 re-export，
 *    任何其它测试都不会 import 它 ⇒ 它既不在覆盖率报告里，改名/漏导也没有人会红。
 *    这里断言「导出的运行时符号集合 == 声明的集合」，漏一个或多余一个都会失败。
 *
 * 2. 本包的**产出边界**要钉住。这条在 2026-09-30 变了（见下），所以断言也跟着变。
 *
 * ── 🚨 2026-09-30：为什么本文件的两条断言**被改写**（不是被放宽）────────────────
 *
 * 原断言是「① 导出集合只含纯函数；② R4：**不导出任何 Vue 组件**」，
 * 依据是契约 §6.2 的**暂定**方向（面板属 `ui`）。而那个方向当时**并未裁决** ——
 * 契约 §9 P3 明确写着「本轮不裁决，因此 L2/L4/L5 留 `todo`」。
 *
 * 2026-09-30 用户裁决 `picker-panel-ownership` = **B**：面板组件（`PickerPanel` /
 * `PanelHeader` / `PanelBody` / 七个面板 / `TimeColumn`）**落在本包**。
 * ⇒ 原断言所依赖的前提（「面板属 ui」）**不成立**，它是「按未裁决的暂定方向写下的期望」，
 * 按 `AGENTS.md` §4.2 的第 3 条属于**测试本身写错了**，应当修正并说明理由。
 *
 * 改成了什么（**更严**，不是更松）：
 *  - 导出集合按「纯函数内核 + 面板层」两组**分别**钉死 ⇒ 任何一组多一个少一个都失败；
 *  - 组件断言从「一个都不许有」改成「**必须**是这一组字面量、且**必须**带组件特征」——
 *    原来「漏了组件也不会红」，现在「漏了或多了组件都会红」；
 *  - 新增一条：**面板层不许产出 CSS**（R4 的真实约束是「不产样式」而不是「不产组件」）。
 *    判据是「组件对象上没有任何 `style` / `styles` 的**生成器**导出」，见下面的用例。
 */

/** 纯函数内核（契约 §5）。**顺序无关**，比对前排序。 */
const PURE_API = [
  'WEEK_DAY_COUNT',
  'buildPanelCells',
  'dayjsGenerateConfig',
  'fillIndex',
  'fillLocale',
  'fillShowTimeConfig',
  'fillTime',
  'fillTimeFormat',
  'fillTimeUnitValue',
  'findValidateTime',
  'flattenUnits',
  'formatValue',
  'formatWith',
  'generateUnits',
  'getEnabled',
  'getFromDate',
  'getHeaderDisabled',
  'getMaskRange',
  'getMeridiemTime',
  'getMeridiemUnits',
  'getNearestUnitIndex',
  'getPanelGeometry',
  'getPanelHeaderLimits',
  'getQuarter',
  'getRowFormat',
  'getRowStartDate',
  'getTimeInfo',
  'getTimeParts',
  'getTimeProps',
  'getTriggerDateTemplate',
  'getWeekNumber',
  'getWeekStartDate',
  'hiddenStyleWhen',
  'isAM',
  'isInRange',
  'isSame',
  'isSameDate',
  'isSameDates',
  'isSameDecade',
  'isSameMonth',
  'isSameOrAfter',
  'isSameQuarter',
  'isSameTime',
  'isSameTimestamp',
  'isSameWeek',
  'isSameYear',
  'isWeekMode',
  'leftPad',
  'offsetCellValue',
  'orderDates',
  'pickProps',
  'providePanelHack',
  'providePanelInfo',
  'providePanelInfoFromProps',
  'sharedPanelProps',
  'toArray',
  'toggleDates',
  'usePanelHack',
  'usePanelInfo',
  'usePanelShared',
  'validateRangeSubmit',
];

/** 面板层的 Vue 组件（裁决 `picker-panel-ownership` = B）。 */
const PANEL_COMPONENTS = [
  'DEFAULT_HEADER_ICONS',
  'DEFAULT_PANEL_COMPONENTS',
  'DatePanel',
  'DateTimePanel',
  'DecadePanel',
  'MonthPanel',
  'PanelBody',
  'PanelHeader',
  'PickerPanel',
  'QuarterPanel',
  'TimeColumn',
  'TimePanel',
  'TimePanelBody',
  'WeekPanel',
  'YearPanel',
];

/** 注入键（`Symbol`，`*_KEY` 三个不是组件也不是函数）。 */
const INJECTION_KEYS = ['PANEL_HACK_KEY', 'PANEL_INFO_KEY', 'PANEL_SHARED_KEY'];

describe('公开 API 面', () => {
  it('运行时导出集合 = 纯函数内核 + 面板层 + 注入键（不多不少）', () => {
    expect(Object.keys(picker).sort()).toEqual(
      [...PURE_API, ...PANEL_COMPONENTS, ...INJECTION_KEYS].sort(),
    );
  });

  it('每个导出都不是 undefined（漏导 / 名字写错会在这里暴露）', () => {
    for (const [name, value] of Object.entries(picker)) {
      expect(value, `导出 "${name}" 是 undefined —— 多半是 re-export 的名字写错了`).not.toBe(
        undefined,
      );
    }
  });

  it('面板层：**恰好**是这一组组件，且每个都带 Vue 组件特征', () => {
    // 没有 `default` 导出（避免「整个包就是一个组件」的误用形态）
    expect('default' in picker).toBe(false);

    const COMPONENT_MARKERS = ['render', 'setup', '__vccOpts', '__file', 'template'];
    for (const name of PANEL_COMPONENTS) {
      // `DEFAULT_HEADER_ICONS` / `DEFAULT_PANEL_COMPONENTS` 是纯数据对象，单独判
      if (!/Panel|Column/.test(name)) {
        expect(typeof (picker as Record<string, unknown>)[name]).toBe('object');
        continue;
      }
      const value = (picker as Record<string, unknown>)[name] as object;
      const hit = COMPONENT_MARKERS.filter((marker) => marker in value);
      expect(
        hit,
        `导出 "${name}" 不像 Vue 组件（缺 ${COMPONENT_MARKERS.join(' / ')} 全部）`,
      ).not.toEqual([]);
    }
  });

  it('⭐ 纯函数内核那一组**一个组件都没有**（R4 的反向哨兵）', () => {
    // 这条取代了原来的「R4：本包不导出组件」。它仍然是**可证伪的** ——
    // 往内核组里混一个组件（例如把 `DatePanel` 改成从 `panel.ts` 导出）会红。
    const COMPONENT_MARKERS = ['render', 'setup', '__vccOpts', '__file'];
    const offenders: string[] = [];
    for (const name of PURE_API) {
      const value = (picker as Record<string, unknown>)[name];
      if (value === null || (typeof value !== 'object' && typeof value !== 'function')) continue;
      if (COMPONENT_MARKERS.some((marker) => marker in (value as object))) {
        offenders.push(name);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('日期库适配层是**纯数据对象**（不是组件、不是函数）', () => {
    expect(typeof picker.dayjsGenerateConfig).toBe('object');
  });

  it('R4：面板层**不产样式** —— 没有任何「样式生成器」导出', () => {
    // R4 的原文是「L2 包不得发布组件样式 / 不产出 CSS」，而不是「不产出组件」。
    // 这里的判据：没有任何导出名像样式工厂（`genXxxStyle` / `useXxxStyle`），
    // 也没有 `style` / `styles` 的生成函数。
    const styleish = Object.keys(picker).filter(
      (name) => /^(gen|create|use).*Style/i.test(name) || /^style/i.test(name),
    );
    expect(styleish).toEqual([]);

    // 更实质的一条：本包不 import 任何样式产物。用「组件对象上没有 `styles` 工厂」表达不够硬，
    // 因此改为断言「本包源码目录里没有 .css / .scss 文件」由 L7 构建门禁的 E19 扫描负责
    // （见 `registry/tools/validate-registry.mjs`）。这里只钉导出面。
  });
});
