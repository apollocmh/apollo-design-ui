# BackTop · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-src/package/es/back-top/`（index.js 96 行 /
> index.d.ts / style）。规模 113 行 + `_util/{getScroll,scrollTo,easings,
> throttleByAnimationFrame}`；Component Token **1 个**（zIndexPopup）。**先于实现存在**。

## 1. 组件面

单组件 `BackTop`（注册名 `ABackTop`）。**整个组件在 6.x 已 `@deprecated`**
（→ `FloatButton.BackTop`）—— 仍按契约逐字实现（deprecated 告警照发）。

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| visibilityHeight | `number` | `400` | 滚动超过该值才显示（初始 visible = `visibilityHeight === 0`） |
| duration | `number` | `450` | 回顶动画时长（ms） |
| target | `() => HTMLElement \| Window \| Document` | ownerDocument/window | 滚动容器 |
| onClick | `MouseEventHandler` | — | 点击回调（滚动**之后**调用） |
| children | 默认插槽 | 默认元素 | 自定义内容（被 CSSMotion 的 className 克隆包裹） |

## 2. 行为契约（逐条）

1. **初始 visible = `visibilityHeight === 0`**（不是 false）。
2. **handleScroll 节流**：`throttleByAnimationFrame`（raf 去重，cancel 要在卸载时调）。
3. **监听**：挂载后 `getTarget()`（target prop 或 ownerDocument/window）→ 立即
   handleScroll 一次 + addEventListener('scroll')；卸载 cancel + remove。
4. **getScroll 语义**：window→pageYOffset / document→documentElement.scrollTop /
   element→scrollTop；非 window 且结果非 number → 回落 ownerDocument 的 documentElement。
5. **scrollTo(0, { getContainer, duration })**：duration<=0 直落；否则
   `easeInOutCubic` + raf 逐帧；window→scrollTo(pageXOffset, top)。
6. **点击**：scrollToTop = scrollTo + onClick?.(e)。
7. **DOM**：根 div（fixed 定位 + onClick + ref）> CSSMotion（motionName=
   `${rootPrefixCls}-fade`，visible）包裹的 children || 默认元素
   （`-content` > `-icon` > VerticalAlignTopOutlined）。children/默认元素被
   cloneElement 注入 `motionClassName`。
8. **SSR 真相**（extract 实测）：antd 产物里**没有任何 `-fade` keyframes CSS**
   （initFadeMotion 只有 tooltip 等局部使用）——motion 类挂在 DOM 上但无动画 CSS。
   visible=false 时 rc-motion 首帧渲染 null（CSSMotion 语义）。
9. **`:empty{display:none}`**：children 为空的兜底隐藏。
10. **omit 透传**：divProps = props 减去已知键 → aria/data/事件透传。

## 3. 样式契约（extract 产物逐条，全 var() 化）

- 根：`position:fixed; inset-inline-end:calc(controlHeightLG*2.5); inset-block-end:calc(*1.25);
  z-index:var(--back-top-z-index-popup); width:40px; height:40px; cursor:pointer`
  （+ resetComponent 的 box-sizing/margin/padding/color/font/line-height/list-style）
- `-content`：宽高 `controlHeightLG`、`colorTextLightSolid` on `colorTextDescription`、
  圆角=宽、transition all motionDurationMid；hover → `colorText`
- `-icon`：font-size `fontSizeHeading3`；line-height `controlHeightLG`
- `@media (max-width: screenMD)` → inset-inline-end `*1.5`；`screenXS` → `*0.5`
- Component Token：`zIndexPopup = zIndexBase + 10`

## 4. Vue 对应（平台差异）

| React | Vue |
|---|---|
| cloneElement 注入 motionClassName | CSSMotion 的函数插槽（badge 范式） |
| useRef + ownerDocument | ref + `document`/ownerDocument 兜底 |
| useEffect [target] | `watch(() => props.target)` + onMounted/onScopeDispose |
| raf 节流 | `@apollo-design/utils` 的 `wrapperRaf`（契约同 `@rc-component/util` raf） |

## 5. 预判差异

| # | 差异 | 分类 |
|---|---|---|
| D6 | 前缀 apollo-back-top | INTENDED |
| D5 | 无 hash/css-var 类 | INTENDED |
| — | fade 无 CSS（antd 产物同样无） | 平台一致 |
| — | deprecated 告警：antd 在 render 期每次渲染都发；我们在 setup 期发一次 | PLATFORM |

## 6. 本分析没有证明什么

- 滚动时序（jsdom 无布局；L2 用 mock target 钉监听/节流/scrollTo 参数）
- 滚动动画观感（L6 不在比对面）
