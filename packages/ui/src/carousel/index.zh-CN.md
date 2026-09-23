---
category: 数据展示
title: Carousel
subtitle: 走马灯
---

旋转木马轮播组件。

## 何时使用

- 需要在有限空间内**轮播展示**一组内容（图片 / 卡片 / 文案）。
- 需要自动播放、循环滚动或淡入淡出切换。

## 代码演示

见 [`demo/`](./demo)（7 个，与 antd 非 debug demo 一一对应）。

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| effect | 动画效果 | `'scrollx' \| 'fade'` | `'scrollx'` |
| dots | 圆点；对象形态可定制 className | `boolean \| { className?: string }` | `true` |
| dotPlacement | 圆点位置 | `'top' \| 'bottom' \| 'start' \| 'end'` | `'bottom'` |
| dotPosition | ⚠️ 已废弃，用 `dotPlacement`（left/right 映射 start/end，发告警） | 同上 + `'left' \| 'right'` | — |
| autoplay | 自动播放；对象形态可开圆点进度动画 | `boolean \| { dotDuration?: boolean }` | `false` |
| autoplaySpeed | 自动播放间隔（ms） | `number` | `3000` |
| speed | 切换动画时长（ms） | `number` | `500` |
| cssEase | 切换动画的 CSS 缓动 | `string` | `'ease'` |
| easing | 缓动（antd 文档暴露；react-slick 2.0 内部未消费，接受但无效果） | `string` | `'linear'` |
| infinite | 无限循环（渲染 clone） | `boolean` | `true` |
| initialSlide | 初始定位（0 起） | `number` | `0` |
| slidesToShow | 一屏几张（⚠️ fade 下强制 1） | `number` | `1` |
| slidesToScroll | 一次滚动几张（⚠️ fade 下强制 1） | `number` | `1` |
| draggable | 鼠标拖拽 | `boolean` | `true` |
| swipe | 触摸滑动 | `boolean` | `true` |
| touchMove | 响应触摸/鼠标移动 | `boolean` | `true` |
| touchThreshold | 触发翻页的滑动距离系数 | `number` | `5` |
| vertical | 纵向布局（`dotPlacement` 为 start/end 时自动 true） | `boolean` | — |
| waitForAnimate | 动画中拦截新切换；⚠️ antd 默认 **false**（slick 默认 true） | `boolean` | `false` |
| pauseOnHover | 悬停暂停自动播放 | `boolean` | `true` |
| pauseOnDotsHover | 圆点悬停暂停 | `boolean` | `false` |
| pauseOnFocus | 聚焦暂停 | `boolean` | `false` |
| arrows | 左右箭头；⚠️ antd 默认 **false**（slick 默认 true） | `boolean` | `false` |
| accessibility | 键盘 Left/Right 切换 | `boolean` | `true` |
| adaptiveHeight | 自适应高度 | `boolean` | `false` |
| rtl | RTL（默认跟随 ConfigProvider 的 direction，且不与 vertical 同用） | `boolean` | — |
| id / className / rootClassName / style | 常规属性（⚠️ style 落在 `.slick-slider` 上，与 antd 一致） | — | — |

### Slots

| 插槽 | 说明 | 作用域 |
|---|---|---|
| default | 轮播内容（每张一个节点） | — |
| prev-arrow / next-arrow | 自定义箭头（需 `arrows`） | `{ currentSlide, slideCount }` |

### Events

| 事件 | 说明 | 参数 |
|---|---|---|
| before-change | 切换前 | `(current: number, next: number)` |
| after-change | 切换后 | `(current: number)` |
| swipe | 滑动方向 | `('left' \| 'right' \| 'up' \| 'down')` |
| edge | 非循环模式拖到边界 | `('left' \| 'right' \| 'up' \| 'down')` |

### 键盘

| 按键 | 行为 |
|---|---|
| `ArrowLeft` | 上一张（rtl 时为下一张） |
| `ArrowRight` | 下一张（rtl 时为上一张） |

判据是 `keyCode`（37/39），焦点在 `INPUT` / `TEXTAREA` / `SELECT` 内不触发。

## Ref

| 名称 | 类型 |
|---|---|
| nativeElement | `HTMLDivElement \| null` |
| goTo | `(slide: number, dontAnimate?: boolean) => void` |
| next / prev | `() => void` |
| autoPlay | `(playType?: 'update' \| 'leave' \| 'blur') => void` |
| innerSlider | 引擎状态对象（⚠️ PLATFORM：React 侧是 slick 实例） |

## Theme（Component Token）

8 个，与 antd 的 `ComponentToken` 逐字段对齐（CSS 变量形态 `--apollo-carousel-*`）。

| Token | 说明 | 默认值 |
|---|---|---|
| arrowSize | 箭头尺寸 | `16px` |
| arrowOffset | 箭头到边缘距离（= `marginXS`） | `8px` |
| dotWidth | 圆点宽 | `16px` |
| dotHeight | 圆点高 | `3px` |
| dotGap | 圆点间距（= `marginXXS`） | `4px` |
| dotOffset | 圆点到边缘距离 | `12px` |
| dotWidthActive | ⚠️ 已废弃，= `dotActiveWidth` | `24px` |
| dotActiveWidth | 激活圆点宽（纵向时为高） | `24px` |

> ⚠️ 这 8 个是**构建期算好的解析值**，不随主题缩放（`arrowLength = arrowSize/√2`
> 的无理数几何是主因，登记 COMPATIBILITY）。零运行时下用 CSS 变量覆盖即可自定义：

```css
.my-scope .apollo-carousel {
  --apollo-carousel-dot-width: 24px;
  --apollo-carousel-dot-active-width: 48px;
}
```

## 与 antd 的差异（INTENDED 摘要）

- **自建引擎**：antd 基于 react-slick；本仓按用户裁决自建（embla 无法对齐 slick 的
  DOM 契约，见 `docs/analysis/carousel.md` §7）。DOM 与行为逐条对拍 react-slick@2.0.0。
- **Settings 不再整包透传**：`responsive` / `rows` / `slidesPerRow` / `centerMode` /
  `variableWidth` / `lazyLoad` / `asNavFor` / `focusOnSelect` / `swipeToSlide` /
  `appendDots` / `customPaging` / `unslick` 首版**显式不支持**（传了发 dev 告警）。
- **`beforeChange` / `afterChange` / `onSwipe` / `onEdge` 是事件**（C19）；
  `prevArrow` / `nextArrow` 用插槽。

## FAQ

**为什么单张内容时圆点消失了？**
slick 的 `unslick` 行为：children 数 ≤ `slidesToShow` 时引擎停摆 —— 不渲染 clone
与 dots/arrows，这是上游原样语义（L4 基线钉住）。

**`autoplaySpeed` 和 `speed` 的区别？**
`autoplaySpeed` 是两张之间停留多久；`speed` 是切换动画播放多久。slick 的自动播放
定时器是 `autoplaySpeed + 50`（原样保留）。
