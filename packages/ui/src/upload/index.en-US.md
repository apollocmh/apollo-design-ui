---
category: Data Entry
title: Upload
subtitle: Upload
---

Upload files by selecting or dragging.

## When To Use

- Upload is the process of publishing information (web pages, text, pictures, video, etc.)
  to a remote server via a web page or an upload tool.
- When you need to upload one or more files.
- When you need to show the process of uploading.
- When you need to use drag and drop interaction.

## Examples

See [`demo/`](./demo) (23 demos).

| demo | Content |
|---|---|
| `basic` | Click to upload: controlled `v-model:fileList` with done / uploading / error items |
| `dragger` | Drag area (`UploadDragger`) with the `-drag-hover` state |
| `picture-card` | Picture wall: thumbnails plus the hover action layer |

Scenarios such as image cropping, external OSS uploads and custom progress bars need
external services or extra capabilities and are not provided. The upload lifecycle,
validation, drag / picture wall, manual upload and custom request paths are covered.

## API

### Props

| Property | Description | Type | Default |
|---|---|---|---|
| action | Upload URL. A function receives the file and may return a promise | `string \| ((file: RcFile) => string \| PromiseLike<string>)` | — |
| accept | Accepted file types (`string`, or `{ format, filter: 'native' \| (file) => boolean }`) | `string \| AcceptConfig` | — |
| beforeUpload | Hook before uploading. Return `false` to stop (still emits `change` once), `LIST_IGNORE` to skip entirely, or a `File`/`Blob`/object to replace the payload | `(file: RcFile, fileList: RcFile[]) => boolean \| object \| Promise<…>` | — |
| capture | Media capture, forwarded to the native input | `string \| boolean` | — |
| classNames | Semantic class names: `{ root, trigger, list, item }` (or a function) | `UploadSemanticClassNames \| ((info) => …)` | — |
| customRequest | Replace the default XHR implementation | `(options) => { abort?: () => void } \| void` | — |
| data | Extra form data (function form is evaluated per file) | `object \| ((file: RcFile) => object)` | `{}` |
| defaultFileList | Default file list (uncontrolled) | `UploadFile[]` | — |
| directory | Upload a folder (recursed by `traverse-file-tree`) | `boolean` | — |
| disabled | Whether disabled | `boolean` | — |
| fileList | Controlled file list (same as `v-model:fileList`) | `UploadFile[]` | — |
| headers | Request headers (`null` values are skipped) | `Record<string, string>` | — |
| isImageUrl | Override the "is image" predicate | `(file: UploadFile) => boolean` | antd's implementation |
| listType | List style | `'text' \| 'picture' \| 'picture-card' \| 'picture-circle'` | `'text'` |
| maxCount | Max number of files. With `1`, a new file replaces the old one; exceeded files never enter the list and do **not** emit `change` | `number` | — |
| method | Request method | `string` | `'post'` |
| multiple | Whether multiple selection is allowed | `boolean` | `false` |
| name | Field name sent to the server | `string` | `'file'` |
| openFileDialogOnClick | Whether clicking the trigger opens the file dialog | `boolean` | `true` |
| pastable | Paste from clipboard (document-level listener) | `boolean` | — |
| previewFile | Custom thumbnail generator for the picture family | `(file: File \| Blob) => PromiseLike<string>` | canvas 200×200 center crop |
| progress | Upload-list progress presentation options, detailed below | `UploadListProgressProps` | Full width, 2px, no information |
| showUploadList | Show the list, or configure it: `{ showPreviewIcon, showRemoveIcon, showDownloadIcon }` | `boolean \| ShowUploadListInterface` | `true` |
| type | `'drag'` is equivalent to using `UploadDragger` | `'select' \| 'drag'` | `'select'` |
| withCredentials | Whether to send cookies on cross-origin requests | `boolean` | `false` |
| class / style | **Native root attrs** (not Props); `style` flows through the semantic root channel's `trigger` slot | — | — |
| hasControlInside | Whether the trigger already contains a focusable control (drives `role="button"` / `tabIndex` on the engine root) | `boolean` | `true` |
| locale | Override built-in text | `{ uploading, removeFile, downloadFile, previewFile }` | from `LocaleProvider` |

### Progress options

