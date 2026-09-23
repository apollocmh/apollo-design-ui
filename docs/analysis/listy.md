# Listy（轻量列表）· G1–G3 分析产物

> 步骤 3 的产物先于步骤 5 存在（AGENTS.md §2）。
> 事实来源（§5 优先级第 4 层）：
> - antd 6.6.4 薄壳：`/tmp/antd-src/package/es/listy/`（index 87 行 + style 73 行）
> - 引擎判据：`@rc-component/listy@1.2.3`（本地 node_modules，es/ 600 行）——H5 禁用 rc，
>   按 carousel-engine 同判**自建引擎**（`packages/ui/src/listy/engine/`，registry
>   dependencies.json 已登记 strategy=in-ui / target=packages/ui/src/listy/engine/）
> - 虚拟滚动复用 foundation：`@apollo-design/virtual-list@completed`（契约
>   docs/foundation/virtual-list-contract.md；§5.1 已登记「原生滚动、无自绘滚动条」差异）

---

## 1. 组件一句话

**antd v6 新增**的轻量列表：数据驱动渲染 + 可选分组（section/sticky）+ 可选虚拟滚动 +
`scrollTo` 命令式定位。`rowKey` 与 `itemRender` **必填**。

## 2. 架构（三层）

```
antd Listy（薄壳 87 行）
  └─ rc-listy List（List.js 32 行）── virtual 分流
       ├─ RawList（真实滚动，默认路径）      ← antd 默认 virtual=false
       └─ VirtualList（rc-virtual-list 包装）← 复用 @apollo-design/virtual-list
```

- **antd 的 virtual 语义**：`virtual ?? contextVirtual ?? false`（ConfigContext 的
  `virtual`）⇒ **默认走 RawList**；rc 层默认 true 被 antd 覆盖。
- **itemHeight 由 antd 计算后下传**：`fontHeight + (itemPaddingBlock ?? paddingSM) * 2`
  ——这是**虚拟模式的估算行高**，Raw 模式不消费它。

## 3. Props 契约（rc List.d.ts + antd 覆盖）

| Prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| items | `T[]` | `[]` | 数据（undefined ⇒ 空数组） |
| rowKey | `keyof T \| ((item)=>Key)` | **必填** | 项键 |
| itemRender | `(item, index)=>VNodeChild` | **必填** | 项内容 |
| group | `{ key(item)=>K; title(groupKey, items)=>VNodeChild }` | — | 分组；**不要求同 key 连续**（useGroupSegments 按 key 聚合、保持首次出现顺序） |
| sticky | `boolean` | — | 分组头吸顶（Raw=CSS sticky；Virtual=Portal 定位克隆头） |
| virtual | `boolean` | antd 默认 `false` | 虚拟滚动 |
| height | `number` | — | 容器高（Raw ⇒ maxHeight+overflowY:auto；Virtual ⇒ 必需才启用虚拟） |
| itemHeight | — | antd 内部计算 | **antd 已 Omit**，不许用户传 |
| direction | `'ltr'\|'rtl'` | — | 由 ConfigProvider 注入 |
| classNames/styles | `{ root, item, groupHeader }` | — | 三语义槽（antd 经 useMergeSemantic 合并 context + useSemanticRootStyle） |
| onScroll | `(e)=>void` | — | 原生滚动事件透传 |

## 4. DOM 契约（rc 源码逐条）

### 4.1 RawList（默认路径，L4 oracle 覆盖面）

```
div.{prefixCls}[dir]                      style: maxHeight/overflowY/overflowAnchor:none
 ├─ (无分组) div.{prefixCls}-item[data-key="item:{k}"]     ← itemRender 内容
 └─ (有分组) div.{prefixCls}-group-section[data-key="group:{k}"]
      ├─ div.{prefixCls}-group-header[-sticky]             ← group.title(groupKey, items)
      └─ div.{prefixCls}-item[data-key="item:{k}"] × n
```

- `data-key` 是 **type-tagged**（`item:x` / `group:x`，util.toTaggedKey）——项键与组键
  永不冲突，`scrollTo` 用 `[data-key="…"]` + `CSS.escape` 查找。
- RTL ⇒ 根加 `{prefixCls}-rtl`，`dir="rtl"`。
- item 的 class：`{prefixCls}-item` + `classNames.item`；style：`styles.item`。
- header 的 class：`{prefixCls}-group-header` + `[-sticky: sticky&&group]` +
  `[-fixed: 仅虚拟吸顶克隆头]` + `classNames.groupHeader`。

### 4.2 RawList 的 scrollTo（useRawListScroll）

- `scrollTo(number)` ⇒ `holder.scrollTop = n`；`null/undefined` ⇒ no-op。
- `{key|groupKey, align='auto', offset=0}` ⇒ 找 `[data-key]`，用 **scrollMarginTop/Bottom
  临时占位** + `scrollIntoView({block})`：
  - `align==='auto'` ⇒ block:'nearest'；`'bottom'` ⇒ 'end'；否则 'start'。
  - **sticky 头偏移**：`isItem && align!=='bottom'` 时量当前 section 的 sticky header
    高度（`closest('.{prefix}-group-section')` → querySelector header → rect.height），
    加进 scrollMarginTop，防止目标项被吸顶头遮住。滚动后**恢复**原 scrollMargin。
