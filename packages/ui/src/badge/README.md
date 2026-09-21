# Badge 实现说明（Badge + Ribbon）

## 1. 对应 antd 组件

- antd 6.6.4 · `es/badge/`（只读参照，H2）
- 分析产物：`docs/analysis/badge.md`（G1，先于实现存在）

## 2. 与 antd 的行为差异清单

（同步到 `COMPATIBILITY.md` §9；分类依据 AGENTS.md §4.3）

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D6 | 前缀 `apollo-badge`/`apollo-scroll-number`/`apollo-ribbon` vs `ant-*` | INTENDED（裁决 `prefix-cls-default` = A） | L4 `*:prefix-cls:no-props` |
| D5 | 无 CSS-in-JS hash 包裹类 | INTENDED（D5） | L4 全部用例 |
| — | `#2db7f5` → CSSOM 序列化为 `rgb(45,183,245)`（React SSR 是字符串拼接） | PLATFORM（语义等价） | L4 `*:custom-color` ×3 |
| — | Component Token 的派生乘除（`indicatorHeight=20`）以默认 seed 常量落地，主题覆盖 alias token 不改变 | 已知边界（同 grid 断点） | style/token.ts |
| — | offset 数字补 px：React 自动 / Vue 手动（L4 用数字对齐 + L1 钉数字路径） | PLATFORM | L1 offset 用例 |
| — | 空间插入（spaceChildren）仅处理单个字符串/Text 子节点；antd 的 cloneElement 分支（组件子节点内嵌两字）未实现 | 已知缺口 | README §7 |

无 BUG 类差异（L6 全 exact）。

## 3. .vue / .tsx 选择

- `Badge.vue` / `Ribbon.vue` / `SingleNumber.vue`：SFC。
- `ScrollNumber.ts`：render 函数（children 分支要 cloneVNode，SFC 模板表达不了；spin/Indicator 范式）。
- `parseFlex` 类纯函数：`isPresetColor` 抽到 `_internal/preset-color.ts`（共享层，三次法则）。

## 4. Component Token 清单（9 个）

`indicatorZIndex('auto') / indicatorHeight(20) / indicatorHeightSM(14) / dotSize(6) /
textFontSize(12) / textFontSizeSM(12) / textFontWeight('normal') / statusSize(6) / paddingInline(8)`

落地形态：CSS 变量声明在 `.apollo-badge` / `.apollo-ribbon-wrapper`（B7 认组件 CSS
局部声明 —— grid 落地时扩展），规则侧全部 `var()` 消费。名称与默认值计算方式与 antd
`prepareComponentToken` 逐字对齐。

## 5. 共享层

- 新增 `_internal/preset-color.ts`：PresetColors / isPresetColor / isPresetStatusColor
  （badge 的 color/status；后续 Tag / Alert 复用）。
- 复用 `@apollo-design/motion` 的 CSSMotion（badge 是第一个消费者；为此修了首帧
  mergedVisible 的 SSR 缺陷）。

## 6. 已知缺口

- antd demo 的 `Avatar` / `Icon`（Plus/Minus） / `Card` 未落地：playground 类 demo 用
  原生元素等价替换。
- spaceChildren 的 cloneElement 分支（`<span>确定</span>` 这类元素子节点内嵌两字）
  未实现 —— 我们只处理单个字符串 / Text vnode。
- `title` 的 `false` 与 `null` 语义（显式禁用）已实现；`text === true` 不渲染（上游原样）。

## 7. 插画色（Empty 连带修复）

badge 收口的 L6 全量回归暴露 Empty 插画色问题：antd 的 empty.js 在运行时用
getDesignToken(theme) 解析 token 再 getAsSolidColor 合成 —— **主题切换会改变插画色**。
`empty/components/artwork.ts` 已重新生成为 `ctx.colors.<role>` 引用（生成器
`registry/tools/gen-empty-artwork.mjs`），`Images.ts` 从 useToken() 实时合成。
