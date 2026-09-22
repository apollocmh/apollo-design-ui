# Watermark 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/watermark/`（只读参照，H2）
- 分析产物：`docs/analysis/watermark.md`（G1，先于实现存在）
- 组件：`Watermark`（注册名 `AWatermark`）

## 2. 与 antd 的行为差异清单

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| — | **无样式表**：全内联 style + canvas 绘制 ⇒ 不注册 `COMPONENT_STYLES`、无 Component Token | INTENDED | L7「无样式表契约」 |
| — | MutationObserver 走 `@apollo-design/utils` 的 `observeMutation`（元素→回调集合的全局单例）而不是裸 `new MutationObserver` | PLATFORM | L1 防篡改用例 |
| — | 无 canvas 环境（`getContext('2d')` 返回 null，如 jsdom）**跳过绘制**而不抛错 | PLATFORM | L5/demo 测试能在 jsdom 挂住 |
| — | ErrorBoundary 式能力（antd 无）不适用；`inherit` 用 `provide/inject` 而非 React context | PLATFORM | L1 inherit 用例 |
| — | demo `custom` 用原生控件替换 Form/Slider/ColorPicker（依赖未落地） | PLATFORM | demo 文件头 |
| — | demo `portal` 未做（依赖未落地的 Modal / Drawer） | PLATFORM | §5 缺口 |

## 3. .vue / .tsx 选择

- `Watermark.ts` 渲染函数（非 SFC）：根 div 同时承担 expose ref 与观察目标，且
  `targetElements`（container + 嵌套面板注册的子元素）是运行时计算的集合
  （badge / Tag / Alert 同范式）。

## 4. Component Token 清单（0 个）

无样式表。运行时 token 由 `useToken()` 取**实值**（不是 CSS 变量）：

| 用途 | token | 默认 |
|---|---|---|
| zIndex | `zIndexPopupBase - 1` | 1000 − 1 = 999 |
| font.color | `colorFill` | `rgba(0, 0, 0, 0.15)` |
| font.fontSize | `fontSizeLG` | 16 |

## 5. 已知缺口

- demo `portal`（Modal / Drawer 继承水印）未做：两个组件未落地。`context.ts` 的
  `usePanelRef` 已就绪，等面板组件落地后接上即可。
- `image` 的跨域细节（`crossOrigin` / `referrerPolicy`）与 antd 一致，但没有
  真实外链图片的回归（视觉用例用内联 SVG data URL）。

## 6. 关键判据速查

- **水印 div 是运行时 append 的**：无 class、无 hidden、`visibility: visible !important`、
  `pointer-events: none`、`background-repeat: repeat`；style 每次全量重写。
- **zIndex 默认** = `zIndexPopupBase - 1`；**rotate 默认** -22；**gap 默认** [100, 100]。
- **offset 修正**：`position = offset - gap / 2`；> 0 才写 `left/top` 与
  `width/height: calc(100% - Npx)`，最后写 `backgroundPosition`。
- **contentLines 为空 ⇒ 0×0**：不调用 `drawImage`（零尺寸画布保护）。
- **防篡改**：`reRendering(mutation)` 认「removedNodes 含水印元素」与
  「attributes 且 target 是水印元素」；container 的 style 被改则回写 `fixedStyle`。
- **onRemove**：水印换父时触发；组件卸载不触发（`disposeAll` 直接清 Map）。
- **style 合并**：`{...fixedStyle, ...props.style}` —— **用户 style 覆盖** fixed
  （L4 `watermark:style-override-fixed` 钉住）。
- **class 顺序**：`className → contextClassName → rootClassName`。
