import { Color } from '@apollo-design/utils';
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';
import { isPresetColor, isPresetStatusColor } from '../../_internal/preset-color';
import type { TagVariant } from '../interface';

export interface TagColorResult {
  variant: TagVariant;
  color: string | undefined;
  isPreset: boolean;
  isStatus: boolean;
  tagStyle: Record<string, string>;
}
export interface TagColorProps {
  color?: string;
  variant?: TagVariant;
  bordered?: boolean;
}
function lightBackground(color: string): string {
  // Native CSS colours may reference caller variables and cannot be parsed on the server.
  if (
    /^(var|color|color-mix|light-dark|oklch|oklab|lab|lch)\(/.test(color) ||
    color === 'currentColor' ||
    color === 'transparent'
  ) {
    return `hsl(from ${color} h s 95% / 1)`;
  }
  try {
    const hsl = new Color(color).toHsl();
    return new Color(`hsl(${hsl.h}, ${hsl.s * 100}%, 95%)`).toHexString();
  } catch {
    return `hsl(from ${color} h s 95% / 1)`;
  }
}
export function useColor(
  props: MaybeRefOrGetter<TagColorProps>,
  contextVariant: MaybeRefOrGetter<TagVariant | undefined>,
  prefix: () => string = () => 'apollo-tag',
): ComputedRef<TagColorResult> {
  return computed(() => {
    const { color, variant, bordered } = toValue(props);
    const inverse = color?.endsWith('-inverse');
    const nextVariant =
      variant ??
      (inverse ? 'solid' : bordered === false ? 'filled' : (toValue(contextVariant) ?? 'filled'));
    const nextColor = inverse
      ? color?.slice(0, -8)
      : (color ?? (nextVariant === 'solid' ? 'default' : undefined));
    const preset = isPresetColor(nextColor),
      status = isPresetStatusColor(nextColor);
    const tagStyle: Record<string, string> = {};
    if (!preset && !status && nextColor) {
      tagStyle[`--${prefix()}-custom-color`] = nextColor;
      tagStyle[`--${prefix()}-custom-bg`] = lightBackground(nextColor);
    }
    return { variant: nextVariant, color: nextColor, isPreset: preset, isStatus: status, tagStyle };
  });
}
