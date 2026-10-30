---
category: 数据录入
title: Upload
subtitle: 上传
---

文件选择上传和拖拽上传。

## 何时使用

- 上传是将信息（网页、文字、图片、视频等）通过网页或者上传工具发布到远程服务器上的过程。
- 当需要上传一个或一些文件时。
- 当需要展现上传的进度时。
- 当需要使用拖拽交互时。

## 代码演示

见 [`demo/`](./demo)（23 个）。

| demo | 内容 |
|---|---|
| `basic` | 点击上传：`v-model:fileList` 受控列表 + done/uploading/error 三态 |
| `dragger` | 拖拽上传：`UploadDragger` 的虚线区 + `-drag-hover` 态 |
| `picture-card` | 照片墙：`listType="picture-card"` 缩略图 + 悬浮操作层 |

裁剪图片、外部 OSS、自定义进度条等场景依赖外部服务或额外能力，暂不提供；上传生命周期、
校验、拖拽/照片墙、手动上传与自定义请求等高频场景均已覆盖。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| action | 上传地址。为函数时按文件动态返回（可返回 Promise） | `string \| ((file: RcFile) => string \| PromiseLike<string>)` | — |
| accept | 接受的文件类型（`string` 或 `{ format, filter: 'native' \| (file) => boolean }`） | `string \| AcceptConfig` | — |
| beforeUpload | 上传前钩子。返回 `false` 阻止上传（仍触发一次 `change`）；返回 `LIST_IGNORE` 完全忽略；返回 `File`/`Blob`/字符串替换上传内容；拒绝的 Promise 也阻止该文件上传 | `(file: RcFile, fileList: RcFile[]) => void \| boolean \| string \| Blob \| Promise<…>` | — |
| capture | 媒体捕获，透传给原生 input | `string \| boolean` | — |
| classNames | 语义化类名：`{ root, trigger, list, item }`（+ 函数形态） | `UploadSemanticClassNames \| ((info) => …)` | — |
| customRequest | 覆盖默认 XHR；第二参提供 defaultRequest，返回 abort 句柄支持取消 | `(options, { defaultRequest }) => { abort: () => void } \| void` | — |
| data | 附加表单数据（函数形态按文件求值） | `object \| ((file: RcFile) => object \| Promise<object>)` | `{}` |
| defaultFileList | 非受控的默认文件列表 | `UploadFile[]` | — |
| directory | 支持上传文件夹（走 `traverse-file-tree` 递归） | `boolean` | — |
| disabled | 是否禁用 | `boolean` | — |
| fileList | **受控**文件列表（与 `v-model:fileList` 等价） | `UploadFile[]` | — |
| headers | 上传请求头（值为 `null` 的项目会被跳过） | `Record<string, string \| null>` | — |
| isImageUrl | 覆盖「是否图片」的判定 | `(file: UploadFile) => boolean` | 内置判定 |
| listType | 列表形态 | `'text' \| 'picture' \| 'picture-card' \| 'picture-circle'` | `'text'` |
| maxCount | 最大文件数。`1` 时新文件替换旧文件；超出部分不进列表且**不触发** `change` | `number` | — |
| method | 请求方法 | `string` | `'post'` |
| multiple | 是否多选 | `boolean` | `false` |
| name | 发往服务器的字段名 | `string` | `'file'` |
| onPreview | 接管预览导航 | `(file: UploadFile) => void` | — |
| onDownload | 接管默认下载服务 | `(file: UploadFile) => void` | — |
| onRemove | 确认移除；false 阻止删除 | `(file: UploadFile) => void \| boolean \| Promise<void \| boolean>` | — |
| openFileDialogOnClick | 点击触发区是否打开文件框 | `boolean` | `true` |
| pastable | 支持从剪贴板粘贴上传（`document` 级 paste 监听） | `boolean` | — |
| previewFile | 生成 picture 族缩略图的自定义实现 | `(file: File \| Blob) => PromiseLike<string>` | 200×200 居中缩略图 |
| progress | 上传列表的进度展示配置，字段见下表 | `UploadListProgressProps` | 满宽 2px，隐藏信息 |
| showUploadList | 是否展示列表，或 `{ showPreviewIcon, showRemoveIcon, showDownloadIcon }` | `boolean \| ShowUploadListInterface` | `true` |
| type | 上传形态。`'drag'` 等价于使用 `UploadDragger` | `'select' \| 'drag'` | `'select'` |
| withCredentials | 跨域请求是否携带 cookie | `boolean` | `false` |
| class / style | 原生 attrs 落外层 wrapper；局部 style 优先于语义 root 样式 | — | — |
| hasControlInside | 触发区内是否已有可聚焦控件（决定引擎根是否带 `role="button"` / `tabIndex`） | `boolean` | `true` |
| locale | 覆盖内置文案 | `{ uploading, removeFile, downloadFile, previewFile }` | 从 `LocaleProvider` 取 |

`onPreview(file)`、`onDownload(file)` 是业务服务 Props：提供后分别接管原生预览导航和
默认 window.open 下载。`onRemove(file)` 是可选确认 Prop，返回 false 或解析为 false
的 Promise 会保留文件。它们不再重复发出同名通知事件。

fileList 代表已接受的列表，update 是提议；父级拒绝不会污染其文件对象，撤去绑定后保留
最后接受的列表。已接受的活动文件被删除或替换时中止请求，迟到回调不会改写新状态。
maxCount 同时排除超额请求。action/data/request 失败只把该文件标为 error，其他批次成员
继续上传。beforeUpload 阻止的文件仍使用含 originFileObj、没有 uploading 状态的 UploadFile
作为 change 载荷。

