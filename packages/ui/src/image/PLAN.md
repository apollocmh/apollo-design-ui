# Image · 执行记录（G0–G14，2026-09-25 收口）

> 由 `gen-component.mjs` 生成后**改写为执行记录**（原模板见 git 历史）。
> 组件的权威状态在 `registry/components.json`；本文件记录「实际怎么做的、踩了什么」。

## 状态

- registry status: **completed**（11 维度全 done，2026-09-25）· priority P3 · complexity M
- 依赖组件: 无；foundation 5 个（icons / locale / portal / theme / utils）全部 completed
- antd 规模: 931 行 / 16 文件 · Component Token 6（+ 派生 `imagePreviewSwitchSize`）
- rc 依赖: `@rc-component/image@1.10.0`（~1480 行，**内核自建**，不引入运行时依赖）

## 交付面

| Gate | 产物 |
|---|---|
| G1 | `docs/analysis/image.md`（分层 / 渲染树 / 12 条行为契约 / 依赖缺口 / 实现顺序） |
| G2 | `interface.ts`（ImageProps / PreviewConfig / PreviewGroupProps / 语义槽 5 组） |
| G3 | `style/token.ts`（7 个 token：`prepareComponentToken` + `withAlpha` 逐字对齐） |
| G4 | `style/index.ts`（59 条选择器 + 4 组 `@keyframes`，机械转换自 extractStyle 产物）+ `Image.ts` / `Preview.ts` / `PreviewGroup.ts` / `Progress.ts` / `context.ts` / `hooks/{useStatus,useImageTransform}.ts` / `util.ts` |
| G5+G6 | L1+L2 27 用例（`__tests__/index.test.ts`，vitest `unit` project） |
| G7 | L3 8 用例（`type.test-d.ts`，`types` project） |
| G8 | L5 18 用例（`a11y.test.ts`，axe + role/键盘/焦点） |
| G9 | L6 9 张（3 variant × 3 viewport）**全 0.000% exact** |
| G10 | L4 9 用例（`semantic.test.ts`）+ 机械基线 `tests/compat/baselines/image.dom.json` |
| G11 | `index.zh-CN.md` / `index.en-US.md` + 14 个 demo（`demo.test.ts` 的 `expectCount` 钉死） |
| G12 | registry：`completed`，11 维度 `done`，`layerNotes` 记录 L4/L6/L7 口径 |
| G13 | `registry:check` 18 项 ✅ / `lint`（vue-tsc + biome）✅ / `test` 四层 ✅ / `test:build` **141 项 FAIL 0** |
| G14 | 一次提交，`[COMP:image]` |

## 实现期修正（三处，全部由 L6 暴露）

1. **`<img>` 的 `height` 没走 `toCssSize()`** ⇒ 裸数字被 Vue 静默丢弃，`<img>` 退回 CSS
   `height:auto` 按原始比例撑高（实测 200×100 渲染成 200×200）。L6 `basic` 5.106%/9.574%/19.608%
   → **0.000%**。根因与判据见 PITFALLS **170**、差异登记 **D94**。
2. **预览浮层拿不到组件变量**：浮层经 Teleport 挂在 `body` 上、不在 `.apollo-image` 子树内，
   而声明块只挂了 `.apollo-image` ⇒ 关闭按钮 `font-size` 由 18px 回退成继承的 16px（图标 `1em`）。
   L6 `preview` 0.011%–0.043% → **0.000%**（差异像素 100% 落在关闭按钮 40×40 内）。
   修法：声明块覆盖两个根（同 input D69）。见 PITFALLS **171**、**D95**。
3. **`border-radius:NaNpx`**：antd 的 `borderRadiusXS / 2` 被原样搬进 CSS 字符串 ⇒ 浏览器静默丢弃
   （轨道填充块没有圆角）。修成 `calc(var(--apollo-border-radius-xs)/2)`（计算值仍是 antd 的 1px）。
   ⭐ 顺手给构建门禁加了 **B11**（产物 CSS 不得含 `NaN` / `Infinity` / `undefined` / 未展开的 `${`），
   把这类「转换漏网」从「只有像素比对能发现」提前成硬 Gate —— 全仓 39 份 CSS 产物扫描，
   image 是唯一命中者，修完 0 命中。

## 差异登记

`D94`（Vue `style` 数字值不自动补 px，实为全局平台事实）/ `D95`（无 `-css-var` 类 ⇒
组件变量声明块必须覆盖 portal 根）。两者都在 `COMPATIBILITY.md` §9.2。

## 开工避坑清单（原模板保留，全部真实踩过；详见 .workbuddy-ai/memory/PITFALLS.md）

1. **内联 style 的数字必须转 px 字符串** —— Vue patchStyle 不做转换（React 才有），裸数字被静默丢弃。
   ⚠️ 本条在 image 上**真的踩了**（见上「实现期修正 1」），且被 CSS 兜底伪装成「看起来正常」。
2. **L3 负例必须包在永不调用的闭包里** —— *.test-d.ts 会被 vitest 真执行。
3. **vitest 必须从仓库根跑** —— 在 packages/<x>/ 下跑不应用根 config，大面积假失败。
4. **demo 显式指定字体** —— 继承字体差异是平台差异，会让 L6 全红。
5. **Boolean prop 未传 ≠ false** —— withDefaults 里给 undefined，否则布尔语义静默失效。
6. **cssinjs 嵌套语义**：`&` 是复合选择器、普通键是后代 —— 搞反会让样式作用到所有形态。
7. **var(--apollo-*) 必须在 theme tokens.css 有声明** —— 写错不报错，由 test:build B7 兜底。
8. **凡是要断言「某决策/约定是这样」先跑 node registry/tools/ask.mjs**，不凭记忆。
9. **跑重型门禁前关 IDE** —— 实测 16 分钟 → 7 分 49 秒。
10. **改完文件回读** —— Edit 偶发报 success 但内容未变；biome 会重排 import。
11. **跑 `tests/visual/run.mjs` 要带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`** —— 否则 vite 的
    `emptyOutDir` 会被 safe-delete shim 拦死（PITFALLS 172）。
12. **预览类组件先确认「变量在不在浮层子树里」** —— portal/Teleport 出来的根最容易漏（PITFALLS 171）。
