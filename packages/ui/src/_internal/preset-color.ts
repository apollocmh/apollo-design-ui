/**
 * 预设色判据（共享层，三次法则：badge 的 color / status、后续 Tag / Alert 等复用）。
 *
 * 契约来源：antd 6.6.4 的 `es/_util/colors.js` + `es/theme/interface/presetColors.js`（逐字对齐）。
 */

/** antd 的 `PresetColors`（seed 层的 13 个预设色键）。 */
export const PRESET_COLORS = [
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
] as const;

export type PresetColorKey = (typeof PRESET_COLORS)[number];

/** antd 的 `PresetStatusColors`。 */
export const PRESET_STATUS_COLORS = [
  'success',
  'processing',
  'error',
  'default',
  'warning',
] as const;

export type PresetStatusColorType = (typeof PRESET_STATUS_COLORS)[number];

/** 反色键（`{color}-inverse`），仅 `includeInverse = true` 时参与判定。 */
const INVERSE_COLORS = PRESET_COLORS.map((color) => `${color}-inverse`);

/**
 * 判定 color 是否属于预设色。
 *
 * @param includeInverse 是否把 `{color}-inverse` 也算预设（badge/ribbon 恒传 false）
 */
export function isPresetColor(color: string | undefined, includeInverse = true): boolean {
  if (includeInverse) {
    return [...INVERSE_COLORS, ...PRESET_COLORS].includes(color as never);
  }
  return (PRESET_COLORS as readonly string[]).includes(color as never);
}

/** 判定是否为预设状态色（badge 的 status 合法枚举）。 */
export function isPresetStatusColor(color: string | undefined): boolean {
  return (PRESET_STATUS_COLORS as readonly string[]).includes(color as never);
}
