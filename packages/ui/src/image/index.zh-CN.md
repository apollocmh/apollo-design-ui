---
category: 数据展示
title: Image
subtitle: 图片
---

可预览的图片。预览浮层走 portal，支持缩放 / 旋转 / 翻转 / 组内切换。

## 何时使用

- 需要展示图片，并让用户点击查看大图。
- 一组图片需要统一预览、可左右切换（`Image.PreviewGroup`）。
- 图片加载中/失败时需要占位与兜底（`placeholder` / `fallback`）。

## 代码演示

见 [`demo/`](./demo)（18 个原生示例）：basic / component-token /
controlled-preview / cover-placement / fallback / image-render / nested /
placeholder / preview-group / preview-group-top-progress / preview-group-visible /
preview-img-info / preview-mask / preview-src / style-class / transform-events /
popup-provider / preview-close。

## API

### Image · Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 完整根前缀；响应当前prop，移除覆盖后回到当前ConfigProvider命名空间 | `string` | `apollo-image` |
| src | 图片地址 | `string` | — |
| width / height | 宽高。数字会归一化成 `px`（见「设计说明」） | `number \| string` | — |
| alt | 图片替代文本；非空时用作预览触发器及弹层的默认名称。省略时img使用空alt，触发器/弹层保留通用名称 | `string` | `''` |
| fallback | 加载失败时的兜底图 | `string` | — |
| placeholder | 占位内容；`{ progress: true \| { percent, render } }` 时渲染进度层 | `VNodeChild \| { progress }` | — |
| preview | `false` 关闭预览；对象形态见下表 | `boolean \| PreviewConfig` | `true` |
| open | 顶层受控开合，可用 `v-model:open` | `boolean` | — |
| defaultOpen | 非控初值，后续变更不重置状态 | `boolean` | `false` |
| class / style | 根元素原生attrs；style支持Vue字符串/对象/数组，优先于 `styles.root`，不复制到img；图片样式用 `styles.image` | `string \| array \| object` / `StyleValue` | — |
| wrapperStyle | ⚠️ 已废弃，请用 `styles.root` | `CSSProperties` | — |
| classNames / styles | 语义化类名/样式，见「语义化槽位」 | — | — |
| crossOrigin / decoding / loading / referrerPolicy / sizes / srcSet / useMap / draggable | 透传给 `<img>` 的原生属性 | — | — |

进度/纯占位分支的原生attrs落在现有Progress根，合并Image根与placeholder.progress语义，style仍优先。id/data及名称/描述ARIA保持当前值；role、范围和busy状态由进度控制。移除显式aria-label恢复百分比默认名称。根click通知一次且不打开预览，img error不改挂到占位根。详见 [原生样式修正](../../../../docs/migrations/image-native-styles.md)。

### Image · 插槽

| 名称 | 说明 | 参数 |
|---|---|---|
| imageRender | 自定义缩略图区域；空槽抑制默认img | 单对象 `ImageRenderInfo`，见下文 |
| previewImage | 自定义预览大图区域 | 单对象 `PreviewImageInfo` |
| previewActions | 自定义预览工具栏 | 单对象 `PreviewActionsInfo` |
| previewCloseIcon | 自定义关闭图标；空槽也优先，按钮名称独立保留 | 无参数 |

`originNode` 是带原始ref、加载/错误处理、原生属性与样式的真实VNode，建议用 `<component :is="originNode" />` 渲染。`src` 是当前原图的原始src属性（含fallback，缺省undefined）；alt/width/height来自当前props，title来自字符串原生attr，classNames.image是已合并的语义image类名。槽存在则使用其内容（含有意为空），移除恢复默认img；同一结构下的原图和稳定富节点保持身份。Progress/纯占位提前分支不调用此槽。

`ImageSlots` / `ImageRenderInfo` 已从组件和包根导出。顶层函数prop直接移除，无兼容层或弃用期；详见 [迁移记录](../../../../docs/migrations/image-render-slot.md)。预览扩展使用下方独立命名的作用域槽。

### 预览槽作用域

