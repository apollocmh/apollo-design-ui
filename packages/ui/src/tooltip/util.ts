/**
 * `parseColor` —— antd `components/tooltip/util.ts` 的 Vue 版。
 *
 * 差异（登记于 README §6）：antd 用 `color-picker/util` 的 `generateColor` 解析
 * 任意 CSS 颜色算亮度；本仓的静态架构只需**预设色 ⇒ 类名、自定义色 ⇒ 内联变量**
 * 两条路径，色值解析取 hex/rgb/rgba 的最小子集（analysis §6 P4），
 * 解析不出时按亮色处理（暗字）—— 与 antd 的 `color: '#FFF'` 缺省一致。
 */
import type { CSSProperties } from 'vue';

import { isPresetColor } from '../_internal/preset-color';

/** 最小色值解析：#rgb / #rrggbb / #rrggbbaa / rgb() / rgba()。 */
function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
  const hex = color.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3,8}$/i.test(hex)) {
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex.padEnd(6, '0').slice(0, 6);
    const n = Number.parseInt(full.slice(0, 6), 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
  }
  const m = color.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (m) {
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
  }
  return null;
}

export interface ParsedTooltipColor {
  className: string;
  overlayStyle: CSSProperties;
  arrowStyle: CSSProperties;
}

/** antd `parseColor(rootPrefixCls, prefixCls, color)`（genCssVar 段取本仓命名）。 */
export function parseTooltipColor(prefixCls: string, color?: string): ParsedTooltipColor {
  const isInternal = color !== undefined && isPresetColor(color);

  const className = color && isInternal ? `${prefixCls}-${color}` : '';

  const overlayStyle: CSSProperties = {};
  const arrowStyle: CSSProperties = {};
  if (color && !isInternal) {
    const rgb = parseColorToRgb(color);
    const luminance = rgb ? (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 : 1;
    const textColor = luminance < 0.5 ? '#FFF' : '#000';
    overlayStyle.background = color;
    overlayStyle['--apollo-tooltip-overlay-color'] = textColor;
    arrowStyle['--apollo-tooltip-arrow-background-color'] = color;
  }

  return { className, overlayStyle, arrowStyle };
}

// ⚠️ 这里**曾经**有一份「轻量 clsx」（只处理 string / falsy）—— 2026-10-07 删除：
//    它是 `notification/engine/util.ts` 那份 clsx 的**重复实现**（后者还支持对象参数，
//    是这个的真超集）。两份并存就是重复代码债。现在统一用 `_internal/clsx.ts` 那一份。
