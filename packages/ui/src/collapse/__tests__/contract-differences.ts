/** Reviewed paths only. Original reference HTML and projection are unchanged.
 * Stable hidden regions add one child; native heading/button owns disclosure ARIA.
 * Item modifiers scope inherited variants to actual Panels (including custom prefixes).
 * semantic.test.ts checks every replacement subtree skipped by a child-count difference.
 */
const entry = (diff: string[]) => ({
  deviationId: 'collapse-native-disclosure',
  reason:
    'Accepted native Vue disclosure migration: heading/button, stable region ownership, item-local variants. See docs/migrations/collapse-contracts.md; full native subtrees and real keyboard/focus/animation have separate coverage.',
  diff,
});
export const collapseContractDifferences = {
  'collapse:basic': entry([
    '$/div[0]/div[0]: 子节点数不同 1 vs 2',
    '$/div[0]/div[1]: 子节点数不同 1 vs 2',
  ]),
  'collapse:items-default-active': entry([
    '$/div[0]/div[0]/div[0]: 我们缺少属性 aria-disabled="false"',
    '$/div[0]/div[0]/div[0]: 我们缺少属性 aria-expanded="true"',
    '$/div[0]/div[0]/div[0]: 我们缺少属性 role="button"',
    '$/div[0]/div[0]/div[0]: 子节点数不同 2 vs 1',
    '$/div[0]/div[0]/div[1]: 我们多出属性 aria-hidden="false"',
    '$/div[0]/div[0]/div[1]: 我们多出属性 aria-labelledby="{i0}"',
    '$/div[0]/div[0]/div[1]: 我们多出属性 role="region"',
    '$/div[0]/div[1]: 子节点数不同 1 vs 2',
  ]),
  'collapse:accordion': entry([
    '$/div[0]: 我们缺少属性 role="tablist"',
    '$/div[0]/div[0]/div[0]: 我们缺少属性 aria-disabled="false"',
    '$/div[0]/div[0]/div[0]: 我们缺少属性 aria-expanded="true"',
    '$/div[0]/div[0]/div[0]: 我们缺少属性 role="tab"',
    '$/div[0]/div[0]/div[0]: 子节点数不同 2 vs 1',
    '$/div[0]/div[0]/div[1]: 属性 role 不同 "tabpanel" vs "region"',
    '$/div[0]/div[0]/div[1]: 我们多出属性 aria-hidden="false"',
    '$/div[0]/div[0]/div[1]: 我们多出属性 aria-labelledby="{i0}"',
    '$/div[0]/div[1]: 子节点数不同 1 vs 2',
  ]),
  'collapse:borderless': entry([
    '$/div[0]/div[0]: 类名不同 [apollo-collapse-item] vs [apollo-collapse-item apollo-collapse-item-borderless]',
    '$/div[0]/div[0]: 子节点数不同 1 vs 2',
    '$/div[0]/div[1]: 类名不同 [apollo-collapse-item] vs [apollo-collapse-item apollo-collapse-item-borderless]',
    '$/div[0]/div[1]: 子节点数不同 1 vs 2',
  ]),
  'collapse:ghost': entry([
    '$/div[0]/div[0]: 类名不同 [apollo-collapse-item] vs [apollo-collapse-item apollo-collapse-item-ghost]',
    '$/div[0]/div[0]: 子节点数不同 1 vs 2',
    '$/div[0]/div[1]: 类名不同 [apollo-collapse-item] vs [apollo-collapse-item apollo-collapse-item-ghost]',
    '$/div[0]/div[1]: 子节点数不同 1 vs 2',
  ]),
  'collapse:size-small': entry([
    '$/div[0]/div[0]: 类名不同 [apollo-collapse-item] vs [apollo-collapse-item apollo-collapse-item-small]',
    '$/div[0]/div[0]: 子节点数不同 1 vs 2',
    '$/div[0]/div[1]: 类名不同 [apollo-collapse-item] vs [apollo-collapse-item apollo-collapse-item-small]',
    '$/div[0]/div[1]: 子节点数不同 1 vs 2',
  ]),
  'collapse:size-large': entry([
    '$/div[0]/div[0]: 类名不同 [apollo-collapse-item] vs [apollo-collapse-item apollo-collapse-item-large]',
    '$/div[0]/div[0]: 子节点数不同 1 vs 2',
    '$/div[0]/div[1]: 类名不同 [apollo-collapse-item] vs [apollo-collapse-item apollo-collapse-item-large]',
    '$/div[0]/div[1]: 子节点数不同 1 vs 2',
  ]),
  'collapse:icon-placement-end': entry([
    '$/div[0]/div[0]: 类名不同 [apollo-collapse-item] vs [apollo-collapse-item apollo-collapse-item-end]',
    '$/div[0]/div[0]: 子节点数不同 1 vs 2',
    '$/div[0]/div[1]: 类名不同 [apollo-collapse-item] vs [apollo-collapse-item apollo-collapse-item-end]',
    '$/div[0]/div[1]: 子节点数不同 1 vs 2',
  ]),
  'collapse:rtl': entry([
    '$/div[0]/div[0]: 类名不同 [apollo-collapse-item apollo-collapse-item-active] vs [apollo-collapse-item apollo-collapse-item-active apollo-collapse-item-rtl]',
    '$/div[0]/div[0]/div[0]: 我们缺少属性 aria-disabled="false"',
    '$/div[0]/div[0]/div[0]: 我们缺少属性 aria-expanded="true"',
    '$/div[0]/div[0]/div[0]: 我们缺少属性 role="button"',
    '$/div[0]/div[0]/div[0]: 子节点数不同 2 vs 1',
    '$/div[0]/div[0]/div[1]: 我们多出属性 aria-hidden="false"',
    '$/div[0]/div[0]/div[1]: 我们多出属性 aria-labelledby="{i0}"',
    '$/div[0]/div[0]/div[1]: 我们多出属性 role="region"',
    '$/div[0]/div[1]: 类名不同 [apollo-collapse-item] vs [apollo-collapse-item apollo-collapse-item-rtl]',
    '$/div[0]/div[1]: 子节点数不同 1 vs 2',
  ]),
  'collapse:semantic': entry([
    '$/div[0]/div[0]: 子节点数不同 1 vs 2',
    '$/div[0]/div[1]: 子节点数不同 1 vs 2',
  ]),
  'collapse:collapsible-disabled': entry([
    '$/div[0]/div[0]/div[0]: 我们缺少属性 aria-disabled="true"',
    '$/div[0]/div[0]/div[0]: 我们缺少属性 aria-expanded="true"',
    '$/div[0]/div[0]/div[0]: 我们缺少属性 role="button"',
    '$/div[0]/div[0]/div[0]: 子节点数不同 2 vs 1',
    '$/div[0]/div[0]/div[1]: 我们多出属性 aria-hidden="false"',
    '$/div[0]/div[0]/div[1]: 我们多出属性 aria-labelledby="{i0}"',
    '$/div[0]/div[0]/div[1]: 我们多出属性 role="region"',
    '$/div[0]/div[1]: 子节点数不同 1 vs 2',
  ]),
  'collapse:children-deprecated': entry([
    '$/div[0]/div[0]/div[0]: 我们缺少属性 aria-disabled="false"',
    '$/div[0]/div[0]/div[0]: 我们缺少属性 aria-expanded="true"',
    '$/div[0]/div[0]/div[0]: 我们缺少属性 role="button"',
    '$/div[0]/div[0]/div[0]: 子节点数不同 2 vs 1',
    '$/div[0]/div[0]/div[1]: 我们多出属性 aria-hidden="false"',
    '$/div[0]/div[0]/div[1]: 我们多出属性 aria-labelledby="{i0}"',
    '$/div[0]/div[0]/div[1]: 我们多出属性 role="region"',
    '$/div[0]/div[1]: 子节点数不同 1 vs 2',
  ]),
};
