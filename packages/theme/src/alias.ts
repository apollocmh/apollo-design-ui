import { Color } from '@apollo-design/utils';
import { defaultSeedToken } from './seed';
import getAlphaColor from './shared/get-alpha-color';
import type { AliasToken, MapToken } from './types';

/** formatToken 的输入：Map token 上额外挂一个 `override`（来自 ThemeConfig.token） */
export type DerivativeTokenWithOverride = MapToken & {
  /**
   * 允许 `undefined`：`ThemeConfig.token` 是 `Partial<...>`，
   * 显式的 `{ colorPrimary: undefined }` 是合法输入，语义上等于没传。
   */
  override?: Record<string, string | number | boolean | undefined>;
};

/**
 * Map → Alias。
 *
 * `override` 的处理顺序有个容易搞错的地方：
 *   - `override` 里**属于 Seed 的键**会被丢弃（它们已经在 Seed 阶段合并过了）
 *   - 剩下的非 Seed 键在**最后**再覆盖一次（见函数末尾的 `...overrideTokens`）
 * 所以非 Seed 的 override 会盖掉 alias 的派生结果。这是 antd 的契约：
 * 用户传 `colorPrimaryBg` 应当生效，而不是被 `colorPrimaryBorder` 的派生值盖回去。
 */
export default function formatToken(derivativeToken: DerivativeTokenWithOverride): AliasToken {
  const { override, ...restToken } = derivativeToken;

  const overrideTokens: Record<string, string | number | boolean | undefined> = { ...override };

  for (const key of Object.keys(defaultSeedToken)) {
    delete overrideTokens[key];
  }

  // 断言成 MapToken：显式传 `{ x: undefined }` 时 antd 的结果里 x 就是 undefined
  // （已用 antd 真实代码核对 —— 见 purity.test.ts 的同名用例）。
  // 类型上仍按「非 Seed 键已补齐」处理，否则下游每个字段都要写一次判空。
  const mergedToken = { ...restToken, ...overrideTokens } as MapToken;

  const shadowBaseColor = new Color(mergedToken.colorShadow);
  const shadowBaseAlpha = shadowBaseColor.a;
  const getShadowColor = (alpha: number): string =>
    shadowBaseColor
      .clone()
      .setAlpha(shadowBaseAlpha * alpha)
      .toRgbString();

  const screenXS = 480;
  const screenSM = 576;
  const screenMD = 768;
  const screenLG = 992;
  const screenXL = 1200;
  const screenXXL = 1600;
  const screenXXXL = 1920;

  // motion: false 时把三档时长全部归零 —— 这是 formatToken 里唯一的条件分支
  if (mergedToken.motion === false) {
    const fastDuration = '0s';
    mergedToken.motionDurationFast = fastDuration;
    mergedToken.motionDurationMid = fastDuration;
    mergedToken.motionDurationSlow = fastDuration;
  }

  const aliasToken = {
    ...mergedToken,

    // ============== 背景 ==============
    colorFillContent: mergedToken.colorFillSecondary,
    colorFillContentHover: mergedToken.colorFill,
    colorFillAlter: mergedToken.colorFillQuaternary,
    colorBgContainerDisabled: mergedToken.colorFillTertiary,

    // ============== 分割线 ==============
    colorBorderBg: mergedToken.colorBgContainer,
    colorSplit: getAlphaColor(mergedToken.colorBorderSecondary, mergedToken.colorBgContainer),

    // ============== 文本 ==============
    colorTextPlaceholder: mergedToken.colorTextQuaternary,
    colorTextDisabled: mergedToken.colorTextQuaternary,
    colorTextHeading: mergedToken.colorText,
    colorTextLabel: mergedToken.colorTextSecondary,
    colorTextDescription: mergedToken.colorTextTertiary,
    colorTextLightSolid: mergedToken.colorWhite,
    colorHighlight: mergedToken.colorError,
    colorBgTextHover: mergedToken.colorFillSecondary,
    colorBgTextActive: mergedToken.colorFill,
    colorIcon: mergedToken.colorTextTertiary,
    colorIconHover: mergedToken.colorText,
    colorErrorOutline: getAlphaColor(mergedToken.colorErrorBg, mergedToken.colorBgContainer),
    colorWarningOutline: getAlphaColor(mergedToken.colorWarningBg, mergedToken.colorBgContainer),
    colorErrorAffix: mergedToken.colorError,
    colorWarningAffix: mergedToken.colorWarning,

    // 字体
    fontSizeIcon: mergedToken.fontSizeSM,

    // 线
    lineWidthFocus: mergedToken.focusOutline === false ? 0 : mergedToken.lineWidth * 3,

    // 控件
    controlOutlineWidth: mergedToken.lineWidth * 2,
    controlInteractiveSize: mergedToken.controlHeight / 2,
    controlItemBgHover: mergedToken.colorFillTertiary,
    controlItemBgActive: mergedToken.colorPrimaryBg,
    controlItemBgActiveHover: mergedToken.colorPrimaryBgHover,
    controlItemBgActiveDisabled: mergedToken.colorFill,
    controlTmpOutline: mergedToken.colorFillQuaternary,
    controlOutline: getAlphaColor(mergedToken.colorPrimaryBg, mergedToken.colorBgContainer),
    fontWeightStrong: 600,
    opacityLoading: 0.65,
    linkDecoration: 'none',
    linkHoverDecoration: 'none',
    linkFocusDecoration: 'none',
    controlPaddingHorizontal: 12,
    controlPaddingHorizontalSM: 8,

    // 间距（全部映射到 size 梯度）
    paddingXXS: mergedToken.sizeXXS,
    paddingXS: mergedToken.sizeXS,
    paddingSM: mergedToken.sizeSM,
    padding: mergedToken.size,
    paddingMD: mergedToken.sizeMD,
    paddingLG: mergedToken.sizeLG,
    paddingXL: mergedToken.sizeXL,
    paddingContentHorizontalLG: mergedToken.sizeLG,
    paddingContentVerticalLG: mergedToken.sizeMS,
    paddingContentHorizontal: mergedToken.sizeMS,
    paddingContentVertical: mergedToken.sizeSM,
    paddingContentHorizontalSM: mergedToken.size,
    paddingContentVerticalSM: mergedToken.sizeXS,
    marginXXS: mergedToken.sizeXXS,
    marginXS: mergedToken.sizeXS,
    marginSM: mergedToken.sizeSM,
    margin: mergedToken.size,
    marginMD: mergedToken.sizeMD,
    marginLG: mergedToken.sizeLG,
    marginXL: mergedToken.sizeXL,
    marginXXL: mergedToken.sizeXXL,

    boxShadow: `
      0 6px 16px 0 ${getShadowColor(0.08)},
      0 3px 6px -4px ${getShadowColor(0.12)},
      0 9px 28px 8px ${getShadowColor(0.05)}
    `,
    boxShadowSecondary: `
      0 6px 16px 0 ${getShadowColor(0.08)},
      0 3px 6px -4px ${getShadowColor(0.12)},
      0 9px 28px 8px ${getShadowColor(0.05)}
    `,
    boxShadowTertiary: `
      0 1px 2px 0 ${getShadowColor(0.05)},
      0 1px 6px -1px ${getShadowColor(0.03)},
      0 2px 4px 0 ${getShadowColor(0.03)}
    `,

    screenXS,
    screenXSMin: screenXS,
    screenXSMax: screenSM - 1,
    screenSM,
    screenSMMin: screenSM,
    screenSMMax: screenMD - 1,
    screenMD,
    screenMDMin: screenMD,
    screenMDMax: screenLG - 1,
    screenLG,
    screenLGMin: screenLG,
    screenLGMax: screenXL - 1,
    screenXL,
    screenXLMin: screenXL,
    screenXLMax: screenXXL - 1,
    screenXXL,
    screenXXLMin: screenXXL,
    screenXXLMax: screenXXXL - 1,
    screenXXXL,
    screenXXXLMin: screenXXXL,

    boxShadowPopoverArrow: `2px 2px 5px ${getShadowColor(0.05)}`,
    dropShadowPopover: `drop-shadow(0 6px 16px ${getShadowColor(0.08)}) drop-shadow(0 3px 6px ${getShadowColor(0.12)}) drop-shadow(0 9px 28px ${getShadowColor(0.05)})`,
    boxShadowCard: `
      0 1px 2px -2px ${getShadowColor(0.16)},
      0 3px 6px 0 ${getShadowColor(0.12)},
      0 5px 12px 4px ${getShadowColor(0.09)}
    `,
    boxShadowDrawerRight: `
      -6px 0 16px 0 ${getShadowColor(0.08)},
      -3px 0 6px -4px ${getShadowColor(0.12)},
      -9px 0 28px 8px ${getShadowColor(0.05)}
    `,
    boxShadowDrawerLeft: `
      6px 0 16px 0 ${getShadowColor(0.08)},
      3px 0 6px -4px ${getShadowColor(0.12)},
      9px 0 28px 8px ${getShadowColor(0.05)}
    `,
    boxShadowDrawerUp: `
      0 6px 16px 0 ${getShadowColor(0.08)},
      0 3px 6px -4px ${getShadowColor(0.12)},
      0 9px 28px 8px ${getShadowColor(0.05)}
    `,
    boxShadowDrawerDown: `
      0 -6px 16px 0 ${getShadowColor(0.08)},
      0 -3px 6px -4px ${getShadowColor(0.12)},
      0 -9px 28px 8px ${getShadowColor(0.05)}
    `,
    boxShadowTabsOverflowLeft: `inset 10px 0 8px -8px ${getShadowColor(0.08)}`,
    boxShadowTabsOverflowRight: `inset -10px 0 8px -8px ${getShadowColor(0.08)}`,
    boxShadowTabsOverflowTop: `inset 0 10px 8px -8px ${getShadowColor(0.08)}`,
    boxShadowTabsOverflowBottom: `inset 0 -10px 8px -8px ${getShadowColor(0.08)}`,

    // 非 Seed 的 override 最后生效
    ...overrideTokens,
  };

  return aliasToken as AliasToken;
}