Image与PreviewGroup均支持previewImage/previewActions/previewCloseIcon；Group另支持previewCount。所有槽只在实际预览内容渲染时读取当前函数，空槽抑制默认内容，移除槽恢复默认；闭合/SSR及Progress提前分支不急求值。Group内只有Group负责预览扩展，子Image的imageRender仍只作用于缩略图。

| 类型 | 字段 |
|---|---|
| PreviewImageInfo | originNode（真实img VNode）、src（原始src，含fallback，可能undefined）、alt、transform、current、total |
| PreviewActionsInfo | originNode（默认工具栏VNode）、icons、actions、transform、image（src/alt）、current、total、disabled（zoomIn/zoomOut） |
| PreviewCountInfo | originNode（默认计数VNode）、current、total；仅Group |

current为零基索引，与Group模型相同，显示序号时加1；单图current=0/total=1。transform为当前六字段快照。actions提供flipX/flipY/rotateLeft/rotateRight/zoomIn/zoomOut/reset/close零参回调，与默认控件共用变换与关闭请求；disabled给出当前缩放按钮状态。输入、textarea、select和contenteditable内的方向键保留编辑行为，Esc仍可请求关闭，子控件preventDefault优先。

上述类型、PreviewActions与PreviewGroupSlots均由根入口导出。通过 `<component :is="info.originNode" />` 保留原图的ref/手势或默认工具栏；迁移旧preview内renderer见 [预览槽迁移](../../../../docs/migrations/image-preview-slots.md)。

### Image · PreviewConfig（`preview` 的对象形态）

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| src | 预览用大图（默认取 `src`） | `string` | — |
| afterOpenChange | 开合动画结束后 | `(open) => void` | — |
| cover | 缩略图封面；`false` 隐藏，null或省略使用默认内容；配置对象可只指定placement | `VNodeChild \| { placement?: 'center' \| 'top' \| 'bottom', coverNode?: VNodeChild }` | — |
| mask | 预览遮罩外观；false隐藏遮罩；对象支持blur/className/style，语义styles.popup.mask优先 | `boolean \| { blur?: boolean, className?: string, style?: Record<string, string \| number> }` | `true` |
| maskClosable | 点遮罩关闭 | `boolean` | `true` |
| closable | 显示关闭按钮 | `boolean` | `true` |
| closeIcon | 自定义关闭图标 | `VNodeChild` | — |
| movable | 可拖拽 | `boolean` | `true` |
| minScale / maxScale / scaleStep | 缩放边界与步长 | `number` | `1` / `50` / `0.5` |
| zIndex | 浮层层级 | `number` | `1080`（`zIndexPopupBase + 80`） |
| getContainer | 当前浮层挂载容器；未指定时使用ConfigProvider.getPopupContainer，再回到body | `() => HTMLElement` | `document.body` |
| icons | 图标槽（rotateLeft/rotateRight/zoomIn/zoomOut/close/left/right/flipX/flipY） | `PreviewIcons` | 内置图标 |
| rootClassName | 浮层根附加类；语义入口为classNames.popup.root | `string` | — |
| maskClassName | 浮层遮罩附加类；语义入口为classNames.popup.mask | `string` | — |

关闭图标优先级为当前 `#previewCloseIcon` → 显式 `preview.closeIcon`（含 null/false/0）→ `preview.icons.close` → 默认图标。`closable=false` 只隐藏关闭按钮且不求值图标槽；Esc、maskClosable 与工具栏 close 动作仍各自生效。显示/隐藏和内容替换保留预览身份、编辑器与变换，按钮始终有独立名称。见 [关闭控件回归](../../../../docs/audit/2026-10-25-image-preview-close-remediation.md)。

Image/Group 每次缩放、滚轮、双击及非复位变换读取当前 minScale/maxScale；替换或移除配置会作用于下一次操作。更改配置本身保留现有比例与预览身份，不发 transform。比例达到或超过当前上限时，放大按钮与 previewActions.disabled.zoomIn 同时禁用；复位/关闭仍回到比例 1。见 [边界回归](../../../../docs/audit/2026-10-25-image-scale-bounds-remediation.md)。

scaleStep是比例增量：放大乘以1+step，缩小除以1+step；默认0.5使1放大为1.5，当前值也用于滚轮及从1开始的双击放大。step/min/max须为有限正数，无效值使用默认值；max小于min时按min处理。容器、资源加载、分组类型和步长集中修正见 [本轮迁移](../../../../docs/migrations/image-contracts.md)；forceRender/destroyOnClose已从类型移除。

