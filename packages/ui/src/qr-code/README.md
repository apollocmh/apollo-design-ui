# QRCode 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/qr-code/`（170 行薄壳 + style 80 行，只读参照，H2）
- 分析产物：`docs/analysis/qr-code.md`（G1–G3）
- **引擎 vendored（strategy=reuse 落定）**：`engine/qrcodegen.js`（Project Nayuki，
  MIT——与 antd 链路 `@rc-component/qrcode@2.0.0` 的 libs **同源**）+ `engine/utils.ts`
  （rc utils 逐行移植，其逻辑来自 `qrcode.react`，ISC）。
  ⚠️ 不选 `qrcode` / `qr-code-styling`：path 序列化格式与 antd 不同 ⇒ 破坏 L4
  byte 级 oracle。见 `docs/analysis/qr-code.md` §2。
- 复用基建：`useLocale('QRCode')`、Button（refresh 按钮）、Spin（loading 覆盖层）、
  `useMergeSemantic`/`semanticRootStyle`、icons 的 ReloadOutlined

## 2. 与 antd 的行为差异清单

同步到 `COMPATIBILITY.md` §9.1 / §9.2。

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D64 | 事件：`onRefresh` ⇒ `refresh` emit（C19） | INTENDED | L1 |
| U11 | **可访问性**：canvas/svg 是 `role="img"` 且**无** aria-label/title（上游原样）⇒ axe 的 role-img-alt / svg-img-alt 豁免 | UPSTREAM | L5 |
| — | bg 色经 jsdom CSSOM 规范化（hex → rgb） | PLATFORM | L4 allow（carousel left:0 同族） |

## 3. 实现要点

- canvas 绘制：`devicePixelRatio` 缩放 + Path2D fill（fallback 逐格 fillRect）；
  Vue 侧走 `onMounted` + `watch(qr, flush:'post')`（React 是每次 render 后 effect）。
- icon：隐藏 `<img>` 预载，`onLoad` 触发重绘；`excavate` 挖空中心模块。
- `emits` 声明会把 `onRefresh` 从 props 剥离 ⇒ 监听器存在性从
  `instance.vnode.props.onRefresh` 探测（**新坑 #68**）。
- `color` 默认 = 默认主题 `colorText`（构建期解析值，D50 同判）。
- **尺寸的两条通道别混**（Issue #36）：
  - HTML `width`/`height` **属性** = `size`（画布坐标尺寸，恒为数字）；
  - CSS `width`/`height` = **调用方 `style`**（antd 给 rc 的是
    `style: { width: style?.width, height: style?.height }`，会把 rc 内部的
    `{ height: size, width: size, ...style }` 覆盖成 `undefined` ⇒ 调用方没传
    style 时 canvas **没有任何内联尺寸**，视觉尺寸交给 CSS 的 `width/height:100%`）。
    ⚠️ **不是** `size` —— 真浏览器探针实测两侧都是
    `<canvas height="160" width="160" role="img">`（computed 134×134）。
- **数值补 `px`**：React 会自动为数字内联样式补 `px`，Vue 不会 ⇒ 带值时一律过
  `px()`。根那里还要把 px 化后的值**再覆盖回**调用方 style —— 否则根 vnode 末尾
  展开的 `attrs.style` 会用裸数字把它顶掉，整个声明被 CSSOM 丢弃。
- **canvas 重绘挂 `watchEffect(post)`**（Issue #37）：上游 rc 用的是
  `React.useEffect(() => {...})` —— **无依赖数组 ⇒ 每次渲染后都重绘**。
  ⚠️ 别改写成显式依赖数组（`watch([qr, imageLoaded], …)` 会漏掉 `bgColor` / `color` /
  `size` ⇒ 只改颜色时画布保留旧像素，而 SVG 分支会跟着变 ⇒ 两侧不一致）。
  ⚠️ `imageLoaded` 必须**显式读一次**：图片 `onLoad` 只置真该标记，`imageEl` 的
  **引用不变** ⇒ 不显式订阅就收不到「图载好了、该补画了」。

## 4. Component Token（1 个）

`QRCodeCoverBackgroundColor` = `FastColor(colorBgContainer).setA(0.96)` —— utils
`Color` 算出逐字节相同的 rgba 串（switch handleShadow 同判），构建期解析值。

## 5. 测试矩阵

| 层 | 文件 | 条数 | 钉什么 |
|---|---|---|---|
| L1/L2 | `__tests__/index.test.ts` | 15 | generatePath/excavate/getMarginSize、null+告警、canvas/svg 结构、icon 预载、三态覆盖层、statusRender、ref、语义槽 |
| L3 | `__tests__/type.test-d.ts` | 12 | status/errorLevel/type 字面量、value 联合、iconSize、ref |
| L4 | `__tests__/semantic.test.ts` | 8 | basic/borderless/svg×2/status×3/semantic（SVG path byte 级） |
| L5 | `__tests__/a11y.test.ts` | 4 demo（2 组调用） | axe + U11 豁免 |
| L6 | `tests/visual/render/cases/{react,vue}/qr-code.*` | 3×3 | basic / custom / svg |
| L7 | `__tests__/theme.test.ts` | 9 | Token 值 + 样式段 |
| — | `tests/compat/fixtures/qr-code/*.json` | 3 | basic / svg / status-expired |

## 6. 已知边界

- canvas 的像素绘制在 jsdom 不可测（`getContext` 未实现）——L6 浏览器截图已证
  两侧像素一致（同矩阵 + 同绘制算法）。
- `value` 数组形态：多段拼接编码（rc 的 values reduce），L1 未展开（与单 string
  走同一 computeQr 入口）。
