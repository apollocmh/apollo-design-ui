# F12 · CSSMotion hydration 首帧（2026-10-24）

## 复现与修复

F03 真实 Input / ErrorList 的 SSR hydration 回归发现基础层 mismatch：SSR 以 ssrContext 同步渲染 visible 内容，客户端支持 motionAppear 时初始化为 NONE/null，Vue 把服务器元素替换为 comment，再由 mounted 的 appear 插入新元素。forceRender 隐藏分支也会替换节点。

基础层新增 hydration.test.ts 四条测试，修前 3 失败、1 通过（不可见且不 forceRender 的原有行为）；日志 `/tmp/apollo-motion-hydration-red.log`。修复使用 Vue getCurrentInstance 的 vnode.el：hydration setup 前 Vue 已关联服务器节点，仅此时让初始快照匹配 SSR。driver.mount 的 supportMotion 和 motionAppear 保持原值，mounted 后照常 appear；未改驱动、时长、队列或原生事件逻辑。普通新挂载没有已有节点，继续走 NONE/null 的防闪烁规则，原有帧泵矩阵继续覆盖。

测试覆盖可见、不可见、forceRender 的 DOM 身份；不受控输入框在 hydration 前已输入的值；appear → leave → enter 真实执行；onVisibleChanged 各一次；零 hydration warning/error。

## 验证

- `pnpm exec vitest run --project unit packages/motion/src/ packages/ui/src/form/__tests__/prefix-reactivity.test.ts --maxWorkers=1`：8 文件 138 条通过（Motion 130 + F03 8），含原有 driver/oracle/首帧时序矩阵。
- `pnpm --filter @apollo-design/motion run build`：通过。
- `node tests/browser/motion-hydration.mjs`：生产 dist，真实 Node SSR → Chrome 150.0.7871.125；原节点与不受控输入值保留，appear/leave/enter 保持启用，通知各一次，零 browser/Vue 错误。
- Form/Input/Alert/Badge/Collapse/Message/Notification 消费回归（unit/dom-contract/a11y/theme，maxWorkers=1）：48 文件 722 条通过，含现有 Message/Notification 动效测试。
- `pnpm run lint:types` 通过；Motion/Form/Input 类型项目 8 文件 96 条通过，无 source/unhandled 错误。
- `node tests/build/run.mjs --no-build --package motion`：11 检查、0 FAIL/PENDING、5 项按包职责 n/a；实际构建已在上条完成。UI L7 另有 11 项通过。
- `pnpm run registry:check`：19 项通过，vue-native 历史 24 fixed / 0 open；范围内 Biome 11 文件与 git diff --check 通过。
- 文档 14 文件 157 条、typecheck、更新 motion dist 后重建 client/server + SSG 84 路由通过（994 Demo）；既有 303 条 order 提示和大 chunk 提示保留。

未修改图片基线。Form 组件的视觉检查仍缺 21 张已批准基线，不能以这些行为和基础层 SSR 检查宣称组件视觉已验收。

## 边界

这不是关闭 appear 或修改组件动效。SSR 与客户端数据本来不一致的场景仍由 Vue 正常诊断；不以固定编号/强制重挂载掩盖差异。本批覆盖 hydration 边界，不宣称所有组件的视觉重新验收。Motion Registry 保留历史 verification，仅追加此次证据。
