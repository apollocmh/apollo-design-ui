/**
 * @apollo-design/theme
 *
 * Token Runtime：Seed → Map → Alias → Component 的完整派生链，以及 Token → CSS 变量的注入。
 *
 * Apollo 的公开类型与文档定义契约；历史 Ant Design 算法对照保留为回归证据。
 *
 * getDesignToken 的源依赖不读取 Vue 或 DOM；公共根入口也导出 Vue 绑定，
 * Vue 作为 peer dependency。CSS 变量通过静态声明或可清理的运行作用域消费。
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
