# Layout —— antd 6.6.4 契约分析（G1）

> 材料：`/tmp/antd-src/package/es/layout/`（构建产物）+ antd v6.6.4 的 demo/测试
> （`/tmp/antd-demo/layout/`、`/tmp/antd-demo/layout-index.test.tsx`）+ cssinjs 实测 CSS
> （`extractStyle(cache, { types: ['style','cssVar'] })`，prefixCls=apollo）。

## 1. 文件与规模

| 文件 | 行 | 职责 |
|---|---|---|
| `layout.js` | 119 | `generator()` 工厂 + `Basic` + `BasicLayout` + Header/Footer/Content |
| `Sider.js` | 182 | Sider 本体（受控折叠 / 响应式 / trigger / 零宽触发器） |
| `context.js` | 6 | `LayoutContext`（siderHook: addSider/removeSider） |
| `hooks/useHasSider.js` | 12 | hasSider 三元判据 |
| `style/index.js` | 112 | genLayoutStyle + prepareComponentToken（19 token） |
| `style/sider.js` | 112 | genSiderStyle（复用同一份 prepareComponentToken） |

## 2. API 面

### Layout（`BasicProps` extends HTMLAttributes）

| prop | 类型 | 默认 |
|---|---|---|
| prefixCls / rootClassName / className | string | — |
| hasSider | boolean | — |
| （内部）suffixCls / tagName | 由 generator 注入 | — |

- `classString = clsx(prefixCls, { -has-sider, -rtl }, contextClassName, className, rootClassName, hashId, cssVarCls)`
- `style = {...contextStyle, ...style}`（context 在前，**用户 style 覆盖**）
- `passedProps = omit(others, ['suffixCls'])`
- 渲染 `<Tag>`（Layout=div、Header=header、Footer=footer、Content=main）

### Header / Footer / Content（`Basic`）

- `prefixWithSuffixCls = suffixCls ? \`${prefixCls}-${suffixCls}\` : prefixCls`
  —— ⚠️ **Basic 只用 `customizePrefixCls || prefixWithSuffixCls`**，即传了 `prefixCls`
  就直接用它（不加 suffix）。
- `className = clsx(customizePrefixCls || prefixWithSuffixCls, className, hashId, cssVarCls)`
  —— ⚠️ Basic **没有** `rootClassName`、没有 contextClassName。
- Header/Footer/Content 各自的 style 就是用户 style（无 context）。

### Sider（`SiderProps`）

| prop | 类型 | 默认 |
|---|---|---|
| collapsible | boolean | false |
| collapsed | boolean（受控） | — |
| defaultCollapsed | boolean | false |
| reverseArrow | boolean | false |
| zeroWidthTriggerStyle | CSSProperties | — |
| trigger | VNodeChild（`null` ⇒ 不渲染 trigger 区） | — |
| width / collapsedWidth | number \| string | 200 / 80 |
| breakpoint | Breakpoint（xs…xxxl） | — |
| theme | 'light' \| 'dark' | 'dark' |
| classNames / styles | 语义槽 `{ root, body }`（对象或函数，函数收 `{ props }`） | — |
| onCollapse | (collapsed, type: 'clickTrigger' \| 'responsive') => void | — |
| onBreakpoint | (broken: boolean) => void | — |

- `collapsed = useControlledState(defaultCollapsed, props.collapsed)`：
  `collapsed === undefined` ⇒ 非受控。
- `siderWidth = isNumeric(rawWidth) ? \`${rawWidth}px\` : String(rawWidth)`
  （`width="50%"` → `50%`；`width=200` → `200px`）。
- `divStyle = {...style, flex:'0 0 W', maxWidth:W, minWidth:W, width:W}`
- `siderCls = clsx(prefixCls, \`${prefixCls}-${theme}\`, { -collapsed, -has-trigger, -below, -zero-width }, className, mergedClassNames.root, hashId, cssVarCls)`
  —— ⚠️ 语义化 root 在 `className` **之后**。
