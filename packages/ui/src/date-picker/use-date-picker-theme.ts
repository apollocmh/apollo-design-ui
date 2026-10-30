import { transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  '--apollo-border-radius',
  '--apollo-border-radius-lg',
  '--apollo-border-radius-sm',
  '--apollo-border-radius-xs',
  '--apollo-box-shadow-popover-arrow',
  '--apollo-box-shadow-secondary',
  '--apollo-color-bg-container',
  '--apollo-color-bg-container-disabled',
  '--apollo-color-bg-elevated',
  '--apollo-color-border',
  '--apollo-color-border-disabled',
  '--apollo-color-error',
  '--apollo-color-error-affix',
  '--apollo-color-error-bg',
  '--apollo-color-error-bg-hover',
  '--apollo-color-error-border-hover',
  '--apollo-color-error-text',
  '--apollo-color-fill-secondary',
  '--apollo-color-fill-tertiary',
  '--apollo-color-icon',
  '--apollo-color-icon-hover',
  '--apollo-color-primary',
  '--apollo-color-primary-border',
  '--apollo-color-split',
  '--apollo-color-text',
  '--apollo-color-text-disabled',
  '--apollo-color-text-heading',
  '--apollo-color-text-light-solid',
  '--apollo-color-text-placeholder',
  '--apollo-color-text-quaternary',
  '--apollo-color-text-tertiary',
  '--apollo-color-warning',
  '--apollo-color-warning-affix',
  '--apollo-color-warning-bg',
  '--apollo-color-warning-bg-hover',
  '--apollo-color-warning-border-hover',
  '--apollo-color-warning-text',
  '--apollo-control-height',
  '--apollo-control-height-lg',
  '--apollo-control-height-sm',
  '--apollo-control-item-bg-active',
  '--apollo-font-family',
  '--apollo-font-height',
  '--apollo-font-size',
  '--apollo-font-size-lg',
  '--apollo-font-weight-strong',
  '--apollo-line-height',
  '--apollo-line-height-lg',
  '--apollo-line-type',
  '--apollo-line-width',
  '--apollo-line-width-bold',
  '--apollo-margin-xs',
  '--apollo-margin-xxs',
  '--apollo-motion-duration-mid',
  '--apollo-motion-duration-slow',
  '--apollo-padding',
  '--apollo-padding-sm',
  '--apollo-padding-xs',
  '--apollo-padding-xxs',
  '--apollo-size-popup-arrow',
] as const;

/** The same current token projection follows the trigger, popup and numeric layer context. */
export function useDatePickerTheme() {
  const theme = useTheme();
  const defaults = computed(() => prepareComponentToken(theme.token.value));
  const componentToken = computed(() => {
    const values: Record<string, string | number> = { ...defaults.value };
    const custom = theme.config.value.components?.DatePicker;
    for (const [key, fallback] of Object.entries(defaults.value)) {
      if (key === 'addonBg' || key === 'INTERNAL_FIXED_ITEM_MARGIN') continue;
      const next = custom?.[key];
      if (typeof fallback === 'number' && typeof next === 'number' && Number.isFinite(next))
        values[key] = next;
      else if (typeof fallback === 'string' && typeof next === 'string' && next !== '')
        values[key] = next;
    }
    return values;
  });
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const alias of aliases) {
      const value = variables[alias];
      if (value !== undefined) result[alias] = value;
    }
    for (const [key, value] of Object.entries(componentToken.value)) {
      const name = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      result[`--apollo-date-picker-${name}`] =
        typeof value === 'number' && key !== 'zIndexPopup' ? `${value}px` : String(value);
    }
    return result;
  });
  const zIndexPopup = computed(() => {
    const value = componentToken.value.zIndexPopup;
    return typeof value === 'number' ? value : defaults.value.zIndexPopup;
  });
  return { style, zIndexPopup };
}
