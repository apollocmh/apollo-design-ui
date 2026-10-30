/** Smoke every current Watermark Demo, including the actual Modal inheritance consumer. */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Watermark', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 5,
});