- 最终 style：`{...mergedStyles.root, ...divStyle}`（**divStyle 覆盖语义 root**）。
- children 包一层 `.${prefixCls}-children`（`mergedClassNames.body` / `mergedStyles.body`）。
- `-has-trigger`：`collapsible && trigger !== null && !zeroWidthTrigger`。
- `-zero-width`：`Number.parseFloat(siderWidth) === 0`。
- trigger：
  - `zeroWidthTrigger`（collapsedWidth 解析为 0）：`<span class="-zero-width-trigger[-left|-right]" style={zeroWidthTriggerStyle}>{trigger || <BarsOutlined/>}</span>`
    —— ⚠️ 是 **span**，位置由 `reverseArrow ? right : left`。
  - 否则：`<div class="-trigger" style={{width: siderWidth}}>{trigger || defaultTrigger}</div>`
  - `triggerDom` 仅在 `trigger !== null` 时存在；渲染条件 `collapsible || (below && zeroWidthTrigger)`。
- 图标方向：`reverseIcon = (direction === 'rtl') === !reverseArrow`；
  expanded ⇒ reverseIcon ? Right : Left；collapsed 反之。
- 响应式：`dimensionMaxMap` xs 479.98 … xxxl 1839.98；
  `matchMedia(\`screen and (max-width: ${max})\`)`，addEventListener('change')；
  **挂载时立即调用一次** `responsiveHandler(mql)` ⇒ `onBreakpoint(mql.matches)`，
  且 `collapsed !== mql.matches` 时 `handleSetCollapsed(mql.matches, 'responsive')`。
  ⚠️ 依赖数组只有 `[breakpoint]`（不接受动态 dimension）。
- 注册：`useEffect` 里 `generateId('ant-sider-')` + `siderHook.addSider/removeSider`。
- SiderContext：`{ siderCollapsed: collapsed }`（Menu 消费）。

### useHasSider（判据顺序）

```
hasSider 是 boolean ⇒ 原样返回
siders.length > 0  ⇒ true
children 里存在 type === Sider 的直系/展平节点 ⇒ true
```
⚠️ SSR（`renderToString`）也要能出 `-has-sider`（上游 `auto check hasSider` 用例），
即 children 检测必须在**首帧**完成，不能依赖 `addSider`（那是 mount 后）。

### 复合导出

`Layout.Header/Footer/Content/Sider/_InternalSiderContext`（同 Skeleton/Statistic 范式）。

## 3. Component Token（19 个，实测 cssVar 声明值）

| token | 声明值（apollo 前缀） | 派生 |
|---|---|---|
| bodyBg | `#f5f5f5` | colorBgLayout |
| colorBgBody（deprecated） | `#f5f5f5` | 同 bodyBg |
| colorBgHeader（deprecated） | `#001529` | 同 headerBg |
| colorBgTrigger（deprecated） | `#002140` | 同 triggerBg |
| headerBg | `#001529` | 字面常量 |
| headerHeight | `64px` | controlHeight × 2 |
| headerPadding | `0 50px` | `0 ${controlHeightLG × 1.25}px` |
| headerColor | `rgba(0,0,0,0.88)` | colorText |
| footerPadding | `24px 50px` | `${controlHeightSM}px ${paddingInline}px` |
| footerBg | `#f5f5f5` | colorBgLayout |
| siderBg | `#001529` | 字面常量 |
| triggerHeight | `48px` | controlHeightLG + marginXXS × 2 |
| triggerBg | `#002140` | 字面常量 |
| triggerColor | `#fff` | colorTextLightSolid |
| zeroTriggerWidth | `40px` | controlHeightLG |
| zeroTriggerHeight | `40px` | controlHeightLG |
| lightSiderBg | `#ffffff` | colorBgContainer |
| lightTriggerBg | `#ffffff` | colorBgContainer |
| lightTriggerColor | `rgba(0,0,0,0.88)` | colorText |

⚠️ antd 的 cssVar 产物是**实值**（`#f5f5f5`），本仓按既有约定（tag/alert/statistic）
声明为 **var() 别名派生**（可主题化）；字面常量（`#001529` / `#002140`）保持原样
（E10 对声明行豁免）。

## 4. 样式结构（实测 CSS，hash 已去掉）

