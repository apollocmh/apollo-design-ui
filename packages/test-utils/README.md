# @apollo-design/test-utils

Apollo Design 仓库内部的 Vue 测试工具。用于复用组件挂载、DOM 契约、键盘焦点、无障碍、主题与资源释放检查。本包设置为 `private: true`，不发布到 npm。

## 使用场景

组件测试在各组件的 `__tests__` 中维护。本包提供测试辅助函数与可复用契约，不集中存放具体组件用例。

| 场景 | 入口示例 |
| --- | --- |
| Demo 与挂载 | `demoTest`、`mountTest` |
| DOM 与根属性 | `domContractTest`、`rootPropsTest` |
| 无障碍与焦点 | `a11yDemoTest`、`focusTest` |
| 方向和主题 | `rtlTest`、`themeTest` |
| 异步更新 | `flushAll`、`waitFrames` |
| 资源与告警 | `snapshotObservers`、`captureWarnings`、`assertNoUnexpectedWarnings` |

## 仓库接入

需要使用的 workspace 包将 `@apollo-design/test-utils` 声明为 `workspace:*` 开发依赖，在 Vitest 的对应项目中导入：

```ts
import { flushAll } from '@apollo-design/test-utils';

// 触发组件状态更新后，等待 Vue 和本轮异步任务完成。
await flushAll();
```

辅助函数的参数类型从包根导出，实际测试场景以对应组件的测试为例。需要浏览器布局、滚动或真实动效时，使用仓库的浏览器验证入口，不能用 DOM 模拟结果替代。

## 约定

- 等待应描述实际更新或帧，不添加任意时长的 sleep。
- 已知例外通过带原因的 `Allowance` 表达，未命中的例外不能长期留存。
- 使用现有警告捕获与观察器快照，保持释放与清理检查有效。
- 测试范围、阈值与验收阶段由项目规范统一规定，README 不维护第二套数字。

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/test-utils/src/index.ts) · [测试标准](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md) · [工作流程](https://github.com/apollocmh/apollo-design-ui/blob/master/WORKFLOW.md)
