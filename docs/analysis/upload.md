# Upload 分析（G1/G2 产物）—— antd 6.6.4

> 判据：`/tmp/antd-src/package/es/upload/`（构建产物）+ `/tmp/antd-repo/components/upload/`
> （源码 + 测试）+ `/tmp/rcup/package/es/`（@rc-component/upload@1.1.1 引擎）。
> 先于实现存在（AGENTS §2 步骤 3）。

## 1. 组件结构与文件映射

| antd / rc | 本仓落点 | 说明 |
|---|---|---|
| `@rc-component/upload` AjaxUploader | `engine/AjaxUploader.ts` | 隐藏 `input[type=file]` + 点击/键盘/拖拽/粘贴入口 |
| rc `request.js` | `engine/request.ts` | XHR 上传请求器（FormData、进度、abort） |
| rc `attr-accept.js` | `engine/attr-accept.ts` | accept 过滤（扩展名/MIME 通配） |
| rc `traverseFileTree.js` | `engine/traverse-file-tree.ts` | directory 模式递归读目录 |
| rc `uid.js` | `engine/uid.ts` | 自增 uid |
| antd `Upload.tsx` | `Upload.ts` | 包装层：fileList 状态机 + onChange 协议 |
| antd `UploadList/index.tsx` | `UploadList.ts` | 列表容器（CSSMotionList + appendAction 动效） |
| antd `UploadList/ListItem.tsx` | `UploadList/ListItem.ts`（`UploadList/ListItem.ts`） | 单项（图标/名称/操作/进度） |
| antd `utils.ts` | `utils.ts` | file2Obj / updateFileList / getFileItem / removeFileItem / isImageUrl / previewImage |
| antd `Dragger.tsx` | `Dragger.ts` | `type='drag'` + `DraggerProps`（HTML 属性透传） |
| antd `interface.ts` | `interface.ts` | 类型重定义（H2：不复制） |

## 2. 行为契约（判据清单，L1 直接对拍）

1. **隐藏 input**：`type=file`，`display:none`，`accept`（string 或 accept.format）、
   `multiple`、`capture`（null ⇒ 不带属性）、`directory ⇒ directory+webkitdirectory`；
   name/disabled 透传；onChange 后**重置 uid**（同选同一文件也能再次触发）。
2. **accept 双形态**：string ⇒ 原生过滤（`filterFile`：非 directory 时按 attrAccept）；
   对象 `{ format, filter: 'native' | fn }`：`'native'` ⇒ 不过滤。
3. **点击/键盘**：根 `role=button` + `tabIndex=0`（`hasControlInside=false` 时）；
   Enter ⇒ 打开文件框；`openFileDialogOnClick=false` ⇒ 不开；BUTTON 内点击先
   focus 父级再 blur 目标（rc 判据）；input click stopPropagation（issue 19948）。
4. **beforeUpload**：返回 `false` ⇒ 不进列表不上传（onChange 仍触发一次，文件
   status 无 uploading）；返回 `LIST_IGNORE`（导出常量 `__LIST_IGNORE_…__`）⇒
   完全忽略（onChange 不触发）；返回 File/Blob/对象 ⇒ 替换上传内容。
5. **fileList 状态机**：受控 `fileList` / 非受控 `defaultFileList`；受控模式自动
   补 uid（`__AUTO__ts_i__`，frozen 对象跳过）；`maxCount=1` ⇒ 替换（保留最后一
   个）；`maxCount>1` ⇒ 超出部分裁掉且**不触发** onChange（removed 例外）。
6. **onChange 协议**：`{ file, fileList, event? }`；batchStart 时逐个触发
   （每文件一次，React18 flushSync 语义 ⇒ Vue 侧同步触发即可）；uploading/
   done/error/removed 各阶段 uid 匹配的文件被替换；percent 进度在 event 上。
7. **上传请求器**：XHR + FormData（数组值 `key[]` 逐项 append）；2xx 成功；
   响应体尝试 JSON.parse；`X-Requested-With` 默认带（null 可关）；headers null
   值跳过；withCredentials；onProgress e.percent = loaded/total*100；返回
   `{ abort() }`。
8. **删除**：onRemove 可返回 false/Promise<false> 阻止；删除后原文件标
   `removed`（uid 匹配，frozen 跳过）并 abort 请求。
9. **列表**：默认 `showUploadList=true`；对象形态 `{showRemoveIcon,
   showPreviewIcon, showDownloadIcon, removeIcon, previewIcon, downloadIcon,
   extra}`，函数形态按文件判定；remove 图标**跟随 disabled**（issue 46171），
   download/preview 不跟随；downloadIcon 仅 done 态。
10. **previewImage**：canvas 200×200 居中裁剪；gif/svg 走 FileReader dataURL；
    非图片 resolve('')。
11. **进度条**：`<Progress type="line" percent showInfo=false>`（small）——
    本仓内联最小复刻（见 §4 P1）。
12. **error 提示**：antd 包 Tooltip（本仓 tooltip 未落地）⇒ 见 §4 P2。
13. **Dragger**：`type='drag'`；`-drag-uploading`（列表有上传中）/`-drag-hover`
    （dragover 态）/`-disabled`；DraggerProps = HTML Attributes 排除
    defaultFileList/fileList/onChange 等白名单外键。

## 3. API 面（Vue 化）

- 事件：`change(info)` / `remove(file) ⇒ boolean|Promise<boolean>`（onRemove）/
  `preview` / `download` / `drop`；rc 层 `batch-start`、`success`、`error`、
  `progress` 经包装层消化，不对外（antd 对外也只有 change）。
- `v-model:fileList` + `onChange` 双通道（C11）。
- Ref：`upload`（AjaxUploader 实例：abort/uploadFiles via uid）、`nativeElement`、
  `fileList`、`onBatchStart/onSuccess/onProgress/onError`（antd ref 测试面）。
- 语义槽：`classNames/styles = { root, list, item, trigger }`（+函数式）。
- `children` = 触发区内容（drag 容器 / select 按钮）。

## 4. 依赖缺口与替代（D 登记候选）

| # | 缺口 | 处置 | 分类 |
|---|---|---|---|
| P1 | Progress 组件未落地（ListItem uploading 进度条） | 内联 `MiniProgress`：复刻 line-small 固定 DOM（role=progressbar + aria-valuenow/min/max + body/rail/track），rail 高度/track 宽度内联样式，track 色内联 `var(--apollo-color-primary)`（error 时传 strokeColor ⇒ 内联色） | INTENDED（progress 落地后换真组件） |
| P2 | Tooltip 未落地（error 状态 title 提示） | error 项外层 `title` 原生属性承载提示文本 | INTENDED |
| P3 | `flushSync`（React18 批处理闸） | Vue 无此问题：onInternalChange 同步执行即等价 | PLATFORM |

## 5. Token（registry：2 个）

`actionsColor = colorIcon`（var）、`pictureCardSize = controlHeightLG * 2.55`
（构建期解析）；派生：`uploadThumbnailSize = fontSizeHeading3*2`、
`uploadProgressOffset = marginXS/2 + lineWidth`、`uploadPicCardSize =
pictureCardSize`。

## 6. 样式段

`genUploadStyle()`：base（wrapper/select/hidden/disabled）+ dragger + picture +
pictureCard + list + motion（collapse-motion 复用 + fade/animate）+ rtl ——
产物逐条对拍（提取脚本同 input 流程）。
