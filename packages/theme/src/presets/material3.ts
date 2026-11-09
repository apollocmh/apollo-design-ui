import { Color } from '@apollo-design/utils';
import darkAlgorithm from '../algorithms/dark';
import defaultAlgorithm from '../algorithms/default';
import type { MappingAlgorithm, MapToken, SeedToken, ThemePreset } from '../types';

/**
 * Material surface/action proportions reference MUI's createPalette, Paper and Button.
 * https://github.com/mui/material-ui/tree/0d30b42a4d6cc2c1f2be3c5e3f4ae84969064d62/packages/mui-material/src
 * Apollo retains its own component contracts and blue brand. Derive from the final
 * seeds so custom colors, density and typography also work with this preset.
 */
function materialMap(seed: SeedToken, map: MapToken, dark: boolean): MapToken {
  const text = seed.colorTextBase || (dark ? '#ffffff' : '#000000');
  const background = seed.colorBgBase || (dark ? '#121212' : '#ffffff');
  const alpha = (color: string, amount: number) => new Color(color).setAlpha(amount).toRgbString();
  const mix = (color: string, other: string, amount: number) =>
    new Color(color).mix(new Color(other), amount).toHexString();
  const surface = dark ? mix(background, '#ffffff', 5) : background;
  const primaryText = dark ? mix(seed.colorPrimary, text, 45) : seed.colorPrimary;
  const link = seed.colorLink || primaryText;
  const infoBg = mix(surface, seed.colorInfo, dark ? 16 : 8);
  const successBg = mix(surface, seed.colorSuccess, dark ? 16 : 8);
  const warningBg = mix(surface, seed.colorWarning, dark ? 16 : 8);
  const errorBg = mix(surface, seed.colorError, dark ? 16 : 8);
  return {
    ...map,
    colorBgBase: background,
    colorTextBase: text,
    colorBgLayout: background,
    colorBgContainer: surface,
    colorBgElevated: dark ? mix(background, '#ffffff', 9) : background,
    colorBgSpotlight: dark ? '#616161' : '#424242',
    colorBgBlur: alpha(surface, 0.9),
    colorText: alpha(text, dark ? 1 : 0.87),
    colorTextSecondary: alpha(text, dark ? 0.7 : 0.6),
    colorTextTertiary: alpha(text, dark ? 0.7 : 0.54),
    colorTextQuaternary: alpha(text, dark ? 0.5 : 0.38),
    colorBorder: alpha(text, 0.23),
    colorBorderSecondary: mix(surface, text, 12),
    colorFill: alpha(text, dark ? 0.24 : 0.12),
    colorFillSecondary: alpha(text, dark ? 0.12 : 0.08),
    colorFillTertiary: alpha(text, dark ? 0.08 : 0.04),
    colorFillQuaternary: alpha(text, dark ? 0.05 : 0.02),
    colorPrimary: seed.colorPrimary,
    // Filled actions darken on hover; text actions use a lighter foreground in dark mode.
    colorPrimaryHover: mix(seed.colorPrimary, '#000000', 15),
    colorPrimaryActive: mix(seed.colorPrimary, '#000000', 25),
    colorPrimaryBg: alpha(seed.colorPrimary, dark ? 0.16 : 0.08),
    colorPrimaryBgHover: alpha(seed.colorPrimary, dark ? 0.24 : 0.12),
    colorPrimaryBorder: alpha(seed.colorPrimary, 0.5),
    colorPrimaryBorderHover: seed.colorPrimary,
    colorPrimaryText: primaryText,
    colorPrimaryTextHover: dark ? mix(primaryText, text, 15) : mix(primaryText, '#000000', 15),
    colorPrimaryTextActive: dark ? mix(primaryText, text, 25) : mix(primaryText, '#000000', 25),
    colorLink: link,
    colorLinkHover: dark ? mix(link, text, 15) : mix(link, '#000000', 15),
    colorLinkActive: dark ? mix(link, text, 25) : mix(link, '#000000', 25),
    colorInfo: seed.colorInfo,
    colorInfoBg: infoBg,
    colorInfoBorder: infoBg,
    colorSuccess: seed.colorSuccess,
    colorSuccessBg: successBg,
    colorSuccessBorder: successBg,
    colorWarning: seed.colorWarning,
    colorWarningBg: warningBg,
    colorWarningBorder: warningBg,
    colorError: seed.colorError,
    colorErrorBg: errorBg,
    colorErrorBorder: errorBg,
    fontSizeHeading1: (seed.fontSize * 34) / 14,
    fontSizeHeading2: seed.fontSize * 2,
    fontSizeHeading3: (seed.fontSize * 24) / 14,
    fontSizeHeading4: (seed.fontSize * 20) / 14,
    fontSizeHeading5: (seed.fontSize * 16) / 14,
    lineHeight: 1.5,
    lineHeightSM: 1.5,
    lineHeightLG: 1.5,
    lineHeightHeading1: 1.235,
    lineHeightHeading2: 1.25,
    lineHeightHeading3: 1.334,
    lineHeightHeading4: 1.6,
    lineHeightHeading5: 1.5,
    borderRadiusXS: seed.borderRadius / 2,
    borderRadiusSM: seed.borderRadius,
    borderRadiusLG: seed.borderRadius,
  };
}
const light: MappingAlgorithm = (seed, previous) =>
  materialMap(seed, previous ?? defaultAlgorithm(seed), false);
const dark: MappingAlgorithm = (seed, previous) =>
  materialMap(seed, darkAlgorithm(seed, previous), true);

/** The material3 public name is retained; Material styling follows MUI's restrained surfaces. */
export const material3Preset: ThemePreset = Object.freeze({
  name: 'material3',
  token: Object.freeze({
    fontFamily: "Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
    fontSize: 14,
    fontWeightStrong: 500,
    borderRadius: 4,
    controlHeight: 36,
    motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    motionEaseOut: 'cubic-bezier(0, 0, 0.2, 1)',
    boxShadow:
      '0 5px 5px -3px rgba(0,0,0,0.2), 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12)',
    boxShadowSecondary:
      '0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12)',
    boxShadowTertiary:
      '0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12)',
    boxShadowCard:
      '0 2px 1px -1px rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 1px 3px 0 rgba(0,0,0,0.12)',
  }),
  light: Object.freeze({
    algorithm: light,
    token: Object.freeze({
      colorPrimary: '#0073e6',
      colorInfo: '#0073e6',
      colorLink: '#0073e6',
      colorBgBase: '#ffffff',
      colorTextBase: '#000000',
      colorSuccess: '#2e7d32',
      colorWarning: '#b65d00',
      colorError: '#d32f2f',
    }),
  }),
  dark: Object.freeze({
    algorithm: dark,
    token: Object.freeze({
      colorPrimary: '#0073e6',
      colorInfo: '#0073e6',
      colorLink: '#90caf9',
      colorBgBase: '#121212',
      colorTextBase: '#ffffff',
      colorSuccess: '#81c784',
      colorWarning: '#ffb74d',
      colorError: '#ef9a9a',
    }),
  }),
});
export default material3Preset;
