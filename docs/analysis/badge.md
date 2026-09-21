# Badge · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-src/package/es/badge/`（Badge.js / ScrollNumber.js /
> SingleNumber.js / Ribbon.js / style）。规模 881 行 / 14 文件；Component Token **9 个**。
> **先于实现存在**（G2 前置）。

## 1. 组件面（badge = Badge + Badge.Ribbon）

### BadgeProps

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `count` | `ReactNode`（Vue: VNodeChild） | `null` | 数字/节点；`null` 表示无 count |
| `overflowCount` | `number` | `99` | 超出显示 `${overflowCount}+` |
| `dot` | `boolean` | `false` | 只显示小红点（`dot && !isZero`） |
| `showZero` | `boolean` | `false` | 数值为 0 时是否显示 |
| `size` | `'medium' \| 'small'` | `'medium'` | `default` 已废弃（告警） |
| `status` | `'success' \| 'processing' \| 'default' \| 'error' \| 'warning'` | — | 状态点 |
| `color` | 预设色串 \| 自定义色 | — | 非 count 模式的自定义颜色 |
| `text` | `VNodeChild` | — | 状态文本（`text === 0` 受 showZero 控制） |
| `title` | `string \| null \| false` | count 回落 | 原生 title；`null/false` 显式禁用 |
| `offset` | `[number \| string, number \| string]` | — | `[x, y]`：x → `inset-inline-end: -parseInt(x)`，y → `margin-top` |
| `scrollNumberPrefixCls` / `prefixCls` / `className` / `rootClassName` / `classNames` / `styles` | | | 语义槽位 root/indicator |

### RibbonProps

`color`（预设/自定义）、`text`、`placement`（`'start' \| 'end'`，默认 end）、语义槽位 root/indicator/content。

## 2. 行为契约（Badge.js 逐条）

1. **numberedDisplayCount**：`count > overflowCount ? `${overflowCount}+` : count`。
2. **isZero**：`displayCount === 0 || count === 0 || text === 0`（值与串都算）。
3. **ignoreCount** = `count === null || (isZero && !showZero)`。
4. **hasStatus** = `(status/color 非空) && ignoreCount`。
5. **isStatusBadge**（状态点独立渲染分支）= `!children && hasStatus && (text || hasStatusValue || !ignoreCount)`；
   该分支根元素与状态点分离渲染，状态文本颜色取 `styles.root.color`。
6. **isHidden** =（count/text 均不可渲染 `|| isZero && !showZero`）`&& !showAsDot`。
7. **三组 ref 缓存**（livingCount / displayCount / isDot）：隐藏（离场动画）期间保持
   上一次的显示值 —— motion 撤场不闪变。Vue 侧用 `ref` + 条件更新（同构）。
8. **offsetStyle**：`marginTop: offset[1]`（数字/字符串原样）+ `insetInlineEnd: -parseInt(offset[0])`
   （⚠️ React 对负数字不补单位？—— 实为字符串拼接 `-8`，React 输出 `inset-inline-end: -8px`；
   Vue 需手动补 px，PITFALLS 32）。合并顺序：offset → contextStyle → style。
9. **statusStyle**：`color && !isPresetColor(color)` 时 color/background 内联。
10. **CSSMotion**：`motionName: ${prefixCls}-zoom`，`motionAppear: false`（挂载不动画），
    `motionDeadline: 1000`。我们用 `@apollo-design/motion` 的 `CSSMotion`（foundation 已就绪）。
11. **status 分支的 zoom 动画**用 noWrapper 变体（not-a-wrapper 场景）。

## 3. ScrollNumber / SingleNumber

- ScrollNumber：根 `sup`（component 可换）+ `data-show`；**仅整数**才拆位
  （`Number(count) % 1 === 0`）渲染 `<bdi>` + SingleNumber 列表（key = 倒序 index）；
  `style.borderColor` → `boxShadow: 0 0 0 1px {borderColor} inset`（旧用法兼容）；
  children 时 clone 并加 `-custom-component` 类。
