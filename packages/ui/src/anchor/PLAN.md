# Anchor · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **todo** · priority P5 · complexity M
- 依赖组件: affix, config-provider
- foundation: @apollo-design/theme, @apollo-design/utils
- antd 规模: 526 行 / 10 文件 · token 2

## Gate 检查单

- [x] G0 CLAIM —— 已由 `next-task.mjs --component anchor` 授权开工；骨架由 `gen-component.mjs` 生成
- [x] G1 ANALYZE —— **`docs/analysis/anchor.md`**（先于实现）。核心结论：
      **无 foundation 缺口**（依赖面 13 条对照表在 §0；`scroll-into-view-if-needed`
      已是 `packages/ui` 的依赖、`scrollTo` 在 `ui/_internal/scroll-to.ts`、
      `useEvent` 在 Vue 下**不需要**）；
      两处必须照抄的上游行为：**`useEffect([JSON.stringify(links)])` 不含 `getContainer`**
      （容器变更不重挂滚动监听）+ **`onChange` 收到的是原始 link**（不是 `getCurrentAnchor`
      改写后的，且 `forceTriggerChange` 时即使同值也发）
- [x] G2 API DESIGN —— `interface.ts` 全量枚举。⚠️ **没有 `ref`/`expose`**（上游是 `React.FC`，
      没有 forwardRef）· **没有 `click` 事件**（`onClick` 是自定义签名的 prop ——
      声明成 `emits: ['click']` 会让组件上的 `@click` **不再挂到根元素**）·
      复合子组件 `Anchor.Link`（照 `Splitter.Panel` 的写法）· 4 处平台映射
- [x] G3 TOKEN —— `style/token.ts`：**2 个 Component Token**（`linkPaddingBlock` = `paddingXXS`、
      `linkPaddingInlineStart` = `padding`，都是别名派生）+ **4 个 `mergeToken` 派生值**
      （`holderOffsetBlock` / `anchorPaddingBlockSecondary` / `anchorTitleBlock` / `anchorBallSize`，
      用户不可覆盖；⚠️ 最后一个**本仓样式里没有消费者** —— 上游也没有，保留只为逐条对齐）
- [x] G4 IMPLEMENT —— `Anchor.ts`（渲染函数，理由见 README §3）+ `AnchorLink.ts` + `context.ts`
      + `style/index.ts`；已注册进 `COMPONENT_STYLES` 与 `packages/ui/src/index.ts`。
      ⚠️ 实现是 `.ts` 不是 `.vue`（`COMPONENT-RULES.md` §2 **条件 2**：`items` 递归展开 +
      affix / 非 affix 两分支共享同一份内容 + 多来源定序合并的类名）。`AnchorLink` 同理
      （它要渲染一个 **`VNodeChild` prop** —— 模板里只能靠 `:is="() => vnode"`，那会每次渲染重挂）。
      **实现期才暴露的四个判据**（都写在代码注释里）：
      ① 🚨 **`createNestedLink` 必须把 `children` 从 item 里摘出来**再 spread ——
      `AnchorLink` 的 `children` 在 Vue 侧是**插槽**（规则 C19）⇒ 不摘会落进 **`attrs`**
      并被绑到根 `div`（实测报 `Failed setting prop "children"` 且**破坏渲染**）。PITFALLS 3 同族。
      ② 🚨 **scroll 监听不能用 `immediate: true`** —— 它在 `setup` 期同步跑（那时 `links` 还空）
      ⇒ 会挂两次；改用 `onMounted` + watcher + 「同容器不重复挂」。
      ③ 🚨 **ink 的触发必须挂 `onUpdated`**，不能只用 post watcher：`handleScroll` 在
      **post flush 期间**改 `activeLink`，watcher 的 post 任务会排进**同一批** ⇒
      跑在下一次渲染**之前**，那时子组件还没有 `-link-title-active` ⇒ `querySelector` 找不到目标、
      ink 的内联样式**永远写不进去**（探针实测 `hasActiveTitle: false` 而 `activeLink` 已是 `#a`）。
      ④ `getCurrentContainer` 的边界收窄（`GetTargetContainer` 的返回类型含 `ShadowRoot`，
      而 `AnchorContainer` 不含）—— 照 `affix/Affix.vue:110-114` 的既有处理。
- [x] G5 L1 单元 + G6 L2 交互 —— `__tests__/index.test.ts` **18 条**：
      结构 8 条（`-wrapper` / `-fixed` 的 `!affix && !showInkInFixed` 判据 / affix 默认开 /
      `-wrapper-horizontal` / `-rtl` 在 wrapper 上 / 废弃 children 分支 / 嵌套展开 /
      水平不渲染嵌套）+ 点击 5 条（三段式 + `replace` + 用户 `preventDefault` +
      `onChange` 的原始 link + `getCurrentAnchor` 只改高亮）+ 滚动侦测 3 条（取 top 最大 /
      全出界 / 监听挂摘各一次）+ ink 1 条 + `Anchor.Link` 独立使用 1 条。
      ⚠️ jsdom 无布局 ⇒ 靠 **mock `getBoundingClientRect` + `getClientRects`** 与
      **手动派发 `scroll`**；真滚动归 L6。上游 `Anchor.test.tsx` 有 **49** 条 —— 其余在 G13 前补齐。
- [ ] G7 L3 类型（含负例，负例包在永不调用的闭包里）
- [ ] G8 L5 a11y —— axe + role/键盘断言
- [ ] G9 L6 视觉 —— 先建基线再 compare；⚠️ 滚动相关行为 jsdom 测不了，归 L6
- [ ] G10 L4 DOM 契约 + compat 比对
- [ ] G11 DOCS —— demo 与 antd 一一对应（**12 个**用户可见 demo，`expectCount` 钉死数量）
- [ ] G12 REGISTRY —— 11 维度置 done（唯一让进度被承认的方式）
- [ ] G13 BUILD —— pnpm run registry:check && lint && test && test:build 四道全绿
- [ ] G14 COMMIT —— commit message 带 [COMP:anchor]

## 开工避坑清单（全部真实踩过，详见 .workbuddy-ai/memory/PITFALLS.md）

1. **内联 style 的数字必须转 px 字符串** —— Vue patchStyle 不做转换（React 才有），裸数字被静默丢弃。
2. **L3 负例必须包在永不调用的闭包里** —— *.test-d.ts 会被 vitest 真执行。
3. **vitest 必须从仓库根跑** —— 在 packages/<x>/ 下跑不应用根 config，大面积假失败。
4. **demo 显式指定字体** —— 继承字体差异是平台差异，会让 L6 全红。
5. **Boolean prop 未传 ≠ false** —— withDefaults 里给 undefined，否则布尔语义静默失效。
6. **cssinjs 嵌套语义**：`&` 是复合选择器、普通键是后代 —— 搞反会让样式作用到所有形态。
7. **var(--apollo-*) 必须在 theme tokens.css 有声明** —— 写错不报错，由 test:build B7 兜底。
8. **凡是要断言「某决策/约定是这样」先跑 node registry/tools/ask.mjs**，不凭记忆。
9. **跑重型门禁前关 IDE** —— 实测 16 分钟 → 7 分 49 秒。
10. **改完文件回读** —— Edit 偶发报 success 但内容未变；biome 会重排 import。
