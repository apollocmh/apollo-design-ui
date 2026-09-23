# Descriptions（描述列表）分析 — antd 6.6.4

> 依据：`/tmp/antd-src/package/es/descriptions/`（index 141 + Row 143 + Cell 87 +
> hooks 93 + style 205 行）+ SSR 探针实测（本文 §3 全部为
> react-dom/server.renderToStaticMarkup 真实输出摘录）。分析日期：2026-09-23。

## 1. 组件事实（registry 口径）

- antd 运行时依赖：`@rc-component/util`（toArray / isNumber / isReactRenderable → utils）。
- 本仓依赖组件：无（dagLevel=0）；foundation：theme、utils；**可复用本仓基建**：
  `useBreakpoint`（grid/hooks）+ `matchScreen` / `responsiveArray`（_internal/responsive-observer）+
  `mergeClassNames/mergeStyles/resolveSemantic/styleAttrs`（_internal/use-merge-semantic）。
- 规模：18 文件 / 694 行；Token：**10 个** Component Token。

## 2. API 全量

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| bordered | `boolean` | `false` | 边框形态（th/td 分格） |
| size | `'large' \| 'medium' \| 'small'` + deprecated `'default'` | — | 类名只对 medium/middle→`-medium`、small→`-small`；large/default 无类；`size="default"` 发 deprecated（提示改 `large`） |
| column | `number \| Partial<Record<Breakpoint, number>>` | DEFAULT_COLUMN_MAP（xxxl:4, xxl/xl/lg/md:3, sm:2, xs:1） | 响应式：`matchScreen(screens, column) ?? matchScreen(screens, DEFAULT_COLUMN_MAP) ?? 3`（用户 map 优先，无激活断点才落默认 map） |
| layout | `'horizontal' \| 'vertical'` | `'horizontal'` | vertical：label 行 + content 行分开渲染 |
| colon | `boolean` | `true` | label 冒号（CSS `::after` content":"）；false → span 加 `-no-colon` |
| title / extra | `VNodeChild` | — | 仅当 `title \|\| extra` 时渲染 `-header` 块 |
| items | `DescriptionsItemType[]` | — | **首选** API |
| children | deprecated | — | 旧形态：`Descriptions.Item` 子节点转 items（`transChildren2Items`：读 node.props + key） |
| labelStyle / contentStyle | deprecated → `styles.label` / `styles.content` | — | 合并顺序：`labelStyle → styles.label(根) → item.labelStyle → item.styles.label` |
| classNames / styles | 语义化（含函数式，`GenerateSemantic`） | — | 槽位：`root / header / title / extra / label / content` |
| prefixCls / rootClassName / className / style / id… | 常规；**restProps 全部落根 div** | — | |

**DescriptionsItemType**：`{ key?, label?, children?, span?: number \| 'filled' \| Partial<Record<Breakpoint,number>>, prefixCls?, className?, style?, labelStyle?, contentStyle?, styles?, classNames? }`。
`span:'filled'` → `filled:true`（独占逻辑行、删 span，行尾补齐公式管它的 colSpan）；数字/响应式对象。

**Ref**：`{ nativeElement: HTMLDivElement }`。

### 2.1 行切分算法（useRow / getCalcRows，机械判据）

- `count += item.span || 1`；`count >= column` 时收行；`count > column` 时 `exceed=true` 并把当前 item 的 span 压成 `restSpan = column - (count - span)`（dev 告警「Sum of column span …」）。
- `filled` item：删 span 推入当前行后**立即收行**。
- 行尾补齐：行内 span 总和 `< column` 时，**最后一个 item** 的 span 扩成 `column - (sum - lastSpan)`。
- 实测：items 4 条 / column 3 ⇒ 行 1 三格（1/1/1）、行 2 单格 colSpan=3；span:'filled' 的例子 ⇒ L1 colSpan=1 + L2 colSpan=2（补齐公式落在 filled item 上）。

## 3. DOM 契约（SSR 实测）

### 3.1 horizontal 非 bordered（默认）

```html
<div class="apollo-descriptions">
  [div.apollo-descriptions-header > div.apollo-descriptions-title + div.apollo-descriptions-extra]（仅 title||extra）
  <div class="apollo-descriptions-view"><table><tbody>
    <tr class="apollo-descriptions-row">
      <td class="apollo-descriptions-item" colSpan="N">
        <div class="apollo-descriptions-item-container">
          <span class="apollo-descriptions-item-label">…</span>
          <span class="apollo-descriptions-item-content">…</span>
        </div>
      </td>…
```

- label/content **同一个 td**；`-no-colon` 类加在 label span 上。
- 补齐：行尾单条 `colSpan="3"`。

### 3.2 bordered

