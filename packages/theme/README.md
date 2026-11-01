# @apollo-design/theme

Apollo 的 L0 设计令牌包：Seed → Map → Alias 派生、CSS 变量转换与 Vue 主题上下文。规范来源见 [AGENTS.md](../../AGENTS.md) 和 [ARCHITECTURE.md](../../ARCHITECTURE.md)；历史 Ant Design 对照保留为回归证据。

运行依赖为 `@apollo-design/utils`，Vue 是 peer dependency。`@ant-design/colors` / `@ant-design/fast-color` 仅作为开发对照工具，不进入发布运行图。基础包不依赖 UI。

## 预设与明暗

```vue
<script setup lang="ts">
import { ConfigProvider } from '@apollo-design/ui';
import { monoPreset } from '@apollo-design/theme/presets/mono';
</script>

<template>
  <ConfigProvider :theme="{ preset: monoPreset, mode: 'system' }">
    <App />
  </ConfigProvider>
</template>
```

预设是 `ThemePreset` 数据对象，与 `mode: 'light' | 'dark' | 'system'` 独立。三个内置入口分别是 `presets/default`（`defaultPreset`）、`presets/mono`（`monoPreset`）和 `presets/material3`（`material3Preset`）；每个入口也有 default 导出。根入口不汇总预设，因此单独使用 Mono 不引入另外两套预设。Material 3 是色彩、排版、形状、表面与阴影的启发式预设，保留 Apollo 的组件结构、交互和无障碍契约。

用户预设使用同一公开 API，无需注册名称或主题 resolver：

```ts
import { getDesignToken, type ThemePreset } from '@apollo-design/theme';

const brand: ThemePreset = {
  name: 'brand',
  token: { fontSize: 16, borderRadius: 6 },
  light: { token: { colorPrimary: '#006b60', colorBgBase: '#f8fffc' } },
  dark: { token: { colorPrimary: '#1a786d', colorBgBase: '#0b1715' } },
};
const token = getDesignToken({ preset: brand, mode: 'dark', token: { fontSize: 18 } });
```

派生顺序为默认 Seed → preset.token → preset 当前 light/dark.token → 用户 token 中的 Seed → 算法 → 用户 Alias 覆盖；`components` 留给 UI 按最终组件覆盖消费。修改主色同时改变 hover/active 等色板，修改字号同时改变派生排版。`ThemePresetScheme.algorithm` 可定义该预设的真实派生规则，显式 `ThemeConfig.algorithm` 仍是完整算法链并优先于预设算法。已知 default/dark/compact 算法也决定选用预设的亮暗分支；局部显式 algorithm 不被外层 mode 覆盖，局部显式 mode 则替代继承的 algorithm。

`getDesignToken({mode:'system'})` 是确定性的服务端亮色；已知请求偏好时可传第二参数 `'dark'` 或 `'light'`。Vue 中的活跃 Provider 在 mounted 后读取并监听系统偏好，切换 mode 或卸载时释放监听。组件外的 `createThemeContext()` 不持有浏览器生命周期；应传入实际 light/dark 或自行更新 config。

`ConfigProvider` 在有显式主题来源时向业务根和浮层投影完整变量，使用 Mono 或自定义预设无需同时引入默认 `tokens.css`。仍需按所选导入方式引入 UI 结构 CSS。

## 静态样式

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
```

`tokens.css` 提供默认、`[data-apollo-theme="dark"]`、`[data-apollo-theme="compact"]`、`[data-apollo-theme="dark-compact"]` 四套变量。组件规则使用默认 `--apollo-*` 名称。自定义变量前缀需要对应样式消费；DOM 类名前缀由 UI 的 `ConfigProvider.prefixCls` 配置。

每个预设另有独立的可选静态资源 `@apollo-design/theme/presets/default.css`、`mono.css`、`material3.css`，均由相同的 `getDesignToken` / `getCSSVarDeclarations` 生成，不导入其它预设或旧变量表。给全局或局部变量根显式设置 `data-apollo-preset="mono"` 与 `data-apollo-theme="light|dark|system"`；后代继承这些变量。system 的静态资源通过 prefers-color-scheme 媒体查询选择暗色，可在 JS 启动前配置 HTML 属性。自定义预设的 SSR/CSS 也用 `getCSSVarDeclarations(getDesignToken(...))` 输出，无需另一张手写色表。静态变量表服务于 CSS/首屏；需要组件级覆盖及 JS Token 消费时，Provider 使用同一 preset/mode。

## 纯函数派生

```ts
import { compactAlgorithm, darkAlgorithm, getDesignToken } from '@apollo-design/theme';

