# QRCode（二维码）· G1–G3 分析产物

> 步骤 3 的产物先于步骤 5 存在（AGENTS.md §2）。
> 事实来源：antd 6.6.4 `es/qr-code/`（index 134 + QrcodeStatus 43 + style 80）；
> 引擎判据 `@rc-component/qrcode@2.0.0`（es/ 1476 行）。

---

## 1. 组件一句话

二维码生成器：`value` 内容编码为 canvas/svg 图形，支持前景/背景色、中心图标、
尺寸、纠错级别与三种状态覆盖层（expired/loading/scanned）。

## 2. 引擎选型（registry strategy=reuse 的落定）

`@rc-component/qrcode` 绑定 React（H5 禁用）。registry 建议复用第三方纯 JS 库
（候选 `qrcode` / `qr-code-styling`，注明「选型需实测确认」）。

**落定：vendor 同一份 `qrcodegen.js`**（Project Nayuki，MIT，rc 包 libs 里就是它）：

| 候选 | 结论 |
|---|---|
| `qrcodegen`（Nayuki，MIT）✅ | antd 链路同源 ⇒ 矩阵与 SVG path **逐字节一致**；L4 byte 级 oracle 可对齐 |
| `qrcode`（node lib）❌ | SVG/toDataURL 输出格式不同（rect 列表 vs path），byte 级必分叉 |
| `qr-code-styling` ❌ | 面向样式化场景，依赖 DOM 生成管线，格式同样不同 |

QR 编码是**标准化纯算法**：同一输入的模块矩阵由规范唯一决定（版本/掩码选择规则
确定）；差异只可能出现在序列化层。qrcodegen 是唯一与 antd 序列化同源的候选。
H5 合规：rc 的 React 绑定层（hooks/JSX）零复用，只复用其 vendored 的纯 JS 算法库
（MIT 许可，头注释保留）。

结构：`engine/qrcodegen.js`（vendored，`.d.ts` 手写 API 面）+ `engine/utils.ts`
（rc utils 逐行移植：ERROR_LEVEL_MAP/generatePath/excavateModules/getImageSettings/
getMarginSize/isSupportPath2d + computeQr 纯函数）。

## 3. DOM 契约

```
div.{p}-qrcode [-borderless]                style: backgroundColor + width/height(size)
 ├─ (status!=active) div.{p}-qrcode-cover   absolute z10, bg=Component Token
 │    ├─ expired: p.{p}-qrcode-expired + Button(link, ReloadOutlined, locale.refresh)*
 │    ├─ loading: Spin
 │    └─ scanned: p.{p}-qrcode-scanned
 └─ canvas 形态: canvas[role=img][width/height=size] + (icon) 隐藏 img[alt=QR-Code]
    svg   形态: svg[viewBox='0 0 N N'][role=img] > (title) + path[bg] + path[fg] + (image)

* refresh 按钮仅 onRefresh 提供时渲染（locale.refresh 为文案）。
```

- canvas 绘制（浏览器端）：`canvas.width = size * devicePixelRatio`，ctx.scale
  归一到模块坐标，bg fillRect 全域 + fg Path2D(fill)（fallback 逐格）；
  icon 经隐藏 img 预载，onLoad 后 excavate + drawImage。
- 无 value ⇒ 渲染 null + dev 告警；errorLevel=L + icon ⇒ dev 告警。
- aria：canvas/svg 都是 `role="img"`，**无** aria-label/title（上游原样 ⇒ U11）。

## 4. Props / Events / Locale

`value(string|string[]) / type(canvas|svg) / icon / iconSize / color(colorText) /
errorLevel(M) / status(active) / bordered(true) / bgColor(transparent) / marginSize /
statusRender / boostLevel / title(svg) / onRefresh ⇒ refresh emit / 语义槽
{root, cover}`。locale：`QRCode.{expired, refresh, scanned}`。

## 5. 样式契约（1 个 Component Token）

`QRCodeCoverBackgroundColor = FastColor(colorBgContainer).setA(0.96).toRgbString()`
⇒ utils `Color` 同判（switch handleShadow），构建期解析值 `rgba(255,255,255,0.96)`。
`QRCodeTextColor` 是 mergeToken 别名（= colorText）⇒ 直接 `var(--apollo-color-text)`。
根段：flex 居中 + 白底 + LG 圆角 + split 边框 + overflow hidden；
`-borderless`：透明边框 + 零 padding/圆角；`> canvas`：align-self:stretch + flex:auto。

## 6. Vue API 设计（INTENDED）

| # | 差异 | 分类 |
|---|---|---|
| I1 | `onRefresh` ⇒ `refresh` emit（C19） | INTENDED |
| I2 | `ref` ⇒ `expose({ nativeElement })` | INTENDED |
| I3 | canvas 绘制时机：onMounted + watch（flush:'post'）vs React 每次 render 后 effect | INTENDED |

## 7. 测试策略

- L4：SVG path `d` byte 级（矩阵确定性）+ canvas 空元素结构 + status 覆盖层 +
  语义槽。bg hex 经 CSSOM 规范化（PLATFORM allow）。
- L1：generatePath 两种模板（行中/行末）、excavate、getMarginSize 优先级、
  null+告警、三态覆盖层、statusRender、refresh 链。
- L6：canvas 像素（同矩阵 + 同绘制算法 ⇒ 一致）与 svg 3 variant × 3 viewport。