| Field | Description | Type | Default |
|---|---|---|---|
| strokeColor | Solid color, `{ from, to }`, or percentage gradient stops; gradient direction follows RTL | `string \| Record<string, string>` | Theme progress color |
| strokeWidth | Rail thickness; numbers use px, strings use valid CSS lengths | `number \| string` | `2` |
| showInfo | Show the current percentage | `boolean` | `false` |
| size | A number sets width and height; a tuple sets `[width, height]`. Nonpositive width fills the available space. small/default use 6/8px thickness | `number \| [number, number] \| 'small' \| 'default'` | `[-1, 2]` |
| aria-label | Accessible name on the actual bar; overrides the file value and falls back to the file name | `string` | File name |
| aria-labelledby | Label element IDs on the actual bar; overrides the file value | `string` | — |

A numeric or tuple size determines dimensions. Otherwise, explicit strokeWidth takes
precedence over presets and the default thickness. Partial progress objects retain
the full-width 2px default. Current `components.upload.progress` Provider options are
shallow-merged with local options; local fields win, including reactive replacement and removal.

The value comes from `UploadFile.percent`: finite fractions are preserved and clamped
to 0–100; non-finite values become 0. An absent percent field omits the bar, while
explicit undefined or 0 means zero progress. After a 300ms delay from the list item's
initial mount, the bar is shown only while uploading. Reaching 100% still waits for
the upload success event. A whole-row itemRender slot owns its content. This subset
does not expose other Progress fields such as percent/type/status.

### Events

| Event | Description | Arguments |
|---|---|---|
| `update:fileList` | Controlled update (`v-model:fileList`) | `fileList` |
| `change` | Emitted once per state transition (uploading / done / error / removed); emitted **per file** on batch start | `{ file, fileList, event? }` |
| `drop` | Drop event (event channel only) | `DragEvent` |
| `preview` / `download` | Preview / download callbacks (`onPreview` / `onDownload` prop form) | `file` |
| `remove` | Remove callback (`onRemove` prop form). Return `false` or `Promise<false>` to **prevent** removal | `file` |

### Slots

| Name | Scope | Description |
|---|---|---|
| default | — | Trigger content. With `type="drag"` it lands in `-drag-container`; with `picture-card` / `picture-circle` it becomes the trailing upload button |
| iconRender | `{ file, listType }` | Custom list item icon (was the `iconRender` prop) |
| itemRender | `{ originNode, file, fileList, actions }` | Customize the whole list item (was the `itemRender` prop) |
| removeIcon | `{ file }` | Custom remove icon (was `showUploadList.removeIcon`) |
| previewIcon | `{ file }` | Custom preview icon (was `showUploadList.previewIcon`) |
| downloadIcon | `{ file }` | Custom download icon (was `showUploadList.downloadIcon`) |
| extra | `{ file }` | Custom list item extra content (was `showUploadList.extra`) |
| appendAction | — | Content of the trailing upload button (only `picture-card` / `picture-circle`; falls back to the default upload button when omitted) |

### Expose

| Name | Description |
|---|---|
| `nativeElement` | Root element (`HTMLElement \| null`) |
| `fileList` | Current file list |
| `upload` | Engine instance (`abort(file?)`) |
| `onBatchStart` / `onSuccess` / `onProgress` / `onError` | Engine hooks (same surface as antd's ref) |

### Types

`UploadFile`, `UploadProps`, `UploadChangeParam`, `UploadListType`, `ItemRender`,
`ShowUploadListInterface`, `UploadLocale`, `DraggerProps`, `RcFile` (= `File & { uid }`),
`LIST_IGNORE` (sentinel for `beforeUpload`).

## Design Notes

- **Self-built upload engine**: the five modules under `engine/` are equivalents of
  `@rc-component/upload` (depending on rc packages is forbidden). `customRequest`
  is the single replacement point; the default goes through XHR + FormData.
- **Custom requests**: `customRequest` is the replacement point; the default uses
  XHR + FormData.
- **List motion**: non-picture styles expand/collapse by height, picture styles fade;
  `motionName = {p}-animate[-inline]` with a 2000ms fallback.
- **Progress**: upload-specific presentation options compose the shared Progress component.
  Error messages use native `title` tooltips.
- **No global base styles**: for a bare `<a>` name or a native `<button>` trigger, the
  link color and form-control normalization come from your own global CSS.
  Pair the library with any CSS reset, or use the bundled `Button` / `Link`.
