/**
 * L4 · DOM 契约（与 antd 6.6.4 的机械 oracle 逐字比对）—— Image
 *
 * 基准：`tests/compat/baselines/image.dom.json`（9 个用例，产出者
 * `tests/compat/baseline/image.mjs`）。cssinjs 类（css-dev-only-do-not-override /
 * css-var-root / -css-var）由 dom-contract 对称剔除。
 * Preview 是 portal ⇒ SSR 不可见（与 tooltip/popover 同判）。
 */

import { domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/image.dom.json';
import Image from '../Image';

const BP = { prefixCls: 'apollo-image' };
const PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const specs: Record<string, { render: () => ReturnType<typeof h> }> = {
  'image:basic': {
    render: () => h(Image, { ...BP, src: PX, alt: 'a', width: 200, height: 100 } as never),
  },
  'image:no-preview': {
    render: () => h(Image, { ...BP, src: PX, alt: 'b', width: 96, preview: false } as never),
  },
  'image:cover-placement': {
    render: () =>
      h(Image, {
        ...BP,
        src: PX,
        width: 96,
        preview: { cover: { placement: 'top', coverNode: 'top' } },
      } as never),
  },
  'image:cover-false': {
    render: () => h(Image, { ...BP, src: PX, width: 96, preview: { cover: false } } as never),
  },
  'image:placeholder-true': {
    render: () => h(Image, { ...BP, src: PX, width: 96, placeholder: true } as never),
  },
  'image:progress': {
    render: () =>
      h(Image, {
        ...BP,
        width: 200,
        height: 200,
        placeholder: { progress: { percent: 50 } },
      } as never),
  },
  'image:progress-busy': {
    render: () => h(Image, { ...BP, width: 100, placeholder: { progress: true } } as never),
  },
  'image:preview-src': {
    render: () => h(Image, { ...BP, src: PX, width: 96, preview: { src: PX } } as never),
  },
  'image:preview-mask': {
    render: () =>
      h(Image, { ...BP, src: PX, width: 96, preview: { mask: { blur: true } } } as never),
  },
};

domContractTest('Image', {
  baseline,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`semantic.test: 基线用例 ${id} 缺少 Vue 侧 spec`);
    return spec.render();
  },
});
