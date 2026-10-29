/** All nine real paired Divider demos must render, update and unmount without unexpected warnings. Browser checks exercise their native controls and geometry separately. */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Divider', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 9,
});
