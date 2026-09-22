# Tag · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-src/package/es/tag/`（index.js + CheckableTag +
> CheckableTagGroup + hooks/useColor + style/{index,presetCmp,statusCmp}）+
> `_util/hooks/useClosable`。Component Token **3 个**（defaultBg/defaultColor/
> solidTextColor）。**先于实现存在**。

## 1. 组件面（三个导出）

`Tag`（含 `Tag.CheckableTag` / `Tag.CheckableTagGroup` 静态属性）。

### Tag

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| color | `LiteralUnion<PresetColor \| PresetStatusColor>` | — | 预设色走类名；其它走内联动态色 |
| variant | `'filled' \| 'solid' \| 'outlined'` | context/filled | inverse color → solid；bordered=false → filled |
| bordered | `boolean` | — | **@deprecated** → variant="filled" |
| closable / closeIcon | `ClosableType` / VNode | — | useClosable 合并（props > context > fallback CloseOutlined） |
| onClose | `(e) => void` | — | e.defaultPrevented 阻止关闭；href 时 preventDefault |
| icon | VNode | — | 有 icon 时 children 包进 span（content 槽） |
| href / target | — | — | href → 渲染 `<a>`；disabled 时 href 置 undefined + aria-disabled |
| disabled | boolean | DisabledContext | — |

### CheckableTag

`role="checkbox" aria-checked` + 空格键触发 onChange（Enter 不触发 —— antd 逐字）；
类 `tag-checkable(-checked/-disabled)`；icon + span(children)。

### CheckableTagGroup

`options`（原始值数组或 {value,label,className,style}）、受控/非受控 value、
multiple（数组）/单选（null 语义）；div `-checkable-group`（flex wrap gap）+
item `-checkable-group-item`；pickAttrs aria/data；nativeElement。

## 2. 行为契约（逐条）

1. **useColor 判据链**：inverse color（`-inverse` 后缀）→ variant=solid 且去后缀；
   `nextColor===undefined && variant==='solid'` → color='default'；
   非预设非状态且 nextColor 存在 → **动态色内联**：solid → backgroundColor=color；
   否则 hsl.l=0.95 的浅底 + color 文字 + outlined 时 borderColor=color。
2. **closable 关闭**：triggerClose —— disabled 直接 return；stopPropagation；
   onClose；defaultPrevented 中止；href 时 preventDefault；最后 setVisible(false)
   （DOM 保留，`-hidden` 类显示，不卸载）。
3. **close-icon DOM**：`role="button"` + `tabIndex=disabled?-1:0` + aria-disabled +
   onKeyDown（Enter/空格 → click，!e.repeat）；fallback 图标 CloseOutlined
   （locale closeLabel="Close" 作 aria-label）。
4. **icon 存在时**：children 包进 `<span class="content 槽">`（antd 的
   `isReactRenderable(children)` 守卫）。
5. **tagStyle 合并顺序**：disabled → 只 mergedStyles.root；否则
   `{...customTagStyle(动态色), ...mergedStyles.root}`（语义槽位覆盖动态色）。
6. **wave**：`isFunction(onClick) || children?.type === 'a'` 时包 Wave ——
   **我们不实现 Wave**（运行时点击波纹，无静态 DOM/SSR 差异，登记缺口）。
7. **CheckableTag 键盘**：Space 触发 onChange；Enter 不触发（antd 逐字）。
8. **Group 值语义**：multiple → 数组增删；单选 → 值或 null。

## 3. 样式契约（extract 产物逐条，全 var()）

- 根：inline-block / paddingInline=calc(8px - lineWidth) / fontSize=fontSizeSM /
  lineHeight=calc(lineHeightSM × fontSizeSM) / nowrap / defaultBg /
  border lineWidth solid colorBorder / radius=borderRadiusSM / relative
- `-close-icon`：marginInlineStart=calc(paddingXXS - lineWidth)；
  fontSize=calc(fontSizeIcon - lineWidth*2)；color=colorIcon；hover→heading
- checkable 族（未选 hover → primary on fillSecondary；checked → primary；
  active → primaryActive；disabled 全套 6 条）
- `-checkable-group`：flex wrap gap=paddingXS
- `-hidden`：display:none
- `> svg` 居中修正（inline-block/vertical-align:middle/margin-block-end:0.2em）
- 图标与文字间距：`> .anticon+span, > span+.anticon, > svg+span, > span+svg`
- `-solid`：border transparent / colorTextLightSolid / colorBgSolid；
  `-solid.-default` → solidTextColor
- `-filled`：border transparent / tagBorderlessBg(=defaultBg)
- `-disabled` 全套（含 a 子元素、close-icon、三 variant 边框）
- **状态四色**（success/processing→Info/error/warning）× 三 variant：Bg/Border/主色
- **预设 13 色** × 三 variant：outlined → {key}-1 底 + {key}-3 边 + {key}-7 字；
  solid → {key}-6 底边 + textLightSolid；filled → {key}-1 底 + {key}-7 字

Component Token（3）：defaultBg=#f5f5f5（seed 实色：colorFillTertiary
onBackground colorBgContainer）、defaultColor=colorText(var)、solidTextColor=#fff
（isBright(colorBgSolid) 判定，seed 实色）。

## 4. Vue 对应（平台差异）

| React | Vue |
|---|---|
| useClosable（React hook） | `_internal/use-closable.ts`（composable，Alert 将来复用） |
| cloneElement(icon) | cloneVNode(icon, { class, style }) |
| Wave 包裹 | 不实现（无静态 DOM 差异，缺口登记） |
| DisabledContext | config-provider 的 disabled context（既有） |
| useControlledState | utils 的 useControlledValue |

## 5. 预判差异

| # | 差异 | 分类 |
|---|---|---|
| D6 | 前缀 apollo-tag（基线侧 ConfigProvider 对齐 iconPrefixCls） | INTENDED |
| D5 | 无 hash；3 个 Component Token 变量声明在根类（badge 范式） | INTENDED |
| — | Wave 点击波纹缺失（无静态 DOM 差异） | 已知缺口 |
| — | close-icon 的 aria-label 用 locale（与 antd 同源） | 平台一致 |

## 6. 本分析没有证明什么

- Wave 运行时效果（不在任何比对面）
- Group 多选键盘导航（antd 亦无专门处理）
