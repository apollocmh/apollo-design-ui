# F07 / F09 / H02 整改 · 2026-10-24

接续前两批未提交工作区；保留既有改动，未提交、推送或发布。环境为 macOS x64、Node 22.22.2、pnpm 12.4.2。

## F07：内容 slot 优先与当前面板子树

Alert 原文档和测试明确承诺 prop 优先，本次在未发布开发阶段直接调整为 slot 存在优先，独立记录 [行为迁移](../migrations/content-slot-precedence.md)，无兼容分支或弃用期。#title、#description、CollapsePanel #header 即使有意为空也覆盖 prop；条件 slot 消失时才恢复 prop。Alert 空描述同时清除 with-description 状态，title/message 的 prop-only 优先级保留。

Collapse 不在 computed 内缓存面板/插槽；每轮 render 收集一次子树，标题、extra 与面板 body 读取同一快照。没有为刷新标题更换 key 或重挂载面板。

6 条回归修前全失败，修后通过，覆盖同传、空内容、动态出现/移除、最新内容、输入节点身份和单次默认插槽读取。旧 prop-first 断言按本次行为迁移修正；message-only、展开/关闭、DOM、a11y 和 theme 断言保留。新增 `alert/demo/content-slots.vue/.md`，可真实操作并验证面板输入状态保留。

## F09：声明语义 change

Switch 声明带 `(checked, MouseEvent | KeyboardEvent)` 载荷的 change，InputNumber 内外两层声明 `(number | string | null)` change，并由包装层只转发一次。移除手动调用 attrs.onChange 的通道，onChange 和 @change 均监听同一个 Vue emit。v-model 的更新与 change 均保留，不会再将原生 DOM change 误传给语义监听器。

4 条回归中，3 条修前明确因语义 emit 缺失失败；键盘条目最初因 VTU 不允许赋值只读 which 的测试构造报错，该错误不算组件缺陷证据。改用现有 Switch 测试的 KeyboardEvent 构造后，四条通过，覆盖鼠标、键盘、监听器替换、disabled、v-model、单次发送、stringMode 和 null；未改运行时键盘策略。**Switch click 仍为 `(checked, event)`，D02 未被本批自动裁决。**

类型声明新增 InputNumberProps.onChange 以及具体 emit payload。严格检查暴露 Avatar、ColorPicker、Pagination 三个数值消费者原先过窄的处理签名；现在显式收窄数值，未用断言或忽略诊断掩盖。相关运行回归 3 文件 / 47 条通过。

## H02：过期规范描述清账

当前根规范已由 ADR 0005 统一独立契约、事实与规则职责；ADR 0006 另行记录开发阶段模板扩展直接迁移。KNOWN-ISSUES 原 H02 仍引用已替换章节，已更正。再次核对 foundation 的 use-id-test-env：2026-10-07 已裁决仅断言侧归一 id、保留引用关系，生产实现不固定编号。未修改 AGENTS，也未创建重复 ADR。Registry 没有 open 不表示本台账全部裁决。

## 验证记录

- 四组件 unit / dom-contract / a11y / theme 首次合跑 26 文件、382 条：381 通过，仅 InputNumber presuffix Demo 的过期 label 豁免失败。该 Demo 已有 aria-label，故移入无豁免组；保留严格的“豁免必须真实命中”断言。独立复验 InputNumber a11y 14/14 通过。其他 25 文件 / 368 条通过。
- 新增 Demo 后，Alert 的 demo 与 a11y 数量哨兵同步为实际 15；文档目录为 992 个 Demo。没有删除业务断言或降低阈值。
- 根严格类型、20 文件 / 252 条类型测试、utils/UI L7、tarball Vite/Webpack、当前 Chrome 浏览器回归、文档类型/最终 157 条测试/84 路由构建及 Registry 均通过。最终 H03 示例加入后为 994 个 Demo；逐条命令及限制见 [共享交付门禁](2026-10-24-dom-attrs-remediation.md)。

## 验收边界

四组件 Apollo 视觉基线检查均真实失败：Alert 缺 18 张、Collapse 缺 9 张、Switch 缺 15 张、InputNumber 缺 9 张已审阅图片。没有接受或复制上游基线，也未把功能交互当作视觉验收。全仓 verify:full、覆盖率及 72/13 完整复审矩阵未在本批运行。
