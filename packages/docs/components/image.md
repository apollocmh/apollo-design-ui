---
title: Image 图片
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

可预览的图片。预览浮层走 portal，支持缩放 / 旋转 / 翻转 / 组内切换。

## 何时使用

- 需要展示图片，并让用户点击查看大图。
- 一组图片需要统一预览、可左右切换（`Image.PreviewGroup`）。
- 图片加载中/失败时需要占位与兜底（`placeholder` / `fallback`）。

:::

## 代码演示

::: v-pre

**basic**：基本用法（点击可预览）。

:::

<DemoPreview component="image" demo="basic" />

::: v-pre

**component-token**：组件级 token（本仓以默认主题渲染 —— ConfigProvider 主题覆盖 PENDING）。

:::

<DemoPreview component="image" demo="component-token" />

::: v-pre

**controlled-preview**：受控的预览开关（`preview.open` + `onOpenChange`）。

:::

<DemoPreview component="image" demo="controlled-preview" />

::: v-pre

**cover-placement**：`preview.cover.placement` 指定封面（hover 层）位置。

:::

<DemoPreview component="image" demo="cover-placement" />

::: v-pre

**fallback**：加载失败时显示 `fallback` 指定的图片。

:::

<DemoPreview component="image" demo="fallback" />

::: v-pre

**image-render**：自定义 `img` 元素的渲染（`imageRender`）。

:::

<DemoPreview component="image" demo="image-render" />

::: v-pre

**nested**：嵌套在其他容器中的图片（预览浮层仍挂 portal）。

:::

<DemoPreview component="image" demo="nested" />

::: v-pre

**placeholder**：使用 `placeholder.progress` 展示生成进度（无 `percent` 时为忙碌态）。

:::

<DemoPreview component="image" demo="placeholder" />

::: v-pre

**preview-group-top-progress**：组内预览可自定义工具栏（`actionsRender`）。

:::

<DemoPreview component="image" demo="preview-group-top-progress" />

::: v-pre

**preview-group-visible**：受控的预览开关（deprecated 的 `visible` 与新的 `open` 等价）。

:::

<DemoPreview component="image" demo="preview-group-visible" />

::: v-pre

**preview-group**：多个图片放在 `Image.PreviewGroup` 中，可切换预览。

:::

<DemoPreview component="image" demo="preview-group" />

::: v-pre

**preview-img-info**：预览时保留原图的 `width`/`height`（`imageInfo`）。

:::

<DemoPreview component="image" demo="preview-img-info" />

::: v-pre

**preview-mask**：自定义预览的遮罩（`preview.mask`）。

:::

<DemoPreview component="image" demo="preview-mask" />

::: v-pre

**preview-src**：`preview.src` 指定预览用的大图（与缩略图不同）。

:::

<DemoPreview component="image" demo="preview-src" />

::: v-pre

## API

### Image · Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo` |
| src | 图片地址 | `string` | — |
| width / height | 宽高。数字会归一化成 `px`（见「设计说明」） | `number \| string` | — |
| alt | 可访问名。可预览时也是根元素的 `aria-label` | `string` | — |
| fallback | 加载失败时的兜底图 | `string` | — |
| placeholder | 占位内容；`{ progress: true \| { percent, render } }` 时渲染进度层 | `VNodeChild \| { progress }` | — |
| preview | `false` 关闭预览；对象形态见下表 | `boolean \| PreviewConfig` | `true` |
| class / style | **根元素原生 attrs**（不是 Props；替代上游 `className` / `rootClassName` / `style`） | `string \| array \| object` / `CSSProperties` | — |
| style | 根元素内联样式。**会覆盖 `styles.root`** | `CSSProperties` | — |
| wrapperStyle | ⚠️ 已废弃，请用 `styles.root` | `CSSProperties` | — |
| classNames / styles | 语义化类名/样式，见「语义化槽位」 | — | — |
| imageRender | 自定义 `<img>` 渲染 | `(info: ImageRenderInfo) => VNodeChild` | — |
| onClick | 点击（先走内部打开预览，再调它） | `(e: MouseEvent) => void` | — |
| onError | `<img>` 加载失败 | `(e: Event) => void` | — |
| crossOrigin / decoding / loading / referrerPolicy / sizes / srcSet / useMap / draggable | 透传给 `<img>` 的原生属性 | — | — |

