# Carousel 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/carousel/` + `@ant-design/react-slick@2.0.0`（只读参照，H2）
- 分析产物：`docs/analysis/carousel.md`（G1，先于实现存在；§7 是 embla 可行性核对）
- **决策 B：自建引擎**（`carousel-engine` 开放决策，2026-09-23 用户裁决）——
  embla 无法对齐 slick 的 DOM 契约（clone / 内联定位 / aria 结构 / snap 物理），
  见分析文档 §7。引擎源：`engine.ts`（slick 状态机的 Vue 移植，判据逐行对拍
  `@ant-design/react-slick/es/*`）
- **无子组件**、无 `__ANT_*` 静态标记（与 antd 一致）
- 样式：`genCarouselStyle()` 移植 antd 五段样式 —— 全部挂在 **slick 命名空间类**
  （`.slick-*` 不随 prefixCls 变），只多 8 条 Component Token 声明

## 2. 与 antd 的行为差异清单

同步到 `COMPATIBILITY.md` §9.1 / §9.2（D54–D57）。

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D54 | **Settings 不整包透传**：`responsive` / `rows` / `slidesPerRow` / `centerMode` / `variableWidth` / `lazyLoad` / `asNavFor` / `focusOnSelect` / `swipeToSlide` / `appendDots` / `customPaging` / `slide` / `unslick` / `onInit` / `onReInit` / `onLazyLoad` / `swipeEvent` 显式不支持（用户裁决 2026-09-23），传了发 dev 告警 | INTENDED | interface.ts + L1 |
| D55 | **8 个 Component Token 是构建期解析值**，且 `arrowLength = arrowSize/√2` 是无理数 ⇒ ::after 几何必须 JS 常量（CSS 无法除以 √2），不随主题缩放 | INTENDED | L7 `theme.test.ts` |
| D56 | `beforeChange` / `afterChange` / `onSwipe` / `onEdge` 是 Vue 事件；`prevArrow` / `nextArrow` 用插槽（cloneVNode 合并 class/style/data-role/onClick + 作用域 `{ currentSlide, slideCount }`） | INTENDED（C19） | L1 |
| D57 | `innerSlider` 是引擎的响应式状态对象（非 slick 实例）；`pauseOnFocus` 的 focus/blur 只挂本实例的 slide（antd 是 `document.querySelectorAll('.slick-slide')` 全局挂） | PLATFORM | L1「ref 形状」 |
| — | fade 当前张的内联 `left:0`：React SSR 输出 `"0"`，经 CSSOM（含真实浏览器）规范化为 `"0px"`——计算值一致 | PLATFORM | L4 allowance（CSSOM_LEFT_ZERO） |
| — | slick 的 autoplay 定时器是 `autoplaySpeed + 50`、dots 的 mouseenter→onDotsLeave 映射等「怪但既有」语义逐字保留 | PLATFORM | engine.ts 注释 |

## 3. 渲染函数选型（无 .vue）

`Carousel.ts` 用渲染函数，与 `Switch.ts` 同判且更强：

- slide/dots/arrows 的 DOM 是 slick 的**机械契约**（clone 编号、内联定位、类名次序、
  `class=""`），模板写起来只会更绕；
- track/slide 的 style 是**字符串拼接**（React 的驼峰 CSS 属性 + 值形态逐字对齐），
  模板绑定对象反而会引入 Vue 的 camelCase→CSSOM 差异；
- slot 的 children 统计必须在 render 内消费（Vue 的 slot 依赖追踪限制）。

## 4. Component Token 清单（8 个）

与 antd 的 `ComponentToken` 接口**逐字段对齐**（规则 R7）。

| Token | 计算方式 | 默认值 |
|---|---|---|
| `arrowSize` | 字面量 | `16px` |
| `arrowOffset` | `marginXS` | `8px` |
| `dotWidth` | 字面量 | `16px` |
| `dotHeight` | 字面量 | `3px` |
| `dotGap` | `marginXXS` | `4px` |
| `dotOffset` | 字面量 | `12px` |
| `dotWidthActive` | ⚠️ deprecated（映射 dotActiveWidth） | `24px` |
| `dotActiveWidth` | 字面量 | `24px` |

- `--dot-duration` 是运行时 CSS 变量（`autoplay.dotDuration && autoplaySpeed` 时挂根节点），
  圆点进度动画消费它 —— 与 antd 逐字一致。
- 两个 `@keyframes`（横向 width / 纵向 height）以根前缀命名防碰撞
  （`apollo-carousel-dot-animation`）；antd 的 cssinjs Keyframes 名是 `carousel-dot-animation`。

## 5. 测试矩阵

| 层 | 文件 | 条数 | 钉什么 |
|---|---|---|---|
| L1/L2 | `__tests__/index.test.ts` | 29 | 状态机：切换/回绕/waitForAnimate/打断补发/fade/键盘/自动播放/pauseOnHover/rtl 镜像/unslick 边界/children 变化/ref 形状 |
| L3 | `__tests__/type.test-d.ts` | 7 | 负例闭包（无受控 API、dotPosition 的 left/right、ref 形状） |
| L4 | `__tests__/semantic.test.ts` | 19 | 与 `baselines/carousel.dom.json` 逐节点一致（keepStyle；fade 的 left:0 走 PLATFORM 豁免） |
| L5 | `__tests__/a11y.test.ts` | 7 demo | axe 0 violation |
| L6 | `tests/visual/render/cases/{react,vue}/carousel.*` | 4×3 | basic / fade / arrows / vertical |
| L7 | `__tests__/theme.test.ts` | 6 | Token 解析值 + slick 类挂载 + keyframes + √2 几何 |
| — | `tests/compat/fixtures/carousel/*.json` | 4 | basic / fade / arrows / dot-placement-start |

## 6. 已知边界

- **不支持的 Settings** 见 §2 D54（首版裁决；后续按需补）。
- jsdom 里 `offsetWidth=0` ⇒ L1 的 track transform 数值无意义，定位**公式**由 L4 的
  SSR 基线钉（`width:500%` / `left:-100%`），状态机由 L1 钉。
- unslick（children ≤ slidesToShow）：无 clone、无 dots/arrows、list 无 handlers ——
  slick 原样语义，L4 `carousel:single-child` 钉住。
