# Drawer · 执行记录（G0–G14，2026-09-26 收口）

> 由 `gen-component.mjs` 生成后**改写为执行记录**。组件的权威状态在 `registry/components.json`。

## 状态

- registry status: **completed**（11 维度全 done，2026-09-26）· priority P3 · complexity M
- 依赖组件: config-provider、skeleton
- antd 规模: 733 行 / 12 文件 · Component Token 4

## ⭐ 本轮的结构前提

`@rc-component/drawer` 没有现成的 Vue 版 ⇒ 本轮 = **portal 能力扩展 + rc-drawer 内核自建 +
组件壳 + 样式层**。G1 补读时发现 `packages/portal` 缺 `autoLock` / `onEsc` 两个能力
（rc-drawer 与 rc-dialog 都从 portal 拿），按三次法则先补进 portal 再写内核。

| Gate | 产物 |
|---|---|
| G0 | `next-task` 领取 + 骨架 |
| G1 | `docs/analysis/drawer.md`（两遍：第一遍 + 补读 rc-drawer 全文与 token） |
| — | **前置**：`packages/portal` 补 `autoLock`（useScrollLocker）+ `onEsc`（useEscKeyDown），21 条用例 |
| G2 | `interface.ts`（4 方位 / 12 语义槽 / DrawerProps 展开 rc 侧 15 字段） |
| G3 | `style/token.ts`（4 token） |
| G4 | `style/index.ts`（91 条规则机械转换）+ 内核 6 文件 + 壳 + 面板 |
| G5+G6 | L1+L2 20 用例（内核 10 + antd 侧 10） |
| G7 | L3 8 用例 |
| G8 | L5 19 用例（axe 扫 18 个 demo） |
| G9 | L6 9 张（3 variant × 3 viewport）**全 0.000% exact** |
| G10 | L4 4 用例 + 机械基线 `tests/compat/baselines/drawer.dom.json` |
| G11 | `index.zh-CN.md` / `index.en-US.md` + 18 个 demo（`expectCount` 钉死） |
| G12 | registry 11 维 done |
| G13 | registry:check / lint / test / test:build 四道全绿 |
| G14 | 一次提交，`[COMP:drawer]` |

## 实现期修正（三处，都由门禁/契约暴露）

1. **`inline` prop 漏传**（L6 抓到）：`getContainer === false` 时 rc 会加 `{p}-inline` 类，
   漏了它 position 停在 `fixed` ⇒ 9 张图全红（最高 64%）。**这是 L6 存在的意义**。
2. **关闭按钮缺 `aria-label="Close"`**（L4 抓到）：antd 的 `useClosable` 对**最终**图标
   注入 closeLabel，而 drawer 的「最终图标」是面板自己包的 button ⇒ 在 button 上显式给。
3. **`toCssSize` 缺失**（单测抓到）：`wrapperStyle.width = 378`（裸数字）被 Vue 静默丢弃
   ⇒ 面板宽高全丢（PITFALLS 170 / D94）。

## 差异登记

`D99`（closeLabel 的注入点在 drawer 是 button，与 notification 的 D98 同族）。
`packages/portal` 的边界说明同时修订（滚动锁 / ESC 留在 portal）。

## 开工避坑清单（原模板保留；详见 .workbuddy-ai/memory/PITFALLS.md）

1. 内联 style 的数字必须转 px（PITFALLS 170 / D94）—— 本组件又踩一次。
2. L3 负例必须包在永不调用的闭包里。
3. vitest 必须从仓库根跑。
4. demo 显式指定字体。
5. Boolean prop 未传 ≠ false。
6. cssinjs 嵌套语义：`&` 是复合选择器、普通键是后代。
7. `var(--apollo-*)` 必须在 theme tokens.css 有声明（B7 兜底）。
8. 断言「某决策是这样」先跑 `ask.mjs`。
9. 跑重型门禁前关 IDE。
10. 改完文件回读。
11. `tests/visual/run.mjs` 要带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`。
12. 组件 vnode 的 ref 是实例不是元素（PITFALLS 174）。
13. 「实测值」要同时覆盖「挂载后」与「变化后」（PITFALLS 175）。
14. 改了 foundation 包要单独重建（PITFALLS 176）。
15. **命令式/portal 组件的 L4/L6 走静态面板或内联**（PITFALLS 177）。
16. **同包内引用必须走相对路径**（`@apollo-design/ui` 是包自身，dts 构建期解析不到）。
