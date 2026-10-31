> 2026-10-31 Vue 原生化增量：五个所属通知统一为 camelCase emits；模板 kebab 写法和 h 的 onX 监听器自然映射。Splitter 保留真实 Panel VNode，由私有布局 context 提供尺寸，Panel 的原生 attrs、完整当前默认槽和 nativeElement ref 由实际组件拥有。尺寸与折叠记忆归业务 key，受控拒绝不污染撤控状态，默认尺寸只在面板建立时使用。保留 sizeUtil / ARIA 算法和 s33/s51 场景。分隔条补齐键盘入口、当前 active 样式与取消/卸载监听释放；现有四 Token 读取当前主题，resizeSpinnerSize 继续作为未显式设置 draggable 尺寸的派生来源。当前契约见双语 API，以下旧实现记录保留其历史含义。

> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

# Splitter 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/splitter/`（898 行：Splitter 231 + SplitBar 235 + Panel 35 +
  hooks 337 + style 330，只读参照，H2）
- 分析产物：`docs/analysis/splitter.md`（G1–G3，先于实现存在）
- 依赖替换（registry 登记）：`@rc-component/resize-observer` ⇒ utils 的
  `useResizeObserver`；图标 ⇒ `@apollo-design/icons`（Left/Right/Up/DownOutlined）
- 复用基建：`useOrientation`（_internal）、`useMergeSemantic`/`semanticRootStyle`
- 复合组件：`Splitter.Panel`（renderless，React 的 `Panel = () => null` 同款）

## 2. 与 antd 的行为差异清单

同步到 `COMPATIBILITY.md` §9.1 / §9.2。

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D63 | 事件名映射：`onResizeStart/onResize/onResizeEnd/onCollapse/onDraggerDoubleClick` ⇒ `resize-start/resize/resize-end/collapse/dragger-double-click`（C19 惯例，emit + onXxx prop 双通道） | INTENDED | L1 事件用例 |
| — | ref ⇒ `expose({ nativeElement })`（antd 的 `SplitterRef` 同形状） | INTENDED | L1 |
| — | Panel children 收集：slot 函数/槽对象/数组三形态归一化（Vue 特有，React children 恒为数组） | INTENDED | Splitter.ts `renderPanelChildren` |
| D131 | **ARIA 上下界收口为有限且 `min ≤ now ≤ max`** —— antd 在①容器**未测量**（SSR/首帧）时 `ptgMaxSizes = (max \|\| 0)/0` = `NaN` ⇒ 渲染出 `valuemin=0 / valuemax=0 / valuenow=50`（now 落在区间外）；②约束**不可满足**（两侧 `min` 之和 > 100%）时产出 `min > max`（区间反转）。本仓两条都收口：非有限比例回退「无约束」语义得 `0 / 100 / 50`；矛盾约束退化为「不可拖」单点 = 当前位置（**而非**交换端点谎报一段拖不到的区间），最后把 `now` 夹回区间。**只改 ARIA 属性，不改拖拽/布局**：可满足场景的数值与 antd 逐字相同 | INTENDED（**优于上游**：A11y 正确性，依据 ARIA 规范） | COMPATIBILITY.md §9 `D131`；L1 `s51-issue51`（`[C2]` 证明矛盾约束下拖拽 offset 确实归零、`[C3]` 证明良构约束下 `[min,max]` 恰为拖拽端点）；L4 的 9 条 allow |

> ⚠️ **D131 的取舍边界（改之前请先读）**：为什么矛盾约束是「退化为单点」而不是「交换 min/max」？
> `useResize.onOffsetUpdate` 的边界对齐是**顺序覆盖**的四条规则，两侧 `min` 互相夹死时会把
> offset 压回 0 ⇒ 这条 bar **真的拖不动**。此时若向辅助技术播报一段 `[20, 80]` 的可拖区间，
> 等于承诺用户一个拖不到的范围 —— 违反「ARIA 语义必须与实际可拖范围一致」。
> 矛盾约束本身是**使用方的配置错误**（`min` 之和超过容器），本仓选择如实告知「当前不可拖」。

