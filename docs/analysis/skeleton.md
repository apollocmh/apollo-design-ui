# Skeleton 分析产物（G1）

> 阶段：Phase 2 · 组件 `skeleton`（P1 / complexity S / **unblocks 4 个下游**）
> 目标：**只读 antd 6.6.4 的行为与契约**，不搬实现。本文先于任何实现代码存在（`AGENTS.md` §2）。

## 0. 事实来源（本地缓存，已读）

| 用途 | 路径 |
|---|---|
| 类型面 | `/tmp/antd-src/package/es/skeleton/{Skeleton,Element}.d.ts` |
| 行为实现 | `/tmp/antd-src/package/es/skeleton/Skeleton.js` |
| 子组件 | 同目录 `Avatar/Button/Input/Image/Node/Title/Paragraph` |
| 样式 | `/tmp/antd-src/package/es/skeleton/style/` |

⚠️ `/tmp` 会被系统清理（PITFALLS 42），每个新会话先 `ls`。

---

## 1. 类型面（antd 的公开契约）

```ts
SkeletonProps {
  active?: boolean;
  loading?: boolean;
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  style?: CSSProperties;
  avatar?: SkeletonAvatarProps | boolean;   // 默认 false
  title?: SkeletonTitleProps | boolean;     // 默认 true
  paragraph?: SkeletonParagraphProps | boolean; // 默认 true
  round?: boolean;
  classNames? / styles?  // 语义化
}

SkeletonRef { nativeElement: HTMLDivElement | null }

// Element（Avatar/Button/Input/Image/Node 的公共底座）
SkeletonElementProps {
  prefixCls?; className?; rootClassName?; style?;
  size?: SizeType | number | 'default';       // 'default' 已废弃，用 'medium'
  shape?: 'circle' | 'square' | 'round' | 'default';
  active?: boolean;
  classNames? / styles?                       // root / content
}
```

**语义化 6 个键**：`root / header / section / avatar / title / paragraph`。
⚠️ 本仓库 `empty-semantic-fn` 决策建议 **B（不支持函数式变体）** —— 与已完成的
divider / spin / space / button / typography 一致，只支持对象形态。

**复合组件**：`Skeleton.Button / .Avatar / .Input / .Image / .Node`。

---

## 2. Vue API 设计（本节是我们自己的设计，不是 antd 的）

| antd (React) | Vue 侧 |
|---|---|
| `children` | 默认插槽 `default` |
| `ref` | expose `{ nativeElement }` |
| 其余 prop 透传 | `v-bind="$attrs"` |
| 复合组件 | 具名导出 `SkeletonButton` 等（与 `Space.Compact` 同一形态） |

---

## 3. DOM 契约（`Skeleton.js:168-172`）

```html
<div class="apollo-skeleton [-with-avatar] [-active] [-rtl] [-round]">
  <!-- 有 avatar 时 -->
  <div class="apollo-skeleton-header">
    <Element class="apollo-skeleton-avatar" … />
  </div>
  <!-- 有 title 或 paragraph 时 -->
  <div class="apollo-skeleton-section">
    <Title class="apollo-skeleton-title" … />
    <Paragraph class="apollo-skeleton-paragraph" … />
  </div>
</div>
```

⚠️ `-header` 与 `-section` 是**两个独立的一级子容器**，不是嵌套关系。
⚠️ 类名前缀：`avatar` 用的是 `${prefixCls}-avatar`（`Skeleton.js:114`），
不是 `${prefixCls}-header-avatar`。

### `loading === false` 时不渲染骨架（`Skeleton.js:174`）

```js
return children ?? null;
```

⇒ 直接返回 children，**不套任何容器**。

---

## 4. 关键行为（逐条给上游行号）

### 4.1 🚨 `loading` 的判据在 Vue 里必须改写（`Skeleton.js:105`）

```js
if (loading || !('loading' in props)) { …骨架… }
return children ?? null;
```

⚠️⚠️ **`'loading' in props` 在 Vue 里恒为 `true`** —— Vue 的 props 对象**恒**包含全部
声明键（未传时值为 `undefined`）。照抄会让「未传 loading」永远走 `children` 分支。

