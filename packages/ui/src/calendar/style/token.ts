/**
 * Calendar 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/calendar/style/index.js`
 *   - `ComponentToken`（**6** 个用户面键）
 *   - `prepareComponentToken`（6 个自有 + `...initPanelComponentToken(token)` ⇒ **27** 个键）
 *   - `mergeToken` 的 **5** 个派生（`calendarCls` / `pickerCellInnerCls` /
 *     `dateValueHeight` / `weekHeight` / `dateContentHeight`）—— 用户**不可**覆盖
 *
 * ── 实测的变量面：**27 个** `--ant-calendar-*` ─────────────────────────────────
 *
 * 取证命令（可复现）：
 * `node tests/visual/debug/extract-calendar-css.mjs --tokens`
 *
 * | 来源 | 个数 | 键 |
 * |---|---|---|
 * | 本组件自有 | 6 | `fullBg` / `fullPanelBg` / `itemActiveBg` / `yearControlWidth` / `monthControlWidth` / `miniContentHeight` |
 * | `initPanelComponentToken` | 21 | 12 个面板自有（cell 系 / time 系 / textHeight / withoutTimeCellHeight）+ 8 个 `MultipleSelectorToken` + **`INTERNAL_FIXED_ITEM_MARGIN`** |
 *
 * 🚨 **27 而不是 26 —— 这个数本轮先读错过一次**。`extract-calendar-css.mjs` 首版的
 * 探针正则写成 `[a-z0-9-]`（**漏了 `_`**）⇒ `internal_fixed_item_margin` 压根没被扫出来。
 * 这正是 `date-picker/style/token.ts` 文件头记的 **PITFALLS 229**（同一个正则、同一个坑），
 * 而那份说明当时就在同一个仓库里。**教训：数不对时先怀疑自己的探针。**
 *
 * ── 别名 → `var(--apollo-*)`，还是字面量？─────────────────────────────────────
 *
 * 与 date-picker **同判**（见其 `style/token.ts` 文件头的表格）：
 *   - **别名派生**（`fullBg` / `fullPanelBg` / `itemActiveBg`，以及 `initPanelComponentToken`
 *     返回的 `cellHoverBg` / `cellActiveWithRangeBg` / `cellBgDisabled` / `multipleItemBg` …）
 *     ⇒ 落 `var(--apollo-*)`，随主题自适应（B7 可校验）。
 *     ⚠️ 上游产物里它们是**解析后的字面量**（`#ffffff` / `rgba(0,0,0,0.04)`）——
 *     本仓的 `var()` 是**有意差异**（零运行时 + 静态 CSS 下唯一能随主题走的路）。
 *   - **构建期解析值**（`yearControlWidth` 等字面量、`cellHoverWithRangeBg` 的
 *     `lighten(35)`）⇒ 构建期算成常量，**不随主色变化**（已知固有差异，同 date-picker）。
 *
 * ── 5 个 `mergeToken` 派生为什么不在这里算 ──────────────────────────────────────
 *
 * 实测产物里它们**保持表达式形态**（`var()` 未被求值）：
 *
 * | 派生 | 产物里的形态 |
 * |---|---|
 * | `dateValueHeight` | `var(--ant-control-height-sm)` |
 * | `weekHeight` | `calc(var(--ant-control-height-sm) * 0.75)` |
 * | `dateContentHeight` | `calc((var(--ant-font-height-sm) + var(--ant-margin-xs)) * 3 + var(--ant-line-width) * 2)` |
 * | `calendarCls` / `pickerCellInnerCls` | 拼出来的类名，**不进 CSS** |
 *
 * ⇒ 本仓**不需要**为它们建 token：`CALENDAR_DERIVED` 只是把三条表达式固化成常量，
 * 供 `style/index.ts` 内联消费、并被 `theme.test.ts` 钉住（改一处要同步改测试）。
 *
 * ── 为什么这里 import `date-picker/style` 而不违反 H11 ─────────────────────────
 *
 * 上游 `calendar/style/index.ts` 的**第一句**就是
 * `import { genPanelStyle, initPanelComponentToken, initPickerPanelToken } from '../../date-picker/style'`
 * —— 这是上游**自己的**代码组织，不是本仓发明的耦合。
 * H11 禁止的是「跨**层**反向依赖」；`calendar` 与 `date-picker` 同在 L3（`ui`），
 * 且 registry 的 `componentDag` 记的是**组件**依赖（`radio` / `select` 是
 * `calendar/Header.tsx` 的 import），**样式模块**依赖不在其中 ——
 * 这与 `time-picker → date-picker`（真·组件依赖，有 DAG 边）是两回事。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import {
  type DatePickerSeedToken,
  initPanelComponentToken,
  type PanelInternalToken,
} from '../../date-picker/style';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

// ---------------------------------------------------------------------------
// ① 用户面 Component Token（上游 `ComponentToken`，6 个）
// ---------------------------------------------------------------------------

/**
 * Calendar 自己声明的 6 个 Component Token。
 *
 * ⚠️ registry 的 `tokenCount = 6` 是**实测口径**（`antd-6.6.4.raw.json` 的
 * `componentTokens['calendar']`）—— 即「该组件自己声明的那 6 个」，
 * **不含** `initPanelComponentToken` 带进来的 21 个（那是 date-picker 的面板面）。
 */
