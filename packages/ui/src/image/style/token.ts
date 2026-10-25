/**
 * Image 的 Component Token（G3/G4 产物）。
 *
 * 契约来源：antd 6.6.4 `components/image/style/index.ts` 的
 * prepareComponentToken（+ 派生的 imagePreviewSwitchSize）。registry 数据：
 * 组 token 数 = 6。
 *
 * 关键判定值由 L7 与 style/index.ts 的 DECLS 字面量逐字对拍。
 */

import { Color } from '@apollo-design/utils';

export interface ComponentToken {
  /** `zIndexPopupBase + 80`。 */
  zIndexPopup: number;
  /** colorTextLightSolid @ 0.65。 */
  previewOperationColor: string;
  /** colorTextLightSolid @ 0.85。 */
  previewOperationHoverColor: string;
  /** colorTextLightSolid @ 0.25。 */
  previewOperationColorDisabled: string;
  /** `fontSizeIcon * 1.5`。 */
  previewOperationSize: number;
  /** '3s'。 */
  progressAnimationDuration: string;
  /** 派生：controlHeightLG（预览组内切换按钮尺寸）。 */
  imagePreviewSwitchSize: number;
}

export interface ImageSeedToken {
  zIndexPopupBase: number;
  colorTextLightSolid: string;
  fontSizeIcon: number;
  controlHeightLG: number;
}

/** antd prepareComponentToken 的关键判定（alpha 合成逐字）。 */
export function prepareComponentToken(token: ImageSeedToken): ComponentToken {
  const { zIndexPopupBase, colorTextLightSolid, fontSizeIcon, controlHeightLG } = token;

  return {
    zIndexPopup: zIndexPopupBase + 80,
    previewOperationColor: withAlpha(colorTextLightSolid, 0.65),
    previewOperationHoverColor: withAlpha(colorTextLightSolid, 0.85),
    previewOperationColorDisabled: withAlpha(colorTextLightSolid, 0.25),
    previewOperationSize: fontSizeIcon * 1.5,
    progressAnimationDuration: '3s',
    imagePreviewSwitchSize: controlHeightLG,
  };
}

/**
 * `colorTextLightSolid` 的 alpha 合成（antd 用 fast-color 的 setA）。
 * 用现有框架无关颜色算法解析数值颜色；CSS命名色/变量保留给浏览器合成。
 */
function withAlpha(color: string, alpha: number): string {
  const c = color.trim();
  if (/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(c) || /^(?:rgb|hsl|hsv)a?\(/i.test(c)) {
    const { r, g, b } = new Color(c).toRgb();
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `color-mix(in srgb, ${c} ${alpha * 100}%, transparent)`;
}

/** 默认主题的判定值（L7 对拍 DECLS 字面量）。 */
export function imageTokenValues(): ComponentToken {
  return prepareComponentToken({
    zIndexPopupBase: 1000,
    colorTextLightSolid: '#fff',
    fontSizeIcon: 12,
    controlHeightLG: 40,
  });
}
