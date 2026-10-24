import { demoTest } from '@apollo-design/test-utils';

demoTest('List', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
});