加载状态只由实际img的原生事件和缓存完成状态驱动，不额外构造Image或发起校验请求。fallback启用时移除失败的srcSet/sizes，避免候选图覆盖兜底；src/srcSet/sizes更新后重新尝试当前资源。拖拽仅接受主键，关闭、禁用movable、失去主键、窗口失焦及卸载均释放原窗口监听器。

### Image · Events

| 名称 | 说明 |
|---|---|
| click | 原MouseEvent；可预览时内部打开请求后通知，支持Vue修饰符和监听器数组 |
| error | 原img的Event；占位根不接收图片error，error.once正确归于组件事件 |
| keydown | 原KeyboardEvent；监听器先于内置Enter/Space，preventDefault可阻止内置键盘动作 |
| openChange | 交互请求 `(nextOpen: boolean, prevOpen: boolean)`，写入前捕获前态 |
| update:open | 顶层 `v-model:open` 的boolean请求；父prop变化不回发 |
| transform | 当前变换的完整 `TransformInfo` 快照（rotate/scale/flipX/flipY/x/y）；接受关闭后也通知复位，拒绝关闭不复位 |

preview=false保留原生role/tabindex/aria-label；普通可预览根拥有button/0。imageRender插槽或VNode封面使用group根，非空图片内容提供独立可见的原生预览按钮；originNode保持普通img，可放入调用者的原生控件。输入、按钮、label、可编辑内容及已取消事件不触发预览，无需.stop；图片及非交互封面可点击预览，说明文字可选择。富内容根自然展开，height仍作用于图片，显式root样式优先。按钮名称为“Preview image: 名称”，名称优先显式aria-label，其次alt；普通根的默认名称保持不变。Progress只通知click/keydown，不打开潜在预览。以 `@click` / `@error` / `@keydown` 绑定；h()/ImageProps中的onXxx是Vue监听器注册。详见 [集中迁移](../../../../docs/migrations/image-contracts.md)。

预览锁定所属文档body滚动与焦点直到退场结束，mask=false仍为模态预览；多实例分别释放，关闭返回实际触发器。Escape使用所属窗口最上层及IME保护，子控件preventDefault优先；分组方向键仅在非编辑目标且无修饰/组合输入时切换。系统reduced-motion、主题motion=false或当前过渡零时长不等待500ms兜底；偏好/主题动态变化保留现有预览内容。

imageRender完全替换originNode时，非空内容保留独立可见的原生预览按钮，不把表单包成按钮；空槽不补按钮。触发器在打开期间被替换时，关闭后优先归还仍有效的保存焦点，必要时回到当前可用预览入口。

开合只有顶层Vue状态入口。open省略使用内态，移除控制接续最后同步值；交互先openChange再update:open，父级可以拒绝请求。旧preview状态字段直接移除，afterOpenChange等业务配置保持，见 [模型迁移](../../../../docs/migrations/image-open-model.md)。失效的preview.onTransform直接迁到顶层 `@transform`，类型可从根入口导入；支持监听器数组、替换与 `.once`，不混入根DOM同名事件，见 [变换事件迁移](../../../../docs/migrations/image-transform-event.md)。

预览打开后焦点进入弹层，Tab/Shift+Tab在其中循环，Esc请求关闭。受控父级拒绝关闭时保留焦点；关闭动画结束或整个预览卸载后归还原触发器。关闭与组内切换按钮自带可访问名称，自定义装饰图标不会移除名称。

### Image.PreviewGroup · Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| items | 图片列表（首选）；原生图片属性加src/width/height/fallback，可附带业务元数据 | `Array<string \| PreviewGroupItem>` | — |
| preview | 预览行为配置；不含Image专属src/cover，分别配置items/子Image | `boolean \| GroupPreviewConfig` | `true` |
| open | 顶层受控开合，可用 `v-model:open` | `boolean` | — |
| defaultOpen | 非控初值，后续变更不重置状态 | `boolean` | `false` |
| current | 受控当前索引 | `number` | — |
| defaultCurrent | 非受控初始索引 | `number` | `0` |
| previewPrefixCls | 完整预览前缀；当前prop优先，移除后使用当前Provider派生值 | `string` | `${prefixCls}-preview` |
| classNames / styles | 分组实际root及共享popup的语义配置；子Image语义在子组件或Provider配置 | `PreviewGroupSemanticType` 对应字段 | — |

