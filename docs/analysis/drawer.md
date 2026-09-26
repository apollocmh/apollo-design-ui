# drawer 分析（G1）

> 契约来源：antd 6.6.4 `components/drawer/`（Drawer.tsx 369 / DrawerPanel.tsx 249 /
> useFocusable.ts 26 / style 357 + motion 80）+ `@rc-component/drawer`。
> 上游是**兼容性规格**，不是代码来源。
>
> ⚠️ 本文件是 G1 的**第一遍**：已读的是 `Drawer.tsx` 前 200 行、`DrawerPanel` 的 props 段与
> 文件规模；**渲染结构 / token 值 / rc-drawer 内核** 在 G2–G4 开工前必须补读（标了 ⏳）。

## 0. 与已收口组件的关系

| 部分 | 状态 |
|---|---|
| `@apollo-design/portal`（Portal 组件 + `CONTAINER_MAX_OFFSET` 等） | ✅ 已落地（image/notification 用过） |
| `_internal/use-closable.ts`（closable/closeIcon 三级合并 + aria） | ✅ 已落地（Tag 建、notification 复用） |
| `@apollo-design/motion`（CSSMotion / MotionList） | ✅ 已落地 |
| `skeleton`（依赖组件） | ✅ 已收口 |
| **`@rc-component/drawer` 内核**（Drawer 的容器 / mask / push / resizable） | ❌ 需自建（R7：发布包零 `@rc-component/*`） |
| **drawer 的样式层**（antd 侧 357 + motion 80 行） | ❌ 本轮 |
| **drawer 组件本体**（Drawer.tsx / DrawerPanel.tsx） | ❌ 本轮 |

⇒ 本轮 = **rc-drawer 内核（自建）+ 组件壳 + 样式层**，与 image（自建 rc-image 内核）同型。

## 1. 分层（antd 侧）

```
antd drawer/Drawer.tsx       壳：尺寸/推挤/遮罩/zIndex/焦点/语义槽 → 交给 RcDrawer
  └─ @rc-component/drawer    内核：portal 容器 + mask + panel 的进出场 + push 位移
  └─ drawer/DrawerPanel.tsx  面板内容：header（title + extra + close）/ body / footer
  └─ drawer/useFocusable.ts  焦点（`focusable` 配置）
  └─ drawer/style/{index,motion}.ts  样式与动效
```

## 2. API 面（G2 的目标，已确认部分）

### 2.1 `DrawerProps`

`extends Omit<RcDrawerProps, 'maskStyle' | 'destroyOnClose' | 'mask' | 'resizable' | 'classNames' |
'styles' | OmitFocusType> + Omit<DrawerPanelProps, 'prefixCls' | 'ariaId'>`，并新增：

| 字段 | 说明 |
|---|---|
| `size` | `'default' \| 'large' \| number \| string`（`DEFAULT_SIZE = 378`） |
| `resizable` | `boolean \| { onResize?, onResizeStart?, onResizeEnd? }` |
| `open` | 受控开合（v6 用 `open`，不是 `visible`） |
| `afterOpenChange` | 动效结束后回调 |
| `destroyOnClose` | ⚠️ deprecated ⇒ `destroyOnHidden` |
| `destroyOnHidden` | 关闭后卸载 |
| `maskClosable` | ⚠️ deprecated ⇒ `mask.closable` |
| `mask` | `MaskType`（`_util/hooks` 的 `useMergedMask`） |
| `focusable` | `FocusableConfig`（`useFocusable`） |

### 2.2 `DrawerPanelProps`（内容面板）

`prefixCls` / `ariaId` / `title` / `footer` / `extra` / `size` / `closable`
（`boolean \| (ClosableType & { placement?: 'start' | 'end' })`）/ `closeIcon` / `onClose` /
`children` / `classNames` / `styles` / `loading`；**deprecated 4 个**：
`headerStyle`→`styles.header`、`bodyStyle`→`styles.body`、`footerStyle`→`styles.footer`、
`contentWrapperStyle`→`styles.wrapper`。

