# @apollo-design/utils

Apollo Design 的基础工具包，提供 Vue 状态组合函数、DOM 与焦点操作、属性合并、调度和颜色计算。适合组件作者与基础设施代码；普通业务应用通常只需安装 `@apollo-design/ui`。

## 安装

```bash
npm install @apollo-design/utils vue
```

## 受控状态

在 Vue `setup()` 或有效作用域内创建组合函数。标准 SFC 的双向绑定可直接使用 Vue 的 `defineModel`；需要在独立组合函数中处理受控和非受控状态时使用 `useControlledValue`：

```ts
import { ref } from 'vue';
import { useControlledValue } from '@apollo-design/utils';

const source = ref<number | undefined>(1);
const [value, requestValue] = useControlledValue({
  defaultValue: 0,
  getValue: () => source.value,
  onChange: (next) => { source.value = next; },
});
requestValue(2);
console.log(value.value); // 2
```

受控请求由调用方决定是否接受；`undefined` 表示撤销受控，并保留最后一次实际接收的值。

## 主要能力

| 类别 | 入口示例 |
| --- | --- |
| Vue 状态与生命周期 | `useControlledValue`、`useDelayState`、`useId` |
| DOM 与焦点 | `canUseDom`、`getActiveElement`、`containsComposed`、`lockFocus` |
| 元素观察 | `useResizeObserver`、`useMutationObserver` |
| 属性与插槽内容 | `toVueDomAttrs`、`mergeDomAttrs`、`toArray` |
| 调度 | `raf`、`cancelRaf`、`throttle`、`debounce` |
| 数据与颜色 | `get`、`set`、`merge`、`Color`、`generatePalette` |

焦点工具按元素所属文档协调，支持 Shadow DOM 的相关边界；作用域工具在释放时清理监听与观察器。直接使用命令式 API 时由调用方执行对应清理。

本包不提供组件外观或 CSS。颜色算法输出计算结果，品牌色、尺寸与设计令牌属于 `@apollo-design/theme`。DOM 工具在存在实际元素的客户端阶段调用。

## 文档与维护

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/utils/src/index.ts) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md) · [测试要求](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md)
