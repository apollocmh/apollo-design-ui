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
- [x] G7 L3 类型 —— `__tests__/type.test-d.ts` **17 条**：props 形态 / `onClick` 的自定义签名 /
  `AnchorContainer` / `affix` 三态 + `AnchorAffixConfig` 的 `Omit` / 四个语义槽 /
  **本组件「没有」的东西**（`children` prop、`value`、`click` 事件、`nativeElement`）/
  链接类型的递归形状 / 可安装（`install`）+ **3 条负例**。
  ⚠️ `toEqualTypeOf<unknown>()` 在 vitest 里会因 `unknown` 约束退化成 `never` 而失败 ⇒
  `VNodeChild` 这类字段要用 **`toBeUnknown()`**。
- [x] G8 L5 a11y —— `__tests__/a11y.test.ts` **15 条**（5 条 role/ARIA 契约 + 9 组 axe 扫描
      + 1 条 RTL 扫描），**零 axe violation、零豁免**。判据：wrapper 与 `.{p}` 都是 `div`
      且**无 `role`** · 🚨 链接是**真 `<a href>`**（语义靠原生元素，不靠 role 模拟）·
      ink 是 `span` 且**无 `aria-*`** · **组件不产生任何 `aria-*`** ·
      `title` 属性只在 title 是字符串时出现。
      ⚠️ 带 active 的形态（`-link-active` / `-ink-visible`）来自滚动侦测 ⇒ jsdom 里要 mock
      rect + 手动派发 scroll，**留给 L6**（`active` 视觉用例已覆盖）。
      🚨 对象字面量的键**含空格要加引号**（`'显示 ink'`）—— 否则 oxc 报
      `Expected ',' or '}' but found Identifier`，而 vitest 的错误片段带 ANSI 颜色，
      看起来像是「文件里有转义字符」（实际没有，别被误导）。
- [x] G9 L6 视觉 —— ✅ **24 / 24 exact**（8 variant × 3 viewport）。
      变体：`basic` / `active` / `active-last` / `horizontal` / `horizontal-active` /
      `nested` / `semantic` / `rtl-active`。React 基线已入库
      （`tests/visual/baselines/react/anchor/`，24 张）。
      ⚠️ **字体在用例内钉住**（两侧页面的 `html` 字体栈不同）。
      🚨 **`active` 要出效果必须同时满足两条**（2026-10-01 用 Playwright 探针实测后重做）：
      ① 目标的**视口** `top` 要 `<= offsetTop + bounds`（默认 0 / 5）—— 视觉用例不滚动页面
      ⇒ 旧写法（把可见目标放在锚点下方）**永远没有 active**；
      ② `affix` 不能是 `false`（除非给 `showInkInFixed`）—— `.{p}-fixed .{p}-ink.{p}-ink`
      的 `display: none`（3 个类）压过 `-ink-visible`（2 个类）⇒ ink 恒被隐藏。
      **旧写法两条都漏了** ⇒ `active` / `affix` / `rtl` 三张基线与 `basic` **逐字节相同**，
      用例是空转的。修法：`bounds` 抬阈值 + **零高度夹具**
      （`{height:0, overflow:hidden}` 容器 + 绝对定位目标，拉开 600px；见 `shared.mjs`），
      `active` 系列改用 `affix` 默认值。
      ⚠️ `affix` 变体已**删**（它与 `basic` 只差一层不可见的 Affix 包装，而默认 affix 路径
      已被 `active` / `active-last` / `horizontal-active` 覆盖 ⇒ 冗余）；
      `rtl` 改名为 `rtl-active` 并保留（见下面的等式守卫）。
      ⚠️ 改完用例的**通用手法**：先写 Playwright 探针把「类名 / computed display /
      `getBoundingClientRect`」两侧打出来，**确认状态真的出现了**再写基线（`PITFALLS 276`）。
- [x] G10 L4 DOM 契约 —— `tests/compat/baseline/anchor.mjs` + `baselines/anchor.dom.json`
      （**23 用例**）+ `semantic.test.ts` **23 条**，**只有 2 条豁免**：
      **D1**（`bare` 用例的默认根前缀 `ant` vs `apollo`，5 层带前缀元素）+
      **D114**（CSSOM 把 `#fafafa` 规范成 `rgb(250,250,250)`，语义等价）。
      🚨 **两条必须记住的判据**：
      ① **`AnchorLink` 的类名前缀取自 ConfigProvider 的根前缀**，与 `Anchor` 的 `prefixCls` prop
      **无关** ⇒ 基线生成器**每个用例都要包一层 `ConfigProvider`**，否则链接会是 `ant-anchor-link`
      而 `Anchor` 自己是 `apollo`（对不上）。`bare` 出口专门用来钉 D1。
      ② 契约**不覆盖** `-link-active` / `-ink-visible` / ink 的内联几何 ——
      它们来自滚动侦测，而 SSR 不跑 effect ⇒ `activeLink` 恒 `null`（真滚动归 **L6**）。
- [x] G11 DOCS —— `demo/` **8 个**（basic / horizontal / onChange / onClick / replace /
      targetOffset / targetOffset-per-link / customizeHighlight，`demo.test.ts` 的
      `expectCount: 8` 钉死）+ `index.zh-CN.md` / `index.en-US.md`（何时使用 / demo 表 /
      API 四表 / Theme / 设计说明）+ `README.md`（差异表 D1–D9 / `.ts` 选型理由 / token 清单 /
      已知缺口）。⚠️ 与 antd 的 12 个用户可见 demo 差 4 个（`static` / `legacy-anchor` /
      `style-class` / `component-token`），理由逐条登记在 README §5。
- [x] G12 REGISTRY —— 11 维度置 done，`status: completed`（唯一让进度被承认的方式）
- [x] G13 BUILD —— `registry:check` **18 checks / 0 warnings** · `lint:types` / `lint:format`
      **0 error** · `test`（unit / dom-contract / a11y / theme）全过 · L7 构建 **FAIL 0**
      （仅 `PENDING 1` = B6 按需样式子路径，全仓既有缺口）· `test:types` **1795 passed /
      Type Errors: no errors**（72 条是 `PITFALLS 73` 的 `.vue` 解析噪音）·
      `test:visual --component anchor --mode compare` **24 / 24 exact**。
- [x] G14 COMMIT —— `feat(anchor): G7–G14 收口 —— 11 维度全 done，组件判 completed [COMP:anchor]`

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
