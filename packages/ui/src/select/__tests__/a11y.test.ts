/** Scan every demo. Existing unnamed demos retain their explicit label issue;
 * named and newly updated demos run without an allowance. */

import { a11yDemoTest } from '@apollo-design/test-utils';

const {
  '../demo/conditional-options.vue': conditionalOptions,
  '../demo/native-models.vue': nativeModels,
  '../demo/component-token.vue': componentToken,
  ...legacyDemos
} = import.meta.glob('../demo/*.vue', { eager: true });

a11yDemoTest('Select', {
  demos: legacyDemos,
  expectCount: 34,
  global: { stubs: { teleport: false } },
  allow: [
    {
      rule: 'label',
      reason: '未修改的历史示例缺少可访问名称；保留既有 label 问题，已命名和新增示例不使用此豁免。',
    },
  ],
});

a11yDemoTest('Select named demos', {
  demos: {
    '../demo/conditional-options.vue': conditionalOptions,
    '../demo/native-models.vue': nativeModels,
    '../demo/component-token.vue': componentToken,
  },
  expectCount: 3,
  global: { stubs: { teleport: false } },
});
