import { describe, expect, it } from 'vitest';
import { darkAlgorithm, getDesignToken } from '../get-design-token';

const preset = {
  name: 'Public example',
  token: { fontSize: 16, borderRadius: 2 },
  light: { token: { colorPrimary: '#276749', colorBgBase: '#fffdf8' } },
  dark: { token: { colorPrimary: '#78589a', colorBgBase: '#121018' } },
};

describe('Public theme preset derivation', () => {
  it('keeps appearance independent from preset selection', () => {
    expect(getDesignToken({ preset, mode: 'light' })).toEqual(
      getDesignToken({ token: { ...preset.token, ...preset.light.token } }),
    );
    expect(getDesignToken({ preset, mode: 'dark' })).toEqual(
      getDesignToken({
        algorithm: darkAlgorithm,
        token: { ...preset.token, ...preset.dark.token },
      }),
    );
  });

  it('puts user seeds into the original palette and typography derivation before final aliases', () => {
    const token = {
      colorPrimary: '#bc3145',
      fontSize: 20,
      colorPrimaryBg: '#ffeedd',
      customSurface: '#112233',
    };
    const expected = getDesignToken({
      algorithm: darkAlgorithm,
      token: { ...preset.token, ...preset.dark.token, ...token },
    });
    const actual = getDesignToken({ preset, mode: 'dark', token });
    expect(actual).toEqual(expected);
    expect(actual.colorPrimaryHover).not.toBe(
      getDesignToken({ preset, mode: 'dark' }).colorPrimaryHover,
    );
    expect(actual.fontSizeHeading1).toBe(expected.fontSizeHeading1);
    expect(actual.colorPrimaryBg).toBe('#ffeedd');
  });

  it('keeps system derivation deterministic on the server and accepts an explicit system appearance', () => {
    expect(getDesignToken({ preset, mode: 'system' })).toEqual(
      getDesignToken({ preset, mode: 'light' }),
    );
    expect(getDesignToken({ preset, mode: 'system' }, 'dark')).toEqual(
      getDesignToken({ preset, mode: 'dark' }),
    );
  });

  it('keeps explicit legacy algorithms authoritative and does not mutate preset data', () => {
    const before = JSON.stringify(preset);
    expect(getDesignToken({ preset, algorithm: darkAlgorithm })).toEqual(
      getDesignToken({ preset, mode: 'dark' }),
    );
    expect(JSON.stringify(preset)).toBe(before);
  });

  it('treats undefined user fields as omissions over preset values', () => {
    expect(
      getDesignToken({ preset, token: { fontSize: undefined, colorPrimary: undefined } }),
    ).toEqual(getDesignToken({ preset }));
  });
});
