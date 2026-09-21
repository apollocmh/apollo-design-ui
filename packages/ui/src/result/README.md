# Result 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/result/`（只读参照，H2）
- 分析产物：`docs/analysis/result.md`（G1，先于实现存在）

## 2. 与 antd 的行为差异清单

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D6 | 前缀 `apollo-result`；IconMap 图标类 `apollo-icon`（基线侧经 ConfigProvider iconPrefixCls 对齐） | INTENDED | L4 `*:prefix-cls:no-props` |
| D5 | 无 hash 包裹；Component Token 4 变量声明在根类 | INTENDED | L4 全部 |
| — | 插画（403/404/500）hex 字面量不随主题 —— **antd 亦如此**（与 Empty 的 token 化插画不同源） | 平台一致 | L4 逐字节对齐 |
| — | `icon` 的 SSR dev 告警（v4 字符串命名废弃）未实现（devUseWarning 场景） | 已知缺口 | README §7 |
| — | `children=''` 的守卫：antd 不渲染 body；Vue 空插槽归一化成数组 → 渲染空 body | PLATFORM（同 Empty footer 契约） | L1 body 守卫用例 |

## 3. .vue / .tsx 选择

- `Result.vue`：SFC（结构与 spin 同构）。
- `components/NoFound.ts` 等：**机械转换**（脚本把 antd 的 React.createElement 链转成
  h 链：变长子节点折数组、camelCase SVG 属性转 kebab），hex 字面量逐字节保留。
- `maps.ts`：IconMap / ExceptionMap 单源（Result.vue 与 barrel 的 PRESENTED_IMAGE_* 共用）。

## 4. Component Token 清单（4 个）

`titleFontSize(=fontSizeHeading3) / subtitleFontSize(=fontSize) / iconFontSize(=heading3×3) /
extraMargin(=paddingLG 0 0 0)`。CSS 变量声明在 `.apollo-result`，`iconFontSize` 的乘法用
`calc(var(--apollo-font-size-heading-3) * 3)` 表达（主题缩放自适应）。

## 5. 关键判据（G1 §2 的落地）

1. **双分支图标**：异常状态忽略 `icon` prop；普通状态 `icon ?? IconMap[status]`，
   `null`/`false` 连容器都不渲染。
2. **`style` prop 折进 `styles.root`** 且**覆盖**之（`useMergeSemantic` 的顺序契约）。
3. **`pickAttrs(attrs, { aria: true, data: true })`** —— id/class 等不透传。
4. **`nativeElement`** 经 `defineExpose` 暴露。

## 6. 连带修复：图标基线进全局

result 是第二个被 `.anticon` 基线缺失咬到的组件（button 期自保过一次；result 的
图标 86.8 vs 72 确认这是集成缺口）。按三次法则把 `@apollo-design/icons` 的
`getIconStyle()` 接进 `ui/style/index.ts` 的 `BASE_CSS`（每份组件 CSS 自带）。

## 7. 已知缺口

- `children=''`（字符串空子节点）在 Vue 侧无法与「空插槽」区分（插槽归一化），
  渲染空 body —— 与 Empty 的 footer 契约同一条 PLATFORM 差异。
- devOnly 告警（icon 字符串命名废弃）未实现。
- L4 基线用 ConfigProvider（prefixCls+iconPrefixCls）包裹对齐 antd 的 anticon 输出。