原生 class/style 落 wrapper，其他原生 attrs/监听器落实际交互触发区，id/name 落真实文件 input。
触发区没有内部控件时支持 Enter/Space；禁用时不进入 Tab 顺序。UploadDragger 转发 Upload
全部插槽、回调、模型事件和 ref；height 设置 wrapper 高度，hasControlInside 默认 false。

### 进度配置

| 字段 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| strokeColor | 纯色、`{ from, to }` 或百分比色标渐变；渐变方向跟随 RTL | `string \| Record<string, string>` | 主题进度色 |
| strokeWidth | 轨道厚度；数字按 px，字符串使用合法 CSS 长度 | `number \| string` | `2` |
| showInfo | 显示当前百分比信息 | `boolean` | `false` |
| size | 数字为宽高，数组为 `[宽, 高]`；宽度非正时自适应，预设 small/default 的厚度为 6/8px | `number \| [number, number] \| 'small' \| 'default'` | `[-1, 2]` |
| aria-label | 实际进度条的可访问名称；覆盖文件值，未提供时使用文件名 | `string` | 文件名称 |
| aria-labelledby | 实际进度条所关联的标签 ID；覆盖文件值 | `string` | — |

数字或数组 size 决定宽高；其余情况下显式 strokeWidth 优先于预设与默认厚度。
部分 progress 对象也保留满宽 2px 的默认值。当前 Provider 的
`components.upload.progress` 与局部配置浅合并，局部字段优先，动态替换或移除立即生效。

进度值来自 `UploadFile.percent`，保留有限小数并限制在 0–100，非有限输入按 0。
文件没有 percent 字段时不显示进度，显式 undefined 或 0 表示零进度。
列表项首次挂载后等待 300ms，随后仅在 uploading 状态显示；达到 100% 仍等待上传成功事件。
整行 itemRender 插槽负责其自身内容。该配置不包含 Progress 的 percent/type/status 等其他字段。

### 事件

| 事件名 | 说明 | 参数 |
|---|---|---|
| `update:fileList` | 受控更新（`v-model:fileList`） | `fileList` |
| `change` | 每次状态推进（uploading / done / error / removed）触发一次；batchStart 时**逐文件**触发 | `{ file, fileList, event? }` |
| `drop` | 拖拽释放（只走事件通道） | `DragEvent` |

### 插槽

| 名称 | 作用域 | 说明 |
|---|---|---|
| default | — | 触发区内容。`type="drag"` 时落在 `-drag-container`；`picture-card` / `picture-circle` 时作为列表尾部上传按钮 |
| iconRender | `{ file, listType }` | 自定义列表项图标（原 `iconRender` prop，已改为 slot） |
| itemRender | `{ originNode, file, fileList, actions }` | 自定义列表项整体渲染（原 `itemRender` prop，已改为 slot） |
| removeIcon | `{ file }` | 自定义删除图标（原 `showUploadList.removeIcon`） |
| previewIcon | `{ file }` | 自定义预览图标（原 `showUploadList.previewIcon`） |
| downloadIcon | `{ file }` | 自定义下载图标（原 `showUploadList.downloadIcon`） |
| extra | `{ file }` | 自定义列表项附加内容（原 `showUploadList.extra`） |
| appendAction | — | picture-card/circle 尾部上传触发区内容，保留真实 input 与全部节点；存在的空插槽也优先 |

### Expose

| 名称 | 说明 |
|---|---|
| `nativeElement` | 根元素（`HTMLElement \| null`） |
| `fileList` | 当前文件列表 |
| `upload` | 引擎句柄：abort(fileOrUid?)、uploadFiles(files): Promise<void>、getInputRef() |
| `onBatchStart` / `onSuccess` / `onProgress` / `onError` | 程序化生命周期方法，通常由内部引擎调用 |

### 类型

`UploadFile`、`UploadProps`、`UploadChangeParam`、`UploadListType`、`ItemRender`、
`ShowUploadListInterface`、`UploadLocale`、`UploadRef`、`UploadSlots`、`UploadConfig`、`DraggerProps`、`RcFile`（= `File & { uid }`）、
`LIST_IGNORE`（`beforeUpload` 的忽略哨兵值）。

## 设计说明

- **自定义请求**：`customRequest` 是替换上传实现的入口；默认使用 XHR + FormData。
- **列表动效**：非 picture 族使用高度展开/收起动效，picture 族使用淡入淡出；
  `motionName = {p}-animate[-inline]`，并带 2000ms 兜底。
- **进度与错误提示**：列表内联轻量进度条，错误信息通过原生 `title` 提示。
- **全局基础样式不注入**：名字为裸 `<a>`、触发区里放原生 `<button>` 时，
  链接色与表单控件归一化取决于使用者自己的全局样式—— 建议配合
  任意 CSS reset 使用，或直接用组件库内的 `Button` / `Link`。

缩略图在挂载后生成，来源或处理器替换会更新，只保存在本地，不向受控文件写入 thumbUrl。
移除或卸载后忽略迟到结果，并释放内置图片预览的资源。当前 theme.components.Upload 的
令牌 actionsColor/pictureCardSize 会实时消费；原生 CSS 变量可覆盖，默认卡片尺寸跟随 controlHeightLG。

0.0.0 开发版移除没有实际消费者的 supportServerRender/styleAttrs：SSR 直接支持，根样式用
原生 style；无兼容层、无弃用期。
