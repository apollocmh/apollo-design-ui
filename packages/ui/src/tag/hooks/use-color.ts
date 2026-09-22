/**
 * `useColor` —— color/variant/bordered 三 prop 到统一色对象的判据链。
 *
 * 契约来源：antd 6.6.4 的 `es/tag/hooks/useColor.js`（**逐条对齐**，G1 §2.1）。
 *
 * 动态色计算用 `@apollo-design/utils` 的 `Color`（我们的 fast-color 移植）：
 * `hsl.l = 0.95` 的浅底等价于 toHsl 后改 lightness 再回 hex。
 */

import { Color } from '@apollo-design/utils';
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';
import { isPresetColor, isPresetStatusColor } from '../../_internal/preset-color';
import type { TagVariant } from '../interface';

export interface TagColorResult {
  variant: TagVariant;
  color: string | undefined;
  isPreset: boolean;
  isStatus: boolean;
  /** 非预设色的动态内联样式（backgroundColor/color/borderColor）。 */
  tagStyle: Record<string, string>;
}

export interface TagColorProps {
  color?: string;
  variant?: TagVariant;
  bordered?: boolean;
}

/** antd 逐字：FastColor 的 `hsl.l = 0.95` → 我们 Color 的 toHsl 改 lightness 后回构造。 */
function lightenTo(color: string, lightness: number): string {
  const hsl = new Color(color).toHsl();
  return new Color(`hsl(${hsl.h}, ${hsl.s * 100}%, ${lightness * 100}%)`).toHexString();
}

function computeColor(
  props: TagColorProps,
  contextVariant: TagVariant | undefined,
): TagColorResult {
  const { color, variant, bordered } = props;
  const isInverseColor = color?.endsWith('-inverse');

  // =================== Variant ===================
  let nextVariant: TagVariant;
  if (variant) {
    // `variant` first
    nextVariant = variant;
  } else if (isInverseColor) {
    // Fallback if using inverse color
    nextVariant = 'solid';
  } else if (bordered === false) {
    // Fallback if using filled
    nextVariant = 'filled';
  } else {
    // Finally not conflict, use context
    nextVariant = contextVariant ?? 'filled';
  }

  // ==================== Color ====================
  let nextColor = isInverseColor ? color?.replace('-inverse', '') : color;
  if (nextColor === undefined && nextVariant === 'solid') {
    nextColor = 'default';
  }

  // =============== Preset & Status ===============
  const nextIsPreset = isPresetColor(nextColor);
  const nextIsStatus = isPresetStatusColor(nextColor);

  // ================== Customize ==================
  // When `color` is not preset color, dynamic calculate the color pair.
  const tagStyle: Record<string, string> = {};
  if (!nextIsPreset && !nextIsStatus && nextColor) {
    const raw = color as string;
    if (nextVariant === 'solid') {
      tagStyle.backgroundColor = raw;
    } else {
      tagStyle.backgroundColor = lightenTo(nextColor, 0.95);
      tagStyle.color = raw;
      if (nextVariant === 'outlined') {
        tagStyle.borderColor = raw;
      }
    }
  }

  return {
    variant: nextVariant,
    color: nextColor,
    isPreset: nextIsPreset,
    isStatus: nextIsStatus,
    tagStyle,
  };
}

/** composable 版（响应 color/variant/bordered/contextVariant 变化）。 */
export function useColor(
  props: MaybeRefOrGetter<TagColorProps>,
  contextVariant: MaybeRefOrGetter<TagVariant | undefined>,
): ComputedRef<TagColorResult> {
  return computed(() => computeColor(toValue(props), toValue(contextVariant)));
}