```
.apollo-layout{display:flex;flex:auto;flex-direction:column;min-height:0;background:var(--apollo-layout-body-bg)}
.apollo-layout,.apollo-layout *{box-sizing:border-box}
.apollo-layout-has-sider{flex-direction:row}
.apollo-layout-has-sider > .apollo-layout, > .apollo-layout-content{width:0}
.apollo-layout .apollo-layout-header, .apollo-layout.apollo-layout-footer{flex:0 0 auto}
.apollo-layout-rtl{direction:rtl}
.apollo-layout-header{height:var(--apollo-layout-header-height);padding:var(--apollo-layout-header-padding);
  color:var(--apollo-layout-header-color);line-height:var(--apollo-layout-header-height);background:var(--apollo-layout-header-bg)}
.apollo-layout-header .apollo-menu{line-height:inherit}
.apollo-layout-footer{padding:var(--apollo-layout-footer-padding);color:var(--apollo-color-text);
  font-size:var(--apollo-font-size);background:var(--apollo-layout-footer-bg)}
.apollo-layout-content{flex:auto;color:var(--apollo-color-text);min-height:0}

.apollo-layout-sider{position:relative;min-width:0;background:var(--apollo-layout-sider-bg);
  transition:all var(--apollo-motion-duration-mid),background 0s}
.apollo-layout-sider-has-trigger{padding-bottom:var(--apollo-layout-trigger-height)}
.apollo-layout-sider-right{order:1}
.apollo-layout-sider .apollo-layout-sider-children{height:100%;margin-top:-0.1px;padding-top:0.1px}
.apollo-layout-sider .apollo-layout-sider-children .apollo-menu.apollo-menu-inline-collapsed{width:auto}
.apollo-layout-sider-zero-width .apollo-layout-sider-children{overflow:hidden}
.apollo-layout-sider .apollo-layout-sider-trigger{position:fixed;bottom:0;z-index:1;
  height:var(--apollo-layout-trigger-height);color:var(--apollo-layout-trigger-color);
  line-height:var(--apollo-layout-trigger-height);text-align:center;background:var(--apollo-layout-trigger-bg);
  cursor:pointer;transition:all var(--apollo-motion-duration-mid)}
.apollo-layout-sider .apollo-layout-sider-zero-width-trigger{position:absolute;top:var(--apollo-layout-header-height);
  inset-inline-end:calc(var(--apollo-layout-zero-trigger-width) * -1);z-index:1;
  width:var(--apollo-layout-zero-trigger-width);height:var(--apollo-layout-zero-trigger-height);
  color:var(--apollo-layout-trigger-color);font-size:var(--apollo-font-size-xl);
  display:flex;align-items:center;justify-content:center;background:var(--apollo-layout-sider-bg);
  border-radius:0 var(--apollo-border-radius-lg) var(--apollo-border-radius-lg) 0;cursor:pointer;
  transition:background-color var(--apollo-motion-duration-slow) ease}
… ::after / :hover::after / -right / -light 变体
```

⚠️ 注意 `margin-top:-0.1px`（antd 源码写 `-0.1`，cssinjs unit() 补 px）。

## 5. demo（11 个非 debug）

`basic`（只依赖 Flex）、`side`、`top`、`top-side`、`top-side-2`、`fixed`、`fixed-sider`、
`custom-trigger`、`responsive`、`component-token`、`collapsible-overlay`
（其余 `_semantic` / `custom-trigger-debug` 是 debug，不进冒烟）。

⚠️ 除 `basic` 外**全部依赖未落地的 Menu（部分还依赖 Breadcrumb）**
—— 按既有约定做 PLATFORM 等价替换（原生 `ul/li` 菜单），并在 README §2 登记。

## 6. 上游测试要点（转成我们的断言）

- `has-sider` 自动检测（含 children 嵌套一层 div 的情况、SSR 首帧）
- `hasSider={false}` 强制不加
- 多 Sider 逐个隐藏 ⇒ 最后一个移除后 `-has-sider` 消失（依赖 addSider/removeSider 计数）
- `-has-trigger`（collapsible）
- `width="50%"` ⇒ style `width:50%; flex:0 0 50%`
- `width="0%"` ⇒ `-zero-width`
- 非受控折叠：`onCollapse(true,'clickTrigger')`
- 受控折叠：click 后由父级 state 决定
- `zeroWidthTriggerStyle` 落到 zero-width-trigger
- `trigger === null` ⇒ 无 trigger
- 语义化 classNames/styles（对象 + 函数形态，函数收合并后的 props）
- 四个组件都能从 ref 拿到 HTMLElement
- `onBreakpoint` 在挂载时立即以 `mql.matches` 调用一次
- Header 独立使用也带 cssVar 类（我们无 hash/cssVarCls ⇒ INTENDED 差异）
