import { describe, expect, it } from 'vitest';
import { mergeButtonContentReferenceAllowances } from './button-content-reference';

const addition = '$/div[0]/button[0]/span[0]: 类名不同 [caller] vs [apollo-btn-content caller]';
describe('exact Button content reference guard', () => {
  it('retains the existing contract and permits only the owning class addition', () => {
    const original = {
      case: { reason: 'Existing SVG contract.', diff: ['original SVG difference'] },
    };
    const merged = mergeButtonContentReferenceAllowances(
      { case: ['original SVG difference', addition] },
      original,
    );
    expect(merged.case?.diff).toEqual(['original SVG difference', addition]);
    expect(original.case.diff).toEqual(['original SVG difference']);
  });
  it.each([
    ['deleted old assertion', [addition]],
    [
      'hidden child structure',
      ['original SVG difference', addition, '$/button[0]: 子节点数不同 2 vs 1'],
    ],
    [
      'unrelated class',
      ['original SVG difference', addition.replace('apollo-btn-content', 'arbitrary')],
    ],
    [
      'removed caller class',
      [
        'original SVG difference',
        addition.replace('apollo-btn-content caller', 'apollo-btn-content'),
      ],
    ],
  ])('rejects %s', (_name, diff) => {
    expect(() =>
      mergeButtonContentReferenceAllowances(
        { case: diff },
        { case: { reason: 'Existing SVG contract.', diff: ['original SVG difference'] } },
      ),
    ).toThrow('Unreviewed Button reference change');
  });
});
