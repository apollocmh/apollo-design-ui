# Modal · 执行记录（G0–G14，2026-09-26）

> 由 `gen-component.mjs` 生成后**改写为执行记录**。组件的权威状态在 `registry/components.json`。

## 状态

- registry status: **completed**（11 维度全 done，2026-09-26）· priority P3 · complexity L
- 依赖组件: config-provider、skeleton
- foundation: a11y / icons / locale / motion / portal / theme / utils
- antd 规模: 1596 行 / 36 文件 · Component Token **6**（公开面；另有 12 internal + 9 派生）

## ⭐ 本轮的结构前提

`@rc-component/dialog` 没有现成的 Vue 版 ⇒ 本轮 = **rc-dialog 内核自建 + 组件壳 +
confirm 命令式路径 + 样式层**。G1 补读时确认 `packages/portal` 的 `autoLock` / `onEsc`
（drawer 那轮补的）正好是 rc-dialog 需要的两个能力；`a11y` 的 `useFocusRestore`
契约来源**就是** rc-dialog 的 `Dialog/index.js:53-95`，直接可用。

| Gate | 产物 |
|---|---|
| G0 | `next-task` 领取 + 骨架 |
| G1 | `docs/analysis/modal.md`（**两遍**：第一遍 + 补读 antd 10 文件 + rc-dialog 10 文件全文） |
| G2 | `interface.ts`（ModalProps / ModalFuncProps / 9 语义槽 / ModalInstance / ModalHookAPI） |
| — | **前置搬家**：`useMergedMask` → `_internal/`、`toCssSize` → `_internal/`（三次法则） |
| G3 | `style/token.ts`（公开 6 + internal 12 + 派生 9） |
| G4 | `style/index.ts`（18 条变量 + 4 个 keyframes + 66 条规则）+ 内核 8 文件 + 壳 + confirm + useModal + PurePanel |
| G5+G6 | L1/L2 24 用例 |
| G7 | L3 11 用例（含 4 条负例） |
| G8 | L5 35 用例（axe 扫 23 个 demo + 焦点三条） |
| G9 | L6 9 张（3 variant × 3 viewport） |
| G10 | L4 9 用例 + 机械基线 `tests/compat/baselines/modal.dom.json` |
| G11 | `index.zh-CN.md` / `index.en-US.md` + 23 个 demo（`expectCount` 钉死） |
| G12 | registry 11 维 done |
| G13 | registry:check / lint / test / test:build 四道全绿 |
| G14 | 两次提交（内核 / 壳+confirm），`[COMP:modal]` |

## 实现期修正（四处，都由门禁/契约暴露）

1. **动效名走 `rootPrefixCls` 而不是组件前缀**（实现期自查）：antd 传
   `getTransitionName(rootPrefixCls, 'zoom')` ⇒ 类是 `.apollo-zoom-*`，不是
   `.apollo-modal-zoom-*`。传错时动效静默失效（CSS 里那批**裸类**规则永不命中）。
2. **`Skeleton` 是 `inheritAttrs: false`**（demo 冒烟抓到）：`class` 会被静默丢弃，
   必须传 `className` **prop**。
3. **`PurePanel` 的类名不能含 `prefixCls` 本身**（L4 抓到）：`Panel` 的根类已经会加它
   ⇒ 多写一次得到 `apollo-modal apollo-modal apollo-modal-pure-panel`。
4. **`Space` 的 `direction` 已废弃**（demo 冒烟抓到）：demo 里要写 `orientation`。

## 差异登记

`D100`（命令式宿主：游离 div）/ `D101`（PurePanel 不包 withPureRenderTheme）/
`D102`（L4 过滤器补 `css-var-*` 形态）/ `D103`（无 ContextIsolator）/
`D104`（Content 加 motionDeadline 兜底）；`U11`（`autoFocusButton` 的 `||` 吃掉 `null`）。

## 开工避坑清单（原模板保留；详见 .workbuddy-ai/memory/PITFALLS.md）

1. 内联 style 的数字必须转 px 字符串（PITFALLS 170 / D94）。
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
16. **同包内引用必须走相对路径**（PITFALLS 180）。
17. ⭐ **`setup()` 里不能创建带 `ref` 的 vnode**（PITFALLS 178）。
18. ⭐ **关闭是异步的**（离场动效结束才卸载）⇒ 测试要轮询（PITFALLS 179）。
19. ⭐ **动效名前缀是 `rootPrefixCls`**（PITFALLS 180）。
