import { token2CSSVar } from '@apollo-design/theme';
import { LAYOUT_HEADER_BG, LAYOUT_SIDER_BG, LAYOUT_TRIGGER_BG } from './token';

const v = (name: string) => `var(${token2CSSVar(name)})`;

/** Defaults are resolved at the consuming node, so nested scopes/native variables inherit. */
export function layoutTokenFallbacks(prefix: string) {
  return {
    'body-bg': `var(--${prefix}-layout-color-bg-body,var(--${prefix}-layout-source-color-bg-body,${v('colorBgLayout')}))`,
    'color-bg-body': v('colorBgLayout'),
    'color-bg-header': LAYOUT_HEADER_BG,
    'color-bg-trigger': LAYOUT_TRIGGER_BG,
    'header-bg': `var(--${prefix}-layout-color-bg-header,var(--${prefix}-layout-source-color-bg-header,${LAYOUT_HEADER_BG}))`,
    'header-height': `calc(${v('controlHeight')} * 2)`,
    'header-padding': `0 calc(${v('controlHeightLG')} * 1.25)`,
    'header-color': v('colorTextLightSolid'),
    'footer-padding': `${v('controlHeightSM')} calc(${v('controlHeightLG')} * 1.25)`,
    'footer-bg': v('colorBgLayout'),
    'sider-bg': LAYOUT_SIDER_BG,
    'trigger-height': `calc(${v('controlHeightLG')} + ${v('marginXXS')} * 2)`,
    'trigger-bg': `var(--${prefix}-layout-color-bg-trigger,var(--${prefix}-layout-source-color-bg-trigger,${LAYOUT_TRIGGER_BG}))`,
    'trigger-color': v('colorTextLightSolid'),
    'zero-trigger-width': v('controlHeightLG'),
    'zero-trigger-height': v('controlHeightLG'),
    'light-sider-bg': v('colorBgContainer'),
    'light-trigger-bg': v('colorBgContainer'),
    'light-trigger-color': v('colorText'),
  };
}

export function layoutTokenValue(
  prefix: string,
  name: keyof ReturnType<typeof layoutTokenFallbacks>,
) {
  return `var(--${prefix}-layout-${name},var(--${prefix}-layout-source-${name},${layoutTokenFallbacks(prefix)[name]}))`;
}

/** Retained explicit declaration generator; default CSS uses property fallbacks. */
export function genTokenDecls(prefix: string): string[] {
  return Object.entries(layoutTokenFallbacks(prefix)).map(
    ([name, value]) => `  --${prefix}-layout-${name}:${value};`,
  );
}
