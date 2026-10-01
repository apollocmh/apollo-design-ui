# Breadcrumb · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **analyzing** · priority P5 · complexity M
- 依赖组件: config-provider
- foundation: @apollo-design/icons, @apollo-design/theme, @apollo-design/utils
- antd 规模: 518 行 / 16 文件 · token 7

## Gate 检查单

- [x] G0 CLAIM —— `node registry/tools/next-task.mjs --component breadcrumb` 授权开工；
      registry `status: todo → analyzing`。
- [x] G1 ANALYZE —— `docs/analysis/breadcrumb.md`（206 行）。规模：805 行源码 /
      518 行产物 / 16 文件；Component Token **7 个**（全别名派生）+ **0 个 `mergeToken` 派生**。
      **依赖面结论**：无 foundation 缺口。三处要留意：
      ① `dropdown/dropdown` 是**叶子模块**（`menu` 特性用，registry 的 `leafModules` 已列）；
      ② `BreadcrumbSeparator` 的 `prefixCls` 取自 **ConfigContext**（不接 prop，与 `AnchorLink` 同族
      ⇒ L4 基线生成器每个用例都要包 ConfigProvider）；
      ③ `ConfigProvider` 的 `BreadcrumbConfig` 类型**未提升**（走 (B) 通道，与 anchor/masonry 一致）。
      🚨 **两处已实测**（不是读码）：
      - `isRenderable('')` **是 false** —— 直接读了 `@rc-component/util@1.13.0` 的
        `es/is.js`，与本仓 `isRenderable` **逐字一致** ⇒ 最后一项后面**不会**多出空分隔符 `<li>`。
      - `item.style` **疑似落不到 DOM**、`item.className` 只落到 `<a>` / `<span>`
        （上游测试没覆盖 ⇒ 必须由 G10 的机械 oracle 定论，见分析 §6.2）。
- [x] G2 API DESIGN —— `interface.ts`。props / emits / slots / expose 全量枚举。
      四处平台映射（`React.Key`→`BreadcrumbKey`、`ReactNode`→`VNodeChild`、
      `CSSProperties`→`Record<string, string | number>`、合成事件→原生 `MouseEvent`）。
      三处**不能照抄**：泛型 `<T>` 不落地（`params: Record<string, unknown>`）、
      `children` 走插槽（规则 C19）、`React.AriaAttributes` 不展开（改用 `aria-*` / `data-*`
      模板字面量索引签名）。⚠️ **`emits` 是空的**（根 `<nav>` 不挂组件事件）。
      ⚠️ `ref` **不是 DOM**：`expose({ nativeElement })`。
- [x] G3 TOKEN —— `style/token.ts`：7 个 token 与上游逐字对齐（顺序也一致：
      `itemColor` → `lastItemColor` → `iconFontSize` → `linkColor` → `linkHoverColor`
      → `separatorColor` → `separatorMargin`）。全部别名派生 ⇒ 落 `var(--apollo-*)`。
      **没有派生值**（上游 `mergeToken(token, {})` 是空的）。
- [x] G4 IMPLEMENT —— 三个组件**都是 `.ts` 渲染函数**（`COMPONENT-RULES.md` §2 **条件 2**，
      理由见 `README.md` §3；**不是**骨架里的 `.vue`，`Breadcrumb.vue` 已删）：
      `Breadcrumb.ts` + `BreadcrumbItem.ts` + `BreadcrumbSeparator.ts` + `context.ts`
      + `useItems.ts` + `useItemRender.ts` + `style/index.ts`（**18 条规则**，从
      antd 真实产物提取 —— 21 条里差的 4 条是 `resetComponent` 的 box-sizing 重复块）。
      接线：`style/index.ts` 的 `COMPONENT_STYLES` 一行 + `ui/src/index.ts` 的 export 块。
      🚨 **三处实测踩到的坑**（都写进源码注释）：
      ① **插槽函数不能在 render 之外调用**（`watchEffect` 里调会打
      `Slot "default" invoked outside of the render function`，把真告警淹掉）⇒
      三条 deprecated / usage 告警搬进 **render**，插槽用**惰性缓存**只取一次；
      ② **Vue 的插槽把 `null` 归一成 `Comment` vnode** ⇒ `isNonNullable(slot())` 恒真、
      **空项也会被渲染**（上游 `children === null` 才不渲染）⇒ 加「只认 `Comment`」的还原；
      ③ **多根组件 + `attrs`**：上游把 `className`/`style`/`onClick`/`pickAttrs(item)`
      spread 给 `InternalBreadcrumbItem`（它全部忽略），本仓**只传它声明过的键** ——
      照抄会落进 `attrs`、Vue 报 `Extraneous non-props attributes` 并整批丢弃。
      另：`menu.items` 的 `key` 在本仓要 `String()` 归一（本仓 `MenuItemType.key` 是 `string`）。
- [x] G5 L1 单元 + G6 L2 交互 —— `__tests__/index.test.ts` **22 条**（结构与分隔符 5 /
      三条数据通道 5 / path·params·href 6 / itemRender·语义化·rtl·expose 6）。
      **零 Vue 告警**。⚠️ 三条期望值的坑（都实测过）：`path` 是**累加**的（第 2 项是
      `#/a/b`）；显式 `type:'separator'` 排在**注入分隔符之后**；自定义 `itemRender`
      **不走** `renderItem` ⇒ 没有 `-link` 元素。
      ⚠️ rc-util 的 `warning()` 走 **`console.error`**（不是 `warn`）。
- [ ] G7 L3 类型（含负例，负例包在永不调用的闭包里）
- [ ] G8 L5 a11y —— axe + role/键盘断言
- [ ] G9 L6 视觉 —— 先建基线再 compare；**首跑全绿 ≠ 测到了**：
      `md5 tests/visual/baselines/react/breadcrumb/*.png | sort` 查同哈希（PITFALLS 276）
- [ ] G10 L4/L4 DOM 契约 + compat 比对 —— 🚨 必须定论分析 §6.2 的 `item.style` / `item.className` 落点
- [ ] G11 DOCS —— demo 与 antd 一一对应（demo.test.ts 的 expectCount 钉死数量）
- [ ] G12 REGISTRY —— 11 维度置 done（唯一让进度被承认的方式）
- [ ] G13 BUILD —— pnpm run registry:check && lint && test && test:build 四道全绿
- [ ] G14 COMMIT —— commit message 带 [COMP:breadcrumb]

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

### 本组件特有的三条（本轮新踩/新判）

11. 🚨 **BSD `grep` 不支持 `\|` 交替、会静默返回空**（PITFALLS 277）——
    本轮在核查依赖面时**连踩两次**（`grep -n "rtl\|direction\|prefixCls}"` 返回空，
    误以为「config-provider 里没有 breadcrumb 槽」）。搜代码一律用 **Grep 工具**或 `grep -E`。
12. ⚠️ **`React.AriaAttributes` 不展开**：本仓 aria 一律走 `attrs`，`items` 里的
    `aria-*` / `data-*` 由 `pickAttrs` 透传 ⇒ 类型上用**模板字面量索引签名**表达，
    不要引入 `AriaAttributes`（无先例，且会与 `attrs` 通道重复声明）。
13. 🚨 **`BreadcrumbSeparator` 的 `prefixCls` 来自 ConfigContext**（不接 prop）——
    L4 / L6 的用例都要包 `ConfigProvider`，否则分隔符是 `ant-breadcrumb-separator`
    而根是 `apollo-breadcrumb`（PITFALLS 272 同族）。
