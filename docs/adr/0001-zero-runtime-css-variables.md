# ADR 0001：采用零运行时 CSS 变量，放弃 CSS-in-JS

- **状态**：已接受
- **日期**：2026-09-15
- **决策者**：项目负责人
- **相关**：`ARCHITECTURE.md` §4.3、`COMPATIBILITY.md` D5/D7、`AGENTS.md` H6

---

## 背景

Ant Design 6.6.4 使用 `@ant-design/cssinjs` 作为样式方案：运行时生成 CSS、插入 `<style>`、给类名加 hash 后缀、通过 `useInsertionEffect` 控制插入时机。

我们在用 Vue 3 重实现时，必须决定样式方案。可选项：

| 方案 | 说明 |
|---|---|
| A. 移植 CSS-in-JS | 找一个 Vue 版 CSS-in-JS 运行时（如 `vue-styled-components`、`@vueuse/head` + 自研） |
| B. 编译期 CSS-in-JS | 构建时把样式抽取为静态 CSS（如 vanilla-extract 的思路） |
| C. 静态 CSS + CSS 变量 | 组件样式写死为静态 CSS，所有可变值引用 CSS 变量；Token Runtime 只负责计算并注入变量 |
| D. CSS Modules / scoped CSS | 每个组件用 scoped 样式 |

## 决策

**采用方案 C：静态 CSS + CSS 变量。**

```
Seed ──algorithm──► Map ──alias──► Alias ──merge──► Component Token
                                                          │
                                    注入 :root / [data-apollo-theme="dark"]
                                    --apollo-color-primary: #1677ff;
                                                          │
                                    静态 CSS 引用变量
                                    .apollo-btn { background: var(--apollo-color-primary); }
```

`theme.zeroRuntime` 恒为 `true`（本项目唯一模式）。

## 理由

1. **无运行时样式计算**
   CSS-in-JS 需要在组件挂载时计算样式对象、序列化、插入 DOM。方案 C 下这些工作在构建期完成，运行时只有一次变量注入。

2. **不依赖 React 专属机制**
   `@ant-design/cssinjs` 依赖 `useInsertionEffect`（React 18 特有）与 React 的渲染时序。移植它必然要伪造这些机制，违反 `AGENTS.md` H4（禁止模拟 React 生命周期）。

3. **SSR 天然友好**
   服务端只需在 HTML 里输出一段 `:root{...}`，无需收集样式、无需与客户端 hydration 对齐。CSS-in-JS 的 SSR 是它最复杂、最容易出错的部分。

4. **主题切换零成本**
   切换 `data-apollo-theme` 属性或替换变量作用域即可，无需重新计算全部组件样式。CSS-in-JS 下切主题会触发大量组件重算。

5. **与 antd 自身演进方向一致**
   antd 6.0 新增了 `theme.zeroRuntime`（构建期抽 CSS，需手动引入），说明官方也认为运行时样式是有成本的。我们直接把该模式作为默认。

6. **可静态抽取与审计**
   默认主题可在构建期固化为 `.css` 文件。样式的最终产物是**可读、可 diff、可审计**的 CSS，而不是运行时生成的不透明字符串。

7. **调试体验更好**
   无 hash 类名，DevTools 里看到的类名就是源码里的类名。

## 后果

### 正面

- 产物更小：无 CSS-in-JS 运行时（`@ant-design/cssinjs` + `cssinjs-utils` 约 40KB+ gzip 前的体积）
- SSR 无需特殊处理
- 主题切换快
- 样式可静态审计
- 测试中无需处理样式注入时序

### 负面与代价

| 代价 | 缓解 |
|---|---|
| 无法使用 `createStyles` 这类动态样式 API | antd 用户极少直接使用；若确需，可通过 `styles` / `classNames` 覆盖 + 自定义 CSS 变量实现 |
| 视觉回归比对时必须做前缀归一化（我们无 hash 类名） | 已在 `tests/compat/README.md` §4 设计对称归一化规则 |
| 组件样式的"局部性"变弱（不再是组件自包含） | 每个组件的样式产物独立成文件（`css/components/<name>.css`），按需引入 |
| 需要自己实现变量注入与作用域管理 | `packages/theme/src/runtime/cssVar.ts` |
| 用户若想覆盖某个组件的深层样式，需了解 CSS 变量名 | 变量命名与 antd 的 cssVar 命名保持同构，且有 `tokens.json` 提供完整清单 |

### 影响的约束

- `AGENTS.md` H6：禁止依赖 `@ant-design/cssinjs` 家族
- `COMPATIBILITY.md` D5：CSS-in-JS 内联 hash 类 → 静态 CSS + CSS 变量（INTENDED）
- `COMPATIBILITY.md` D7：`theme.zeroRuntime` 恒为 `true`
- `validate-registry.mjs` E10：组件样式中禁止硬编码视觉值
- `TESTING.md` L7：产物中禁止出现 CSS-in-JS 运行时

## 备选方案为何被否决

- **A. 移植 CSS-in-JS**：违反 H4；且要维护一个 React 生态的运行时在 Vue 下的适配层，长期成本高
- **B. 编译期 CSS-in-JS**：需要自研编译器，且动态主题（运行时改 Token）会失效
- **D. scoped CSS**：`prefixCls` 契约要求类名结构可预测（`apollo-btn`），scoped 的 hash 属性会破坏 DOM Contract；且跨组件共享样式（如 focus 样式、compact 合并边框）不便

## 待验证

- [ ] `classNames` / `styles` 语义化覆盖与 CSS 变量的组合优先级（AR4）
- [ ] 嵌套 ConfigProvider + `inherit: false` 时的变量作用域隔离
- [ ] 在 `packages/theme` 完成后实测默认主题 CSS 产物体积
