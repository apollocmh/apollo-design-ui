# Notification · 执行记录（G0–G14，2026-09-26 收口）

> 由 `gen-component.mjs` 生成后**改写为执行记录**。组件的权威状态在 `registry/components.json`。

## 状态

- registry status: **completed**（11 维度全 done，2026-09-26）· priority P3 · complexity M
- 依赖组件: config-provider（+ **notification 内核**，上一轮已建）
- antd 规模: 1284 行 / 20 文件 · Component Token 7（3 个有默认值）

## ⭐ 本轮的结构前提：内核已经在上一轮为 message 建好

`docs/analysis/notification.md` §0 的结论：`notification/engine/`（rc-notification 的 Vue 自建）
+ `util.ts` + `hooks/useStackConfig.ts` 都已落地并被 message 验证过 ⇒ 本轮只剩
**组件壳 + 语义 + 样式层**。这也是为什么 notification 比 message 收得更快。

| Gate | 产物 |
|---|---|
| G1 | `docs/analysis/notification.md`（与 message 的差异表 / API 面 / 渲染树 / 11 条契约 / 缺口 / 风险） |
| G2 | `interface.ts`（6 方位 / 4 类型 / **11 语义槽** / ArgsProps / GlobalConfigProps / NotificationConfig） |
| G3 | `style/token.ts`（7 token 键 + 共享派生 `prepareNotificationToken`） |
| G4 | `style/index.ts`（120 条规则机械转换）+ index/useNotification/PurePanel/PureList/icon |
| G5+G6 | L1+L2 21 用例（+ 内核 10 用例） |
| G7 | L3 8 用例 |
| G8 | L5 19 用例（axe 扫 14 个 demo） |
| G9 | L6 9 张（3 variant × 3 viewport）**全 0.000% exact** |
| G10 | L4 4 用例 + 机械基线 `tests/compat/baselines/notification.dom.json` |
| G11 | `index.zh-CN.md` / `index.en-US.md` + 14 个 demo（`expectCount` 钉死） |
| G12 | registry 11 维 done |
| G13 | registry:check / lint / test / test:build 四道全绿 |
| G14 | 一次提交，`[COMP:notification]` |

## 实现期修正（两处，都由契约/门禁暴露）

1. **关闭图标的 `aria-label`**：L4 逐属性比对抓到 `"Close" vs "close"` —— 图标自带小写，
   而可访问名契约要求 locale 的 `Close`。补 `getCloseIconWithLabel`
   （等价于 antd `cloneElement` 里的 `'aria-label': closeLabel`）。
2. **`stack` demo 的 axe 违规**：antd 的 demo 里 Switch / InputNumber 没有名字 ⇒
   本仓 L5 要求 demo 零违规，给它们补了 `aria-label`（教学内容不变，已注明）。

## 差异登记

`D96`（游离 div + 不实现 `holderRender` / `warnContext`，与 message 同判）、
`D98`（`useClosable` 的 vnode aria 注入走 `closeIconRender` + `cloneVNode`）。

## 开工避坑清单（原模板保留；详见 .workbuddy-ai/memory/PITFALLS.md）

1. **内联 style 的数字必须转 px 字符串**（Vue 不补 px）。
2. **L3 负例必须包在永不调用的闭包里**。
3. **vitest 必须从仓库根跑**。
4. **demo 显式指定字体**。
5. **Boolean prop 未传 ≠ false**。
6. **cssinjs 嵌套语义**：`&` 是复合选择器、普通键是后代。
7. **`var(--apollo-*)` 必须在 theme tokens.css 有声明**（B7 兜底）。
8. **断言「某决策是这样」先跑 `ask.mjs`**。
9. **跑重型门禁前关 IDE**。
10. **改完文件回读**。
11. **`tests/visual/run.mjs` 要带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`**。
12. **组件 vnode 的 ref 是实例不是元素**（PITFALLS 174）。
13. **「实测值」要同时覆盖「挂载后」与「变化后」**（PITFALLS 175）。
14. **改了 foundation 包要单独重建**（PITFALLS 176）。
15. **命令式组件的 L4/L6 只能走静态面板**（PITFALLS 177）。
