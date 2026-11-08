# @apollo-design/a11y

面向 Vue 组件作者的无障碍交互原语：焦点约束与恢复、方向键导航、活动后代、字符定位和屏幕阅读器播报。

## 安装

```bash
npm install @apollo-design/a11y vue
```

## 键盘导航示例

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { useRovingFocus } from '@apollo-design/a11y';

const count = ref(3);
const active = ref(0);
const items = useTemplateRef<HTMLButtonElement[]>('items');
const { getTabIndex, onKeyDown } = useRovingFocus({
  count,
  activeIndex: active,
  onChange: (index) => { active.value = index; },
  getItem: (index) => items.value?.[index] ?? null,
});
</script>

<template>
  <div role="toolbar" aria-label="工具" @keydown="onKeyDown">
    <button v-for="index in count" :key="index" ref="items" :tabindex="getTabIndex(index - 1)">
      操作 {{ index }}
    </button>
  </div>
</template>
```

这里使用原生按钮展示基础原语。宿主负责提供元素、逻辑顺序、禁用过滤和语义；导航在状态变更被接受后移动焦点。

## 能力与职责

| 场景 | API |
| --- | --- |
| 模态内容内的焦点循环 | `lockFocus`、`useLockFocus` |
| 关闭后返回触发元素 | `useFocusRestore` |
| 工具栏、列表中的方向键导航 | `useRovingFocus` |
| 保持输入焦点并标记活动选项 | `useActiveDescendant` |
| 输入字符定位选项 | `useTypeahead` |
| 状态播报 | `useLiveRegion`、`announce` |

组合函数在 Vue 作用域内使用。`useLiveRegion` 随组件挂载建立节点、卸载清理；`announce` 使用共享的命令式播报区域。焦点恢复支持嵌套层级，已移除的目标按当前恢复契约回退。

本包不生成控件布局、主题或完整 ARIA 结构。无障碍扫描属于测试工具，组件仍需要验证名称、角色、焦点顺序和实际键盘操作。

## 文档与维护

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/a11y/src/index.ts) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md) · [测试要求](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md)
