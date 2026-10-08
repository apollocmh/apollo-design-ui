const e=`<script setup lang="ts">
// 对齐 antd 的 virtual-scroll demo。
// ⚠️ \`build\` 必须写**显式返回类型**：递归函数靠推断会报
//    \`TS7023/7024: implicitly has return type 'any' because it is referenced directly
//    or indirectly in one of its return expressions\`。
import { Tree } from '@apollo-design/ui';
// ⚠️ \`DataNode\` / \`EventDataNode\` **不在包根导出**（根 barrel 只导 \`Tree*\` 前缀的类型）
//    ⇒ 从组件的本地模块导入；写成 \`from '@apollo-design/ui'\` 会报 TS2305。
import type { DataNode } from '../interface';

const treeData: DataNode[] = [];
const build = (pre: string, level: number): DataNode[] => {
  if (level < 0) return [];
  return [0, 1, 2].map((i) => {
    const key = \`\${pre}\${i}\`;
    return { title: \`节点 \${key}\`, key, children: build(\`\${key}-\`, level - 1) };
  });
};
treeData.push(...build('0-', 3));
<\/script>

<template>
  <Tree :tree-data="treeData" :height="234" default-expand-all />
</template>
`;export{e as default};
