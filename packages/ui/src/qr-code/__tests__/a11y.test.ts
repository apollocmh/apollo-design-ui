/** Actual named graphics and native status content; no inherited upstream waivers. */
import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('QrCode (canvas)', {
  demos: import.meta.glob('../demo/{basic,custom,status,component-token}.vue', { eager: true }),
  expectCount: 4,
});

a11yDemoTest('QrCode (svg)', {
  demos: import.meta.glob('../demo/svg.vue', { eager: true }),
  expectCount: 1,
});
