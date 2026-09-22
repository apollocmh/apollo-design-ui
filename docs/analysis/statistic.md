# Statistic · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-src/package/es/statistic/`（构建产物 393 行 / 14 文件）
> + GitHub v6.6.4 的 `components/statistic/demo/*` 与 `__tests__/index.test.tsx`。
> Component Token **2 个**（titleFontSize / contentFontSize）。**先于实现存在**。

## 1. 组件面

导出面（`es/statistic/index.d.ts`）：`Statistic`（默认）+ **静态属性**
`Statistic.Timer`（`Statistic.Timer`）/ `Statistic.Countdown`（@deprecated）。
Vue 侧：`Statistic` / `Timer` / `Countdown` 三个具名导出 + 静态属性逐字保留
（tag 的 `CheckableTag` 范式）。

### Statistic props

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| value | `number \| string` | `0` | 数值 |
| title | `VNodeChild` | — | 标题（`isReactRenderable` 判据见 §2.1） |
| prefix / suffix | `VNodeChild` | — | 前缀/后缀 |
| formatter | `false \| 'number' \| 'countdown' \| (value, config?) => VNodeChild` | — | 自定义格式化（**实现只消费函数**） |
| precision | `number` | — | 小数位（负数 ⇒ 无小数） |
| decimalSeparator | `string` | `'.'` | 小数分隔符 |
| groupSeparator | `string` | `','` | 千分位分隔符 |
| loading | `boolean` | `false` | Skeleton 骨架 |
| valueStyle | `CSSProperties` | — | **@deprecated** → `styles.content`（仍生效，先合并） |
| valueRender | `(node: VNode) => VNode` | — | 包裹 valueNode |
| onMouseEnter / onMouseLeave | handler | — | 落在根元素 |
| classNames / styles | 语义化（root/header/title/content/value/prefix/suffix，对象或函数） | — | |
| ref | `nativeElement: HTMLDivElement` | — | |

## 2. 行为契约（逐条）

1. **`isReactRenderable(title/prefix/suffix)`**：`0` 也渲染（测试钉住：
   `title={0} prefix={0} suffix={0}` 都出现），`null/undefined/true/false` 不渲染。
   Vue 侧判据：`v !== null && v !== undefined && v !== true && v !== false`。
2. **Number 内部格式化**：`String(value)` → 正则 `^(-?)(\d*)(\.(\d+))?$`；
   不匹配（含 `'-'`、`'bamboo'`）⇒ 原样字符串；匹配 ⇒ 负号 + int（千分位正则
   `/\B(?=(\d{3})+(?!\d))/g`）+ decimal；**Number 组件的 groupSeparator 默认空串**
   （fallback 测试钉住），`.5` ⇒ int 兜底 `'0'`；precision：`padEnd(p,'0').slice(0, max(p,0))`
   （负 precision ⇒ decimal 变空串，测试钉住 5 组）。
3. **formatter 是函数 ⇒ 整个 valueNode = formatter(value)**（`content-value`
   里不再有 int/decimal 子 span）。
4. **valueNode 结构**：`span.{prefixCls}-content-value`(className=merged value 类) >
   `span.-content-value-int`(负号+int) + `span.-content-value-decimal`(分隔符+小数)。
5. **DOM 骨架**：`div.{prefix}` > [`div.-header` > `div.-title`]（title 可渲染时）+
   **Skeleton**(`paragraph:false, loading, className:-skeleton, active:true`) 包着
   `div.-content` > [`span.-content-prefix`] + valueNode/valueRender(node) +
   [`span.-content-suffix`]。
6. **loading**：true ⇒ 渲染骨架、content 消失（Skeleton `loading!==false` 判据）。
   valueStyle 并入 content 的 style（在 mergedStyles.content **之前** ⇒ 被覆盖）。
7. **aria/data 透传**：`pickAttrs(rest, {aria, data})` —— `data-abc`/`aria-label`/
   `role` 落根元素；其余未知属性不透传（mountTest 断言根 div 无多余属性）。
