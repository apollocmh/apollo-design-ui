/** Nine current Calendar demos: render, update and unmount without allowances. */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Calendar', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 9,
});
