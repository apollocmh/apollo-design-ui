import assert from 'node:assert/strict';
import { defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Portal, useEscKeyDown, useScrollLocker } from '../../packages/portal/dist/index.mjs';
import { getTargetScrollBarSize, isBodyOverflowing } from '../../packages/utils/dist/index.mjs';

assert.equal(typeof document, 'undefined');
assert.equal(typeof window, 'undefined');
assert.deepEqual(getTargetScrollBarSize(), { width: 0, height: 0 });
assert.equal(isBodyOverflowing(), false);
assert.equal(isBodyOverflowing(null), false);
let slotCalls = 0;
const Source = defineComponent({
  setup() {
    useScrollLocker(true);
    useEscKeyDown(true, () => {
      throw new Error('SSR must not register a browser callback');
    });
    return () =>
      h(
        Portal,
        { open: false, autoLock: true },
        {
          default: () => {
            slotCalls++;
            return h('input');
          },
        },
      );
  },
});
assert.equal(await renderToString(h(Source)), '<!---->');
assert.equal(slotCalls, 0);
console.log('Portal production SSR passed without DOM globals or eager slots');
