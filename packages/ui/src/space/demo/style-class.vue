<script setup lang="ts">
import { Space, type SpaceProps } from '../../index';
import { BTN_DEFAULT } from './_standin';

/**
 * 语义化 `classNames` / `styles`：对象式与函数式两种形态。
 *
 * ⚠️ `classNames` 只负责**挂类名**，样式由使用者自己的样式表提供
 *    （零运行时架构，H6 禁止 CSS-in-JS）。所以这个 demo 里 `classNames` 的效果
 *    要开 devtools 才看得到 —— 视觉差异全部来自 `styles`。
 *    这正是我们的用户会遇到的形态，`README.md` §5.3 有说明。
 *
 * ⚠️ `styles` 的数值必须**带单位**：Vue 的运行时 `setStyle` 不做 px 补全
 *    （PITFALLS 32），写 `{ padding: 8 }` 会被静默丢弃。
 *
 * ⚠️ 函数式拿到的 `info.props` 是**合并后**的 props（`orientation` 已折成
 *    `horizontal` / `vertical`、`size` 已并入 ConfigProvider 的取值），
 *    所以可以放心用它做条件分支。
 */
const classNamesObject: SpaceProps['classNames'] = {
  root: 'demo-space-root',
  item: 'demo-space-item',
  separator: 'demo-space-separator',
};

const classNamesFn: SpaceProps['classNames'] = (info) =>
  info.props.orientation === 'vertical'
    ? { root: 'demo-space-root--vertical' }
    : { root: 'demo-space-root--horizontal' };

const stylesObject: SpaceProps['styles'] = {
  root: { borderWidth: '2px', borderStyle: 'dashed', padding: '8px', marginBottom: '10px' },
  item: { backgroundColor: '#f0f0f0', padding: '4px' },
  separator: { color: 'red', fontWeight: 'bold' },
};

const stylesFn: SpaceProps['styles'] = (info) =>
  info.props.size === 'large'
    ? { root: { backgroundColor: '#e6f7ff', borderColor: '#1890ff', padding: '8px' } }
    : { root: { backgroundColor: '#fff7e6', borderColor: '#fa8c16' } };
</script>

<template>
  <div>
    <Space :styles="stylesObject" :class-names="classNamesObject" separator="•">
      <button type="button" :style="BTN_DEFAULT">Styled Button 1</button>
      <button type="button" :style="BTN_DEFAULT">Styled Button 2</button>
      <button type="button" :style="BTN_DEFAULT">Styled Button 3</button>
    </Space>
    <Space size="large" :styles="stylesFn" :class-names="classNamesFn">
      <button type="button" :style="BTN_DEFAULT">Large Space Button 1</button>
      <button type="button" :style="BTN_DEFAULT">Large Space Button 2</button>
      <button type="button" :style="BTN_DEFAULT">Large Space Button 3</button>
    </Space>
  </div>
</template>
