# 独立化兼容与迁移记录 · 2026-10-23

独立化治理本身未包含破坏性公共组件 API 变更。之后用户在同日批准开发阶段模板扩展 API 直接迁移，见 ADR 0006 与 [Transfer 插槽迁移](transfer-slots.md)；其他安装入口、事件、v-model、视觉、令牌及既有 deprecated alias 保持。

## 开发工具迁移

- Registry 的 `antdVersion`、`antdApiStatus`、`compatStatus` 迁入 `referenceEvidence`，只用于历史追溯；Apollo 的九个质量维度保留。脚本消费者应改读 referenceEvidence，不能把参考完成度作为发布许可。
- `registry:gen` 只刷新 Apollo 自有图；`registry:check` 为只读漂移检查。新增组件维护 components.json，新增令牌维护 theme 类型与 tokens.json，不必伪造上游条目。
- `test:visual` 改为 Apollo 基线比较；原工具用 `test:visual:reference`。旧脚本仍保留明确模式，不删除参考截图。首次运行需要候选生成与人工审阅，缺基线返回非零。

## 待单独评估的公共 API

| 项目 | 兼容路径 | 移除条件 |
|---|---|---|
| 函数内容 props / Transfer render | 已批准直接使用作用域插槽，不保留兼容层 | ADR 0006；Transfer 首批已实施，其他组件逐项验证 |
| `@click` DOM 语义与业务回调 | 逐组件复现 payload，新增明确业务事件或适配层 | 不在本轮批量改 payload |
| 非根样式旧别名 | 保留 deprecated alias，推荐现有 classNames/styles | 独立弃用周期与类型/运行时迁移测试 |
| 任意 prefixCls 的样式 | 保留当前静态 CSS 边界，修复 DOM 响应性 | D04 设计决定后再扩展构建期能力 |

KNOWN-ISSUES 的 D03 已由用户裁决，其余 D01/D02/D04/D05 保持待决。模板扩展迁移无需兼容期；每项仍记录旧/新示例、影响版本、行为与测试证据。

## 内部实现调整

Portal 的 `getContainer=false` 保持内联渲染，但不再向 body 挂载未使用的空 div；原断言只为复制上游副作用，现改为验证内联→默认容器→内联切换、内容位置和容器清理。没有变更公共 prop、事件或可见布局。SSR 提示改用 Vue 的 onMounted。