移除current控制后接续最后同步索引；非受控列表缩短时归一到可用范围。空列表不挂载空弹层；preview=false或空列表的子Image不提供无效预览按钮语义。items和注册数据均透传尺寸及fallback，只将原生图片属性传给实际img。

### Image.PreviewGroup · 插槽与 Events

| 名称 | 说明 |
|---|---|
| default | 子 `Image`（`items` 未传时按注册顺序收集） |
| previewImage / previewActions | 同Image原生预览槽 |
| previewCloseIcon | 同Image无参数关闭图标槽；组内只消费Group自己的槽 |
| previewCount | 原生计数槽，单对象PreviewCountInfo，current为零基索引 |
| openChange / update:open | 同Image开合请求/模型通知，可用 `v-model:open` |
| change | 索引请求 `(current: number, prevCurrent: number)` |
| update:current | change之后的数字模型请求，可用 `v-model:current` |
| transform | 同Image变换快照；组内子Image不重复通知 |

### 语义化槽位

Image通过 `ConfigProvider.components.image.classNames/styles` 接收静态对象语义配置；Image与PreviewGroup的共享预览均读取其中的popup组。字段、image或整个components map替换、晚出现和移除都会读取当前值，原图、富内容和已打开预览保持同结构节点与状态。普通图/Progress证据见 [报告](../../../../docs/audit/2026-10-25-image-provider-remediation.md)，弹层六个节点的当前配置见 [预览配置报告](../../../../docs/audit/2026-10-25-image-popup-provider-remediation.md)。

`classNames` / `styles` 的槽位（`placeholder` 与 `popup` 是**嵌套组**）：

```
root / image / cover
placeholder.progress: root / content / rail / indicator
popup: root / mask / body / footer / actions / close
```

Provider/局部classNames通过嵌套schema拼接，再追加现有预览类名配置。styles.popup按字段浅合并：局部popup.root替换Provider的整个root样式对象，其他未覆盖字段保留。原生class/style留在Image或Group实际根，不复制到弹层；Image根style仍优先于styles.root。本批不改变共享合并规则或增加函数式配置。

Group导航图标读取当前ConfigProvider.direction，ltr/rtl切换时先合并默认与自定义图标再镜像。单侧自定义保留另一侧默认图标；显式null保持为空。当前icons对象替换/移除会更新，已打开的图片、变换和编辑器保持；Previous/Next按钮继续请求相邻索引并保留名称，见 [方向回归](../../../../docs/audit/2026-10-25-image-provider-direction-remediation.md)。

### 静态属性 / 具名导出

| 名称 | 说明 |
|---|---|
| `Image.PreviewGroup` | 预览分组。同时具名导出 `ImagePreviewGroup` |
| `genImageStyle(prefixCls?)` | 产出该组件的完整 CSS（自定义前缀时用） |
| `genImageTokenDecls()` | 组件变量声明块（对拍 antd 的 `-css-var` 块） |
| `prepareImageComponentToken(seed)` | Component Token 派生（类型 `ImageComponentToken` 同名导出） |

### 类型导出

`ImageProps`、`PreviewConfig`、`PreviewGroupProps`、`GroupPreviewConfig`、`PreviewIcons`、
`PlaceholderType`、`ImageProgressConfig`、`ImageStatus`、`CoverPlacement`、`MaskType`、
`TransformInfo`、`ImageSemanticType`、`PreviewGroupSemanticType`、`PreviewGroupItem`、`ProgressClassNames`、`ProgressStyles`。Image.PreviewGroup与具名ImagePreviewGroup使用相同的完整声明类型。

## Theme（Component Token）

