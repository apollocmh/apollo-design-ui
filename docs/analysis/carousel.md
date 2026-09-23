# Carousel（走马灯）分析 — antd 6.6.4

> 依据：`/tmp/antd-src/package/es/carousel/`（实现 + 样式产物）、
> `node_modules/.pnpm/@ant-design+react-slick@2.0.0…`（slick 默认值与 Settings 类型，机械判据）、
> SSR 探针实测 DOM（本文 §3 全部为 react-dom/server.renderToStaticMarkup 真实输出摘录）。
> 分析日期：2026-09-23。结论供 G4 裁决 `carousel-engine`。

---

## 1. 组件事实（registry 口径）

- antd 运行时依赖：`@ant-design/react-slick`（React 移植，strategy=**drop**）+ `@rc-component/util`（toArray → utils）。
- 本仓依赖组件：无（dagLevel=0）；foundation：theme、utils。
- 规模：es 产物 4 文件 / ~530 行（含样式 ~390 行）；slick 侧（行为核心）在依赖包里。
- Token：8 个 Component Token + 1 个 CSS 变量 `--dot-duration`。

## 2. API 全量

### 2.1 CarouselProps（antd 侧）

`CarouselProps extends Omit<Settings, 'dots' | 'dotsClass' | 'autoplay'>`，另有：

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| effect | `'scrollx' \| 'fade'` | `'scrollx'` | fade 时给 slick 传 `fade:true` |
| dotPlacement | `'top' \| 'bottom' \| 'start' \| 'end'` | `'bottom'` | 5.x 后新增 |
| dotPosition（deprecated） | 同上 + `'left' \| 'right'` | — | left/right 映射 start/end；deprecated warning |
| dots | `boolean \| { className?: string }` | `true` | 对象时把 className 拼进 dotsClass |
| autoplay | `boolean \| { dotDuration?: boolean }` | `false` | 对象时启用圆点进度动画 |
| waitForAnimate | `boolean` | `false`（⚠️ 覆盖 slick 默认 true） | antd 显式传 `false` |
| arrows / prevArrow / nextArrow / draggable / vertical / rtl / autoplaySpeed / initialSlide / infinite / speed / cssEase / easing / slidesToShow / slidesToScroll / pauseOnHover / pauseOnFocus / pauseOnDotsHover / beforeChange / afterChange / swipe / swipeToSlide / touchMove / touchThreshold / adaptiveHeight / centerMode / centerPadding / lazyLoad / rows / slidesPerRow / variableWidth / responsive / accessibility / focusOnSelect / useCSS / useTransform / edgeFriction / onEdge / onSwipe / onReInit / slide | 透传 Settings | slick 默认 | 见 §2.2 裁剪建议 |
| prefixCls / rootClassName / className / style / id | — | — | 常规 |

⚠️ 两个覆盖点：`waitForAnimate` antd 默认 **false**（slick 默认 true）；`autoplaySpeed` antd 默认 **3000**（与 slick 相同）。

### 2.2 Settings 透传面（slick 2.0.0 defaultProps，机械判据）

accessibility=true, adaptiveHeight=false, arrows=true(⚠️ 但 antd 侧再默认 false), autoplay=false, autoplaySpeed=3000, centerMode=false, centerPadding="50px", cssEase="ease", draggable=true, easing="linear", edgeFriction=0.35, fade=false, focusOnSelect=false, infinite=true, initialSlide=0, pauseOnDotsHover=false, pauseOnFocus=false, pauseOnHover=true, rows=1, rtl=false, slide="div", slidesPerRow=1, slidesToScroll=1, slidesToShow=1, speed=500, swipe=true, swipeToSlide=false, touchMove=true, touchThreshold=5, useCSS=true, useTransform=true, variableWidth=false, vertical=false, verticalSwiping=false, waitForAnimate=true。

注意：`arrows` slick 默认 true，但 antd Carousel 解构默认 `arrows = false` ⇒ **antd 默认无箭头**。

### 2.3 Ref（CarouselRef）

`{ nativeElement: HTMLDivElement, goTo(slide, dontAnimate?), next(), prev(), autoPlay(playType?: 'update'|'leave'|'blur'), innerSlider }`。
React `useImperativeHandle` 依赖 `[slickRef.current]`。`autoPlay('leave'|'blur')` 实为 pause（slick 内部语义：leave/blur 时暂停）。

### 2.4 事件（props 回调）

`afterChange(current)` / `beforeChange(current, next)` / `onSwipe(dir)` / `onEdge(dir)` / `swipeEvent` / `onReInit` / `onInit` / `onLazyLoad` — 全部来自 Settings 透传。Vue 侧按 C11/C12 映射为 emits + `update:*` 视情况（carousel 无 value 语义，无 v-model 通道）。

## 3. DOM 契约（SSR 实测，机械判据）

### 3.1 basic（3 slides，infinite 默认 true ⇒ 有 clone）

