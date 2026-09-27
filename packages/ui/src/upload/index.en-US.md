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

See [`demo/`](./demo) (3 demos).

| demo | Content |
|---|---|
| `basic` | Click to upload: controlled `v-model:fileList` with done / uploading / error items |
| `dragger` | Drag area (`UploadDragger`) with the `-drag-hover` state |
| `picture-card` | Picture wall: thumbnails plus the hover action layer |

⚠️ antd ships 9 further demos that depend on components not yet implemented in this
repo (Message / Progress / Tooltip / custom request libs). They are intentionally
omitted; see [`README.md`](./README.md) §6 for the landing points.

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
| progress | Progress config (passed to Progress / inline MiniProgress) | `UploadListProgressProps` | `{ size: [-1, 2], showInfo: false }` |
| showUploadList | Show the list, or configure it: `{ showPreviewIcon, showRemoveIcon, showDownloadIcon }` | `boolean \| ShowUploadListInterface` | `true` |
| type | `'drag'` is equivalent to using `UploadDragger` | `'select' \| 'drag'` | `'select'` |
| withCredentials | Whether to send cookies on cross-origin requests | `boolean` | `false` |
| rootClassName / className / style | Root class names and inline style | — | — |
| hasControlInside | Whether the trigger already contains a focusable control (drives `role="button"` / `tabIndex` on the engine root) | `boolean` | `true` |
| locale | Override built-in text | `{ uploading, removeFile, downloadFile, previewFile }` | from `LocaleProvider` |

### Events

| Event | Description | Arguments |
|---|---|---|
| `update:fileList` | Controlled update (`v-model:fileList`) | `fileList` |
| `change` | Emitted once per state transition (uploading / done / error / removed); emitted **per file** on batch start | `{ file, fileList, event? }` |
| `drop` | Drop event (⚠️ event channel only, see `COMPATIBILITY.md` D71) | `DragEvent` |
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
- **List motion**: non-picture styles use the collapse motion (height
  `0 ↔ scrollHeight`, `onXxxEnd` omitted), the picture family only fades;
  `motionName = {p}-animate[-inline]`, `motionDeadline: 2000`. Handlers are passed
  through `CSSMotion`'s `hooks` object (D76).
- **Progress / Tooltip not implemented yet**: an inline `MiniProgress` (DOM aligned
  with antd's line-small output) and a native `title`. Both are temporary and will be
  swapped back — see [`README.md`](./README.md) §6 P1 / P2.
- **No global base styles**: for a bare `<a>` name or a native `<button>` trigger, the
  link color and form-control normalization come from your own global CSS (D75).
  Pair the library with any CSS reset, or use the bundled `Button` / `Link`.
