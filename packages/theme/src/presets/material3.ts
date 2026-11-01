import { Color } from '@apollo-design/utils';
import darkAlgorithm from '../algorithms/dark';
import defaultAlgorithm from '../algorithms/default';
import type { MappingAlgorithm, MapToken, SeedToken, ThemePreset } from '../types';

/** Use final user seeds, so a custom primary/font/radius retains all derivation. */
function materialMap(seed: SeedToken, map: MapToken): MapToken {
  const font = seed.fontSize;
  return {
    ...map,
    colorBgElevated: new Color(map.colorBgContainer)
      .mix(new Color(map.colorPrimary), 5)
      .toHexString(),
    fontSizeHeading1: font * 2,
    fontSizeHeading2: font * 1.75,
    fontSizeHeading3: font * 1.5,
    fontSizeHeading4: font * 1.375,
    fontSizeHeading5: font * 1.125,
    lineHeightHeading1: 1.25,
    lineHeightHeading2: 1.3,
    lineHeightHeading3: 1.35,
    lineHeightHeading4: 1.4,
    lineHeightHeading5: 1.45,
    borderRadiusXS: seed.borderRadius / 3,
    borderRadiusSM: seed.borderRadius / 2,
    borderRadiusLG: seed.borderRadius * 1.5,
  };
}
const light: MappingAlgorithm = (seed, previous) =>
  materialMap(seed, previous ?? defaultAlgorithm(seed));
const dark: MappingAlgorithm = (seed, previous) => materialMap(seed, darkAlgorithm(seed, previous));

/** Material 3 inspired tokens, not a replacement component/interaction implementation. */
export const material3Preset: ThemePreset = Object.freeze({
  name: 'material3',
  token: Object.freeze({
    fontFamily: "Roboto, 'Noto Sans', system-ui, sans-serif",
    fontSize: 16,
    fontWeightStrong: 500,
    borderRadius: 12,
    controlHeight: 40,
    motionEaseInOut: 'cubic-bezier(0.2, 0, 0, 1)',
    motionEaseOut: 'cubic-bezier(0.2, 0, 0, 1)',
    boxShadow: '0 2px 6px 2px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.3)',
    boxShadowSecondary: '0 4px 8px 3px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.3)',
    boxShadowTertiary: '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.3)',
    boxShadowCard: '0 1px 3px rgba(0,0,0,0.15)',
  }),
  light: Object.freeze({
    algorithm: light,
    token: Object.freeze({
      colorPrimary: '#6750a4',
      colorInfo: '#6750a4',
      colorLink: '#6750a4',
      colorBgBase: '#fffbfe',
      colorTextBase: '#1d1b20',
      colorSuccess: '#226b3b',
      colorWarning: '#805200',
      colorError: '#b3261e',
    }),
  }),
  dark: Object.freeze({
    algorithm: dark,
    token: Object.freeze({
      colorPrimary: '#4f378b',
      colorInfo: '#715f98',
      colorLink: '#d0bcff',
      colorBgBase: '#121015',
      colorTextBase: '#e6e0e9',
      colorSuccess: '#91d5a7',
      colorWarning: '#e9c46a',
      colorError: '#f2b8b5',
    }),
  }),
});
export default material3Preset;
