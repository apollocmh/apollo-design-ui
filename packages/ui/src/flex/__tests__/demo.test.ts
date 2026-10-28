/** All six paired Apollo Flex demos must render, update and unmount without component warnings. Their actual controls, conditions, themes and mobile layout are covered by the independent Flex browser fixture. */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Flex', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 6,
});
