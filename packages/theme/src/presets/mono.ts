import type { ThemePreset } from '../types';

/** Achromatic interaction colors; success, error and warning remain semantic colors. */
export const monoPreset: ThemePreset = Object.freeze({
  name: 'mono',
  token: Object.freeze({
    fontFamily: "ui-monospace, 'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
    fontSize: 14,
    fontWeightStrong: 600,
    borderRadius: 2,
    controlHeight: 32,
    boxShadow: 'none',
    boxShadowSecondary: 'none',
    boxShadowTertiary: 'none',
    boxShadowCard: 'none',
    boxShadowPopoverArrow: 'none',
  }),
  light: Object.freeze({
    token: Object.freeze({
      colorPrimary: '#202020',
      colorInfo: '#454545',
      colorLink: '#202020',
      colorBgBase: '#ffffff',
      colorTextBase: '#171717',
      colorSuccess: '#227744',
      colorWarning: '#8a5a00',
      colorError: '#b42318',
    }),
  }),
  dark: Object.freeze({
    token: Object.freeze({
      colorPrimary: '#555555',
      colorInfo: '#b5b5b5',
      colorLink: '#d5d5d5',
      colorBgBase: '#101010',
      colorTextBase: '#f5f5f5',
      colorSuccess: '#76c99a',
      colorWarning: '#dfb35f',
      colorError: '#f4a399',
    }),
  }),
});
export default monoPreset;
