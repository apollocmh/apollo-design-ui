# F03 · Form 前缀与占位扩展整改（2026-10-24）

## 从基础复核到真实缺陷

此前的 [复核](2026-10-24-form-prefix-recheck.md) 仅证明 6867166a 已修复 ItemHolder setup 字符串，原生 input 用例 1 条通过。本阶段使用真实 Input、CSS margin 和 ErrorList 扩展验证；保留原通过用例，新增 6 条修前全部失败（日志 `/tmp/apollo-form-prefix-expanded-red.log`），没有把既有修复当作新工作。

发现并修复两条遗漏：

1. ItemHolder 没有给普通 Item 的错误列表提供前缀上下文，独立 ErrorList 也固定回退 apollo-form；ErrorList 又在 setup 解构 prefixCls 并固定 baseClassName。现在 ItemHolder 提供响应式 getter，ErrorList 按 computed 读取当前 Item/List 上下文，独立使用按 ConfigProvider 取前缀。帮助/错误类及 motionName 一起更新。
2. marginBottom 只在 errors/warnings/有无错误变化时测量。相同 help 下切换 prefix/layout 会使用另一份静态 CSS margin，却仍保留旧负 margin-offset 与 additional min-height。watch 新增 prefix/layout 依赖并在 post flush 读取新 DOM，不引入运行时 CSS。

StatusProvider 的反馈图标本来位于 computed 内，保持原实现；真实 Input 的反馈通道用四种状态验证。本批不修改公开类型或事件载荷，双语文档补充动态 prefix/layout、ErrorList 上下文与静态 CSS 前提。

## SSR 联动

新增的第 8 条 SSR hydration 用例发现 CSSMotion 服务器节点被客户端首帧替换，并触发 mismatch。基础层按独立 F12 修复，见 [motion 报告](2026-10-24-motion-hydration-remediation.md)，没有关闭 appear 或弱化断言。修后基础包与 F03 联动 8 文件 138 条通过。

## 场景和浏览器

prefix-reactivity.test.ts 共 8 条：原基础用例 + 三布局真实 Input/feedback/help + prefix/layout margin 测量 + Item 直接 prefix/四状态 + 独立和 Form.List ErrorList + SSR hydration。CSS 数值仅用于可失败的预加载样式夹具，生产组件没有插入 CSS。

`node tests/browser/form-prefix.mjs` 先以旧 UI dist 运行，因找不到正确前缀的解释内容失败，日志 `/tmp/apollo-form-prefix-browser-red.log`。重建后 Chrome 150.0.7871.125 通过：

- horizontal / vertical / inline × f1→f2→f1，无旧 Item 前缀残留；
- Input 消费真实 feedback context，custom-a/custom-b Item prefix × error/warning/success/validating；
- computed margin 与负 offset、additional min-height 数值相等；
- help 移除后占位清除，再次显示恢复正确测量；
- 用户输入值和原 input DOM 跨 prefix/layout/status 切换保留，零 browser/Vue 错误。

最终执行结果（Node 22.22.2 / pnpm 12.4.2）：

| 命令/范围 | 结果 |
|---|---|
| Form/Input/Alert/Badge/Collapse/Message/Notification 的 unit/dom-contract/a11y/theme（maxWorkers=1） | 48 文件 722 条通过；prefix-reactivity 共 8 条 |
| `pnpm run lint:types` | 通过 |
| Motion/Form/Input types 项目 | 8 文件 96 条通过，无 source/unhandled 类型错误 |
| `pnpm run build:ui`、`pnpm --filter @apollo-design/motion run build` | 通过；UI 与基础包的真实 dist 用于浏览器 |
| `node tests/browser/form-prefix.mjs` | 上述完整生产浏览器矩阵通过，零 browser/Vue 错误 |
| `node tests/browser/motion-hydration.mjs` | 真实 SSR 节点与预输入值保留，appear/leave/enter 及单次通知通过 |
| `node tests/build/run.mjs --no-build --package ui` | 11 项通过，0 FAIL/PENDING，实际构建另行完成 |
| Docs test / typecheck | 14 文件 157 条通过；类型检查通过 |
| Docs build（更新 motion dist 后重新执行） | client/server + SSG 84 路由通过，994 Demo，未新增 Demo 数量 |
| Docs content:check | 72 组件通过，303 条已有 order 提示未屏蔽 |
| `pnpm run registry:check` | 19 项通过，历史 vue-native 24 fixed / 0 open |
| `pnpm run audit:content-slots:check` | 清单无漂移，仍为 496 行 / 12 verified；没有无关插槽状态升级 |
| 范围内 Biome / git diff --check | 11 文件通过，diff 检查通过 |
| `node tests/visual/apollo.mjs --check --component form` | **未通过：21 张 missing-approved-baseline**；没有生成/接受图片或修改阈值 |

Docs 既有 303 条 order 提示、大 chunk 提示及 unbuild 产物生成前提示继续保留。没有运行全仓 verify:full/覆盖率，不把局部证据升级为完整组件重验收。

## 边界

F03 的前缀与测量场景按上述范围处理；任意前缀的整套 CSS 生成/预加载策略仍属于 D04。本批不是完整 Form 的动态列表/异步校验/全部视觉验收，Registry 追加证据并保留历史质量状态。