export interface ComponentToken {
  /** 日历整体背景色。别名 → `colorBgContainer`。 */
  fullBg: string;
  /** 全屏日历的**面板**背景色。别名 → `colorBgContainer`。 */
  fullPanelBg: string;
  /** 选中日期项的背景色。别名 → `controlItemBgActive`。 */
  itemActiveBg: string;
  /** 年下拉宽度。**字面量** `80`。 */
  yearControlWidth: number | string;
  /** 月下拉宽度。**字面量** `70`。 */
  monthControlWidth: number | string;
  /** 迷你日历内容高度。**字面量** `256`。 */
  miniContentHeight: number | string;
}

// ---------------------------------------------------------------------------
// ② `prepareComponentToken` 的入参面
// ---------------------------------------------------------------------------

/**
 * `prepareComponentToken` 的入参面。
 *
 * 与 date-picker 的 `DatePickerSeedToken` **完全同形** —— 上游 Calendar 要的全部键
 * （`colorBgContainer` / `controlItemBgActive` + `initPanelComponentToken` 要的
 * `paddingXXS` / `lineWidth` / `controlHeight` 家族 / `colorPrimary`）都在它里面
 * ⇒ **直接别名，不新声明**（重声明会与 date-picker 那份漂移）。
 */
export type CalendarSeedToken = DatePickerSeedToken;

/** `prepareComponentToken` 的返回面：6 个自有 + 21 个面板（含内部键 `INTERNAL_FIXED_ITEM_MARGIN`）。 */
export type PreparedToken = ComponentToken & PanelInternalToken;

/**
 * 6 个自有的默认值 + 面板的 21 个（逐条对齐上游 `prepareComponentToken`）。
 *
 * ⚠️ **`...initPanelComponentToken(token)` 的 spread 位置是判据**：它带来
 * `INTERNAL_FIXED_ITEM_MARGIN`（21 个键里的**第一个**），实测变量声明顺序是
 * `mini-content-height` → **`internal_fixed_item_margin`** → `cell-hover-bg`。
 */
export function prepareComponentToken(token: CalendarSeedToken): PreparedToken {
  return {
    fullBg: v('colorBgContainer'),
    fullPanelBg: v('colorBgContainer'),
    itemActiveBg: v('controlItemBgActive'),
    yearControlWidth: 80,
    monthControlWidth: 70,
    miniContentHeight: 256,
    ...initPanelComponentToken(token),
  };
}

// ---------------------------------------------------------------------------
// ③ 5 个 `mergeToken` 派生（用户不可覆盖；保持表达式形态）
// ---------------------------------------------------------------------------

/**
 * `mergeToken` 的 5 个派生里**会进 CSS 的那 3 个**。
 *
 * ⚠️ 上游是在 `mergeToken` 里算的（运行时会重算），本仓把它们**固化成 CSS 表达式**
 * —— 因为实测产物里它们本来就是表达式（`var()` 没被求值），
 * 而静态 CSS 保留表达式 ⇒ **仍然随主题自适应**（比算成数字更好）。
 *
 * `calendarCls` / `pickerCellInnerCls` 是拼出来的**类名**，不进 CSS —— 它们的唯一用处是
 * 让「派生集合 = 5 个」这条判据可对拍，所以放在这里而不进 `ComponentToken`。
 */
export const CALENDAR_DERIVED = {
  /** `controlHeightSM` —— 日期值那一行的高度。 */
  dateValueHeight: v('controlHeightSM'),
  /** `controlHeightSM * 0.75` —— 周号行高度。 */
  weekHeight: `calc(${v('controlHeightSM')} * 0.75)`,
  /** `(fontHeightSM + marginXS) * 3 + lineWidth * 2` —— 日期内容区高度。 */
  dateContentHeight: `calc((${v('fontHeightSM')} + ${v('marginXS')}) * 3 + ${v('lineWidth')} * 2)`,
} as const;

// ---------------------------------------------------------------------------
// ④ 构建期取值（缓存）
// ---------------------------------------------------------------------------

let tokenCache: PreparedToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 seed）。 */
export function calendarTokenValues(): PreparedToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken() as unknown as CalendarSeedToken);
  }
  return tokenCache;
}
