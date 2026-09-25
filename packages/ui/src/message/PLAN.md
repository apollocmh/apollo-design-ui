# Message · 执行记录（G0–G14，2026-09-25 收口）

> 由 `gen-component.mjs` 生成后**改写为执行记录**。组件的权威状态在 `registry/components.json`。

## 状态

- registry status: **completed**（11 维度全 done，2026-09-25）· priority P3 · complexity M
- 依赖组件: config-provider（+ **notification 内核**，见下）
- antd 规模: 820 行 / 14 文件 · Component Token 3

## ⭐ 本轮最大的结构决定：先建通知内核

antd 的 message **完全建立在 rc-notification 之上**（`useRcNotification`），样式也复用
notification 的共享 token 与列表项样式 ⇒ 实现 message 必须先把内核建起来。
内核落在 `packages/ui/src/notification/engine/`（rc-notification 的 Vue 自建，≈20 文件），
**notification 组件届时只剩「壳 + 交互按钮 + placement」**。

| Gate | 产物 |
|---|---|
| G1 | `docs/analysis/message.md`（分层 / API 面 / 渲染树 / 14 条行为契约 / 依赖缺口 / 风险） |
| G2 | `interface.ts`（ArgsProps / ConfigOptions / MessageType（可调用 + thenable）/ TypeOpen / …） |
| G3 | `style/token.ts`（3 token；`zIndexPopup = base + 1000 + 10` = 2010） |
| G4 | `style/index.ts`（90 条规则，机械转换自 antd 的 cssinjs 产物）+ index/useMessage/PurePanel/PureList/icon/util |
| G5+G6 | L1+L2 20 用例（命令式 API + hooks 形态） |
| G7 | L3 8 用例 |
| G8 | L5 16 用例（axe 扫 11 个 demo + 语义断言） |
| G9 | L6 9 张（3 variant × 3 viewport）**全 0.000% exact** |
| G10 | L4 4 用例 + 机械基线 `tests/compat/baselines/message.dom.json` |
| G11 | `index.zh-CN.md` / `index.en-US.md` + 11 个 demo（`expectCount` 钉死） |
| G12 | registry 11 维 done |
| G13 | registry:check / lint / test / test:build 四道全绿 |
| G14 | 一次提交，`[COMP:message]` |

## 实现期修正（两处，都由 L6 暴露）

1. **内核的 gap 实测只 watch 了「非空」布尔翻转** ⇒ **静态列表**（PureList：一开始就非空）
   一次都不测，gap 恒 0 ⇒ 四条消息的 `--notification-y` = 0/40/80/120（antd 是
   0/56/112/168），`types` 用例 1.7%–6.5% block-diff。改成「挂载后测一次 + 长度变化后测一次」。
   ⚠️ 这条缺陷**同时影响 notification 组件**（它也用同一个内核）。
2. **`motion` 包必须单独重建**：视觉 harness 从**产物**（`packages/motion/dist`）解析 motion，
   只重建 ui 不会带上 motion 的修复（本轮先踩了「渲染错误」的假象）。

## 差异登记

`D96`（命令式 holder 用**游离 div** 承载 + 不实现 `holderRender` / `warnContext`，D30 同源）、
`D97`（自动 key 字面量 `apollo-message-N`，与 antd 的 `antd-message-N` 属 D45 同判）。

## 开工避坑清单（原模板保留；详见 .workbuddy-ai/memory/PITFALLS.md）

1. **内联 style 的数字必须转 px 字符串** —— Vue patchStyle 不做转换，裸数字被静默丢弃。
2. **L3 负例必须包在永不调用的闭包里** —— *.test-d.ts 会被 vitest 真执行。
3. **vitest 必须从仓库根跑** —— 在 packages/<x>/ 下跑不应用根 config。
4. **demo 显式指定字体** —— 继承字体差异是平台差异，会让 L6 全红。
5. **Boolean prop 未传 ≠ false** —— withDefaults 里给 undefined。
6. **cssinjs 嵌套语义**：`&` 是复合选择器、普通键是后代。
7. **var(--apollo-*) 必须在 theme tokens.css 有声明** —— 由 test:build B7 兜底。
8. **凡是要断言「某决策/约定是这样」先跑 node registry/tools/ask.mjs**，不凭记忆。
9. **跑重型门禁前关 IDE**。
10. **改完文件回读** —— Edit 偶发报 success 但内容未变。
11. **跑 `tests/visual/run.mjs` 要带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`**。
12. **组件 vnode 的 ref 是实例不是元素** —— 动效驱动要的是元素，`CSSMotion` 内部已过
    `getElement`（PITFALLS 174）。
13. **`gap` 这类「实测值」要同时覆盖「挂载后」与「变化后」两个触发点**（PITFALLS 175）。
