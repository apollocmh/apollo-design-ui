# upload

> **层**：L3（`packages/ui`）｜ **优先级**：P2 ｜ **复杂度**：L ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `es/upload/`（Upload / Dragger / UploadList / ListItem / utils /
> locale）+ `@rc-component/upload@1.1.1`（引擎：AjaxUploader / request /
> attr-accept / traverseFileTree / uid）。上游是**兼容性规格**，不是代码来源。
> 分析产物：[`docs/analysis/upload.md`](../../../../docs/analysis/upload.md)。

---

## 1. 职责

文件上传：选择 / 拖拽 / 粘贴三种入口，XHR 上传（可完全替换为 `customRequest`），
受控或非受控的文件列表状态机（`maxCount` 裁剪、`beforeUpload` 三态、删除可被否决），
列表形态 text / picture / picture-card / picture-circle 与 `type="drag"` 的拖拽区。

它是本仓**第一个自带上传引擎**的组件：`rc-upload` 全部 5 个模块都在 `engine/` 下重写
（H5 禁止依赖 `@rc-component/*`），对外只暴露 antd 的 `UploadProps` 面。

## 2. 文件布局

```
upload/
├── Upload.ts                # 包装层（fileList 状态机 + onChange 协议 + drag/select 分支）
├── UploadList.ts            # 列表容器（MotionList 四态 diff + appendAction fade）
├── UploadList/
│   ├── ListItem.ts          # 单项（图标/名称/操作/进度/error title）
│   └── MiniProgress.ts      # 内联进度条（Progress 未落地，见 §6 P1）
├── Dragger.ts               # type='drag' + DraggerProps（HTML 属性透传）
├── engine/
│   ├── AjaxUploader.ts      # 隐藏 input + 点击/键盘/拖拽/粘贴入口
│   ├── request.ts           # XHR + FormData（数组值 key[]、进度、abort）
│   ├── attr-accept.ts       # accept 过滤（扩展名 / MIME 通配）
│   ├── traverse-file-tree.ts# directory 递归（drop / input 两条路径共用）
│   └── uid.ts               # 自增 uid
├── utils.ts                 # file2Obj / updateFileList / getFileItem / removeFileItem / isImageUrl / previewImage
├── interface.ts             # 类型重定义（H2：不复制）
├── style/{token.ts,index.ts}# Component Token 2 个 + 静态 CSS
├── demo/                    # 3 个 demo（basic / dragger / picture-card）
└── __tests__/               # L1+L2 / L3 / L4 / L5 / L6(visual) / L7(theme) + demo 冒烟
```

## 3. `.vue` / `.tsx` 选择

全部 `.ts`（渲染函数）—— 与 `COMPONENT-RULES.md` §2 一致：多形态分支
（drag / select / picture-card）+ 大量 `h()` 子组件拼接，模板化反而更难对齐
antd 的条件渲染结构。全仓无 `.tsx`（H3）。

## 4. Component Token（registry：**2** 个）

| Token | 默认值 | 说明 |
|---|---|---|
| `actionsColor` | `var(--apollo-color-icon)` | 列表操作图标的颜色（antd 同：`colorIcon`） |
| `pictureCardSize` | `102px` | picture-card 磁贴边长 = `controlHeightLG(40) × 2.55`（构建期解析） |

派生量（不进 token 表，随 `--apollo-*` 别名走）：
`uploadThumbnailSize = fontSizeHeading3 × 2`、`uploadProgressOffset = marginXS/2 + lineWidth`、
`uploadPicCardSize = pictureCardSize`。

## 5. 与 antd 的行为差异

同步登记在 [`COMPATIBILITY.md` §9.2](../../../../COMPATIBILITY.md)：**D71~D76**
（drop 事件通道 / 内联 MiniProgress / 原生 title / flushSync 无对应物 /
不注入全局基础样式 / collapse handler 走 `hooks` 对象）。
本组件没有 BUG 或 DEFECT 类差异。

L6 视觉：9 张（3 variant × 3 viewport）**全部 0.000% exact**。

## 6. 已知缺口

| # | 缺口 | 落点 | 状态 |
|---|---|---|---|
| P1 | **进度条**：`Progress` 未落地 ⇒ 内联 `MiniProgress` 复刻 line-small 的 DOM 与类名 | `UploadList/MiniProgress.ts` → 换成 `<Progress type="line" size="small" :showInfo="false" />` | INTENDED（D72） |
| P2 | **错误提示**：`Tooltip` 未落地 ⇒ 用原生 `title` 承载错误文本（**交互不等价**：延迟 ~1s、不可定制） | `ListItem.ts` 的 `dom` computed → 用 `<Tooltip title={file.error?.message}>` 包住 | INTENDED（D73） |
| P3 | **`Wave` 波纹**：点击触发区无波纹（基建未落地） | 与 button / checkbox / radio / switch 同判 | PLATFORM |
| P4 | **`v-model:fileList` 与 `change` 双通道已实现**（C11）；但全仓其余 20 个已收口组件的 `update:*` 仍缺（PITFALLS 162） | — | 本组件**不缺** |
| P5 | `directory` 拖拽递归只有 `drop` 路径经 L2 覆盖（jsdom 无 `webkitGetAsEntry`，`dataTransfer.items` 需手工造桩）；真实浏览器的目录递归由 L6 的 9 张静态帧之外的**未覆盖**部分承担 | `engine/traverse-file-tree.ts` 的 L1 用例 | 已知，不阻塞 |

## 7. 收口证据（G13）

- 7 层：`unit` 30 / `dom-contract` 20 / `a11y` 4 / `theme` 13 / `types`（0 error）
  / `visual` **9/9 exact** / `build`（B1~B7）
- compat 基线：`tests/compat/baselines/upload.dom.json`（20 个用例，`check ok`）
- registry：11 维度全 `done`，`status: completed`