const token = getDesignToken({
  algorithm: [darkAlgorithm, compactAlgorithm],
  token: { colorPrimary: '#6455ff', fontSize: 16, colorPrimaryBg: '#101030' },
});
```

`getDesignToken()` 默认使用 `defaultAlgorithm`；`algorithm: []` 也得到完整默认令牌。非空数组按顺序把前一算法的 Map 结果传给后一算法。已知 Seed/Map/Alias 键遵守各自值类型，未知扩展接受 string/number/boolean。显式 `undefined` 等同省略；`0`、`false` 和有语义的空串保留。`components` 由 UI 消费，本函数不把组件覆盖混入 Alias。

颜色派生使用 utils.Color 支持的具体色值，如 hex、rgb/rgba、hsl/hsla、hsv/hsva；不是浏览器的完整 CSS 颜色解析器，不解析颜色名称、`var()` 或 `color-mix()`。`colorLink: ''` 有明确的回退语义；预设色空串会报颜色解析错误。数值按各 Token 语义配置：常规正字号及小数字号保留派生精度；零、极小、负字号和非有限数不自动归一化，仍可能生成无效数值，不属于支持的字号输入域。允许零的尺寸、关闭动效等有效值不被当作缺省。

源级派生函数不访问 DOM，也不导入 Vue。公共根入口同时导出 Vue 绑定，仍需已声明的 Vue peer；没有未声明的纯函数子路径。

## Vue 上下文与 Provider

```vue
<script setup lang="ts">
import { ThemeProvider } from '@apollo-design/theme';
</script>

<template>
  <ThemeProvider :theme="{ token: { colorPrimary: '#6455ff' } }" inject-css-var>
    <App />
  </ThemeProvider>
