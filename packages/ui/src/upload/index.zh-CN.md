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

见 [`demo/`](./demo)（3 个）。

| demo | 内容 |
|---|---|
| `basic` | 点击上传：`v-model:fileList` 受控列表 + done/uploading/error 三态 |
| `dragger` | 拖拽上传：`UploadDragger` 的虚线区 + `-drag-hover` 态 |
| `picture-card` | 照片墙：`listType="picture-card"` 缩略图 + 悬浮操作层 |

⚠️ antd 另有 9 个 demo 依赖本仓尚未落地的组件（`Message`/`Progress`/`Tooltip`/
自定义请求库等），按 `README.md` §2 的 demo 替换约定暂不提供，落点见
[`README.md`](./README.md) §6。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| action | 上传地址。为函数时按文件动态返回（可返回 Promise） | `string \| ((file: RcFile) => string \| PromiseLike<string>)` | — |
| accept | 接受的文件类型（`string` 或 `{ format, filter: 'native' \| (file) => boolean }`） | `string \| AcceptConfig` | — |
| beforeUpload | 上传前钩子。返回 `false` 阻止上传（仍触发一次 `change`）；返回 `LIST_IGNORE` 完全忽略；返回 `File`/`Blob`/对象替换上传内容 | `(file: RcFile, fileList: RcFile[]) => boolean \| object \| Promise<…>` | — |
| capture | 媒体捕获，透传给原生 input | `string \| boolean` | — |
| classNames | 语义化类名：`{ root, trigger, list, item }`（+ 函数形态） | `UploadSemanticClassNames \| ((info) => …)` | — |
| customRequest | 覆盖默认 XHR 上传实现 | `(options) => { abort?: () => void } \| void` | — |
| data | 附加表单数据（函数形态按文件求值） | `object \| ((file: RcFile) => object)` | `{}` |
| defaultFileList | 非受控的默认文件列表 | `UploadFile[]` | — |
| directory | 支持上传文件夹（走 `traverse-file-tree` 递归） | `boolean` | — |
| disabled | 是否禁用 | `boolean` | — |
| fileList | **受控**文件列表（与 `v-model:fileList` 等价） | `UploadFile[]` | — |
| headers | 上传请求头（值为 `null` 的项目会被跳过） | `Record<string, string>` | — |
| isImageUrl | 覆盖「是否图片」的判定 | `(file: UploadFile) => boolean` | antd 同款实现 |
| listType | 列表形态 | `'text' \| 'picture' \| 'picture-card' \| 'picture-circle'` | `'text'` |
| maxCount | 最大文件数。`1` 时新文件替换旧文件；超出部分不进列表且**不触发** `change` | `number` | — |
| method | 请求方法 | `string` | `'post'` |
| multiple | 是否多选 | `boolean` | `false` |
| name | 发往服务器的字段名 | `string` | `'file'` |
| openFileDialogOnClick | 点击触发区是否打开文件框 | `boolean` | `true` |
| pastable | 支持从剪贴板粘贴上传（`document` 级 paste 监听） | `boolean` | — |
| previewFile | 生成 picture 族缩略图的自定义实现 | `(file: File \| Blob) => PromiseLike<string>` | canvas 200×200 居中裁剪 |
| progress | 进度条配置（透传给 Progress / 内联 MiniProgress） | `UploadListProgressProps` | `{ size: [-1, 2], showInfo: false }` |
| showUploadList | 是否展示列表，或 `{ showPreviewIcon, showRemoveIcon, showDownloadIcon }` | `boolean \| ShowUploadListInterface` | `true` |
| type | 上传形态。`'drag'` 等价于使用 `UploadDragger` | `'select' \| 'drag'` | `'select'` |
| withCredentials | 跨域请求是否携带 cookie | `boolean` | `false` |
| rootClassName / className / style | 根元素类名与内联样式 | — | — |
| hasControlInside | 触发区内是否已有可聚焦控件（决定引擎根是否带 `role="button"` / `tabIndex`） | `boolean` | `true` |
| locale | 覆盖内置文案 | `{ uploading, removeFile, downloadFile, previewFile }` | 从 `LocaleProvider` 取 |

### 事件

| 事件名 | 说明 | 参数 |
|---|---|---|
| `update:fileList` | 受控更新（`v-model:fileList`） | `fileList` |
| `change` | 每次状态推进（uploading / done / error / removed）触发一次；batchStart 时**逐文件**触发 | `{ file, fileList, event? }` |
| `drop` | 拖拽释放（⚠️ 只走事件通道，见 `COMPATIBILITY.md` D71） | `DragEvent` |
| `preview` / `download` | 预览 / 下载回调（`onPreview` / `onDownload` prop 形态） | `file` |
| `remove` | 删除回调（`onRemove` prop 形态）。返回 `false` 或 `Promise<false>` 可**阻止**删除 | `file` |

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
| appendAction | — | 列表尾部上传按钮的内容（仅 `picture-card` / `picture-circle` 生效；不传则用默认上传按钮） |

### Expose

| 名称 | 说明 |
|---|---|
| `nativeElement` | 根元素（`HTMLElement \| null`） |
| `fileList` | 当前文件列表 |
| `upload` | 引擎实例（`abort(file?)`） |
| `onBatchStart` / `onSuccess` / `onProgress` / `onError` | 引擎钩子（与 antd 的 ref 测试面一致） |

### 类型

`UploadFile`、`UploadProps`、`UploadChangeParam`、`UploadListType`、`ItemRender`、
`ShowUploadListInterface`、`UploadLocale`、`DraggerProps`、`RcFile`（= `File & { uid }`）、
`LIST_IGNORE`（`beforeUpload` 的忽略哨兵值）。

## 设计说明

- **上传引擎自建**：`engine/` 下 5 个模块是 `@rc-component/upload` 的等价实现
  （H5 禁止依赖 rc 包）。`customRequest` 是唯一的替换点，默认走 XHR + FormData。
- **列表动效**：非 picture 族用 collapse motion（height `0 ↔ scrollHeight` +
  `onXxxEnd` 被 omit），picture 族只做 fade；`motionName = {p}-animate[-inline]`，
  `motionDeadline: 2000`。handler 经 `CSSMotion` 的 `hooks` 对象传入（D76）。
- **Progress / Tooltip 未落地**：进度条内联 `MiniProgress`（DOM 逐条对齐
  antd line-small 产物）、错误提示用原生 `title`。两者都是**待换回**的临时实现，
  见 [`README.md`](./README.md) §6 P1 / P2。
- **全局基础样式不注入**：名字为裸 `<a>`、触发区里放原生 `<button>` 时，
  链接色与表单控件归一化取决于使用者自己的全局样式（D75）—— 建议配合
  任意 CSS reset 使用，或直接用组件库内的 `Button` / `Link`。
