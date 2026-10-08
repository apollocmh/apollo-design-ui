const n=`<script setup lang="ts">
import { Divider } from '../../index';

/**
 * 组件 Token 的覆盖 —— 本仓库的零运行时写法。
 *
 * ⚠️ 与 antd 的差异（登记缺口，见 README.md §7）：
 *    antd 用 \`<ConfigProvider theme={{ components: { Divider: {...} } }}>\` 覆盖三个组件 Token。
 *    本仓库的 Token 最终形态是 CSS 变量，所以「别名派生的」\`verticalMarginInline\` 可以就地
 *    重声明 \`--apollo-margin-xs\` 覆盖；而 \`textPaddingInline\` / \`orientationMargin\` 是
 *    **字面量** Token，被内联成常量、没有变量可覆盖 —— 这是全库的管线缺口
 *    （\`packages/theme\` 的 tokens.css 只声明 Alias 层），修复位置不在本组件。
 *    这里用 \`styles.content.padding\` / \`styles.content.margin\` 演示等价效果。
 */
const tokenOverrides = {
  '--apollo-margin-xs': '24px',
  '--apollo-margin': '24px',
  '--apollo-line-width': '5px',
  '--apollo-color-split': '#1677ff',
} as const;
<\/script>

<template>
  <div :style="tokenOverrides">
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
      probare, quae sunt a te dicta? Refert tamen, quo modo.
    </p>
    <Divider>Text</Divider>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
      probare, quae sunt a te dicta? Refert tamen, quo modo.
    </p>
    <Divider title-placement="start" :styles="{ content: { padding: '0 16px' } }">
      Left Text
    </Divider>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
      probare, quae sunt a te dicta? Refert tamen, quo modo.
    </p>
    <Divider title-placement="end" :styles="{ content: { margin: '0 50px' } }">
      Right Text
    </Divider>
  </div>
</template>
`;export{n as default};
