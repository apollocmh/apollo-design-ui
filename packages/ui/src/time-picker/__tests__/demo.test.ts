/** The 16 implemented TimePicker demos use the current native props, models and slots. */

import { demoTest } from '@apollo-design/test-utils';

demoTest('TimePicker', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 16,
});
