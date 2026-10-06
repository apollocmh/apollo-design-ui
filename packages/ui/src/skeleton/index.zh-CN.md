---
category: 反馈
title: Skeleton
subtitle: 骨架屏
group:
  title: 反馈
  order: 2
---

# Skeleton 骨架屏

在需要等待加载内容的位置提供一个占位图形组合。

## 何时使用

- 网络较慢，需要长时间等待加载，且**只知道大致结构**时；
- 加载过程中需要给用户一个「正在准备」的视觉预期，避免白屏。

## 代码演示

> ⚠️ 本组件的 `demo/` 目录**尚未落地**（见 `README.md` §7 的缺口清单）。
> 下面的示例是**可直接运行**的最小片段，等 demo 补齐后会替换成 `<demo>` 引用。

### 基础

```vue
<template>
  <ASkeleton />
</template>

<script setup lang="ts">
import { Skeleton as ASkeleton } from '@apollo-design/ui';
</script>
```

### 只显示标题（不显示段落）

```vue
<ASkeleton :paragraph="false" />
```

### 带头像

```vue
<ASkeleton avatar :paragraph="false" />
```

### 加载完成前显示骨架，完成后显示真实内容

```vue
<template>
  <ASkeleton :loading="loading">
    <div>真实内容</div>
  </ASkeleton>
</template>

<script setup lang="ts">
import { Skeleton as ASkeleton } from '@apollo-design/ui';
const loading = ref(true);
</script>
```

### 动画与圆角

```vue
<ASkeleton active round />
```

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `active` | 是否显示动画 | `boolean` | `false` |
| `loading` | 是否显示骨架。**未传与 `true` 都显示骨架，只有 `false` 显示子内容**（见下） | `boolean` | — |
| `avatar` | 是否显示头像占位。传对象可覆盖推导值 | `boolean \| SkeletonAvatarProps` | `false` |
| `title` | 是否显示标题占位。传对象可覆盖推导值 | `boolean \| SkeletonTitleProps` | `true` |
| `paragraph` | 是否显示段落占位。传对象可覆盖推导值 | `boolean \| SkeletonParagraphProps` | `true` |
| `round` | 是否显示圆角 | `boolean` | `false` |
| `prefixCls` | 类名前缀 | `string` | `apollo-skeleton` |
| `class` / `style` | **根元素原生 attrs**（不是 Props）；`style` 覆盖 `styles.root`。⚠️ 其余多余属性仍按上游丢弃 | `string \| array \| object` / `CSSProperties` | — |
| `classNames` | 语义化类名，见「语义化槽位」 | `SkeletonSemanticClassNames` | — |
| `styles` | 语义化样式，见「语义化槽位」 | `SkeletonSemanticStyles` | — |

`avatar` / `title` / `paragraph` 的对象形态：

| 键 | 适用 | 说明 |
|---|---|---|
| `width` | title / paragraph | 宽度。paragraph 下可为**数组**（逐行）；单值时**只有最后一行**生效 |
| `rows` | paragraph | 行数 |
| `size` | avatar | 尺寸 |
| `shape` | avatar | `'circle' \| 'square' \| 'round' \| 'default'` |
| `active` / `className` / `style` | 三者 | 覆盖 |

### 事件

无。Skeleton 不产生任何事件。

### 插槽

| 名称 | 说明 |
|---|---|
| `default` | 真实内容。**仅在 `loading === false` 时渲染**，且**不套任何包裹元素** |

### 语义化槽位

`classNames` / `styles` 各支持 6 个键，与 DOM 结构一一对应：

| 键 | 落到 |
|---|---|
| `root` | 根 `div` |
| `header` | `-header` 容器（**仅在有 avatar 时存在**） |
| `section` | `-section` 容器（**仅在有 title 或 paragraph 时存在**） |
| `avatar` | 头像元素 |
| `title` | 标题元素 |
| `paragraph` | 段落元素 |

> ⚠️ 本组件**不支持函数式** `classNames` / `styles`（与 divider / button / typography 一致，
> 依据 `empty-semantic-fn` 决策的建议 B）。

### 类型导出

`SkeletonProps`、`SkeletonRef`、`SkeletonConfig`、`SkeletonSlot`、
`SkeletonSemanticClassNames`、`SkeletonSemanticStyles`、`SkeletonSemanticType`、
`SkeletonSemanticAllType`、`SkeletonSemanticValue`、
`SkeletonAvatarProps`、`SkeletonAvatarOwnProps`、`SkeletonTitleProps`、`SkeletonParagraphProps`、
`SkeletonButtonProps`、`SkeletonInputProps`、`SkeletonImageProps`、`SkeletonNodeProps`、`SkeletonNodeSlot`、
`SkeletonElementProps`、`SkeletonElementSemanticClassNames`、`SkeletonElementSemanticStyles`、
`SkeletonElementSemanticType`、`SkeletonElementSize`、`SkeletonShape`、`SkeletonWidthUnit`。

