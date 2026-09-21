# Result · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-src/package/es/result/`（index.js / index.d.ts /
> noFound / serverError / unauthorized / style）。规模 959 行 / 10 文件；Component
> Token **4 个**。**先于实现存在**。

## 1. 组件面

单组件 `Result`（注册名 `AResult`）。静态结果页：icon/image + title + subTitle +
extra + body（children）。

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| status | `ResultStatusType` | `'info'` | `'success'\|'error'\|'info'\|'warning'` 或 `'403'\|'404'\|'500'`（数字也收） |
| icon | `VNodeChild` | — | `null`/`false` 显式禁用；否则覆盖默认 IconMap 图标 |
| title / subTitle / extra | `VNodeChild` | — | `isRenderable` 守卫（`''`/`false` 不渲染） |
| children | 默认插槽 | — | body 区（`isRenderable` 守卫） |
| classNames / styles | 语义槽位 | — | root/title/subTitle/body/extra/icon 六槽 |

## 2. 行为契约（逐条）

1. **双分支图标**：`ExceptionStatus.includes(status)`（403/404/500）→ div 渲染
   静态插画组件（noFound/serverError/unauthorized，**hex 字面量、不随主题**）；否则
   `icon === null || icon === false → null`，再 `icon || IconMap[status]`
   （CheckCircleFilled/CloseCircleFilled/ExclamationCircleFilled/WarningFilled）。
2. **icon 类名**：`${prefixCls}-icon` + 异常状态追加 `${prefixCls}-image`
   （imageWidth 250 / imageHeight 295 钉在样式层）。
3. **渲染守卫**：title/subTitle/children 各自 `isRenderable` 才渲染；
   extra 在 Extra 子组件里同样守卫（`!isRenderable(extra) → null`）。
4. **语义合并顺序**（useMergeSemantic）：classNames `[contextClassNames, classNames]`；
   styles `[contextStyles, contextStyleRoot, styles, styleRoot]` —— 用户 `style`
   经 `useSemanticRootStyle` 折进 `styles.root`（后位覆盖）。rootStyles **只**含
   `mergedStyles.root`（style prop 不再单独合并）。
5. **restProps**：`pickAttrs(rest, { aria: true, data: true })` —— 只透传 aria/data。
6. **nativeElement**：`useImperativeHandle` 暴露 `{ nativeElement }`。
7. **常量**：`PRESENTED_IMAGE_403/404/500 = ExceptionMap[...]`（插画组件本身）；
   `IconMap`/`ExceptionMap` 具名导出。
8. **RTL**：`direction === 'rtl'` → `${prefixCls}-rtl`。

## 3. 样式契约（style/index.js 逐条）

- root：`padding: calc(paddingLG*2) paddingXL`
- `-image`：width 250 / height 295 / margin auto
- `-icon`：marginBottom paddingLG；`& > 图标` font-size iconFontSize（= heading3×3）
- `-title`：colorTextHeading / titleFontSize(=heading3) / lineHeightHeading3 / marginBlock marginXS / center
- `-subtitle`：colorTextDescription / subtitleFontSize(=fontSize) / lineHeight / center
- `-body`：marginTop paddingLG / padding paddingLG calc(padding*2.5) / colorFillAlter
- `-extra`：margin extraMargin(paddingLG 0 0 0) / center；子项 marginInlineEnd paddingXS、末位 0
- 状态色：success/error/info/warning → colorSuccess/colorError/colorInfo/colorWarning

Component Token（4）：`titleFontSize` `subtitleFontSize` `iconFontSize` `extraMargin`。

## 4. Vue 对应（平台差异）

| React | Vue |
|---|---|
| `isReactRenderable` | `isRenderable`（utils 已改名，契约同） |
| `pickAttrs(rest,{aria,data})` | `pickAriaDataAttrs`（utils/event-name 契约） |
| `useImperativeHandle` | `defineExpose({ nativeElement })`（badge 的 nativeElement 范式） |
| 插画组件（React FC） | render 函数组件（h 链机械转换，hex 字面量保留） |
| forwardRef + ref | defineExpose |

## 5. 预判差异

| # | 差异 | 分类 |
|---|---|---|
| D6 | 前缀 apollo-result vs ant-result | INTENDED |
| D5 | 无 hash 包裹；Component Token 4 变量声明在根类 | INTENDED |
| — | 插画 hex 字面量（antd 亦为静态，不随主题） | 平台一致 |

## 6. 本分析没有证明什么

- 插画像素级形态（L6 负责）；jsdom 无视觉。
