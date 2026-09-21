# BorderBeam · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-src/package/es/border-beam/`（BorderBeam.js /
> BorderBeamEffect.js / hooks / util.js / style）。规模 298 行 / 14 文件；Component
> Token **0 个**。**先于实现存在**。

## 1. 组件面

单组件 `BorderBeam`（注册名 `ABorderBeam`）。**无 UI 的包裹组件**：渲染
`Fragment = childNode + count 个 Effect`，Effect **portal 进 child 的 DOM**。

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| color | `string \| {color, percent}[]`（BorderBeamColor） | — | 渐变色/色标 |
| count | `number` | `1` | 流光条数（≥1 取整，负数/NaN → 1） |
| duration | `number` | `6` | 单圈秒数（≤0 回落默认） |
| lineWidth | `number \| string` | token.lineWidth | 流光描边厚度 |
| outset | `number \| string` | 随 host border | 覆盖四边统一的 inset 偏移 |
| size | `number \| string` | `100px` | 流光头部长度 |
| children | 单元素 | — | 宿主（必须可挂 ref 才有效果） |

## 2. 行为契约（逐条）

1. **useChildDom**：children 是有效元素且支持 ref → cloneElement 注入
   `composeRef(子ref, 内部ref)`；否则原样透传（无 DOM → Effect 不渲染）。
   Vue 对应：`cloneVNode(child, { ref })`；无法挂 ref 的（纯文本）直接渲染且无 effect。
2. **useBorderSize**：读 host 的 computed `border{Top,Right,Bottom,Left}Width`
   （parseFloat，NaN→0），4 元组同值比较避免多余渲染。**CSS 变量作用域挂在
   Effect 的 style 上**（不是 host）。
3. **inset-offset**：`outset` 非空 → `getInset(outset)`（数字 `-${n}px` / 字符串
   `calc(-1 * ${s})`）；否则 4 边各自 getInset 后 join(' ')（CSS inset 四值展开）。
4. **CSS 变量**（genCssVar → `--{root}-border-beam-*`，值全部内联在 Effect style）：
   `beam-gradient`（color 派生）/ `duration`（`${n}s`）/ `line-width`（unit 补 px）/
   `size`（unit 补 px）/ `delay`（index>0：`-duration*index/count}s` 错相）/ `inset-offset`。
5. **getBorderBeamGradient**：字符串 → 单 stop `{color,0}`；数组 → 原样；
   `fillGradientEnd`（末 stop percent≠100 → 复制一份置 100）；0–100 线性映射到
   **0–70%**（MAX_BEAM_COLOR_STOP_PERCENT，保留尾部淡出）；`linear-gradient(to left, …, transparent)`。
6. **CSS 链**（提取产物逐条）：`display:none` 起手 → `@supports (mask-composite…)`
   内 `mask` 抠边 + 内层 `@supports (offset-path: rect(…))` 才 `display:block` +
   `::before` 流光 → `@media (prefers-reduced-motion: reduce)` 双保险（genNoMotionRawStyle
   的 `transition:none;animation:none` + 显式 `display:none`）。
7. **::before**：`width:var(--size,100px); aspect-ratio:1/1; opacity:.95;
   background-image:var(--beam-gradient, 默认渐变 colorPrimary→Hover 70%→transparent);
   offset-anchor:90% 50%; offset-path:rect(0 auto auto 0 round var(--size,100px));
   animation: antBorderBeamMove (offsetDistance 0%→100%) linear infinite`。
8. Component Token：**0 个**；CSS 变量的默认值（fallback）来自 token
   （line-width → var(--line-width)）。

## 3. Vue 对应（平台差异）

| React | Vue |
|---|---|
| createPortal(el, hostDom) | `<Teleport :to="hostDom">`（host 为元素时） |
| cloneElement + composeRef | `cloneVNode(child, { ref })`（单一注入，合并用户 ref 场景少） |
| useEffect 读 computed style | `onMounted` + `watch(hostDom)`（对齐 useLayoutEffect 仅客户端） |
| unit() 补 px | 手动补（PITFALLS 32） |

## 4. 预判差异

| # | 差异 | 分类 |
|---|---|---|
| D6 | 前缀 apollo-border-beam vs ant-border-beam（含 CSS 变量名 `--apollo-border-beam-*`） | INTENDED |
| D5 | 无 hash 包裹；keyframes 名前缀派生 | INTENDED |
| — | reduced-motion 的 `transition:none;animation:none` 来自共享 motion helper，逐字保留 | INTENDED |
| — | L4 基线：SSR 下 host 无 DOM（portal 客户端才挂）→ Effect 不出现在 antd SSR 产物；我们同构（Teleport 目标不存在时不渲染）——基线只钉 host 侧 | 平台一致 |

## 5. 本分析没有证明什么

- 真实浏览器 offset-path/mask 的渲染（L6 视觉 + jsdom 全 false 的 L1 只能钉结构与样式串）
- 多 count 的 delay 错相视觉效果（L1 钉 style 串）
