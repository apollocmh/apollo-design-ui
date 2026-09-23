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

## 3. 引擎（hooks/ 自建）

| 文件 | 上游来源 | 钉什么 |
|---|---|---|
| `sizeUtil.ts` | `hooks/sizeUtil.js` | `fitPtgSizes`（min/max 夹取 + 空间分摊）/ `autoPtgSizes`（均分/贪婪/缩放/全 0） |
| `useSizes.ts` | `hooks/useSizes.js` | prop size 优先于内部 state；px/百分比归一化；SSR 未测量 ⇒ 开发者原值 |
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

## 6. 已知边界

- 拖拽/折叠的**运行时**行为（窗口监听、lazy 预览、折叠记忆）在 jsdom 里只能桩
  `pageX/pageY` 走最小链路（L1）；像素级验证靠 L6 的静态帧 + 浏览器人工复核。
- `onCollapse` 事件参数 `(collapsed: boolean[], sizes: number[])` 与 antd 一致。
