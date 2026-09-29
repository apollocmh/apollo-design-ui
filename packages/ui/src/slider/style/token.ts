/**
 * Slider 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 `es/slider/style/index.js` 的 `prepareComponentToken`
 * （+ 同名 interface）。registry 数据：该组件 token 数 = **18**。
 *
 * ── 默认主题判定值（2026-09-29 与 antd 6.6.4 产物**逐字对拍通过**）──────────────
 *
 * | token | 判定值 | 派生 |
 * |---|---|---|
 * | `controlSize` | `10px` | `controlHeightLG / 4`（40/4） |
 * | `handleSize` | `10px` | = `controlSize` |
 * | `handleSizeHover` | `12px` | `controlHeightSM / 2`（24/2） |
 * | `railSize` | `4px` | 字面量 |
 * | `dotSize` | `8px` | 字面量 |
 * | `handleLineWidth` | `2px` | `lineWidth + 1` |
 * | `handleLineWidthHover` | `2.5px` | `lineWidth + 1.5` |
 * | `railBg` / `railHoverBg` | `rgba(0,0,0,0.04)` / `rgba(0,0,0,0.06)` | `colorFillTertiary` / `colorFillSecondary` |
 * | `trackBg` / `trackHoverBg` | `#91caff` / `#69b1ff` | `colorPrimaryBorder` / `colorPrimaryBorderHover` |
 * | `handleColor` / `handleActiveColor` | `#91caff` / `#1677ff` | `colorPrimaryBorder` / `colorPrimary` |
 * | `handleActiveOutlineColor` | `rgba(22,119,255,0.2)` | `FastColor(colorPrimary).setA(0.2)` |
 * | `handleColorDisabled` | `#bfbfbf` | `FastColor(colorTextDisabled).onBackground(colorBgContainer).toHexString()` |
 * | `dotBorderColor` / `dotActiveBorderColor` | `#f0f0f0` / `#91caff` | `colorBorderSecondary` / `colorPrimaryBorder` |
 * | `trackBgDisabled` | `rgba(0,0,0,0.04)` | `colorBgContainerDisabled` |
 *
 * 验证命令（可复现）：`node tests/visual/debug/extract-slider-css.mjs --tokens`
 *
 * ── 两处构建期算式（G4 必读）───────────────────────────────────────────────────
 *
 * 1. `handleActiveOutlineColor`：`FastColor#setA(0.2)` ⇒ 本仓 `Color#setAlpha` 直译。
 * 2. `handleColorDisabled`：`FastColor#onBackground` —— 本仓 `Color` **没有**该方法，
 *    已按三次法则收敛到 `_internal/color-composite.ts`（tour / input-number 是前两个
 *    消费者，本轮一并改为从那里 import）。
 *
 * ── 不在 18 个 token 里的派生值（G4 写进 CSS，不进本文件）──────────────────────
 *
 * antd 在 `genStyleHooks` 里 `mergeToken` 了一个 `marginPart = (controlHeight − controlSize) / 2`，
 * 但产物里它**始终以 calc 表达式出现**（不解析成数值）：
 *   `.ant-slider{margin:calc((var(--ant-control-height) - var(--ant-slider-control-size)) / 2) …}`
 * ⇒ G4 照抄这条 calc 字面量即可，不要在这里造一个「11」的常量。
 *
 * ⚠️ 单位规则：`unitless` 里没有 slider 的任何字段 ⇒ 产物里数值 token 带 `px`
 *    （`10px` / `4px` / `2.5px`）。G4 的 DECLS 必须照抄字面量（PITFALLS 170 同族）。
 */

import { getDesignToken } from '@apollo-design/theme';
import { Color } from '@apollo-design/utils';
import { onBackground } from '../../_internal/color-composite';

export interface ComponentToken {
  /** 把手/轨道的基准尺寸（`controlHeightLG / 4`）。 */
  controlSize: number;
  /** 底轨高度。 */
  railSize: number;
  /** 把手直径（= `controlSize`）。 */
  handleSize: number;
  /** hover 时的把手直径。 */
  handleSizeHover: number;
  /** 刻度点直径。 */
  dotSize: number;
  /** 把手描边宽度。 */
  handleLineWidth: number;
  /** hover 时的把手描边宽度。 */
  handleLineWidthHover: number;
  /** 底轨底色。 */
  railBg: string;
  /** 底轨 hover 底色。 */
  railHoverBg: string;
  /** 已选轨道底色。 */
  trackBg: string;
  /** 已选轨道 hover 底色。 */
  trackHoverBg: string;
  /** 把手边框色。 */
  handleColor: string;
  /** 把手激活（hover/dragging）色。 */
  handleActiveColor: string;
  /** 把手激活时的外发光色（`setA(0.2)`）。 */
  handleActiveOutlineColor: string;
  /** 禁用把手的颜色（半透明色合成到容器底）。 */
  handleColorDisabled: string;
  /** 刻度点边框色。 */
  dotBorderColor: string;
  /** 选中刻度点边框色。 */
  dotActiveBorderColor: string;
  /** 禁用时的已选轨道底色。 */
  trackBgDisabled: string;
}

/** `prepareComponentToken` 需要的种子 / 别名 token 子集（只列真正用到的字段）。 */
export interface SliderSeedToken {
  controlHeightLG: number;
  controlHeightSM: number;
  lineWidth: number;
  colorPrimary: string;
  colorFillTertiary: string;
  colorFillSecondary: string;
  colorPrimaryBorder: string;
  colorPrimaryBorderHover: string;
  colorTextDisabled: string;
  colorBgContainer: string;
  colorBorderSecondary: string;
  colorBgContainerDisabled: string;
}

/** antd `prepareComponentToken` 的逐条对齐实现。 */
export function prepareComponentToken(token: SliderSeedToken): ComponentToken {
  // Handle line width is always width-er 1px
  const increaseHandleWidth = 1;
  const controlSize = token.controlHeightLG / 4;
  const handleActiveColor = token.colorPrimary;
  return {
    controlSize,
    railSize: 4,
    handleSize: controlSize,
    handleSizeHover: token.controlHeightSM / 2,
    dotSize: 8,
    handleLineWidth: token.lineWidth + increaseHandleWidth,
    handleLineWidthHover: token.lineWidth + increaseHandleWidth * 1.5,
    railBg: token.colorFillTertiary,
    railHoverBg: token.colorFillSecondary,
    trackBg: token.colorPrimaryBorder,
    trackHoverBg: token.colorPrimaryBorderHover,
    handleColor: token.colorPrimaryBorder,
    handleActiveColor,
    handleActiveOutlineColor: new Color(handleActiveColor).setAlpha(0.2).toRgbString(),
    handleColorDisabled: onBackground(
      token.colorTextDisabled,
      token.colorBgContainer,
    ).toHexString(),
    dotBorderColor: token.colorBorderSecondary,
    dotActiveBorderColor: token.colorPrimaryBorder,
    trackBgDisabled: token.colorBgContainerDisabled,
  };
}

let tokenCache: ComponentToken | null = null;

/**
 * 构建期 token 值（缓存；首次调用时读主题默认 seed）。
 *
 * ⚠️ 缓存是必要的：`prepareComponentToken` 会被 `style/index.ts` 与 L7 测试同时调用，
 *    而每次调用都会 new 若干 `Color`（construction 成本 > 0，且值恒等于默认主题）。
 */
export function sliderTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken() as unknown as SliderSeedToken);
  }
  return tokenCache;
}