**等价改写**：未传（`undefined`）与 `true` 都渲染骨架，`false` 渲染 children
⇒ `const showSkeleton = props.loading !== false;`
（PITFALLS 46 / D21 同源，这次受害的是 `in` 判据。）

### 4.2 三个默认值与外部 props 的合并顺序（`Skeleton.js:112-155`）

统一形态：`{ 语义类名, prefixCls, ...基础props(由其它两项推导), ...用户对象, style }`

- **Avatar**（`:23-35`）：`size: 'large'` 恒定；`shape` = `hasTitle && !hasParagraph ? 'square' : 'circle'`
- **Title**（`:36-48`）：`!hasAvatar && hasParagraph` ⇒ `width:'38%'`；
  `hasAvatar && hasParagraph` ⇒ `width:'50%'`；其余**不设 width**
- **Paragraph**（`:49-62`）：
  - `width`: `!hasAvatar || !hasTitle` ⇒ `'61%'`（即 avatar 与 title **都在**时不设 width）
  - `rows`: `!hasAvatar && hasTitle` ⇒ `3`，否则 `2`

⚠️ 这三组「由其它两项推导」的规则是 Skeleton 最容易写错的地方 —— 它们是**互锁**的。

### 4.3 `getComponentProps`（`:17-22`）

只接受**纯对象**：`isPlainObject(prop) ? prop : {}`。
⇒ `avatar` 传 `true` 时得到 `{}`（用基础 props）；传 `'x'` 这类非对象同样得到 `{}`。

### 4.4 类名（`:162-167`）

| 类 | 条件 |
|---|---|
| `-with-avatar` | `!!avatar` |
| `-active` | `active` |
| `-rtl` | `direction === 'rtl'` |
| `-round` | `round` |

⚠️ **没有** `-loading` 类 —— `loading` 不产生类名，只决定渲染分支。

### 4.5 语义类名的优先级（`:63` 注释）

```
ctx.classNames.root < ctx.className < cpns.classNames.root < cpns.className < rootClassName
```

---

## 5. Token 面

Component Token 见 `/tmp/antd-src/package/es/skeleton/style/token.d.ts`。
零运行时架构下的处置照 `divider/style/token.ts`：
**别名派生的走 `var(--apollo-*)`（B7 可校验、随主题自适应）；字面量的由 token.ts 给唯一真源。**

---

## 6. 差异预判

| # | 差异 | 分类 | 说明 |
|---|---|---|--|
| D1 | `classNames`/`styles` 不支持函数式 | INTENDED | 跟 `empty-semantic-fn` 决策 B |
| D2 | `ref` 暴露 `{ nativeElement }` | INTENDED | 全库统一 |
| D3 | `'loading' in props` ⇒ `loading !== false` | INTENDED | Vue props 语义差异，见 §4.1 |
| D4 | 动画走 `motion` 或纯 CSS | INTENDED | 不得引入 React；先确认 `packages/motion` 能力 |

---

## 7. 测试矩阵（7 层）

| 层 | 覆盖点 |
|---|---|
| L1 unit | §4.2 三组互锁推导（avatar/title/paragraph 的 8 种存在性组合）、`loading` 三态、`getComponentProps` |
| L2 interaction | 无交互元素；主要验 `loading` 切换时 children ↔ 骨架的切换 |
| L3 type | 类型联合、semantic 类型、`loading` 的默认行为 |
| L4 dom-contract | §3 的 DOM 结构（header/section 并列）、类名全表、`loading=false` 时不套容器 |
| L5 a11y | 装饰性内容应 `aria-hidden`，或至少不提供误导性的可访问名 |
| L6 visual | avatar/title/paragraph 组合 × active × round × size 的代表组合 |
| L7 build | 全仓门禁内 |

⚠️ L6 的 React 基线必须 `git add` 入库（上一轮 config-provider 曾 0 张基线冒充「3/9 exact」）。

---

## 8. 待验证 / 未决

- `Title` / `Paragraph` 的内部 DOM（行数与宽度数组的落地形态）需读 `Title.js` / `Paragraph.js` 确认。
- 动画：先确认 `packages/motion` 是否已有可用能力，否则用纯 CSS 并登记。
- `Skeleton.Node` 的 `children` 语义（`Node.js`）。
