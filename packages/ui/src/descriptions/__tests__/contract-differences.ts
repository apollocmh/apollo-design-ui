/** Exact finite differences from all 18 untouched reference cases; native replacements are verified independently. */
export const descriptionsContractDifferences = {
  'descriptions:basic': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:empty-items': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 0',
    ],
  },
  'descriptions:bordered': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:vertical': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]: 类名不同 [apollo-descriptions] vs [apollo-descriptions apollo-descriptions-vertical]',
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:vertical-bordered': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]: 类名不同 [apollo-descriptions apollo-descriptions-bordered] vs [apollo-descriptions apollo-descriptions-bordered apollo-descriptions-vertical]',
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:size-small': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:size-medium': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:colon-false': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:title-extra': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[1]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[1]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[1]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[1]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:title-only': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[1]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[1]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[1]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[1]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:column-2': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:2]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:span-2': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 2',
    ],
  },
  'descriptions:filled': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 2',
    ],
  },
  'descriptions:bordered-span': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 2',
    ],
  },
  'descriptions:semantic': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:label-style': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:bordered-semantic': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
  'descriptions:attrs': {
    deviationId: 'descriptions-native-vue-contracts',
    reason:
      'Stable native dl/div/dt/dd ownership preserves keyed content and focus through responsive regrouping and layout changes (ADR0007); contracts.test.ts and browser tests cover native replacement semantics.',
    diff: [
      '$/div[0]/div[0]/table[0]: 标签不同 <table> vs <dl>',
      '$/div[0]/div[0]/table[0]: 类名不同 [] vs [apollo-descriptions-list]',
      '$/div[0]/div[0]/table[0]: style 不同 [] vs [--apollo-descriptions-columns:3]',
      '$/div[0]/div[0]/table[0]: 子节点数不同 1 vs 4',
    ],
  },
};
