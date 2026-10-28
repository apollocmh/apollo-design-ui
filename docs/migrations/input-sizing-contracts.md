# Input 当前主题与尺寸契约修正

适用版本：当前未发布的 `0.0.0` 开发版。追踪号 `INPUT-SIZING-20261029`。
本轮保留 Input 家族的 props、slots、事件、v-model、ref 与 19 个既有组件 Token，
不新增公共字段或兼容开关。完整盘点和修改前红灯见
[本轮审计](../audit/2026-10-29-input-sizing-audit.md)。

## 行为变化

| 场景 | 旧行为 | 当前契约与迁移 |
|---|---|---|
| 当前主题字体和 padding | 私有字号与 padding 冻结在默认主题，compact 仍为 14/16px | 默认值消费当前 Alias；移除补偿旧字号的固定高度。显式字体、行高和 padding 保持有效 |
| `theme.components.Input` | 全部 19 个已公开字段没有进入组件消费链 | 数字长度按 px，CSS 长度字符串与零值保留；部分配置及动态清除回到当前默认值 |
| 前后缀间距 | `inputAffixPadding` 有公开类型和准备结果，却没有声明或消费 | 接通该既有字段及对应 CSS 变量；没有增加新 Token |
| 显式覆盖 | 复合内部节点再次声明默认变量，覆盖逻辑根上的变量 | 默认只在逻辑根声明；主题数据先于语义和原生样式合并，原有 stylesheet 覆盖仍有效 |
| Provider `style` | input、textArea、inputPassword 的根样式被丢弃 | 作用于逻辑根；复合 Search/OTP 的实际输入节点使用 `styles.input` |
| 空主题来源 | 用配置对象是否有键判断来源，显式空 ThemeProvider 被当成无来源，不能在 CSS-only 作用域内重置默认值 | 消费共享来源身份；显式空 ThemeProvider/factory 仍提供默认数据，无来源时保留 CSS 继承，无 theme 的 ConfigProvider 继续传递最近有效来源 |
| Focus 阴影 | outline Alias 已有 px，又拼接 px，三个默认阴影无效 | 默认、error、warning 的合法阴影重新绘制；移除为旧无效阴影添加的补丁 |
| `Input.Group size` | 未传给实际 Compact；后代 CSS 强制盖掉子 Input/Select 的显式尺寸 | size 作为 Compact 默认值，子组件显式 size 优先。确需统一大小时明确给子组件设置 size |
| `Input.OTP size` | 忽略 Compact，根和格子使用全局 Provider 尺寸 | 组件显式 size → 最近 Compact → Provider，根和格子一致 |
| TextArea 大号行高 | 基础 textarea 规则盖掉大号行高 | 随大号字体使用当前 `lineHeightLG`，保留 rows 和既有最小高度 |
| TextArea autoSize | 仅 mount/value/autoSize 重测；祖先样式在同宽下改变字体/padding 后仍保留旧高度 | 比较实际量测签名，原生观察控件与祖先属性，DOM 迁移后重绑，排版过渡/动画结束后重测；保留草稿、焦点、选择与 minRows/maxRows，禁用/卸载清理 |
| Search 按钮 | 固定 nominal 高度，随后新增的 min-height 又夹住调用者显式的较小高度 | 使用自然 flex 伸展，不注入 Search 自有 min-height；调用者的 height/min-height 按 CSS 实际生效 |

## small 的自然下限

默认主题的单行 Input small/middle/large 为 24/32/40px，compact 为 22/28/35px。
compact small 的 12px × 1.6667 行盒加两侧边框，非负 padding 下自然下限为 22px，
高于 `controlHeightSM=21px`。不通过负 padding、缩字、压行高或固定 height 塞进 21px。
不同类型控件没有外框高度恒等承诺；通用 Compact、Theme 和 Button 不在此处改动。
TextArea 继续按 rows、已有最小高度和 autoSize 约束排版，不套用单行高度表。

公开 `prepareInputComponentToken` 的数值快照公式与返回类型保持兼容。
静态 CSS 的默认值消费当前 Alias，显式组件字体参与默认 padding 派生，
显式 padding 则覆盖派生值；用户样式仍可让自然行盒继续长高。
显式 `ThemeProvider :theme="{}"` 与 `createThemeContext({})` 是默认主题来源，
不能用空配置对象把它们当成“没有来源”。只有没有有效来源时才保留外部 CSS-only
变量继承；无 theme 的 ConfigProvider 不凭空写入默认主题，仍遵守最近来源及既有合并规则。
这项修正不改变19个Input字段，也不增加Input prop。
Search 的默认按钮自然高度仍随输入行盒对齐；显式 18px 或 60px 均保留，
调用者同时设置 min-height 时按其自己的 CSS 约束排版，不添加兼容 class。
autoSize 不轮询，也不把未重测的内容塞进固定高度；无关颜色/状态属性与自身高度回写
不会重复执行影子量测。相关祖先 class/style 变化、宽度变化和排版结束事件均有回归。

```vue
<ConfigProvider
  :theme="{ components: { Input: { paddingBlock: 8, inputAffixPadding: '0.5rem' } } }"
>
  <Input prefix="@" />
  <InputSearch enter-button="搜索" />
  <TextArea :auto-size="{ minRows: 2, maxRows: 4 }" />
</ConfigProvider>
```

## 验证边界

源码浏览器回归分别运行整包与 Input 按需 CSS：

```sh
node tests/browser/input-sizing-contracts.mjs
INPUT_SIZING_CSS=entry node tests/browser/input-sizing-contracts.mjs
```

脚本仅打包临时夹具，缓存和输出在 `/tmp`；不执行包构建或写 dist。
`INPUT_SIZING_MODE=published` 读取发布 JS/CSS，须在主任务完成同一提交构建后运行。
源码验收不能代替发布声明、L7、正式视觉、Docs 或全库最终同提交门禁。