- SingleNumber：数字滚动。value/count 变化时渲染 value…value+10 的单位序列，
  `translateY(-{offset}00%)` 过渡；`onTransitionEnd`（+1s 兜底定时器）回写 prev 值。
  `offset` 单位样式 `top: {offset}00%`（**数字补 px 的反例：`{offset}00%` 是百分比拼接**）。
  Vue 侧用 `ref` + `watch` + `onTransitionEnd` 同构实现。

## 4. 样式契约（style/index.js 328 行 + ribbon.js 81 行）

- **6 组 Keyframes**：antStatusProcessing（processing 波纹）、antZoomBadgeIn/Out、
  antNoWrapperZoomBadgeIn/Out、antBadgeLoadingCircle（icon-spin 兼容）。
- **Component Token（9 个）**，默认值（derive 自 alias）：
  `indicatorZIndex:'auto'`、`indicatorHeight: Math.round(fontSize*lineHeight)-2*lineWidth`、
  `indicatorHeightSM: fontSize`、`dotSize: fontSizeSM/2`、`textFontSize: fontSizeSM`、
  `textFontSizeSM: fontSizeSM`、`textFontWeight:'normal'`、`statusSize: fontSizeSM/2`、
  `paddingInline: paddingXS`。
  ⚠️ `indicatorHeight` 是 token 乘除派生 —— 零运行时下无法用 calc 表达
  （unitless line-height 乘法）→ 按 divider 的「字面量 token 以常量为唯一真源」处理，
  以 theme 默认 seed（fontSize=14, lineHeight≈1.5714285, lineWidth=1）算出 **20**，
  覆盖 token 的主题失效登记为已知边界（与 grid 断点同源）。
- **badge 派生色**（prepareToken）：`badgeColor: colorError`、`badgeTextColor: colorTextLightSolid`、
  `badgeColorHover: colorErrorHover`、`badgeShadowColor: colorErrorBg`（→ 全部落 var()）；
  `badgeFontFamily`、`badgeProcessingDuration: 1.2s`? —— 以 extractStyle 产物核对后定稿。
- 状态点配色：success→colorSuccess、processing→colorInfo（+::after 波纹动画）、
  default→colorTextPlaceholder、error→colorError、warning→colorWarning。
- 预设色（genPresetColor）：`&{componentCls} {componentCls}-color-{key}` 模式。
- Ribbon：wrapper 相对定位；`-placement-start/end`；corner 三角（borderColor 透明技巧）；
  `-color-*` 预设同样生效。

## 5. 预判差异（进 COMPATIBILITY §9 前验证）

| # | 差异 | 分类 |
|---|---|---|
| D6 | 前缀 apollo-badge / apollo-scroll-number / apollo-ribbon | INTENDED |
| D5 | 无 hash 包裹 | INTENDED |
| — | indicatorHeight 等乘除派生 token 以默认 seed 常量落地，主题覆盖失效 | 已知边界（同 grid 断点） |
| — | `offset` 数字补 px：React 自动 / Vue 手动（L4 用字符串避开 + L1 钉数字路径） | PLATFORM |
| — | CSSMotion 为 @apollo-design/motion 实现（motionDeadline/appear 语义需对拍） | PLATFORM |

## 6. 实现顺序（G2 起）

1. interface.ts（Badge/Ribbon props + 语义槽位）
2. style/token.ts（9 token，字面量常量 + var 派生色）
3. style/index.ts（Row 部分移植 + 6 组 keyframes 用 @apollo-design/motion 的能力或纯 CSS）
4. ScrollNumber.vue / SingleNumber.vue（components/ 子组件）
5. Ribbon.vue + style/ribbon.ts
6. Badge.vue 主实现（双分支 + CSSMotion）
7. 测试：L1（状态/count/overflow/showZero 矩阵，镜像上游 testCases）→ L4 基线
   （badge.mjs，SSR 确定性；motion 场景 L2）→ L5/L6（badge/ribbon demos）
