/**
 * 文档站主题入口。
 *
 * 样式真源与视觉回归层一致（tests/visual/render/vue-main.js 同款两行）：
 *   - @apollo-design/theme/tokens.css  设计令牌（:root 上的 --apollo-*）
 *   - @apollo-design/ui/style.css      全量组件样式（聚合产物）
 * 因此文档站 demo 的视觉 = 发布产物的视觉。改动组件样式后先 `pnpm build:ui` 再看效果。
 */
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
import DefaultTheme from 'vitepress/theme';

import './custom.css';
import DemoPreview from './DemoPreview.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 组件页 markdown 里直接用 <DemoPreview component="button" demo="basic" />
    app.component('DemoPreview', DemoPreview);
  },
};
