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
| beforeUpload | Hook before uploading. Return `false` to stop (still emits `change` once), `LIST_IGNORE` to skip entirely, or a `File`/`Blob`/string to replace the payload. A rejected hook stops that file | `(file: RcFile, fileList: RcFile[]) => void \| boolean \| string \| Blob \| Promise<…>` | — |
| capture | Media capture, forwarded to the native input | `string \| boolean` | — |
| classNames | Semantic class names: `{ root, trigger, list, item }` (or a function) | `UploadSemanticClassNames \| ((info) => …)` | — |
| customRequest | Replace XHR; the second argument provides `defaultRequest`. Return an abort handle to cancel the request | `(options, { defaultRequest }) => { abort: () => void } \| void` | — |
| data | Extra form data (function form is evaluated per file) | `object \| ((file: RcFile) => object \| Promise<object>)` | `{}` |
| defaultFileList | Default file list (uncontrolled) | `UploadFile[]` | — |
| directory | Upload a folder (recursed by `traverse-file-tree`) | `boolean` | — |
| disabled | Whether disabled | `boolean` | — |
| fileList | Controlled file list (same as `v-model:fileList`) | `UploadFile[]` | — |
| headers | Request headers (`null` values are skipped) | `Record<string, string \| null>` | — |
| isImageUrl | Override the "is image" predicate | `(file: UploadFile) => boolean` | Built-in predicate |
| listType | List style | `'text' \| 'picture' \| 'picture-card' \| 'picture-circle'` | `'text'` |
| maxCount | Max number of files. With `1`, a new file replaces the old one; exceeded files never enter the list and do **not** emit `change` | `number` | — |
| method | Request method | `string` | `'post'` |
| multiple | Whether multiple selection is allowed | `boolean` | `false` |
| name | Field name sent to the server | `string` | `'file'` |
| onPreview | Replace preview navigation | `(file: UploadFile) => void` | — |
| onDownload | Replace the default download service | `(file: UploadFile) => void` | — |
| onRemove | Confirm removal; false prevents it | `(file: UploadFile) => void \| boolean \| Promise<void \| boolean>` | — |
| openFileDialogOnClick | Whether clicking the trigger opens the file dialog | `boolean` | `true` |
| pastable | Paste from clipboard (document-level listener) | `boolean` | — |
| previewFile | Custom thumbnail generator for the picture family | `(file: File \| Blob) => PromiseLike<string>` | 200×200 centered thumbnail |
| progress | Upload-list progress presentation options, detailed below | `UploadListProgressProps` | Full width, 2px, no information |
| showUploadList | Show the list, or configure it: `{ showPreviewIcon, showRemoveIcon, showDownloadIcon }` | `boolean \| ShowUploadListInterface` | `true` |
| type | `'drag'` is equivalent to using `UploadDragger` | `'select' \| 'drag'` | `'select'` |
| withCredentials | Whether to send cookies on cross-origin requests | `boolean` | `false` |
| class / style | Native attrs on the outer wrapper; local style wins over semantic root style | — | — |
| hasControlInside | Whether the trigger already contains a focusable control (drives `role="button"` / `tabIndex` on the engine root) | `boolean` | `true` |
| locale | Override built-in text | `{ uploading, removeFile, downloadFile, previewFile }` | from `LocaleProvider` |

`onPreview(file)` and `onDownload(file)` are service Props: supplying them replaces
native preview navigation or the default `window.open` download. `onRemove(file)` is
an optional confirmation Prop; `false` or a promise resolving to false keeps the file.
These callbacks do not also emit notification events.

`fileList` owns the accepted list. An update is a proposal; rejecting it does not mutate
the parent's files, and removing the binding keeps the last accepted list. Removing or
replacing an accepted active file aborts its request; late callbacks cannot update it.
`maxCount` also excludes excess requests. Action/data/request failures mark that file
as error while other files in the batch continue. A stopped beforeUpload file still
produces an UploadFile payload with originFileObj and no uploading status.

Native `class` and `style` belong to the wrapper. Other native attrs/listeners target
the interactive trigger, and `id`/`name` target the real file input. With no internal
control, Enter and Space activate the trigger; disabled triggers leave the tab order.
UploadDragger forwards all Upload slots, callbacks, model events and refs; `height`
sets the wrapper height and defaults hasControlInside to false.

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
| appendAction | — | Trailing upload trigger content for picture-card/circle; preserves the file input and all returned nodes. A present empty slot takes precedence |

### Expose

| Name | Description |
|---|---|
| `nativeElement` | Root element (`HTMLElement \| null`) |
| `fileList` | Current file list |
| `upload` | Engine handle: `abort(fileOrUid?)`, `uploadFiles(files): Promise<void>`, `getInputRef()` |
| `onBatchStart` / `onSuccess` / `onProgress` / `onError` | Programmatic lifecycle hooks; the engine normally calls these itself |

### Types

`UploadFile`, `UploadProps`, `UploadChangeParam`, `UploadListType`, `ItemRender`,
`ShowUploadListInterface`, `UploadLocale`, `UploadRef`, `UploadSlots`, `UploadConfig`, `DraggerProps`, `RcFile` (= `File & { uid }`),
`LIST_IGNORE` (sentinel for `beforeUpload`).

Thumbnail generation is local state: it starts on mount, reruns when its source or
handler changes, and does not write thumbUrl into controlled files. Removed sources
and unmounted lists ignore late results; built-in image resources are released.
Current `theme.components.Upload` supports actionsColor and pictureCardSize; native
CSS variables may override both. The default card size follows controlHeightLG.

The unused supportServerRender and styleAttrs fields were removed in the 0.0.0
development version. SSR works directly; use native style for root styling. There is
no compatibility layer or deprecation period for these fields.

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
