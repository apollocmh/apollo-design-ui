# Watermark · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-src/package/es/watermark/`（构建产物 497 行）+
> GitHub v6.6.4 的 `components/watermark/{demo,__tests__}`。Component Token **0 个**
> （全内联样式，运行时 canvas 需要 token 实值）。**先于实现存在**。

## 1. 组件面

单组件 `Watermark`（注册名 `AWatermark`）。无样式表（全内联 style）。

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| content | `string \| WatermarkText \| (string\|WatermarkText)[]` | — | 文本/多行 |
| image | `string` | — | 图片水印（onload 绘制 / onerror 回落 contentLines） |
| rotate | `number` | `-22` | |
| zIndex | `number` | `zIndexPopupBase - 1`（=999） | |
| width / height | `number` | 文本测量 / 图片 [120,64] | |
| font | `WatermarkFont` | color=colorFill, fontSize=fontSizeLG, fontWeight='normal', fontStyle='normal', fontFamily='sans-serif', textAlign='center' | |
| gap | `[number,number]` | `[100,100]` | |
| offset | `[number,number]` | gap/2 | |
| inherit | `boolean` | `true` | 子树是否继承水印（context） |
| onRemove | `() => void` | — | 水印被移动/换父时（6.0.0+） |
| className/rootClassName/style | — | — | 根 div（fixedStyle: position:relative + overflow:hidden） |
| children | 默认插槽 | — | |

## 2. 行为契约（逐条）

1. **水印 DOM 是运行时 append 的 div**（无 class/hidden 属性，`visibility:visible !important`），
   style = `{zIndex, position:absolute, left:0, top:0, width:'100%', height:'100%',
   pointerEvents:none, backgroundRepeat:repeat, backgroundImage:url(data:),
   backgroundSize:${floor(filledWidth)}px, [offset 修正后的 left/top/width/height/backgroundPosition]}`。
2. **offset 修正**：positionLeft = offsetLeft - gapXCenter；>0 ⇒ left=positionLeft px、
   width=calc(100% - Npx)、positionLeft 归 0；top 同理；最后 backgroundPosition =
   `${positionLeft}px ${positionTop}px`。
3. **canvas 绘制三步**（useClips 机械移植）：内容画布（多行 fillText，行距
   fontSize*ratio + FontGap*ratio，FontGap=3）→ 旋转画布（maxSize×maxSize，四角
   旋转变换取包围盒）→ 交错平铺画布（(cutWidth+gapX*ratio)*2 × cutHeight+gapY*ratio，
   三次 drawImage 形成交错布局）→ `toDataURL()`；返回 [base64, filledWidth/ratio,
   filledHeight/ratio]。
4. **测量**：无 image 且有 contentLines ⇒ 逐行 measureText 取最大宽、行高累加
   （fontBoundingBoxAscent+Descent）；contentLines 为空 ⇒ 0×0（不 drawImage
   零尺寸 —— 测试钉住）；image ⇒ [120,64] 兜底（被 width/height 覆盖）。
5. **单例缓存**（useSingletonCache）：只记最近一次参数，参数相同返回旧结果；
   image/NaN/HTMLElement 参数不参与比较。
6. **raf 节流**（useRafDebounce）：执行标记 + 一帧后复位。
7. **MutationObserver 防篡改**：观察 container（+嵌套子元素）；`removedNodes`
   含水印元素 或 水印元素属性被改 ⇒ syncWatermark 重绘；container 的 style 被
   改 ⇒ 把 fixedStyle 的键回写。
8. **onRemove**：appendWatermark 时发现已有水印但换了父容器 ⇒ onRemove；
   卸载不触发。
9. **zIndex**：`zIndex ?? token.zIndexPopupBase - 1`（嵌套测试钉 999）。
10. **inherit/context**：inherit=true 时把 children 包进 WatermarkContext.Provider
    （add/remove 嵌套面板水印）；false 则不包。Modal/Drawer 未落地，嵌套用例
    以等效嵌套 div 覆盖。

## 3. Vue 对应（平台差异）

| React | Vue |
|---|---|
| useMutateObserver（rc） | 原生 MutationObserver + watch(targetElements) 重挂 |
| useComposeRef | 同一 rootRef 既做 expose 又做 container |
| useToken() | `@apollo-design/theme` 的 useToken()（无 Provider 时回退默认 token） |
| useEvent | setup 闭包天然稳定，不需要 |

## 4. 预判差异

| # | 差异 | 分类 |
|---|---|---|
| D6 | 前缀 apollo-watermark（其实水印 DOM 无类名，仅根 div className 顺序） | INTENDED |
| — | jsdom 无 2d context ⇒ 测试用 stub context（vi.spyOn getContext） | 测试设施 |
| — | demo portal 用嵌套 div 等价替换 Modal/Drawer（未落地） | PLATFORM |

## 5. 本分析没有证明什么

- 真实设备像素比下的绘制清晰度（L1 用 stub ratio=1）。
- 图片水印的网络加载（mock onload/onerror）。