8. **Timer**：interval = `1000/60`（≈16.67ms，逐帧）；`onChange(timeDiff)` 每 tick；
   **onFinish 仅 countdown 且 timestamp < now**，触发一次后返回 false ⇒ clearInterval
   （测试钉「只调一次」）；SSR/首帧（showTime 未置位）渲染 `'-'`（测试钉住）。
   `valueRender` 克隆 valueNode 且 `title: undefined`。
9. **Timer 的 value 判据**：`new Date(value).getTime()`（countdown 未来时刻 /
   countup 过去时刻）；format 默认 `'HH:mm:ss'`，`[...]` 转义（`D [Day]` ⇒ `1 Day`
   测试钉住）；timeUnits 顺序 Y→M→D→H→m→s→S，`X+` 贪婪匹配按位数补零。
10. **Countdown（废弃）**：转发 Timer + `type:'countdown'`，dev 告警
    `<Statistic.Countdown /> is deprecated...`；React `memo` —— Vue 无需 memo。
11. **direction**：根元素 `-rtl` 类（无单独 CSS，但类名是契约）。

## 3. 样式契约（extract 产物逐条，全 var() 化）

```
.{p}                       ← resetComponent（margin/padding/color/font/lineHeight/list-style/box-sizing）
  .{p}-header              padding-bottom: marginXXS (4px)
    .{p}-title             color: colorTextDescription; font-size: titleFontSize
  .{p}-skeleton            padding-top: padding (16px)
  .{p}-content             color: colorTextHeading; font-size: contentFontSize; font-family: fontFamily
    .{p}-content-value     display:inline-block; direction:ltr
    .{p}-content-prefix    display:inline-block; margin-inline-end: marginXXS
    .{p}-content-suffix    display:inline-block; margin-inline-start: marginXXS
```

- Component Token：`titleFontSize = fontSize`（14px）、`contentFontSize = fontSizeHeading3`（30px）。
  CSS 变量：`--{root}-statistic-title-font-size` / `--{root}-statistic-content-font-size`
  声明在根类（badge 范式），规则侧消费 `var()`。
- 无 motion、无媒体查询、无 rtl 专属 CSS。

## 4. Vue 对应（平台差异）

| React | Vue |
|---|---|
| `isReactRenderable` | 显式非 null/undefined/布尔判断（Vue 插槽/prop 均 VNodeChild） |
| `StatisticNumber`（组件） | `Number.ts` 渲染函数（数组 children 需要 key 形态 → fragment 数组） |
| `cloneElement(node, {title: undefined})` | `cloneVNode(node, { title: undefined })` |
| `useEvent(update)` | `update` 普通函数（事件回调经 props 传，不经子组件） |
| `useState` 强刷 `setShowTime({})` | `ref` + 递增计数或空对象赋值 |
| `setInterval` 1000/60 | `window.setInterval` 同值；onUnmounted clear |
| `React.memo(Countdown)` | 无需（props 透传一层即可） |
| devUseWarning deprecated | dev 告警 setup 期一次（back-top 范式） |

- **Timer 的 `showTime` 强刷**：Vue 里直接用一个 `ref<number>` 计数（0 ⇒ `'-'`），
  每次 tick `++`；等价于 React 的「状态存在 ⇒ formatCounter」。

## 5. 预判差异

| # | 差异 | 分类 |
|---|---|---|
| D6 | 前缀 apollo-statistic | INTENDED |
| D5 | 无 hashId/cssVarCls | INTENDED |
| — | `valueStyle` deprecated 告警：setup 期一次 | PLATFORM |
| — | Skeleton `loading={undefined}` 行为差异（skeleton README 已登记） | 已有差异 |

## 6. 本分析没有证明什么

- 真实计时精度观感（jsdom 用 fake timers 钉行为，不含帧率）。
- Skeleton 微光动画在 statistic 上的视觉（L6 不比动画帧）。
