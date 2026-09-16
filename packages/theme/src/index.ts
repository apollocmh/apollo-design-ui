/**
 * @apollo-design/theme
 *
 * Token Runtime：Seed → Map → Alias → Component 的完整派生链，以及 Token → CSS 变量的注入。
 *
 * 兼容目标：antd 6.6.4。派生结果与 antd 的 `theme.getDesignToken()` 逐字段一致，
 * 由 `registry/tools/gen-theme-baseline.mjs` 从 antd 真实代码生成的基准保证。
 *
 * 入口是纯函数（`getDesignToken`），不依赖 Vue、不依赖 DOM ——
 * Vue 绑定与 CSS 变量注入另有入口，见 css-var.ts。
 */

export type { DerivativeTokenWithOverride } from './alias';
export { default as formatToken } from './alias';
export type { CSSVarScope, TransformResult } from './css-var';
export {
  applyCSSVar,
  createCSSVarScope,
  DEFAULT_CSS_VAR_PREFIX,
  getCSSVarDeclarations,
  IGNORE,
  PRESERVE,
  token2CSSVar,
  transformToken,
  UNITLESS,
} from './css-var';
export {
  algorithms,
  compactAlgorithm,
  darkAlgorithm,
  defaultAlgorithm,
  getDesignToken,
} from './get-design-token';
export { defaultPresetColors, defaultSeedToken, PresetColors } from './seed';
export { default as genColorMapToken } from './shared/color-map-token';
export { genCommonMapToken } from './shared/common-map-token';
export { genControlHeight } from './shared/control-height';
export { default as genFontMapToken } from './shared/font-map-token';
export { default as genFontSizes, getLineHeight } from './shared/font-sizes';
export { default as getAlphaColor } from './shared/get-alpha-color';
export { genRadius } from './shared/radius';
export { genCompactSizeMapToken, genSizeMapToken } from './shared/size-map-token';
export type {
  AliasToken,
  ColorMapToken,
  ColorNeutralMapToken,
  ColorPalette,
  CommonMapToken,
  ComponentTokenMap,
  FontMapToken,
  GlobalToken,
  HeightMapToken,
  MappingAlgorithm,
  MapToken,
  PresetColorKey,
  PresetColorPalettes,
  PresetColorType,
  SeedToken,
  SizeMapToken,
  StyleMapToken,
  ThemeConfig,
} from './types';
export type { ThemeContext } from './vue';
export {
  createThemeContext,
  injectTokenCssVar,
  ThemeContextKey,
  ThemeProvider,
  useTheme,
  useToken,
} from './vue';