## 3. 引擎（hooks/ 自建）

| 文件 | 上游来源 | 钉什么 |
|---|---|---|
| `sizeUtil.ts` | `hooks/sizeUtil.js` | `fitPtgSizes`（min/max 夹取 + 空间分摊）/ `autoPtgSizes`（均分/贪婪/缩放/全 0） |
| `useSizes.ts` | `hooks/useSizes.js` | prop size 优先于内部 state；px/百分比归一化；SSR 未测量 ⇒ 开发者原值 |
| `ariaBounds.ts` | `Splitter.js:181-201` | 拖拽条 ARIA 三值（`now/min/max`）。⚠️ 抽成纯函数的动机是**可验证**（Issue #51）：容器尺寸在 jsdom 恒为 0 ⇒ 组件级只能看到退化解 |
| `useResizable.ts` | `hooks/useResizable.js` | 相邻面板对的可拖/可折叠矩阵 + 图标显隐 + RTL 镜像 |
| `useResize.ts` | `hooks/useResize.js` | 拖拽状态机（movingIndex 确认/四边界夹取/折叠三路+记忆） |

## 4. Component Token 清单（4 个，全为常量默认值）

`splitBarSize`(2) / `splitTriggerSize`(6) / `resizeSpinnerSize`(20) /
`splitBarDraggableSize`(20)。alias 上不存在这些键 ⇒ 恒取默认，构建期解析值落地（D50
同判）。另声明组件作用域变量 `--apollo-splitter-bar-preview-offset`（antd
`genCssVar(root,'splitter')` 同义，B7/grid 先例）。

## 5. 测试矩阵

| 层 | 文件 | 条数 | 钉什么 |
|---|---|---|---|
| L1/L2 | `__tests__/index.test.ts` | 21 | sizeUtil 全分支、collapsible 归一化、SSR 语义/尺寸、deprecated×2、测量链（ResizeObserver 桩）、事件 emit |
| L3 | `__tests__/type.test-d.ts` | 14 | orientation 字面量、collapsible 三键、语义槽、sizes 回调 |
| L4 | `__tests__/semantic.test.ts` | 9 | SSR 契约 byte 级（basic/vertical/deprecated/collapsible×2/multiple/size-px/rtl/semantic） |
| L5 | `__tests__/a11y.test.ts` | 4 demo | axe 0 violation |
| L6 | `tests/visual/render/cases/{react,vue}/splitter.*` | 3×3 | basic / vertical / multiple |
| L7 | `__tests__/theme.test.ts` | 13 | Token 常量 + 全样式段 |
| — | `tests/compat/fixtures/splitter/*.json` | 3 | basic / collapsible / size-px |

## 5.5 Issue #33 的两条判据

1. **`Splitter.Panel` 的 Vue 原生 `class` 必须落到面板节点**（#33.1）：
   `Splitter.Panel` 是 renderless，父层只收集 `vnode.props`；创建 `InternalPanel`
   时原来只拼 React 式的 `className` ⇒ 调用方写 `class="editor"` 会**静默丢失**。
   现在额外把原生 `class` 传给 `InternalPanel`（落在 attrs ⇒ 由 Vue 自己归一并
   合并到面板根 div）⇒ 字符串/数组/对象/动态 class 全部生效，且与
   `classNames.panel`、旧键 `className` 三者共存。
2. **`SplitBar` 的 `splitBarPrefixCls` 必须是 computed**（#33.2）：setup 期拼
   `` `${props.prefixCls}-bar` `` 是常量 ⇒ `prefixCls` 变化后 bar / dragger /
   collapse / preview 的类名全部停留在旧前缀。改 computed + 所有消费点读 `.value`。

## 6. 已知边界

- 拖拽/折叠的**运行时**行为（窗口监听、lazy 预览、折叠记忆）在 jsdom 里只能桩
  `pageX/pageY` 走最小链路（L1）；像素级验证靠 L6 的静态帧 + 浏览器人工复核。
- `onCollapse` 事件参数 `(collapsed: boolean[], sizes: number[])` 与 antd 一致。