### Image · PreviewConfig（`preview` 的对象形态）

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| src | 预览用大图（默认取 `src`） | `string` | — |
| open | 受控开合 | `boolean` | — |
| defaultOpen | 非受控初始开合 | `boolean` | `false` |
| onOpenChange | 开合变化 | `(open, prevOpen) => void` | — |
| afterOpenChange | 开合动画结束后 | `(open) => void` | — |
| cover | 封面（hover 层）。`false` 不渲染；`{ placement: 'center' \| 'top' \| 'bottom', coverNode }` | `MaskNode` | — |
| mask | 遮罩。`false` ⇒ 根元素加 `-preview-mask-hidden` | `MaskNode` | — |
| maskClosable | 点遮罩关闭 | `boolean` | `true` |
| closable | 显示关闭按钮 | `boolean` | `true` |
| closeIcon | 自定义关闭图标 | `VNodeChild` | — |
| movable | 可拖拽 | `boolean` | `true` |
| minScale / maxScale / scaleStep | 缩放边界与步长 | `number` | `1` / `50` / `0.5` |
| zIndex | 浮层层级 | `number` | `1080`（`zIndexPopupBase + 80`） |
| getContainer | 浮层挂载容器 | `() => HTMLElement` | `document.body` |
| icons | 图标槽（rotateLeft/rotateRight/zoomIn/zoomOut/close/left/right/flipX/flipY） | `PreviewIcons` | 内置图标 |
| imageRender | 预览大图的自定义渲染 | `(info) => VNodeChild` | — |
| actionsRender | 自定义工具栏 | `(originNode, info) => VNodeChild` | — |
| countRender | 自定义组内计数文案 | `(current, total) => VNodeChild` | — |
| onTransform | 变换（rotate/scale/flip/x/y）变化 | `(info: TransformInfo) => void` | — |
| visible | ⚠️ 已废弃，请用 `open` | `boolean` | — |
| onVisibleChange | ⚠️ 已废弃，请用 `onOpenChange` | `(visible, prevVisible) => void` | — |
| rootClassName | ⚠️ 已废弃，请用 `classNames.root` | `string` | — |
| maskClassName | ⚠️ 已废弃，请用 `classNames.cover` | `string` | — |
| toolbarRender | ⚠️ 已废弃，请用 `actionsRender` | `ActionsRender` | — |
| forceRender / destroyOnClose | 已移除（antd 不再支持），传入被忽略 | — | — |

### Image · Events

| 名称 | 说明 |
|---|---|
| update:open | 预览开合变化时发出（与 `preview.onOpenChange` **同时**发出），可写 `v-model:open` |

### Image.PreviewGroup · Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| items | 图片列表（首选）；字符串或 `{ src, alt, ... }` | `Array<string \| object>` | — |
| preview | 同 `Image` 的 `preview`，额外支持 `onVisibleChange(visible, prev, current)` | `boolean \| GroupPreviewConfig` | `true` |
| current | 受控当前索引 | `number` | — |
| defaultCurrent | 非受控初始索引 | `number` | `0` |
| previewPrefixCls | 预览层前缀 | `string` | `${prefixCls}-preview` |
| onChange | 切换 | `(current, prevCurrent) => void` | — |
| classNames / styles | 同 `Image` | — | — |

### Image.PreviewGroup · 插槽与 Events

| 名称 | 说明 |
|---|---|
| default | 子 `Image`（`items` 未传时按注册顺序收集） |
| update:current | 当前索引变化（与 `onChange` **同时**发出），可写 `v-model:current` |

