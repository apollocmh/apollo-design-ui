/** The 28 original reference cases remain unchanged; only finite native ARIA additions differ. */
const entry = (diff: string[]) => ({
  deviationId: 'alert-native-close-accessibility',
  reason:
    'The owned native close button has a stable accessible name and default icons are decorative. Exact additions only; native events/keyboard/empty icons are covered by the contract and browser suites. See docs/migrations/alert-contracts.md.',
  diff,
});
const icon = '$/div[0]/span[0]: 我们多出属性 aria-hidden="true"';
const label = '$/div[0]/button[1]: 我们多出属性 aria-label="Close"';
const closeIcon = '$/div[0]/button[1]/span[0]: 我们多出属性 aria-hidden="true"';
export const alertContractDifferences = {
  'alert:banner': entry([icon]),
  'alert:banner-error': entry([icon]),
  'alert:show-icon': entry([icon]),
  'alert:action': entry([icon]),
  'alert:closable': entry([label, closeIcon]),
  'alert:closable-object': entry([closeIcon]),
  'alert:closable-object-closeIcon': entry([label]),
  'alert:close-text': entry([label]),
  'alert:close-icon-string': entry([label]),
  'alert:semantic': entry([
    icon,
    '$/div[0]/button[3]: 我们多出属性 aria-label="Close"',
    '$/div[0]/button[3]/span[0]: 我们多出属性 aria-hidden="true"',
  ]),
};