7 个（CSS 变量 `--apollo-image-*`）：`zIndexPopup`(`zIndexPopupBase + 80` = 1080) /
`previewOperationColor`(`colorTextLightSolid` @0.65) / `previewOperationHoverColor`(@0.85) /
`previewOperationColorDisabled`(@0.25) / `previewOperationSize`(`fontSizeIcon × 1.5` = 18px) /
`progressAnimationDuration`(`3s`)；`imagePreviewSwitchSize`(= `controlHeightLG`，默认40px，对应 `--apollo-image-preview-switch-size`)，控制分组切换按钮实际宽高。

通过 `ConfigProvider.theme.components.Image` 覆盖全部7个Token。缩略图、Progress和body中的预览从同一个Vue主题上下文读取当前alias/组件变量；支持外层ThemeProvider、嵌套继承、暗色/紧凑算法、配置替换和移除。未配置主题时由静态CSS负责默认值；Image原生style和popup语义style可覆盖对应变量。层级优先级为preview.zIndex、styles.popup.root.zIndex、父浮层层级、组件变量。见实际component-token示例及 [统一证据](../../../../docs/audit/2026-10-25-image-contract-audit.md)。

Group 默认计数使用 `colorBgSpotlight` 背景，文字继续继承 footer 的操作颜色；在亮色页面及关闭遮罩时仍有独立的对比背景。该背景只作用于默认计数节点（也包括 `previewCount.originNode`），自定义计数槽保留自身样式。见 [对比度回归](../../../../docs/audit/2026-10-25-image-counter-contrast-remediation.md)。

## 设计说明

### 数字型 `width` / `height` 会归一化成 `px`

Vue 的 `style` **不会**给数字自动补 `px`（那是 React 的行为），裸数字会被静默丢弃。
所以组件内部统一走 `toCssSize()`：根元素与 `<img>` 的 `style`、`Progress` 的宽高都转成字符串。
漏了这一步不会报错 —— `<img>` 会退回 CSS 的 `height:auto`，按原始比例撑高，
**看起来「有图」但尺寸错了**，只有 L6 像素比对能抓到。

### 组件变量声明块挂在两个根上

静态默认声明同时挂在 `.apollo-image` 与 `.apollo-image-preview`。配置了主题时，两者在自己的实际根写当前CSS变量；Vue的provide/inject跨Teleport保持同一上下文，所以预览不依赖源DOM的变量继承。不生成组件样式表或向全局写入局部主题。

### 预览浮层走 portal

`Image` 的可 SSR 部分是根 `div` + `<img>` + 占位 + 封面；预览浮层经
`@apollo-design/portal` 挂到 `body`（`getContainer` 可改），因此 **SSR 产物里看不到它**。
`preview=false` 时连浮层组件都不挂载。

### 样式引入

```ts
import '@apollo-design/theme/tokens.css'; // 主题变量，必须先引
import '@apollo-design/ui/image/style.css';    // 按需
// 或
import '@apollo-design/ui/style.css';          // 汇总
```

默认发布CSS使用apollo命名空间。`ConfigProvider.prefixCls="my-app"` 对应Image根 `my-app-image` 和预览 `my-app-image-preview`；在应用构建中用 `genImageStyle('my-app')` 预生成并加载对应CSS。Image.prefixCls与Group.previewPrefixCls接受完整前缀。动态更新改变DOM命名，所用命名空间的CSS需预先加载，组件运行时不生成样式。已打开预览和同结构富节点保留状态，见 [前缀证据](../../../../docs/audit/2026-10-25-image-prefix-remediation.md)；D04整体策略继续独立追踪。

## FAQ

**为什么预览浮层的 `z-index` 是 1080？**

`zIndexPopup = zIndexPopupBase(1000) + 80`，与 antd 逐字一致；`preview.zIndex` 可覆盖。

**`Image.PreviewGroup` 的 `items` 和默认插槽能同时用吗？**

`items` 优先。未传 `items` 时按子 `Image` 的注册顺序收集（注册返回自增 id）。

**组内切换时浮层会重建吗？**

不会。组内只挂**一个** `Preview`，切换时更新 `src` 与 `mousePosition`。

Group通过Vue注册关系维护归属，嵌套组相互隔离，Teleport不会改变图片所属组；显式items优先，移除items后恢复子图注册。打开者被删除后，关闭归还本组仍可用的预览入口，不选择嵌套组或业务控件。删除无控当前项会归一到有效索引，数据更新不回声change/update:current。