### ref

```ts
const skeletonRef = ref<{ nativeElement: HTMLDivElement | null }>();
```

### 复合组件

`Skeleton.Avatar` / `Skeleton.Button` / `Skeleton.Input` / `Skeleton.Image` / `Skeleton.Node`
与主组件同包导出，用法与 antd 一致。

## 设计说明

### `loading` 的四态（⚠️ 唯一的兼容性差异）

antd 的判据是 `loading || !('loading' in props)` —— **看的是「键是否存在」**。实测四态：

| 情形 | antd 6.6.4 | 本实现 |
|---|---|---|
| ① **不传**（键不存在） | 渲染骨架 | 渲染骨架 ✅ |
| ② **显式传 `loading={undefined}`** | **渲染 children** | 渲染骨架 ❌ |
| ③ `loading={true}` | 渲染骨架 | 渲染骨架 ✅ |
| ④ `loading={false}` | 渲染 children | 渲染 children ✅ |

**只有 ② 不同**，原因是 **Vue 的 prop 没有「键存在」这个概念**（未传时值同样是 `undefined`，
两者不可区分）⇒ 属**平台固有差异**（PLATFORM），不是实现错误。
本实现取 `loading !== false`，即「未传 = 显示骨架」。

### 三个块的基础 props 是**互锁推导**的

`avatar` / `title` / `paragraph` 各自的 `width` / `rows` / `shape` 由**另外两项是否存在**决定：

| 推导 | 规则 |
|---|---|
| avatar `shape` | `hasTitle && !hasParagraph` ⇒ `'square'`，否则 `'circle'`（`size` 恒为 `'large'`） |
| title `width` | `!hasAvatar && hasParagraph` ⇒ `'38%'`；`hasAvatar && hasParagraph` ⇒ `'50%'`；否则不设 |
| paragraph `width` | `!hasAvatar \|\| !hasTitle` ⇒ `'61%'`；否则不设 |
| paragraph `rows` | `!hasAvatar && hasTitle` ⇒ `3`，否则 `2` |

传入对象时**对象覆盖推导值**（`{ ...基础推导, ...用户对象 }`）。

### DOM 结构：`-header` 与 `-section` 是**并列**的

```html
<div class="apollo-skeleton [-with-avatar] [-active] [-rtl] [-round]">
  <div class="apollo-skeleton-header"><!-- 仅在有 avatar 时 --></div>
  <div class="apollo-skeleton-section"><!-- 仅在有 title 或 paragraph 时 -->
    <h3 class="apollo-skeleton-title"></h3>
    <ul class="apollo-skeleton-paragraph"><li></li>…</ul>
  </div>
</div>
```

标题是 `<h3>`、段落是 `<ul>` + `rows` 个 `<li>`（与上游一致）。
`loading === false` 时**根元素不存在**，直接渲染 children。

### 无障碍

⚠️ **antd 的 Skeleton 完全没有 ARIA**（实测 `aria-*` / `role` 出现次数为 **0**）——
没有 `aria-busy`、没有 `aria-live`、没有 `role="status"`。屏幕阅读器不会播报「正在加载」。
**我们逐字对齐**，不擅自补（否则 L4 的 DOM 契约会与机械基线不一致）。

⚠️ **一处例外（我们比上游更严格，已登记）**：`Skeleton.Image` 的 `<svg>` 上我们加了
`aria-hidden="true"` + `focusable="false"`（antd 的 `Image.js` 没有）。
这是有意为之的改进——装饰性占位图对读屏器无意义。由 `__tests__/a11y.test.ts` 钉住。

### 组件 Token

见 `style/token.ts`。零运行时架构下：
**别名派生的走 `var(--apollo-*)`**（随主题自适应、由构建门禁 B7 校验）；
**字面量的**由 `token.ts` 给出唯一真源，由 `style/index.ts` 内联消费。

### 样式引入

```ts
import '@apollo-design/ui/skeleton/style.css';
```

> ⚠️ 按需样式子路径目前**缺失**（`packages/ui/package.json` 的 `exports` 未声明），
> 属全库级基建议题，影响 `skeleton` / `divider` / `spin` 三家。见 `README.md` §7。