```html
<div class="apollo-carousel css-var-…">
  <div class="slick-slider slick-initialized" dir="ltr">
    <div class="slick-list">
      <div class="slick-track" style="width:500%;left:-100%">
        <!-- 前置 clone（最后一张） -->
        <div data-index="-1" tabindex="-1" class="slick-slide slick-cloned" aria-hidden="true" style="width:20%">
          <div><div tabindex="-1" style="width:100%;display:inline-block"><h3>slide 3</h3></div></div>
        </div>
        <!-- 正片 0..n-1 -->
        <div data-index="0" class="slick-slide slick-active slick-current" tabindex="-1" aria-hidden="false" style="outline:none;width:20%">
          <div><div tabindex="-1" style="width:100%;display:inline-block"><h3>slide 1</h3></div></div>
        </div>
        <div data-index="1" class="slick-slide" tabindex="-1" aria-hidden="true" style="outline:none;width:20%">…</div>
        <div data-index="2" class="slick-slide" tabindex="-1" aria-hidden="true" style="outline:none;width:20%">…</div>
        <!-- 后置 clone（第一张） -->
        <div data-index="3" tabindex="-1" class="slick-slide slick-cloned" aria-hidden="true" style="width:20%">…</div>
      </div>
    </div>
    <ul style="display:block" class="slick-dots slick-dots-bottom">
      <li class="slick-active"><button>1</button></li>
      <li class=""><button>2</button></li>
      <li class=""><button>3</button></li>
    </ul>
  </div>
</div>
```

要点：
- track 宽 `(n+2)/n*100%`，`left:-100%`（infinite 时）；无 clone 时 `width:n/n*100%`、`left:0%`。
- slide 宽 `100/(n+2)%`（infinite）/ `100/n%`（非 infinite）。
- 每张正片包两层：`div.slick-slide > div > div[tabindex=-1, style width:100%;display:inline-block] > child`；clone 层结构相同但多 `tabindex="-1"` 在外层。
- 状态类：`slick-current`（当前）、`slick-active`（可见窗口内）；`aria-hidden` 与之联动。
- dots：`ul.slick-dots.slick-dots-{placement}`，`style="display:block"`（appendDots 默认包裹层），每项 `li > button(文本=序号)`，非激活 li 的 class 是**空字符串**。
- arrows：`button.slick-arrow.slick-prev/.slick-next`，`aria-label="Previous/Next slide"`，`data-role="none"`，`style="display:block"`，位于 `.slick-list` 前/后（slick-slider 直接子级）。

### 3.2 其他分支

| 分支 | DOM 差异 |
|---|---|
| `dots:false` | 无 `ul.slick-dots`，其余同 |
| `arrows:true` | 前后各插入一个 arrow button |
| `dotPlacement:'start'` | 根加 `apollo-carousel-vertical`；slick-slider 加 `slick-vertical`；dots 类变 `slick-dots-start`（end→`-end`，top→`-top`） |
| `effect:'fade'` | **无 clone**（3 张正片，width 20% 仍按 n+2 公式？——实测：width:20% 且 track width:500%，说明 fade 下 track/slide 宽度公式不变，但 clone 消失）；当前张内联 `position:relative;left:0;opacity:1;z-index:999;transition:opacity 500ms ease, visibility 500ms ease`，非当前张 `left:-20px/-40px;opacity:0;z-index:998`（left 按 index 递减 20%？——实测 slide1 left:0、slide2 left:-20px、slide3 left:-40px） |
| `infinite:false` | 无 clone；`width:300%`/`left:0%`；slide 宽 33.33…% |
| `autoplay:{dotDuration:true}` | 根 style 多 `--dot-duration:4000ms`（autoplaySpeed 毫秒） |

⚠️ fade 的 `width:20%`/`track 500%`：说明 slick 在 fade 模式保留 clone 时的宽度公式但**不渲染 clone 节点**（getOnDemandLazySlides / track 渲染分支）。以实测为准记录，勿凭 slick 源码记忆。

## 4. ARIA

- 无 `role`（不是 tablist/listbox 语义）；导航靠 **dots 的 button**（可聚焦）+ arrows button。
- slide：`aria-hidden` 表可达性；外层 `tabindex="-1"`（正片）；内层恒 `tabindex="-1"`。
- arrows：antd 默认渲染的 ArrowButton 带 `aria-label`（i18n：`prevSlide`/`nextSlide`，rtl 时互换文案）。
- 键盘：slick 的 accessibility=true 时在 slider 上监听 arrowLeft/Right（vertical 时 Up/Down）⇒ 行为层 L1。

## 5. Component Token（8 个）+ CSS 变量

| Token | 默认值 | 来源 |
|---|---|---|
| arrowSize | 16 | 字面量 |
| arrowOffset | marginXS (=8) | alias |
| dotWidth | 16 | 字面量 |
| dotHeight | 3 | 字面量 |
| dotGap | marginXXS (=4) | alias |
| dotOffset | 12 | 字面量 |
| dotWidthActive | 24 | deprecated（映射到 dotActiveWidth） |
| dotActiveWidth | 24 | 字面量 |

派生：`arrowLength = arrowSize / √2`（样式内 calc）；`--dot-duration` 由 `autoplay.dotDuration && autoplaySpeed` 注入根节点。Keyframes：`{prefix}-dot-animation`（width 0→dotActiveWidth）与 `-dot-vertical-animation`（height）。deprecatedTokens：`dotWidthActive → dotActiveWidth`。