### 2.3 静态属性

`Drawer._InternalPanelDoNotUseOrYouWillBeFired`（`PurePanel`）。

## 3. 关键常量（已确认）

| 常量 | 值 |
|---|---|
| `DEFAULT_SIZE` | `378` |
| `DEFAULT_PUSH_STATE` | `{ distance: 180 }` |
| `MOTION_CONFIG` | `{ motionAppear: true, motionEnter: true, motionLeave: true, motionDeadline: 500 }` |

## 4. 行为契约（待补读后逐条确认）⏳

1. **placement 四向**：`top` / `right`（默认）/ `bottom` / `left` —— 尺寸轴随方位切换
   （水平方位用 `width`，垂直方位用 `height`）。
2. **push 推挤**：`push` 时把 `#root` 或指定容器推离 `DEFAULT_PUSH_STATE.distance`。
3. **mask**：`mask` 的合并（`useMergedMask`）、`maskClosable` 的 deprecated 面。
4. **zIndex**：`useZIndex('Drawer')` 的层叠体系（与本仓 `portal` 的 `CONTAINER_OFFSET` 同源）。
5. **焦点**：`focusable` 配置 + 打开时把焦点移入面板（`useFocusable`）。
6. **动效**：`motion.ts`（80 行）的四向进出场。
7. **deprecated ×6**：`destroyOnClose` / `maskClosable` / `headerStyle` / `bodyStyle` /
   `footerStyle` / `contentWrapperStyle`。
8. **`loading`**：面板骨架态（依赖 `skeleton`）。
9. **`resizable`**：拖拽改尺寸（v6 新增，`onResizeStart/onResize/onResizeEnd`）。
10. **watermark context**（`usePanelRef`）：面板根注册给水印 —— 本仓 watermark 已收口，需确认接口。

## 5. Token / 样式 ⏳

registry 数据：**4 个** Component Token（具体名与默认值待读 `style/index.ts` 确认）。
样式：`style/index.ts` 357 行 + `style/motion.ts` 80 行（四向动效）。

## 6. 依赖缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | **`@rc-component/drawer` 内核自建** | portal 容器 + mask + push + resizable + 四向动效；本仓有 `portal` 与 `motion` 可复用 |
| P2 | `_util/hooks` 的 `useMergedMask` / `useZIndex` / `ContextIsolator` | 需按本仓既有实现（notification 的 zIndex 同源）对齐 |
| P3 | `skeleton` 的 `loading` 面板 | 已收口，直接用 |
| P4 | watermark 的 `usePanelRef` | 需确认本仓 watermark 的注册接口 |
| P5 | 函数式语义槽 / ConfigProvider 组件级覆盖 | D36 / staged（同 image/message/notification） |

## 7. 实现顺序

1. **补读**：`Drawer.tsx` 余下部分 + `DrawerPanel.tsx` 全文 + `style/{index,motion}.ts` +
   `@rc-component/drawer` 的 es（内核规模先量一下）
2. `interface.ts`（G2）
3. **rc-drawer 内核的 Vue 自建**（P1）→ `drawer/engine/`
4. `style/token.ts` + `style/index.ts`（G3/G4，机械转换自 antd 产物）
5. `DrawerPanel.ts` + `Drawer.ts`（本体）
6. demo → 五层测试 → L6 → 文档 → registry → 收口

## 8. 风险预登记

- **动效**：`MOTION_CONFIG` 的 `motionDeadline: 500` + 四向进出场 —— L6 必须走**受控 open 静态帧**
  （与 tooltip/popover/image 同模式，`STABILIZE_CSS` 会剥动画）。
- **push**：会改动容器（`#root`）的 `transform` —— 视觉用例要避免污染页面其他部分。
- **`resizable`**：拖拽属 L2，jsdom 里只能测事件链；几何由 L6 兜。
- **mask 的合并语义**（`useMergedMask`）容易与 `maskClosable` 的 deprecated 面搞混。
- **focusTrap**：`focusable` 的完整实现依赖 `@apollo-design/a11y`（已就绪）。
