/** Vue 侧（@apollo-design/ui）的 App 视觉用例。与 react/app.jsx 逐条对应。 */

import { App } from '@apollo-design/ui';
import { h } from 'vue';

export default {
  basic: () =>
    h('div', { style: { minHeight: '120px', padding: '16px', width: '420px' } }, [
      h(App, null, () =>
        h('p', { style: { margin: 0 } }, 'App inherits color/fontSize/lineHeight/fontFamily.'),
      ),
    ]),
};
