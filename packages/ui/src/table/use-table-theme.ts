import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { type ComputedRef, computed } from 'vue';
import { getTableTokenValues } from './style';

const aliases = [
  'borderRadius',
  'borderRadiusLG',
  'boxShadowSecondary',
  'colorBgContainer',
  'colorBorderSecondary',
  'colorFillQuaternary',
  'colorIcon',
  'colorLinkActive',
  'colorLinkHover',
  'colorPrimary',
  'colorPrimaryBorder',
  'colorSplit',
  'colorText',
  'colorTextDisabled',
  'colorTextHeading',
  'colorTextPlaceholder',
  'controlHeight',
  'controlInteractiveSize',
  'controlItemBgActive',
  'controlItemBgActiveHover',
  'controlItemBgHover',
  'fontFamily',
  'fontSize',
  'fontSizeIcon',
  'fontSizeSm',
  'fontWeightStrong',
  'lineHeight',
  'lineType',
  'lineWidth',
  'lineWidthFocus',
  'linkDecoration',
  'linkFocusDecoration',
  'linkHoverDecoration',
  'margin',
  'marginXxs',
  'motionDurationMid',
  'motionDurationSlow',
  'opacityLoading',
  'padding',
  'paddingSM',
  'paddingXS',
  'paddingXs',
  'paddingXxs',
] as const;
const lengths = new Set([
  'cell-padding-block',
  'cell-padding-inline',
  'cell-padding-block-md',
  'cell-padding-inline-md',
  'cell-padding-block-sm',
  'cell-padding-inline-sm',
  'header-border-radius',
  'cell-font-size',
  'cell-font-size-md',
  'cell-font-size-sm',
  'selection-column-width',
  'sticky-scroll-bar-border-radius',
  'expand-icon-margin-top',
  'expand-icon-half-inner',
  'expand-icon-size',
]);
const sources = new WeakMap<
  ReturnType<typeof useTheme>,
  ComputedRef<{ aliases: Record<string, string>; fields: Record<string, string> } | undefined>
>();
/** Current defaults and existing overrides, shared by the table and its filter portal. */
export function useTableTheme(prefix: () => string) {
  const theme = useTheme();
  let source = sources.get(theme);
  if (!source) {
    source = computed(() => {
      if (theme.sourceActive?.value === false) return undefined;
      const variables = transformToken(theme.token.value).vars,
        selected: Record<string, string> = {};
      for (const key of aliases) {
        const name = token2CSSVar(key);
        if (variables[name] !== undefined) selected[name] = variables[name];
      }
      const fields = getTableTokenValues(theme.token.value);
      for (const [key, value] of Object.entries(theme.config.value.components?.Table ?? {})) {
        const name = token2CSSVar(key, '').slice(2);
        if (!(name in fields)) continue;
        if (typeof value === 'string' && value.trim()) fields[name] = value;
        else if (
          typeof value === 'number' &&
          Number.isFinite(value) &&
          (value >= 0 || name === 'expand-icon-margin-top')
        ) {
          if (lengths.has(name)) fields[name] = `${value}px`;
          else if (name === 'expand-icon-scale') fields[name] = String(value);
        }
      }
      return { aliases: selected, fields };
    });
    sources.set(theme, source);
  }
  const current = source;
  return computed<Record<string, string>>(() => {
    const data = current.value;
    if (!data) return {};
    const style = { ...data.aliases };
    for (const [key, value] of Object.entries(data.fields)) style[`--${prefix()}-${key}`] = value;
    return style;
  });
}
