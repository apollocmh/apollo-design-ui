import { getDesignToken } from '@apollo-design/theme';
import { expect, it } from 'vitest';
import { formatCounter, formatTimeStr, prepareStatisticComponentToken } from '../index';

it('derives both prepared defaults from the actual default Alias tokens', () => {
  const token = getDesignToken();
  expect(prepareStatisticComponentToken()).toEqual({
    titleFontSize: token.fontSize,
    contentFontSize: token.fontSizeHeading3,
  });
});

it('handles invalid duration/target and negative elapsed time explicitly', () => {
  expect(formatTimeStr(Number.NaN, 'ss')).toBe('-');
  expect(formatTimeStr(Infinity, 'HH')).toBe('-');
  expect(formatTimeStr(-1000, 'ss')).toBe('00');
  expect(formatCounter('invalid', { format: 'HH' }, true)).toBe('-');
});
