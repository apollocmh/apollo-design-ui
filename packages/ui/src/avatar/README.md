# Avatar 实现说明

> 规则 R1：本文件必须记录（G11 前补齐）。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/avatar/`（只读参照，H2）
- 规模 **420 行产物 / 10 文件**；Component Token **12 个** + **2 个 `mergeToken` 派生**

| 上游文件 | 本仓 | 形态 |
|---|---|---|
| `Avatar.tsx`（242） | `Avatar.vue` | `.vue` SFC（见 §3） |
| `AvatarGroup.tsx`（137） | `AvatarGroup.vue` | `.vue` SFC |
| `AvatarContext.ts`（17） | `context.ts` | `InjectionKey` + `provide` / `inject` |
| `style/index.ts`（237） | `style/index.ts` | `genAvatarStyle` + `genTokenDecls`（**19 条规则**） |

**产物交叉验证**（可复现）：

```sh
node tests/visual/debug/extract-avatar-css.mjs > /tmp/avatar-antd.css   # 24 条 ant-avatar 规则
```

本仓产出 **19 条**，差掉的 5 条 = `resetComponent` 的 4 条 `box-sizing` 块（`BASE_CSS` 已覆盖）
+ 1 个 `.css-var-*` 声明块（其 12 条声明由 `genTokenDecls` 内联进根规则）。

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

| # | 差异 | 分类 |
|---|---|---|
| 1 | `Avatar` 的 `ref` 形状：上游是 `forwardRef<HTMLSpanElement>`（ref 就是 DOM 本身），本仓按 `badge/Ribbon` / `card` 的既有约定统一成 `{ nativeElement }`（可空）。`Avatar.Group` 上游本来就是 `{ nativeElement }`。 | PLATFORM |
| 2 | `<ResizeObserver onResize>` **包装组件** ⇒ `useResizeObserver` **hook**（对象参数、响应式）。上游的 `SingleObserver` 是 `cloneElement(children, {ref})`、**不产 DOM**，所以本仓把 observer 挂在**同一个** `-string` span 上，DOM 完全相同。 | PLATFORM |
| 3 | `useStyle(prefixCls, rootCls)` 的 `useCSSVarCls` 产物 ⇒ 本仓直接拼 `${prefixCls}-css-var`（无对应 hook，与 card / rate / masonry 同判）。 | PLATFORM |
| 4 | `devUseWarning` 上游是**三参** `(valid, 'breaking', msg)`，本仓是**两参** `(valid, message)` ⇒ 把 `'breaking'` 并进消息（slider 已踩过同一条）。 | PLATFORM |
| 5 | **数字必须走 `toCssSize()`**（PITFALLS 170）：Vue 的 `patchStyle` **不补 px**，裸数字被静默丢弃 ⇒ `size={40}` / 响应式尺寸会**整个失效**。上游 React 自动补 px。这是本组件最容易踩的一条。 | PLATFORM |
| 6 | `children`（插槽）的真值判据：响应式尺寸的 `fontSize` 判据是 `(icon \|\| children) ? size/2 : 18`；本仓用「**默认插槽是否被传入**」（读函数引用、不调用）⇒ `<Avatar :size="…">{{ '' }}</Avatar>` 时上游判假（18）、本仓判真（size/2）。 | PLATFORM |
| 7 | 上游 `AvatarToken` 里的 `avatarBgColor` 是**死键**（`mergeToken` 里从没赋值）⇒ 本仓不引入（与 card 的 `bodyPadding` 同类）。 | PLATFORM |
| 8 | `<Avatar src="…" />` 不传 `alt` ⇒ 渲染出**没有 `alt` 的 `<img>`** ⇒ axe 的 `image-alt`（serious）。上游就是这样 —— **`alt` 是使用者的责任**；L5 精确钉住了这一点（「恰好一条 `image-alt`」）。 | UPSTREAM |
| 9 | 本仓无 `hashId`（D2）；`-css-var` 与上游 `useCSSVarCls` 同名（D5）。 | PLATFORM |

## 3. `.vue` / `.tsx` 选择

**`Avatar.vue` / `AvatarGroup.vue` 都是 `.vue` SFC。**

理由：两者的**渲染树形状是静态的**（`span` + 一个子节点 / `div` + 一组子节点），
动态的只是「渲哪一支」与「内联样式」—— 那是 `v-if` / `v-else-if` 能直接表达的，
不属于 `COMPONENT-RULES.md` §2 的任何一条例外条件。

⚠️ 唯一的例外形态是 `Avatar.Group` 的内容：它是「一组子元素 + 一个 Popover」的
**异构**列表 ⇒ 本仓用 `NodeRenderer`（`.ts` 平台原语）直接渲染这个 vnode 数组，
不产包裹元素。

## 4. Component Token 清单

<!-- registry 数据：token 数 = 12 -->

**12 个**，顺序与产物的 css-var 声明块**逐条一致**（`theme.test.ts` 逐键断言）：

| token | 默认值来源 | 解析值 |
|---|---|---|
| `containerSize` | `controlHeight` | 32 |
| `containerSizeLG` | `controlHeightLG` | 40 |
| `containerSizeSM` | `controlHeightSM` | 24 |
| `textFontSize` | `fontSize` | 14 |
| `textFontSizeLG` | `fontSize` | 14 |
| `textFontSizeSM` | `fontSize` | 14 |
| `iconFontSize` | `Math.round((fontSizeLG + fontSizeXL) / 2)` | 18 |
| `iconFontSizeLG` | `fontSizeHeading3` | 24 |
| `iconFontSizeSM` | `fontSize` | 14 |
| `groupSpace` | `marginXXS` | 4 |
| `groupOverlapping` | `-marginXS` | -8 |
| `groupBorderColor` | `colorBorderBg` | #ffffff |

**2 个 `mergeToken` 派生**（用户**不可**覆盖）：`avatarBg` = `colorTextPlaceholder`、
`avatarColor` = `colorTextLightSolid` ⇒ 落**全局** token 引用（`style/token.ts` 有对照表）。
⚠️ `AvatarToken.avatarBgColor` 是死键，不引入（见 §2 第 7 条）。

## 5. 已知缺口

<!-- 未支持的能力 + 落点（范本见 divider/README.md §7） -->

1. **1 个 antd demo 未移植**（`demo.test.ts` 的 `expectCount: 9` 钉住的是**已落地**的那批）：
   - `component-token`（`theme.components.Avatar` 调试）—— 零运行时架构下 token 是构建期产物，
     已由 `theme.test.ts` 的「判定值逐条对拍 + 声明↔引用双向检查」覆盖。
2. **`ConfigProvider` 的 `AvatarConfig` 类型未提升**：上游的 `AvatarConfig` 走 (B) 通道
   （`components?: Record<string, ComponentConfigLike>`）—— **运行时可用，只是类型宽**。
   ⚠️ 与 anchor / masonry / card 一致。
3. **`Avatar` 没有 `classNames` / `styles` 语义化槽**（上游也没有）⇒ `AvatarConfig` 只有
   `className` / `style`。别照抄 card / empty / skeleton 的配置面。
4. **`NodeRenderer` 的落点**：住在 `ui/src/_internal/node-renderer.ts`。
   ✅ 2026-10-07 已按架构规则迁出组件目录（registry `VNA-RENDERER-01`）：此前它在
   `empty/components/` 里被 7 个组件目录跨目录 import，且 `spin` / `space` 各有一份副本。
5. **demo 里的图片用 data URI / 必然失败的相对地址**（外网图片会污染 L6 基线；与 `image` / `avatar`
   的 demo 同判）。`fallback` demo 用的是 `./not-exist-avatar.png`（不发外链请求）。

## 6. 本轮实测结果（G4–G14）

| 层 | 命令 | 结果 |
|---|---|---|
| L1/L2 | `vitest run --project unit …/avatar/__tests__/{index,demo}.test.ts` | **47/47**（36 + 11） |
| L3 | `--project types …/type.test-d.ts` | **32/32**，`Type Errors no errors` |
| L4 | `--project dom-contract …/semantic.test.ts` | **31/31**（3 类已登记豁免） |
| L5 | `--project a11y …/a11y.test.ts` | **14/14**（0 axe violation；`alt` 缺失另钉） |
| L6 | `run.mjs --mode compare --component avatar` | **36/36 `exact`（0.000%）** |
| L7 | `--project theme …/theme.test.ts` | **16/16** |
| demo | `--project unit …/demo.test.ts` | **11/11**（9 demo + 计数 + 无告警） |
| 门禁 | `pnpm run verify:full` | ✅ registry 19 checks / lint 双通道 / test 9209 用例 / build 141 项 FAIL 0 |
| 显式补充 | `pnpm run test:types` · `node tests/visual/run.mjs` | **1923/1923** · 见 L6 行（两条都**不在** `verify:full` 里） |

**本轮抓到的真 bug（3 个）**：

1. 🚨 **模板顶层的 HTML 注释让组件变成「多根 fragment」**（`PITFALLS 302`）：
   `<template>` 第一行是 `<!-- 说明 -->` ⇒ `w.element.tagName` 变成 `DIV`、所有 class/style
   断言一次全红（16 条），而 `lint:types` / biome **全绿**。把注释挪进根元素即可。

2. 🚨 **`rootClassName` 传成了数组**（被 demo 冒烟抓到）：上游是
   `clsx(`${groupPrefixCls}-popover`, max?.popover?.rootClassName)` ⇒ 产出**字符串**；本仓一开始传数组
   ⇒ Tooltip 的 `rootClassName?: string` 判为类型不符，demo 直接 warn。改为
   `[…].filter(Boolean).join(' ')`。

3. 🚨 **`var(--apollo-var(--apollo-border-radius))` 双重包裹**（`PITFALLS 305`）：把 token **名**
   与「token → var」的转换**混用**（调用点传 `v('borderRadius')`，而工厂内部**又** `v()` 一次）
   ⇒ 变量名成了 `--apollo-var(--apollo-border-radius)`，**整条声明失效** ⇒ 方形头像的圆角
   退回 `0`。**两条既有防线都放过它**（组件 `theme.test.ts` 与 build gate 的 B7 用的是同一个
   `/var\((--apollo-[a-z0-9-]+)\)/`，会跳过坏壳、匹配到内层合法引用）—— **只有 L6 抓到**
   （`square` 2.98% / 1.45% / 0.78% block-diff，差异率随视口反比下降 = 固定尺寸的圆角区域）。
   已给 build gate 的 **B11** 补上 `var\(--[a-z0-9-]*var\(` 这道通用防线（不误伤
   `var(--a, var(--b))` 合法回退）。

**一个测试写法的坑**（`PITFALLS 303`）：`watch(() => props.x, fn)` 对**相同的原始值不触发** ⇒
「造完几何后 `setProps({ gap: 4 })`（与挂载时同值）」会让测量用例**空转假绿**。
改传一个真的不同的值。

**一个登记层面的坑**（`PITFALLS 304`）：E10 的「硬编码圆角」是**文本**扫描 ⇒ 把 `v('borderRadius')`
先算成变量再插值会被**误判**。修法是让源码形态匹配**已登记**的豁免 `${v(`（把 token 名传进工厂、
在模板串里内联 `v()`），产物逐字节不变 —— 而**不是**放宽 E10 的正则。

## 7. 收口（G11–G14）

- **G11 demo**：**9 个**（basic / type / dynamic / badge / group / max-count / fallback /
  toggle-debug / responsive），与 antd 的**用户可见** demo 一一对应；`demo.test.ts` 的
  `expectCount: 9` 钉死。⚠️ 缺口 **1 个**：`component-token`（零运行时架构下 token 是构建期
  产物，已由 `theme.test.ts` 覆盖）—— 与全仓 10+ 组件**同判**。
- **G11 文档**：`index.zh-CN.md` / `index.en-US.md` 的 API 表与 `interface.ts` **逐字段一致**
  （含 `onClick` / `onError` 是 **prop** 而非事件、五路互斥的渲染优先级、`max.*` 与四个
  deprecated 别名）。
- **G10 fixtures**：`tests/compat/fixtures/avatar/` 三个（`basic` / `group` / `image`），
  对齐机械基线 `baselines/avatar.dom.json` 的 31 个用例分组。⚠️ fixtures 目前是**规格文档**
  （全仓无消费者），差异登记仍以**本文件 §2** 为准。
- **G12 registry**：11 维度全 `done`、`status: completed`（**64/72**）。
  `registry:check` 19 checks 全绿。
- **G13/G14**：`verify:full` ✅ + 显式 `test:types`（1923/1923）与 `test:visual`（36/36 exact）。

⚠️ **发现的一处仓库级漂移（已上报，未擅自改）**：`COMPATIBILITY.md` §9.2 的最后一号是 **D118**，
但**最近收口的 5 个组件（card / masonry / anchor / breadcrumb / date-picker）的差异都没有登记进
§9.2**，只写在各自的 `README §2`。本组件**沿用同一先例**（§2 是本组件的权威清单）。若要让
C24（「任何 L1~L5 差异必须登记后才能合入」）名副其实，需要一次**统一的补登记**，那是跨组件的
独立工作，不在本轮改动面内。
