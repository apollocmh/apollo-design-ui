import { describe, expect, it } from 'vitest';
import formatToken from '../alias';
import {
  compactAlgorithm,
  darkAlgorithm,
  defaultAlgorithm,
  getDesignToken,
} from '../get-design-token';
import { defaultSeedToken } from '../seed';
import type { MappingAlgorithm, ThemeConfig } from '../types';

describe('Apollo token input contracts', () => {
  it('an empty algorithm list derives the complete default token', () => {
    const config: ThemeConfig = { algorithm: [] };
    expect(getDesignToken(config)).toEqual(getDesignToken());
    expect(config.algorithm).toEqual([]);
  });

  it('undefined seed, alias and extension overrides are omissions without mutating input', () => {
    const config: ThemeConfig = {
      algorithm: [darkAlgorithm, compactAlgorithm],
      token: {
        fontSize: undefined,
        colorPrimary: undefined,
        colorPrimaryBg: undefined,
        customLength: undefined,
        controlHeight: 0,
        motion: false,
        colorLink: '',
      },
    };
    const before = { ...config.token };
    const token = getDesignToken(config);
    expect(token).toEqual(
      getDesignToken({
        algorithm: [darkAlgorithm, compactAlgorithm],
        token: { controlHeight: 0, motion: false, colorLink: '' },
      }),
    );
    expect(Object.hasOwn(token, 'customLength')).toBe(false);
    expect(Object.values(token).every((v) => typeof v !== 'number' || Number.isFinite(v))).toBe(
      true,
    );
    expect(config.token).toEqual(before);
    expect(config.algorithm).toEqual([darkAlgorithm, compactAlgorithm]);
  });

  it('the public Map-to-Alias function also ignores undefined overrides', () => {
    const map = defaultAlgorithm(defaultSeedToken);
    const before = { ...map };
    const override = { colorPrimaryBg: undefined, customLength: undefined, padding: 0 };
    const actual = formatToken({ ...map, override });
    expect(actual).toEqual(formatToken({ ...map, override: { padding: 0 } }));
    expect(map).toEqual(before);
    expect(override).toEqual({
      colorPrimaryBg: undefined,
      customLength: undefined,
      padding: 0,
    });
  });

  it('nonempty custom algorithms run once in order with the preceding Map', () => {
    const calls: string[] = [];
    const first: MappingAlgorithm = (seed, previous) => {
      calls.push('first');
      expect(previous).toBeUndefined();
      return { ...defaultAlgorithm(seed), controlHeight: 40 };
    };
    const second: MappingAlgorithm = (seed, previous) => {
      calls.push('second');
      expect(seed.fontSize).toBe(18);
      expect(previous?.controlHeight).toBe(40);
      if (!previous) throw new Error('algorithm chain lost its previous Map');
      return { ...previous, controlHeight: previous.controlHeight + 5 };
    };
    expect(
      getDesignToken({ algorithm: [first, second], token: { fontSize: 18 } }).controlHeight,
    ).toBe(45);
    expect(calls).toEqual(['first', 'second']);
  });
});