- `{left?, top?}` ⇒ 直接赋 `scrollLeft/scrollTop`。
- ref：`{ scrollTo }`（ListyRef）。

### 4.3 VirtualList（虚拟路径，行为测试覆盖）

- 行扁平化（useFlattenRows）：无分组 ⇒ 纯 item 行；有分组 ⇒ 组头行 + 项行（按组首次
  出现顺序），行键 = taggedKey。
- `RcVirtualList` 接参：`data=rows, itemKey='taggedKey', fullHeight=false, virtual=true,
  extraRender=吸顶`。
- **本仓映射**：`@apollo-design/virtual-list` 的 `VirtualList` 组件——
  - 渲染走 default slot（`{ item, index }`），行根元素即测量目标；
  - **吸顶走 `extra` 槽**（filler 内层尾部渲染，入参 `ExtraRenderInfo` 含
    `getSize/scrollTop/virtual`）——rc 用 Portal 挂到 holder，我们把克隆头渲染在
    Filler 内层，用 **inner 坐标** `top = scrollTop + push`（inner 有
    `translateY(-scrollTop)`，视觉等价于 rc 的 holder 坐标 `top=push`）；
    `-group-header-fixed`（absolute/top/insetInline/pointerEvents:auto）+ 外包
    `-group-header-holder`（absolute inset0 overflow hidden pointerEvents none）。
  - `scrollTo`：`{groupKey}` ⇒ `{key: tagged}`；`{key}` 且 sticky&&group&&align!=='bottom'
    ⇒ offset 函数式（`resolveScrollOffset` 支持 `(info)=>number`）：
    `baseOffset + max(0, getSize(tagged组键).bottom - .top)`（align==='top' 才加；
    rc 对 headerHeight 非有限值回退 0）。`align:'auto'` ⇒ 传 undefined（virtual-list
    的「缺省 align = 视口外才决定方向」即 rc 'auto' 语义）。
- ⚠️ 虚拟模式的 DOM 与 rc-virtual-list **不同**（foundation §5.1：原生滚动、无自绘
  滚动条）——已属 foundation 级 PLATFORM 登记，L4 oracle 只覆盖 Raw 路径。

## 5. 样式契约（antd style/index.js 73 行，2 个 Component Token）

| Token | 默认（prepareComponentToken） | 落地形态 |
|---|---|---|
| itemPaddingBlock | `paddingSM` | `var(--apollo-padding-sm)` |
| itemPaddingInline | `padding` | `var(--apollo-padding)` |

样式段（`{componentCls}` = `.{prefixCls}`，即 `.apollo-listy`）：

- 根：`resetComponent` + `position:relative; color:colorText; fontSize; lineHeight`。
- `-item`：`padding: (itemPaddingBlock) (itemPaddingInline)`；
  `borderBottom: (lineWidth)(lineType)(colorSplit)`；
  `transition: background-color (motionDurationMid)(motionEaseInOut)`；hover ⇒
  `controlItemBgHover`。
- `-group-header`：`boxSizing:border-box`；`padding: (paddingXS) (itemPaddingInline)`；
  `color:colorTextDescription; fontWeight:fontWeightStrong; backgroundColor:colorBgContainer`；
  `backgroundImage: linear-gradient(colorFillAlter, colorFillAlter)`；
  - `-sticky`：`position:sticky; top:0; insetInline:0; zIndex:1`
  - `-fixed`：`position:absolute; top:0; insetInline:0; transform:translateY(0);
    pointerEvents:auto`
  - `-holder`：`position:absolute; inset:0; overflow:hidden; pointerEvents:none`
- `-group-section`：`position:relative`。
- `-scrollbar`：`zIndex:1; cursor:pointer`；hover ⇒ `colorFillQuaternary`（本包无自绘
  滚动条，段保留不消费？——⚠️ 判据：该选择器挂在 componentCls 下，rc-virtual-list 的
  ScrollBar 类名才匹配；本仓原生滚动 ⇒ 无节点命中，**照搬规则无害**，保留以对齐产物）。
- `&-rtl`：`direction:rtl`。

## 6. Vue API 设计（INTENDED 差异登记点）

| # | 差异 | 分类 |
|---|---|---|
| I1 | `itemRender` ⇒ **default slot**（作用域 `{ item, index }`），同时保留 `itemRender` prop（函数式用法） | INTENDED（C 系列惯例） |
| I2 | `group.title` 保持函数 prop（它带参数，无法变插槽）；`group.key` 同 | — |
| I3 | `ref` ⇒ `expose({ scrollTo })`（`ListyRef`） | INTENDED |
| I4 | 虚拟模式 DOM 与 rc-virtual-list 不同（原生滚动） | PLATFORM（foundation §5.1 已登记） |
| I5 | 语义槽 `classNames/styles`：三槽 + 函数式，走 use-merge-semantic（context 合并 + rootStyle） | — |

## 7. 裁决记录

无 registry 开放决策挂在本组件。**虚拟模式不做裁剪**：它是 v6 新组件的核心价值
（registry 引擎登记 capability 即「滚动与项渲染」），且 foundation 的 VirtualList
（completed）已覆盖全部底层能力（extra 槽/getSize/函数式 offset），成本可控——
与 carousel「embla 不可用必须自建」不同，这里**没有**需要用户裁决的分叉。