### 语义化槽位

`classNames` / `styles` 的槽位（`placeholder` 与 `popup` 是**嵌套组**）：

```
root / image / cover
placeholder.progress: root / content / rail / indicator
popup: root / mask / body / footer / actions / close
```

合并优先级（低 → 高）：`classNames` → `preview.rootClassName` / `preview.maskClassName`
（deprecated 面）→ **原生 `class` / `style`**（落在根元素）。

> ⚠️ `popup` 是嵌套语义组：本仓的 `useMergeSemantic` 尚未实现 antd 的 `schema` 分支，
> `clsx` 会把对象值压成 `''`，所以 `popup` 由组件单独合并（`Image` 与 `PreviewGroup` 同款）。

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
`TransformInfo`、`ImageSemanticType`、`ProgressClassNames`、`ProgressStyles`。

## Theme（Component Token）

7 个（CSS 变量 `--apollo-image-*`）：`zIndexPopup`(`zIndexPopupBase + 80` = 1080) /
`previewOperationColor`(`colorTextLightSolid` @0.65) / `previewOperationHoverColor`(@0.85) /
`previewOperationColorDisabled`(@0.25) / `previewOperationSize`(`fontSizeIcon × 1.5` = 18px) /
`progressAnimationDuration`(`3s`)；派生 `imagePreviewSwitchSize`(= `controlHeightLG`)。

## 设计说明

### 数字型 `width` / `height` 会归一化成 `px`

Vue 的 `style` **不会**给数字自动补 `px`（那是 React 的行为），裸数字会被静默丢弃。
所以组件内部统一走 `toCssSize()`：根元素与 `<img>` 的 `style`、`Progress` 的宽高都转成字符串。
漏了这一步不会报错 —— `<img>` 会退回 CSS 的 `height:auto`，按原始比例撑高，
**看起来「有图」但尺寸错了**，只有 L6 像素比对能抓到。

### 组件变量声明块挂在两个根上

antd 把组件变量声明在每个 `-css-var` 根上，预览浮层的根同样带这个类（它拿到的是
`mergedRootClassName`）。本仓没有 `-css-var` 类，等价做法是让声明块同时挂
`.apollo-image` 与 `.apollo-image-preview`：预览浮层经 Teleport 挂在 `body` 上，
**不在** `.apollo-image` 子树内，只挂前者会让 `var(--apollo-image-preview-*)` 全部失效
（关闭按钮字号由 18px 回退成继承的 16px）。同 `input` 的 D69。

### 预览浮层走 portal

`Image` 的可 SSR 部分是根 `div` + `<img>` + 占位 + 封面；预览浮层经
`@apollo-design/portal` 挂到 `body`（`getContainer` 可改），因此 **SSR 产物里看不到它**。
`preview=false` 时连浮层组件都不挂载。

### 样式引入

```ts
import '@apollo-design/theme/dist/tokens.css'; // 主题变量，必须先引
import '@apollo-design/ui/image/style.css';    // 按需
// 或
import '@apollo-design/ui/style.css';          // 汇总
```

自定义 `prefixCls`（如 `my-app`）时用 `genImageStyle('my-app')` 自行产出 CSS ——
静态产物只覆盖 `apollo` 与 `ant` 两套前缀。

## FAQ

**为什么预览浮层的 `z-index` 是 1080？**

`zIndexPopup = zIndexPopupBase(1000) + 80`，与 antd 逐字一致；`preview.zIndex` 可覆盖。

**`Image.PreviewGroup` 的 `items` 和默认插槽能同时用吗？**

`items` 优先。未传 `items` 时按子 `Image` 的注册顺序收集（注册返回自增 id）。

**组内切换时浮层会重建吗？**

不会。组内只挂**一个** `Preview`，切换时更新 `src` 与 `mousePosition`。

:::
