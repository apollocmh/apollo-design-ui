# Alert · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-src/package/es/alert/`（构建产物 639 行）+
> GitHub v6.6.4 的 `components/alert/{demo,__tests__}` + cssinjs extractStyle 真实 CSS。
> Component Token **4 个**。**先于实现存在**。

## 1. 组件面

导出面：`Alert`（默认）+ **静态属性** `Alert.ErrorBoundary`。
ConfigProvider `alert` 配置：variant / closable / closeIcon / successIcon /
infoIcon / warningIcon / errorIcon / className / style / classNames / styles。

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| type | `'success' \| 'info' \| 'warning' \| 'error'` | `banner ? 'warning' : 'info'` | |
| variant | `'outlined' \| 'filled'` | contextVariant ?? `'outlined'` | |
| title | VNodeChild | — | `mergedTitle = title ?? message`（message @deprecated） |
| description | VNodeChild | — | 有 ⇒ `-with-description` 类 |
| showIcon | boolean | — | banner 且未传 ⇒ **true**（banner 默认带图标） |
| banner | boolean | false | |
| icon | VNodeChild | — | 覆盖默认类型图标（`icon ?? iconMapFilled[type]`） |
| closable | `boolean \| {closeIcon?, onClose?, afterClose?, ...aria/data}` | contextClosable | 对象 ⇒ **恒 closable** |
| closeIcon | VNodeChild | — | @deprecated → closable.closeIcon；`null/false` ⇒ **不可关** |
| closeText | VNodeChild | — | @deprecated；真值 ⇒ closable |
| onClose / afterClose | handler | — | @deprecated → closable.onClose / .afterClose |
| action | VNodeChild | — | `-actions` 区块 |
| id / role | string | role=`'alert'`（可被 attrs 覆盖） | |
| onMouseenter/Leave/Click | handler | — | 落根元素 |
| classNames / styles | 语义化 7 槽（root/icon/section/title/description/actions/close） | — | |

## 2. 行为契约（逐条）

1. **isClosable 判据链**：closable 是对象 ⇒ true；`closeText` 真值 ⇒ true；
   boolean ⇒ 原值；**`closeIcon !== false && isNonNullable(closeIcon)` ⇒ true**
   （`0` / `''` 也算可关 —— 测试钉住）；否则 `!!contextClosable`。
2. **handleClose**：`closed=true`（不检查 defaultPrevented）→
   `(closableObj.onClose ?? props.onClose)?.(e)`。
3. **mergedCloseIcon 优先级**：closable.closeIcon（对象且有值）→ closeText →
   closeIcon !== undefined → contextClosable.closeIcon → contextCloseIcon。
   CloseIconNode 内：`closeIcon === true || undefined` ⇒ 默认 CloseOutlined。
4. **CSSMotion**：visible=!closed；motionName `${prefixCls}-motion`；
   motionAppear/motionEnter 均 **false**；onLeaveStart ⇒ `{maxHeight: node.offsetHeight}`；
   onLeaveEnd ⇒ closableObj.afterClose ?? afterClose。DOM 关闭后随 leave 动画卸载
   （removeOnLeave 默认 true）；`data-show = !closed`（leave 期间仍为 false）。
5. **aria**：`(closable ?? contextClosable)` 是对象 ⇒ `pickAttrs(obj,{aria,data})`
   落在 close button 上；否则 `{}`（button 无 aria-label）。
6. **role**：根 div 先写 `role="alert"`，再 spread `pickAttrs(otherProps,{aria,data})`
   ⇒ 用户 role **覆盖**默认。
7. **语义化 info.props**：`{...props, prefixCls, variant, type, showIcon, closable}`。
8. **类名顺序**：prefixCls → `-type` → `-variant` → {with-description, no-icon,
   banner, rtl} → contextClassName → className → rootClassName → 语义化 root
   （+ motionClassName 拼在最外）。
9. **IconNode**：`icon ?? iconMapFilled[type]`（ConfigProvider 四种类型图标可换）。
10. **ErrorBoundary**：class 组件 componentDidCatch ⇒ 渲染
    `Alert type="error"`（title ?? error.toString()；description ?? 组件栈 pre）。
11. 废弃告警：`closeText` / `message`（render 期；Vue setup 期一次）。

## 3. 样式契约（extract 产物逐条，全 var() 化）

- 根：resetComponent（margin/padding/color/font-size/line-height/list-style/font-family）
  + position:relative; display:flex; alignItems:center; padding `var(--alert-default-padding)`;
  word-wrap:break-word; border-radius `var(--alert-border-radius)`;
  border-width lineWidth; border-style lineType
- 四 type borderColor（success/info/warning/error-border）；filled ⇒ transparent；rtl
- `-section` flex:1 minWidth:0；`-icon` marginInlineEnd marginXS lineHeight 0
- `-description` display:none fontSize lineHeight；`-title` color colorTextHeading
- `-motion-leave` overflow:hidden opacity 1 + 五属性 transition（motionDurationSlow +
  motionEaseInOutCirc）；`-motion-leave-active` maxHeight 0 / marginBottom 0!important /
  paddingTop 0 / paddingBottom 0 / opacity 0
- `-with-description` alignItems:flex-start padding var；icon marginInlineEnd marginSM
  fontSize var(-with-description-icon-size)；title display block marginBottom marginXS
  fontSize fontSizeLG；description display block color colorText
- `-banner` marginBottom 0 border 0!important borderRadius 0
- type 背景：colorXxxBg；icon color colorXxx；error 的 `-description>pre` margin/padding 0
- `-actions` marginInlineStart marginXS
- `-close-icon`：marginInlineStart marginXS padding 0 overflow hidden fontSize
  fontSizeIcon lineHeight fontSizeIcon background transparent border none cursor pointer
  + `:focus-visible` 焦点环（lineWidthFocus solid colorPrimaryBorder, offset 1px）
  + `.apollo-icon-close` color colorIcon → hover colorIconHover
- `-close-text`：color colorIcon → hover colorIconHover
- Component Token：borderRadius=borderRadiusLG；withDescriptionIconSize=fontSizeHeading3；
  defaultPadding=`8px 12px`（paddingContentVerticalSM 8 + 固定 12）；
  withDescriptionPadding=`20px 24px`（paddingMD 20 + paddingContentHorizontalLG 24）

## 4. Vue 对应（平台差异）

| React | Vue |
|---|---|
| CSSMotion 函数子组件 | `CSSMotion` 函数插槽（back-top 范式），hooks 传 `{onLeaveStart,onLeaveEnd}` |
| `useImperativeHandle` | expose nativeElement |
| ErrorBoundary class 组件 | `onErrorCaptured`（return false 阻断向上传播） |
| `deprecated in props` | `props.x !== undefined` |
| closable 对象的 aria/data | pickAttrs({aria,data}) 落 button attrs |

## 5. 预判差异

| # | 差异 | 分类 |
|---|---|---|
| D6 | 前缀 apollo-alert | INTENDED |
| D5 | 无 hash/css-var 包裹类；4 个 Component Token 变量声明在根类 | INTENDED |
| — | 废弃告警 setup 期一次 | PLATFORM |
| — | ErrorBoundary 用 onErrorCaptured：只捕获后代组件的渲染/生命周期错误（React 还捕获事件处理器错误） | PLATFORM |

## 6. 本分析没有证明什么

- 收起动画的帧观感（jsdom 用 supportMotion:true + fake timers 钉类名时序）
- Tooltip/Popconfirm 组合（未落地组件，不进测试）
