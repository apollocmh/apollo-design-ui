import { describe, expect, it } from 'vitest';
import { Color } from '../color';
import isEqual from '../is-equal';
import mergeProps from '../merge-props';
import get, { set } from '../object';
import omit from '../omit';

describe('public immutable data boundaries', () => {
  it('deletes a leaf at its actual depth without mutating any original parent', () => {
    const source = { branch: { leaf: 1, retained: 2 } };
    const output = set(source, ['branch', 'leaf'], undefined, true);
    expect(output).toEqual({ branch: { retained: 2 } });
    expect(source).toEqual({ branch: { leaf: 1, retained: 2 } });
    expect(output.branch).not.toBe(source.branch);
    const shallow = set({ value: 1, retained: 2 }, ['value'], undefined, true);
    expect(shallow).toEqual({ retained: 2 });
    expect(Object.hasOwn(shallow, 'value')).toBe(false);
    expect(set([1, 2], ['length'], 1)).toEqual([1]);
  });

  it('preserves an ordinary __proto__ data key without changing the output object prototype', () => {
    const output = set({}, ['__proto__', 'value'], 3);
    expect(Object.getPrototypeOf(output)).toBe(Object.prototype);
    expect(Object.hasOwn(output, '__proto__')).toBe(true);
    expect(get(output, ['__proto__', 'value'])).toBe(3);
    const data = Object.fromEntries([['__proto__', { value: 4 }]]);
    const merged = mergeProps({}, data);
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
    expect(Object.hasOwn(merged, '__proto__')).toBe(true);
    const omitted = omit(data, []);
    expect(Object.getPrototypeOf(omitted)).toBe(Object.prototype);
    expect(Object.hasOwn(omitted, '__proto__')).toBe(true);
  });

  it('does not equate different own-key sets merely because their values are undefined', () => {
    expect(isEqual({ first: undefined }, { second: undefined })).toBe(false);
    expect(isEqual({ first: undefined }, { first: undefined })).toBe(true);
  });
});

describe('declared Color input boundaries', () => {
  it('keeps the sign of valid CSS numeric channels and hue', () => {
    expect(new Color('rgb(-10, 20, 300)').toRgb()).toEqual({ r: 0, g: 20, b: 255, a: 1 });
    expect(new Color('hsl(-120, 100%, 50%)').toHexString()).toBe('#0000ff');
  });

  it('encodes fractional numeric RGB values as actual hex bytes', () => {
    expect(new Color({ r: 1.5, g: 12.49, b: 254.6 }).toHexString()).toBe('#020cff');
    expect(new Color('rgb(1.5, 12.49, 254.6)').toHexString()).toBe('#020cff');
  });

  it.each(['#12345', '#1234567'])(
    'rejects an unsupported hex width instead of silently dropping a channel: %s',
    (input) => {
      expect(() => new Color(input)).toThrow(/无法解析颜色/);
    },
  );
});
