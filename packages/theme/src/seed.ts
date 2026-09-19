import type { PresetColorKey, PresetColorType, SeedToken } from './types';

/**
 * antd 的 13 个预设色。
 *
 * 注意 `pink` 与 `magenta` 同值 —— pink 是 magenta 的废弃别名，保留是为了兼容。
 * 派生时会为 pink 单独生成一套 `pink-1..10`，与 magenta 完全重复，这是 antd 的行为。
 */
export const PresetColors: PresetColorKey[] = [
  'blue',
  'purple',
  'cyan',
  'green',
  'magenta',
  'pink',
  'red',
  'orange',
  'yellow',
  'volcano',
  'geekblue',
  'lime',
  'gold',
];

export const defaultPresetColors: PresetColorType = {
  blue: '#1677FF',
  purple: '#722ED1',
  cyan: '#13C2C2',
  green: '#52C41A',
  magenta: '#EB2F96',
  /** @deprecated 用 magenta 代替 */
  pink: '#EB2F96',
  red: '#F5222D',
  orange: '#FA8C16',
  yellow: '#FADB14',
  volcano: '#FA541C',
  geekblue: '#2F54EB',
  gold: '#FAAD14',
  lime: '#A0D911',
};

/**
 * 暗色色板生成时与背景混合用的基色。
 *
 * 上游 `@ant-design/colors` 的 `generate(x, { theme: 'dark' })` 把它硬编码成这个值。
 * 我们把它**显式化**并放在 theme 里，因为 `utils` 是 L0 通用工具包、不允许出现色值
 * 字面量（`ARCHITECTURE.md` R3）—— 色值归 theme 持有，`generatePalette` 只收参数。
 *
 * ⚠️ 它**不是** `colorBgBase` 的暗色默认值 `#000`：antd 在两条路径上用了不同的基色，
 * 改成 `#000` 会让 4 个 dark 用例全部失败（`baseline.test.ts` 会立刻发现）。
 */
export const DARK_PALETTE_BASE = '#141414';

/**
 * antd 6.6.4 的 Seed Token 默认值（34 个，不含 13 个预设色）。
 *
 * `colorLink` / `colorTextBase` / `colorBgBase` 默认为空串 —— 空串是**有意义的**：
 * 派生时 `colorLink` 空串会回落到 `colorInfo`，`colorTextBase` / `colorBgBase` 空串会
 * 在 default 与 dark 里落到不同的默认值（#fff/#000 与 #000/#fff）。
 * 因此**不能**把它们改成 undefined 或删掉，否则会丢失这个分支。
 */
export const defaultSeedToken: SeedToken = {
  ...defaultPresetColors,
  colorPrimary: '#1677ff',
  colorSuccess: '#52c41a',
  colorWarning: '#faad14',
  colorError: '#ff4d4f',
  colorInfo: '#1677ff',
  colorLink: '',
  colorTextBase: '',
  colorBgBase: '',
  fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
'Noto Color Emoji'`,
  fontFamilyCode: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace`,
  fontSize: 14,
  lineWidth: 1,
  lineType: 'solid',
  motionUnit: 0.1,
  motionBase: 0,
  motionEaseOutCirc: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
  motionEaseInOutCirc: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
  motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  motionEaseOutBack: 'cubic-bezier(0.12, 0.4, 0.29, 1.46)',
  motionEaseInBack: 'cubic-bezier(0.71, -0.46, 0.88, 0.6)',
  motionEaseInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
  motionEaseOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  borderRadius: 6,
  borderRadiusCircle: '100%',
  sizeUnit: 4,
  sizeStep: 4,
  sizePopupArrow: 16,
  controlHeight: 32,
  zIndexBase: 0,
  zIndexPopupBase: 1000,
  opacityImage: 1,
  wireframe: false,
  focusOutline: true,
  motion: true,
};