```html
<tr class="apollo-descriptions-row">
  <th colSpan="1" class="apollo-descriptions-item-label"><span>Product</span></th>
  <td colSpan="1" class="apollo-descriptions-item-content"><span>Cloud Database</span></td>…
  <th colSpan="1" class="apollo-descriptions-item-label"><span>Amount</span></th>
  <td colSpan="5" class="apollo-descriptions-item-content"><span>$80.00</span></td>
</tr>
```

- label=`th.{p}-item-label[colSpan=1]`、content=`td.{p}-item-content[colSpan=span*2-1]`；**无 container div**，内容直接 `<span>`。
- labelStyle/contentStyle/styles.label/styles.content 落在 **cell** 上（`{...style, ...typeStyle}`）；语义 classNames.label/content 也落 cell 类。
- ⚠️ bordered 的 colSpan 语义：`span*2-1`（每 item 占 2*span-1 列，label 单独 1 列）。

### 3.3 vertical（非 bordered）

```html
<tr class="apollo-descriptions-row"><th class="apollo-descriptions-item" colSpan="1"><div class="…-item-container"><span class="…-item-label">Product</span></div></th>…</tr>
<tr class="apollo-descriptions-row"><td class="apollo-descriptions-item" colSpan="1"><div class="…-item-container"><span class="…-item-content">Cloud Database</span></div></td>…</tr>
```

- label 行 / content 行分开；cell 是 `th/td.{p}-item`（**类是 item，不是 item-label**），container 里 span 才带 item-label/item-content；colSpan=span（label 行与 content 行相同）。
- vertical + bordered：走 bordered 结构（th.item-label / td.item-content），component 为 'th'/'td'。

### 3.4 其余判据

- 语义化：非 bordered 时 classNames.label/content + styles.label/content 落 **span**；bordered 落 **cell**（3.2）。root/header/title/extra 落对应块（style 直接是元素 style：root 的 style 就是 mergedStyles.root —— ⚠️ 用户 style 也走语义槽 root 合并，不是单独拼）。
- colSpan 的 React 属性是 `colSpan`；`-rtl` 类由 ConfigProvider direction 决定。
- deprecated 告警三条：`size="default"`→large、`labelStyle`→styles.label、`contentStyle`→styles.content。

## 4. Token（10 个 Component Token，`prepareComponentToken`）

| Token | 计算 | 默认值 |
|---|---|---|
| labelBg | `colorFillAlter` | var |
| labelColor | `colorTextTertiary` | var |
| titleColor | `colorText` | var |
| titleMarginBottom | `fontSizeSM * lineHeightSM` | 14*1.5714… = 22（JS 恰好整） |
| itemPaddingBottom | `padding` | 16 |
| itemPaddingEnd | `padding` | 16 |
| colonMarginRight | `marginXS` | 8 |
| colonMarginLeft | `marginXXS / 2` | 2 |
| contentColor | `colorText` | var |
| extraColor | `colorText` | var |

- ⚠️ **判据修正（G4 实测）**：bordered 的 label 文字色，antd 实际渲染产物是 `colorTextSecondary`（rgba(0,0,0,0.65)），不是缓存 es 源码写的 `labelColor`（=colorTextTertiary 0.45）—— 以产物为准（主段 `-item-label` 的 color 才是 labelColor）。顺带核对了 tarball 版本与安装版本一致，属上游源码与产物漂移，登记 COMPATIBILITY。

样式要点：`-header` flex + `titleMarginBottom`；title `textEllipsis` + fontSizeLG/lineHeightLG/fontWeightStrong；`-view` width:100% + table `minWidth:100%; tableLayout:fixed; borderCollapse:collapse`（⚠️ bordered 的 `> table` 覆盖为 `tableLayout:'auto'`）；label `::after` 冒号（`top:-0.5` 魔数）；`-item-container` flex + label/content `inline-flex baseline`；bordered 圆角 `borderRadiusLG`（首行首格 borderStartStartRadius、末行首格 borderEndStartRadius）+ labelBg 背景 + 分隔线 `lineWidth/lineType/colorSplit`；尺寸 padding 三档（默认 padding/paddingLG、medium paddingSM/paddingLG、small paddingXS/padding —— bordered 内，非 bordered 纵向只改 paddingBottom：默认 padding、medium paddingSM、small paddingXS）。

## 5. Vue API 设计（INTENDED 摘要）

- 复合组件：`Descriptions.Item`（Vue：`DescriptionsItem` 组件，渲染即透传 slot；children 形态由 `collectChildren` 读 vnode.props 转 items）。
- `column` 响应式复用 `useBreakpoint()` + `matchScreen`；`span` 响应式对象同理（useItems）。
- 语义化 classNames/styles（含函数式）走本仓 `use-merge-semantic`（switch 范式）；`empty-semantic-fn` 决策不阻塞（基建已支持函数式）。
- deprecation 告警三条照发（dev-warning 层）。
