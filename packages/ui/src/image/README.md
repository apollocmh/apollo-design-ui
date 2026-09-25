# image

> **层**：L3（`packages/ui`）｜ **优先级**：P3 ｜ **复杂度**：M ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/image/`（index 325 行 / PreviewGroup 160 行 / Progress 147 行 /
> style 508 + progressAnimation 37 行）+ `@rc-component/image@1.10.0`（es ~1480 行）。
> 上游是**兼容性规格**，不是代码来源。

## 1. 职责

可预览的图片：本体（`<img>` + 占位 + 封面）、portal 预览浮层（缩放/旋转/翻转/拖拽）、
组内切换（`Image.PreviewGroup`）、生成进度占位（`Progress`，AI 墨层动效）。

## 2. 文件布局与关键决策

```
image/
├── Image.ts         # 本体：状态机 + cover + 键盘 + Preview 挂载点
├── Preview.ts       # portal 浮层：结构 + 变换 + 键盘
├── PreviewGroup.ts  # 注册收集 + 切换 + rtl 图标互换
├── Progress.ts      # 占位进度（ink 墨层 + rail + indicator）
├── context.ts       # 注册表 / provide-inject
├── hooks/{useStatus,useImageTransform}.ts
├── util.ts          # toCssSize（⚠️ 见下）
└── style/{token.ts,index.ts}
```

- **rc-image 内核自建**：发布包零 `@rc-component/*` 运行时依赖（R7/E19），
  手势与变换按 rc 的 `useImageTransform` 逐字 Vue 化。
- **`popup` 语义组单独手算**：本仓 `useMergeSemantic` 未实现 antd 的 `schema` 分支，
  `clsx` 会把 `popup` 的对象值压成 `''`（`Image` 与 `PreviewGroup` 同款）。
- **所有尺寸走 `toCssSize()`**：Vue 的 `style` **不给数字补 px**，裸数字被静默丢弃，
  且会被 CSS 的 `height:auto` 兜住 ⇒ 「有图但尺寸错」，只有 L6 能发现（D94 / PITFALLS 170）。
- **组件变量声明块挂两个根**（`.apollo-image` + `.apollo-image-preview`）：
  浮层经 Teleport 挂在 `body` 上、不在 `.apollo-image` 子树内（D95 / PITFALLS 171）。

## 3. 与 antd 的差异

登记于 `COMPATIBILITY.md` §9.2：**D94**（Vue `style` 数字值不自动补 px，实为全局平台事实）、
**D95**（无 `-css-var` 类 ⇒ 声明块必须覆盖 portal 根，同 input 的 D69）。两者都是 PLATFORM，
产物与 antd 逐字对齐。

L6 视觉 9 张（3 variant × 3 viewport）**全部 0.000% exact**。

## 4. Component Token 清单

registry 数据：token 数 = 6（+ 派生 1）。

| token | 来源 |
|---|---|
| `zIndexPopup` | `zIndexPopupBase + 80` = 1080 |
| `previewOperationColor` | `colorTextLightSolid` @0.65 |
| `previewOperationHoverColor` | `colorTextLightSolid` @0.85 |
| `previewOperationColorDisabled` | `colorTextLightSolid` @0.25 |
| `previewOperationSize` | `fontSizeIcon × 1.5` = 18px |
| `progressAnimationDuration` | `'3s'` |
| `imagePreviewSwitchSize`（派生） | `controlHeightLG` |

## 5. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | focusTrap | rc 的 `useLockFocus`；v1 简化为 ESC + 初始聚焦 |
| P2 | 触摸手势 | rc 的 `useTouchEvent`（双指缩放/拖拽）未落地，鼠标拖拽/滚轮已实现 |
| P3 | 语义槽函数式形态 | D36 同判 |
| P4 | `emits` 声明 | `update:open` / `update:current` 是运行时 `emit()`，未写进 `emits` 选项（`switch`/`radio` 的惯例是声明；声明会把监听器从 attrs 摘掉，本组件 `inheritAttrs: false` 影响面小，待统一） |
| P5 | ConfigProvider 组件级 `classNames` / `styles` | 上下文来源尚未落地（staged），当前来源只有 props 与 deprecated 的 `preview.rootClassName` / `maskClassName` |

## 6. 收口证据（G13）

- L1+L2 27 / L3 8 / L4 9（基线 `tests/compat/baselines/image.dom.json`）/ L5 18 / L7(theme) 13 /
  demo 14（`expectCount` 钉死）/ L6 **9/9 0.000% exact**
- `registry:check` 18 项 ✅ ｜ `lint`（vue-tsc + biome）✅ ｜ `test` 四层 ✅ ｜
  `test:build` **141 项 FAIL 0**（含新增 B11：产物 CSS 无 `NaN` / `undefined` / 未展开 `${`）
- registry 11 维 done，`status: completed`