⚠️ `arrowLength = 16/√2` 是**无理数**：cssinjs 用 token.calc 输出解析值；本仓构建期算 JS 值（≈11.313708498984761）——与 D50 同判（构建期解析值），但注意 calc 链 `calc(16px - 11.3137…px) / 2` 若改用 CSS calc(`16px/√2`) 无法表达除以 √2 ⇒ 该两处必须 JS 值内联。

## 6. 样式块清单（genStyleHooks 五段）

1. `genCarouselStyle`：resetComponent + `.slick-slider/.slick-list/.slick-track/.slick-slide` 骨架（touchAction、`.slick-slide` 默认 display:none、`.slick-initialized .slick-slide` display:block、slick-active 恢复 pointerEvents、`> div > div` verticalAlign:bottom、内部 radio/checkbox input visibility 联动）。
2. `genArrowsStyle`：`.slick-prev/.slick-next`（opacity .4、::after 旋转边框箭头、disabled 隐藏）。
3. `genDotsStyle`：`.slick-dots`（flex!important、li/button、`::after` 进度动画、hover opacity）。
4. `genCarouselVerticalStyle`：`{component}-vertical` 下箭头/圆点方向互换（width/height 对调、margin 纵向）。
5. `genCarouselRtlStyle`：`{component}-rtl` direction + vertical dots 的 rtl 修正。

样式全部挂在 **slick 类名**上 ⇒ 我们的实现必须渲染同名 DOM（.slick-* 是「命名空间」而非 antd 类，前缀不受 prefixCls 影响——这是 slick 命名，逐字保留）。

## 7. 引擎决策证据（carousel-engine）

### 7.1 antd DOM 契约 vs embla 结构（不可调和项）

| antd（slick） | embla-carousel |
|---|---|
| `.slick-track` 上 `width:(n+2)/n·100%` + `left:-100%` 内联，正片两侧**渲染 clone 节点**（slick-cloned，data-index -1/n） | 容器无 clone，循环靠 JS 平移 shift，无 slick-cloned 概念 |
| 每张 slide 内联 `width:%`、`outline:none`、data-index、aria-hidden、tabindex | slide 无这些属性（类名 embla__slide） |
| fade 分支：无 clone + opacity/z-index/transition 内联 | 无 fade 语义（自行 opacity） |
| dots（ul>li>button+序号文本）、arrows（data-role="none"）由 slick 渲染，antd 包一层 | dots/arrows 不存在，插件化且 DOM 不同 |
| 拖拽：track 滑动 + edgeFriction 橡皮筋 + waitForAnimate 锁 | snap 物理：吸附、回弹、循环语义自成一套 |
| SSR 首帧即含 clone 与定位样式 | 首帧由 JS 初始化后才成形 |

**结论**：用 embla 就必须自建「slick 形态 DOM 渲染层」（clone、定位、类名、aria 全部自己算），embla 只剩拖拽物理——而 slick 的拖拽/循环语义与 embla 的 snap 物理并不同源，对齐 antd 行为仍要自己写一套。即 embla **不能降低**对齐成本，反而引入双引擎职责重叠 + 第三方运行时依赖（本仓对 antd 生态一律替换的 R 系纪律外溢）+ SSR 首帧不一致（L4 oracle 直接红灯）。

### 7.2 slick 侧工作量盘点（自建范围）

核心状态机（可参照本地 `@ant-design/react-slick@2.0.0/es` 为行为判据）：track 定位（含 infinite 的 translate 修正）、next/prev/goTo、animationEnd 归一、autoplay 定时器（pauseOnHover/Focus/DotsHover + leave/blur）、fade 分支、拖拽（pointer 事件、edgeFriction、touchThreshold）、vertical、slidesToShow/ToScroll 公式。首版（P0）聚焦：单张默认 + fade + dots/放置 + arrows + infinite(含 clone) + autoplay + goTo/next/prev/autoPlay + 拖拽基础；`responsive/rows/slidesPerRow/centerMode/variableWidth/lazyLoad/asNavFor/focusOnSelect` 列为**显式不支持清单**（INTENDED 登记，警告而非报错）。

### 7.3 建议

**B（自建）**。理由：A 的「省成本」前提（DOM/行为可对齐）经核对不成立（§7.1）；自建状态机规模中等（slick 核心千余行，我们只需对齐用到的子集），且是唯一能让 L4 DOM oracle 与 L6 视觉对齐的路径。registry `rc-map.mjs` 的 rationale 本就倾向自研（"自研可控性更高"），embla 仅作为成本超预期的备选。

## 8. 需要用户裁决的点

1. `carousel-engine`：A（embla）还是 B（自建）——本文建议 **B**。
2. Settings 透传裁剪：首版「显式不支持」清单（§7.2）是否接受（INTENDED 登记 + dev warning）。
3. `slidesToShow>1` 多张轮播：首版只保证 DOM 公式正确 + 单张行为全覆盖，多张行为测试后补——是否接受。
