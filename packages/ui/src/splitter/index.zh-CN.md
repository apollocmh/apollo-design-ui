---
category: 布局
title: Splitter
subtitle: 分割面板
---

可拖拽调整大小的面板分割容器。

## 何时使用

- 两侧/多栏布局需要用户手动调整占比（如 IDE 面板、详情页分栏）。
- 需要面板折叠/展开与尺寸约束（min/max）。

## 代码演示

见 [`demo/`](./demo)（10 个：basic / vertical / collapsible / multiple）。

## API

### Splitter

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| orientation | 分割方向 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | 等价 `orientation="vertical"` | `boolean` | — |
| layout | ⚠️ 已废弃：用 `orientation` | `'horizontal' \| 'vertical'` | — |
| collapsible | 折叠全局配置 `{ motion?: boolean; icon?: { start?, end? } }`（motion 开启折叠过渡动画） | — | — |
| collapsibleIcon | ⚠️ 已废弃：用 `collapsible.icon` | — | — |
| lazy | 拖拽时只移动预览线，松手才提交尺寸 | `boolean` | — |
| destroyOnHidden | 面板折叠后销毁内容（Panel 可覆盖） | `boolean` | — |
| classNames / styles | 当前对象或 `({ props: SplitterProps }) => 对象`；区域 `{ root, panel, dragger }`（dragger 类名支持 string 或 `{ default, active }`，样式支持 `{ default, active }`） | — | — |

### 事件

| 事件 | 说明 | 回调参数 |
|---|---|---|
| resizeStart | 拖拽开始 | `(sizes: number[])` |
| resize | 拖拽中 / 折叠后 | `(sizes: number[])` |
| resizeEnd | 拖拽结束 | `(sizes: number[])` |
| collapse | 折叠状态变化 | `(collapsed: boolean[], sizes: number[])` |
| draggerDoubleClick | 双击把手 | `(index: number)` |

事件由组件独占声明，`@resize-start` / `@resize-end` / `@dragger-double-click` 是模板的自然写法，`h()` 使用 `onResizeStart` / `onResizeEnd` / `onDraggerDoubleClick`。不再把通知声明为回调 prop，也不双发。`lazy` 在松手时各提交一次 `resize` 和 `resizeEnd`；取消拖拽不提交尚未接受的预览。

### 插槽

| 名称 | 说明 |
|---|---|
| default | 面板内容（`<Splitter.Panel>` 列表） |
| draggerIcon | 自定义拖拽手柄图标（替换默认 spinner；原 `draggerIcon` prop，已改为 slot） |

### Splitter.Panel

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| size | 受控尺寸（number px 或 `'50%'`） | `number \| string` | — |
| defaultSize | 非受控初始尺寸 | `number \| string` | — |
| min / max | 最小/最大尺寸（受控需配 `resize` 事件） | `number \| string` | — |
| collapsible | `boolean` 或 `{ start?, end?, showCollapsibleIcon? }`（图标显隐：`true`/`false`/`'auto'` 悬浮显隐） | — | — |
| resizable | 是否可拖拽调整 | `boolean` | `true` |
| destroyOnHidden | 折叠后销毁内容 | `boolean` | — |

### 状态、原生属性与引用

`size` 是受控提议：父级在 `resize` 中赋回新值才接受变化；拒绝提议后布局保持，撤回所有 `size` 从最后接受的尺寸继续。部分面板使用 `size` 时，其余尺寸由既有算法分配。`defaultSize` 只在该面板建立时生效；动态列表应给 Panel 稳定的业务 `key`，尺寸、折叠记忆与编辑器身份随 key 保留，移除面板会释放对应状态。

Splitter 根和 Panel 根分别接收各自的原生 `class` / `style`、`data-*`、ARIA 与原生监听器，支持 Vue 样式字符串/数组。已有 Panel `className` 别名和内部 `classNames` / `styles` 保留。Panel 的默认槽完整渲染文本、0、数组和条件内容；折叠默认保留内容，`destroyOnHidden` 才销毁内容，Panel 可覆盖容器设置。

Splitter 与实际 Panel 的 ref 均为 `{ nativeElement: HTMLDivElement | null }`，卸载后为 null。独立导出的 `SplitterPanel` 与复合 `Splitter.Panel` 是同一面板能力，应置于 Splitter 内。

### 键盘与资源

可调整 separator 通过 Tab 聚焦，沿当前布局轴的方向键调整 10px，Shift 加速为 50px；Home / End 到当前 min / max 边界，水平 RTL 镜像方向。禁用 separator 不进入 Tab 顺序。折叠按钮支持 Enter / Space；尺寸边界继续采用现有归一化和 ARIA 算法。拖拽中更改方向、lazy、禁用状态或面板 key 顺序会取消未提交的预览并释放窗口监听，卸载同时释放 ResizeObserver。动画仅为 CSS 过渡，遵循 reduced-motion。

## Theme（Component Token）

4 个（CSS 变量 `--apollo-splitter-*`）：`splitBarSize`(2px 把手宽) /
`splitTriggerSize`(6px 热区) / `resizeSpinnerSize`(20px) /
`splitBarDraggableSize`(20px)。

通过 `ConfigProvider :theme="{ components: { Splitter: { splitBarSize: 4, splitTriggerSize: 12, resizeSpinnerSize: 28 } } }"` 配置当前实例；替换、撤回和嵌套主题即时生效。未显式设置 `splitBarDraggableSize` 时继承 `resizeSpinnerSize`。原生 style 的显式 CSS 变量覆盖最后生效。前缀 DOM 响应更新，任意自定义前缀仍需预先提供对应静态 CSS。

## FAQ

**SSR / 首帧的面板尺寸是多少？**

容器未测量时使用开发者配置的原值（未配置 ⇒ `flex-basis: auto` 均分）；测量后由
归一化算法接管（`autoPtgSizes`：均分 / 缩放 / 贪婪填充，受 min/max 约束）。

**为什么 aria-valuenow 在 SSR 是 50？**

未测量时容器尺寸为 0，百分比归一化仍然成立（50/50）。
