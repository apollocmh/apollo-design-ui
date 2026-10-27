import { demoTest } from '@apollo-design/test-utils';

demoTest('Avatar', { demos: import.meta.glob('../demo/*.vue', { eager: true }), expectCount: 10 });
