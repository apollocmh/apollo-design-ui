---
category: 数据展示
title: Listy
subtitle: 轻量列表
---

数据驱动的轻量列表，支持按键聚合分组、原生吸顶和虚拟滚动。项内容可以包含原生交互元素。

## 代码演示

见 [`demo/`](./demo) 的 8 个示例。

## API

`T` 为真实数据类型，可以是普通接口或原始值；`K extends string | number` 为组键类型。

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| items | 数据；未传时为空列表 | `T[]` | `[]` |
| rowKey | 稳定键字段或取键算法；字段值必须完整满足 `string \| number`，支持数字和 Symbol 字段名 | `ListyRowKey<T>` | 必填 |
| group | 按键聚合；同组数据无需连续，组按首次出现顺序展示 | `{ key: (item: T) => K }` | — |
| sticky | 组头吸顶；Raw 使用唯一原生组头，Virtual 使用固定组头 | `boolean` | — |
| virtual | 是否虚拟滚动；未传时继承当前 ConfigProvider.virtual | `boolean` | `false` |
| height | Raw 的 maxHeight；Virtual 的视口高度 | `number` | — |
| prefixCls | 组件类名前缀 | `string` | 当前 ConfigProvider 前缀 |
| classNames | 语义类名 | `Partial<Record<'root' \| 'item' \| 'groupHeader', string>>` | — |
| styles | 语义样式，使用 Vue `CSSProperties` | `ListyStyles` | — |

文字方向来自当前 ConfigProvider.direction。`class`、`style`、`data-*` 落到外层根元素，`style` 支持 Vue 原生字符串、对象和数组合并。`id`、`tabindex`、`role`、`aria-*`、键盘和焦点监听落到实际滚动容器：Raw 为根元素，Virtual 为 holder。控件身份与 ARIA 目标保持一致，不在外壳重复设置；视口高度由 `height` 控制。

### 插槽

| 名称 | 对象作用域 | 说明 |
|---|---|---|
| default | `{ item: T, index: number }` | 项内容；index 始终为原始 items 下标 |
| groupHeader | `{ groupKey: K, items: T[], sticky: boolean, fixed: boolean }` | 全组共享模板；未提供时显示组键，包含 `0` 和空字符串 |

槽支持 `0`、空内容、多根数组和条件切换。Raw 的唯一组头在开启吸顶时 `sticky=true, fixed=false`；Virtual 普通组头为 `false,false`，固定副本为 `false,true`。相同项键在 Raw 的替换、排序与跨组移动中保留真实节点、编辑状态和焦点；Virtual 在项持续位于已挂载窗口内时同样复用，离开窗口的项正常卸载。

### 事件

| 名称 | 参数 | 说明 |
|---|---|---|
| scroll | `(event: Event)` | 真实滚动容器的原生事件，每次通知一次；`event.target` 是实际 holder |

组件不构造合成事件，也不接管方向键、IME 或用户 `preventDefault`；原生滚动键和槽内控件保留浏览器行为。

### Ref

`ListyRef<K>` 只公开 `scrollTo(config?: ListyScrollToConfig<K>): void`。

- `number`：设置本列表的 scrollTop。
- `{ key, align?, offset? }`：定位项键。`align` 为 `'top' | 'bottom' | 'auto'`，默认 `'auto'`；顶部定位会为当前吸顶组头让位。
- `{ groupKey: K, align?, offset? }`：定位组头。
- `{ left?, top? }`：本列表的绝对滚动坐标。
- `null` / `undefined`：不指定新目标。

Raw 只修改自己的 holder，不调用会滚动外层页面的 `scrollIntoView`。Virtual 使用已有虚拟列表的测量和滚动迭代。数据键 `1` 与 `'1'`、项键与组键分别编码；`data-key` 为内部定位标识，不应自行解析。

## 主题

当前 Provider 的 Listy 配置与两个 Component Token 都响应式消费：`itemPaddingBlock`（默认 `paddingSM`）与 `itemPaddingInline`（默认 `padding`），接受数字或 CSS 长度字符串。组件覆盖可动态撤回。

Virtual 的初始估算为当前 `fontHeight + itemPaddingBlock * 2`；数字与 px 长度直接参与估算，其他 CSS 单位先采用当前 paddingSM，实际尺寸由已有 VirtualList 测量修正。未新增虚拟列表缓存或测量机制。

## 迁移

`itemRender(item,index)` 改为 `#default="{ item, index }"`；`group.title(groupKey,items)` 改为 `#groupHeader="{ groupKey, items }"`。`group.key` 继续承担数据分组职责。旧模板函数入口已移除。
