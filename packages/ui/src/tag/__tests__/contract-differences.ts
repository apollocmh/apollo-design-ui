/** Exact reviewed differences from the untouched React reference.
 * Native content, owned actions, model and colour checks are in contract-audit.test.ts
 * and tests/browser/tag-{link,color}-contracts.mjs; see docs/migrations/tag-contracts.md.
 */
export const tagContractDifferences = {
  'tag:prefix-cls:no-props': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]: 子节点数不同 0 vs 1'],
  },
  'tag:basic': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]: 子节点数不同 0 vs 1'],
  },
  'tag:href': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Owned link is inside the stable content host; close is a sibling native button.',
    diff: ['$/a[0]: 标签不同 <a> vs <span>', '$/a[0]: 子节点数不同 0 vs 1'],
  },
  'tag:disabled-href': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Owned link is inside the stable content host; close is a sibling native button.',
    diff: ['$/a[0]: 标签不同 <a> vs <span>', '$/a[0]: 子节点数不同 0 vs 1'],
  },
  'tag:aria-attrs': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]: 子节点数不同 0 vs 1'],
  },
  'tag:preset-blue-filled': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]: 子节点数不同 0 vs 1'],
  },
  'tag:preset-blue-solid': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]: 子节点数不同 0 vs 1'],
  },
  'tag:preset-blue-outlined': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]: 子节点数不同 0 vs 1'],
  },
  'tag:status-success-filled': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]: 子节点数不同 0 vs 1'],
  },
  'tag:status-success-solid': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]: 子节点数不同 0 vs 1'],
  },
  'tag:status-error-outlined': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]: 子节点数不同 0 vs 1'],
  },
  'tag:custom-color-filled': {
    deviationId: 'tag-native-vue-contracts',
    reason:
      'Current custom colour variables enable accessible foregrounds in every theme; content has a stable host.',
    diff: [
      '$/span[0]: 类名不同 [apollo-tag apollo-tag-filled] vs [apollo-tag apollo-tag-custom apollo-tag-filled]',
      '$/span[0]: style 不同 [background-color:#e7f6fe;color:#2db7f5] vs [--apollo-tag-custom-bg:#e7f6fe;--apollo-tag-custom-color:#2db7f5]',
      '$/span[0]: 子节点数不同 0 vs 1',
    ],
  },
  'tag:custom-color-solid': {
    deviationId: 'tag-native-vue-contracts',
    reason:
      'Current custom colour variables enable accessible foregrounds in every theme; content has a stable host.',
    diff: [
      '$/span[0]: 类名不同 [apollo-tag apollo-tag-solid] vs [apollo-tag apollo-tag-custom apollo-tag-solid]',
      '$/span[0]: style 不同 [background-color:#2db7f5] vs [--apollo-tag-custom-bg:#e7f6fe;--apollo-tag-custom-color:#2db7f5]',
      '$/span[0]: 子节点数不同 0 vs 1',
    ],
  },
  'tag:inverse-color': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]: 子节点数不同 0 vs 1'],
  },
  'tag:closable': {
    deviationId: 'tag-native-vue-contracts',
    reason:
      'Stable content host and native close button preserve Vue subtree state and caller glyph semantics.',
    diff: ['$/span[0]: 子节点数不同 1 vs 2'],
  },
  'tag:custom-close-icon': {
    deviationId: 'tag-native-vue-contracts',
    reason:
      'Stable content host and native close button preserve Vue subtree state and caller glyph semantics.',
    diff: ['$/span[0]: 子节点数不同 1 vs 2'],
  },
  'tag:closable-disabled': {
    deviationId: 'tag-native-vue-contracts',
    reason:
      'Stable content host and native close button preserve Vue subtree state and caller glyph semantics.',
    diff: ['$/span[0]: 我们多出属性 aria-disabled="true"', '$/span[0]: 子节点数不同 1 vs 2'],
  },
  'tag:icon': {
    deviationId: 'tag-native-vue-contracts',
    reason:
      'Complete icon content has an owned semantic host; business attributes remain on the caller node.',
    diff: [
      '$/span[0]: 类名不同 [apollo-tag apollo-tag-filled] vs [apollo-tag apollo-tag-filled apollo-tag-has-icon]',
      '$/span[0]/i[0]: 标签不同 <i> vs <span>',
      '$/span[0]/i[0]: 类名不同 [my-icon] vs [apollo-tag-icon]',
      '$/span[0]/i[0]: 子节点数不同 0 vs 1',
      '$/span[0]/span[1]: 类名不同 [] vs [apollo-tag-content]',
    ],
  },
  'checkable:checked': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]/span[0]: 类名不同 [] vs [apollo-tag-content]'],
  },
  'checkable:unchecked': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]/span[0]: 类名不同 [] vs [apollo-tag-content]'],
  },
  'checkable:disabled': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Existing complete content owns a stable, addressable content host.',
    diff: ['$/span[0]/span[0]: 类名不同 [] vs [apollo-tag-content]'],
  },
  'checkable-group:single': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Group has explicit group semantics and each child owns its stable content host.',
    diff: [
      '$/div[0]: 我们多出属性 role="group"',
      '$/div[0]/span[0]/span[0]: 类名不同 [] vs [apollo-tag-content]',
      '$/div[0]/span[1]/span[0]: 类名不同 [] vs [apollo-tag-content]',
    ],
  },
  'checkable-group:multiple': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Group has explicit group semantics and each child owns its stable content host.',
    diff: [
      '$/div[0]: 我们多出属性 role="group"',
      '$/div[0]/span[0]/span[0]: 类名不同 [] vs [apollo-tag-content]',
      '$/div[0]/span[1]/span[0]: 类名不同 [] vs [apollo-tag-content]',
    ],
  },
  'checkable-group:option-objects': {
    deviationId: 'tag-native-vue-contracts',
    reason: 'Group has explicit group semantics and each child owns its stable content host.',
    diff: [
      '$/div[0]: 我们多出属性 role="group"',
      '$/div[0]/span[0]/span[0]: 类名不同 [] vs [apollo-tag-content]',
    ],
  },
};