</template>
```

| Prop | 类型 | 默认 | 行为 |
| --- | --- | --- | --- |
| theme | ThemeConfig | `{}` | 当前配置；后续整值或深层 prop 更新恢复 prop 的权威值 |
| injectCssVar | boolean | false | 挂载后把当前有效 Token 写入目标；支持动态启停 |
| target | HTMLElement \| SVGElement \| null | 客户端 document.documentElement | 变量目标；null/省略均回落到文档根，支持原生模板 DOM 引用；切换时释放旧目标 |

Provider 保持 renderless，只有默认槽，无自定义 Emits、v-model 或 Expose。DOM attrs/listeners 放在业务元素上；Provider 不隐式转发给多根槽或变量 target。条件槽正常更新，主题切换不重挂业务子树。SSR 只提供数据，DOM 注入在 mounted 后执行；卸载释放自己的 scope。

`ThemeProvider` 保留既有默认：`theme={}` 是显式重置，不继承父主题，CSS 变量前缀也沿用本地默认；设置 `theme.inherit: true` 才合并最近的原始配置。UI `ConfigProvider` 保留默认继承，`theme.inherit: false` 才重置，并保留父 CSS 变量前缀。这两个边界都调用 `mergeThemeConfig(parent, own)`，不把已派生的父 Alias 当作子预设输入；token 按键合并，components 按组件与键合并。重置后预设、明暗、用户 token 与组件覆盖从本地开始。

在组件 setup 中调用 `useTheme()` 或 `useToken()`。`useTheme().config` 是可写深层 Ref，`token` 是随有效配置更新的 ComputedRef：

```ts
const theme = useTheme();
theme.config.value = { token: { fontSize: 18 } };
theme.config.value.token = { ...theme.config.value.token, fontSize: 20 };
```

也可通过 `config.value.token` / `components` 的代理对象原位更新。`createThemeContext(config)` 使用 Vue ref 语义；修改外部原始对象不会绕过 Vue 自动触发响应，使用 `config.value`、传入 reactive 对象或整值替换。Provider 的本地可写配置与输入 props 隔离，后续 prop 更新会覆盖本地运行修改。保证的是 Ref.value 更新；不承诺重绑 Ref 容器、修改计算结果或改变导出默认对象来更新现存缓存。

最近的显式主题上下文优先。无 Provider 时，同一 Vue app 共享惰性默认 context，不同 app 隔离；SSR 每个请求创建自己的 app，复用同一个 app 则仍是同一份上下文。确需跨 app 共享时显式 provide 同一个 `createThemeContext()` 结果。

`sourceActive` 是可选只读来源元数据：无源默认 context 为空配置时是 false，写入非空配置后为 true，清空恢复 false；显式 ThemeProvider 即使 `{}` 也为 true。旧自定义 context 不带此字段仍视作显式来源。UI writer 需要区分无源 CSS 主题与显式默认主题。

## CSS 变量 API

- `token2CSSVar(name, prefix?)`：稳定的 Token → CSS 变量命名，默认前缀 apollo，空前缀也受支持。
- `transformToken(token, prefix?)`：返回 `{ vars, refs }`；只处理 string/number，保留断点原值，单位表字段不加 px，忽略派生配置字段。
- `getCSSVarDeclarations(token, { prefix?, selector? })`：无 DOM 静态规则，默认 selector 为 `:root`。
- `createCSSVarScope(el, prefix?)`：`apply(token)` / `remove()` / `keys`；重复 apply 释放已消失的键，keys 是快照，remove 可重复且之后可再 apply。
- `applyCSSVar(el, token, prefix?)` / `injectTokenCssVar(...)`：一次性加法写入，无 owner 注册、无回收句柄；后续未包含的键不自动删除。

同目标同变量由最近一次 apply 的活跃 scope 提供；释放后恢复其他活跃 scope 或原有 inline 值及 priority。不同目标/前缀独立。外部直接写入不同值或 priority 后，scope 清理保留该外部写入；CSSOM 无法区分完全相同值的普通外部写入。一次性 API 明确交出所有权，即使写入相同值也可在 scope 清理后保留。

## 全部根导出

| 分类 | 导出 |
| --- | --- |
| 派生/算法 | getDesignToken, formatToken, algorithms, defaultAlgorithm, darkAlgorithm, compactAlgorithm, mergeThemeConfig |
| 默认值/预设色 | defaultSeedToken, defaultPresetColors, PresetColors |
| 共享派生函数 | genColorMapToken, genCommonMapToken, genControlHeight, genFontMapToken, genFontSizes, getLineHeight, getAlphaColor, genRadius, genCompactSizeMapToken, genSizeMapToken |
| CSS | DEFAULT_CSS_VAR_PREFIX, UNITLESS, IGNORE, PRESERVE, token2CSSVar, transformToken, getCSSVarDeclarations, createCSSVarScope, applyCSSVar |
| Vue | ThemeContextKey, createThemeContext, ThemeProvider, useTheme, useToken, injectTokenCssVar |
| 输入/主题类型 | SeedToken, MappingAlgorithm, ThemeConfig, ThemeContext, DerivativeTokenWithOverride, ThemePreset, ThemePresetScheme, ThemeMode, ThemeAppearance, ThemeTokenOverrides |
| Map 类型 | ColorMapToken, ColorNeutralMapToken, ColorPalette, FontMapToken, SizeMapToken, HeightMapToken, StyleMapToken, CommonMapToken, MapToken |
| 其他类型 | AliasToken, GlobalToken, ComponentTokenMap, PresetColorKey, PresetColorType, PresetColorPalettes, TransformResult, CSSVarScope |

`ThemeConfig` 包含 token、algorithm、cssVarPrefix、components、preset、mode 与 inherit。预设值从上述独立子入口导入。无消费的 `theme.prefixCls` 已移除；迁移与既有错误输入修正见 [Theme 契约迁移](../../docs/migrations/theme-foundation-contracts.md)。

## 验证

完整范围、失败复现、源回归和未验证边界见 [Theme 基础包审计](../../docs/audit/2026-10-29-theme-foundation-contract-audit.md)。包测试与类型检查遵循 [TESTING.md](../../TESTING.md)；浏览器回归入口是 `node tests/browser/theme-foundation.mjs`，支持已冻结产物的 `THEME_FOUNDATION_MODE=published`，自身不构建包。

变量目标也可为原生SVGElement；createCSSVarScope/applyCSSVar/injectTokenCssVar使用同一目标类型，保留原有style变量写入行为。

CSS变量转换/静态声明与scope/一次性写入接受`Partial<AliasToken>`，使原本已有效的部分变量操作具有准确声明；已知字段类型保持精确。scope.apply缺失字段仅释放自己的旧写入，一次性apply保持加法语义，原有所有权与原生覆盖规则不分叉。
