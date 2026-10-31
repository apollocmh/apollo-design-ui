---
category: 数据展示
title: Carousel
subtitle: 走马灯
---

# Carousel

通过原生默认插槽提供轮播内容。示例见 [demo](./demo)（保留现有九个示例）。

## API

| 属性 | 说明 | 类型 | 默认 |
| --- | --- | --- | --- |
| effect | 动画效果 | `'scrollx' \| 'fade'` | `'scrollx'` |
| dots | 显示圆点，可提供内层圆点类 | `boolean \| { className?: string }` | `true` |
| dotPlacement | 圆点位置；start/end默认启用纵向 | `'top' \| 'bottom' \| 'start' \| 'end'` | `'bottom'` |
| dotPosition | 已有位置别名；请用dotPlacement | `DotPlacement \| 'left' \| 'right'` | `—` |
| autoplay | 自动播放；对象形态启用圆点进度 | `boolean \| { dotDuration?: boolean }` | `false` |
| autoplaySpeed | 播放间隔配置，毫秒 | `number` | `3000` |
| speed | 动画时长，毫秒 | `number` | `500` |
| cssEase | 实际CSS过渡缓动 | `string` | `'ease'` |
| infinite | 循环轮播，包含克隆实例 | `boolean` | `true` |
| initialSlide | 初始索引；动态变更重新定位 | `number` | `0` |
| slidesToShow | 可见页数；fade强制为1 | `number` | `1` |
| slidesToScroll | 每次翻页数；fade强制为1 | `number` | `1` |
| draggable | 鼠标拖拽 | `boolean` | `true` |
| swipe | 允许手势切换 | `boolean` | `true` |
| touchMove | 响应鼠标/触摸移动 | `boolean` | `true` |
| touchThreshold | 最小位移的除数：可视尺寸/该值 | `number` | `5` |
| vertical | 纵向布局；未传时从位置推导 | `boolean` | `—` |
| waitForAnimate | 动画中拒绝新切换 | `boolean` | `false` |
| pauseOnHover | 内容悬停时暂停 | `boolean` | `true` |
| pauseOnDotsHover | 圆点悬停时暂停 | `boolean` | `false` |
| pauseOnFocus | 本组件内聚焦时暂停 | `boolean` | `false` |
| arrows | 显示前后原生按钮 | `boolean` | `false` |
| accessibility | 启用轮播键盘操作和list焦点入口 | `boolean` | `true` |
| adaptiveHeight | list高度跟随当前页 | `boolean` | `false` |
| rtl | 水平RTL；默认读取当前Provider方向 | `boolean` | `—` |
| useCSS | 启用CSS切换动画 | `boolean` | `true` |
| useTransform | 使用transform；false时使用left/top | `boolean` | `true` |
| edgeFriction | 非循环边缘拖拽阻力 | `number` | `0.35` |
| prefixCls | 根类名前缀 | `string` | `'apollo-carousel'` |
| id | 实际根div的id | `string` | `—` |
| classNames | 内层语义类名 | `{ slider?: string }` | `—` |
| styles | 内层语义样式 | `{ slider?: CSSProperties }` | `—` |
| className | 已有内层类名别名，落点不变；新代码用classNames.slider | `string` | `—` |

原生 `class`、完整 `style`（对象、字符串、数组）、ARIA/data 与监听器落到实际根 div。原内层 `style` prop 直接移除，内层样式使用 `styles.slider`；已有不冲突的 `className` 仍落内层。Provider 的 `components.carousel` 类名/语义样式及当前方向响应替换和撤回。

`easing` 原来没有消费实现，开发阶段直接删除；缓动使用实际工作的 `cssEase`。没有兼容通道。

### 插槽

| 插槽 | 作用 | 参数 |
| --- | --- | --- |
| default | 完整 Vue 轮播内容；数组、Fragment、条件空内容和0均可处理 | — |
| prev-arrow / next-arrow | 既有原生箭头按钮的完整内容 | `{ currentSlide: number, slideCount: number }` |

箭头的禁用、名称、点击和键盘行为由原生 button 拥有。旧箭头槽中的 button 根直接改为图标/span等内容，避免嵌套按钮；多个内容节点和条件空槽不再被截断。自定义内容出现时不叠加默认箭头图形。

### 事件

| 事件 | 模板 | 参数 |
| --- | --- | --- |
| beforeChange | `@before-change` | `(current: number, next: number)` |
| afterChange | `@after-change` | `(current: number)` |
| swipe | `@swipe` | `('left' \| 'right' \| 'up' \| 'down')` |
| edge | `@edge` | 同上，非循环边缘拖拽 |
| keydown | `@keydown` | 原生 `KeyboardEvent`；先于导航，可 `preventDefault()` |

`h()` 使用 `onBeforeChange` / `onAfterChange` 等自然监听器。通知由 Vue emits 派发，不手调 attrs。没有 value 模型；定位通过公开方法。完成的滑动只通知一次，非切换的同位置请求不伪造切换。

### 引用与交互

```ts
interface CarouselRef {
  nativeElement: HTMLDivElement | null;
  goTo(slide: number, dontAnimate?: boolean): void;
  next(): void;
  prev(): void;
  autoPlay(playType?: 'update' | 'leave' | 'blur'): void;
  innerSlider: Readonly<CarouselEngineState>;
}
```

`innerSlider` 是实际响应式引擎状态，非 slick 实例。`goTo` 对有限索引按当前页数循环或约束；关闭动画时立即完成。动态配置/slide结构变化会收尾已接受的旧动画并按当前配置重测，旧计时器不能回写旧布局。`initialSlide` 或有效RTL改变会按当前初值重新定位。

方向键支持原生 key（并保留 keyCode），水平RTL交换左右方向，纵向支持上下方向。输入框、选择框、textarea、可编辑内容、输入法和已取消的事件不触发轮播导航。原始可交互内容保留其原生 Tab 行为；当前不可见内容使用 inert/aria-hidden，静止视口中可见的边界克隆保持交互。自动播放保留既有 `autoplaySpeed + 50` 调度，焦点、内容/圆点悬停原因合并，本实例的内移焦点不会提前恢复。

原始 slide 使用用户 key 保持组件身份。克隆树内已知原生 id 与指向这些 id 的 for/ARIA 关联带稳定的实例后缀，外部ID和自定义组件业务id不改。原件ref归原件；组件透传内容槽在实际渲染时只调用一次并保留作用域/owner，克隆返回节点清理ref。

克隆仍是独立组件实例，不镜像任意内部未受控状态；需要单一组件实例的内容可使用 `infinite=false`。没有探测或改写组件内部不可见的固定ID，也不预调用其插槽来搜集内部结构。

## 主题

保留八项：`arrowSize`、`arrowOffset`、`dotWidth`、`dotHeight`、`dotGap`、`dotOffset`、`dotWidthActive`、`dotActiveWidth`。全部接受数字(px)或CSS长度字符串，当前 `theme.components.Carousel` 替换/撤回生效。`dotWidthActive` 是既有别名，未设置新版字段时供应 `dotActiveWidth`；新版显式值优先。箭头尖角随当前 arrowSize 用 CSS calc 派生，支持 rem 等长度。原生根 style 中的变量可显式覆盖。

不支持的旧 slick 能力（responsive、rows、variableWidth、lazyLoad、asNavFor、appendDots/customPaging 等）没有在本轮新增。已有参考和算法证据保留；全库九维验收在最终冻结版本统一进行。
