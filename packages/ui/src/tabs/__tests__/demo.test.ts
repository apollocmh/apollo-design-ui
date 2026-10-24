/** Tabs demos: current native Vue examples load without warnings. */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Tabs', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 20,
});
