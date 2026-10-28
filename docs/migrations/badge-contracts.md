# Badge / Ribbon 原生契约修正

适用版本：当前未发布 `0.0.0` 开发版。按 ADR 0006 / 0007 和已授权的 Vue 原生规则直接修正，无兼容通道、弃用期或旧 DOM 复刻。原有 Badge / Ribbon / Badge.Ribbon 导出、九 Token 和十三 Demo 保留。

## 根样式和内部样式

旧 Badge / Ribbon 把 Vue `style` 声明为对象 prop，再送给指示器；Badge 还按状态改变落点，字符串和数组样式会被覆盖或校验告警。现在根 `class` / `style` 是 Vue 原生 attrs，支持对象、字符串、数组、动态移除。内部样式使用既有 `styles.indicator`，不新增别名。

```vue
<!-- 旧：style 意外写到指示器 -->
<Badge :count="5" :style="{ background: '#fff', color: '#595959' }" />
<!-- 新：明确内部目标；原生 style 始终控制根 -->
<Badge :count="5" :styles="{ indicator: { background: '#fff', color: '#595959' } }"
  :style="[{ marginInlineEnd: '16px' }, 'padding: 4px']" />
<Ribbon text="Ready" :styles="{ indicator: { paddingInline: '12px' } }"
  style="margin-block: 8px" />
```

Ribbon `className` 保留其已存在的独立 indicator 目标；根类使用 `class`。ConfigProvider 的 `style` 是配置字段，保留已文档化的独立目标：Badge 的状态独立模式为 root，其他模式为 indicator；Ribbon 为 indicator。建议用语义 `styles` 明确目标；这些配置字段不是组件的原生 attrs，不因名称相同而移除。配置对象、语义函数、方向和前缀均读取当前值。

## 完整内容与引用

Ribbon 的 `text` 正常渲染全部 `VNodeChild`，不再把数组误当组件类型。新增原生 `#text` 与 Badge 内容规则一致：插槽存在即优先，含有意为空；移除条件槽恢复 text prop。Badge 既有 default/count/text 槽保留全部内容及离场缓存，富内容不进入数字拆位。

Badge 的非标量 count 数据同样使用实际原生 sup 指示器，与 #count 共用完整内容路径。原 VNode、数组、Fragment、文本节点与多根组件不再走单节点克隆；子节点的 class/style/key/ref/业务实例保留，指示器语义、title、位移和 motion 由外层宿主拥有。旧自定义节点上的 scroll-number-custom-component 标识移到指示器，样式使用 styles.indicator；富内容使用统一计数外观，自带外观可明确覆盖既有语义样式，不保留 React 克隆树兼容通道。

null、布尔、空串/数组/Fragment/文本节点均按 Vue 空内容判断；无计数时独立文字仍可显示。条件组件返回空内容时空指示器不占位，业务组件保持一次挂载；重新出现恢复同一宿主。状态分支的自动 title 读取当前 count，避免继承上一条离场数字。

Badge 补齐已声明的只读 `nativeElement`，指向实际根 span；状态与数字模式共用根，避免模式切换丢失根焦点。Ribbon 引用仍指实际 wrapper。卸载后引用为空，重挂引用新根；不暴露内部引擎实例。

## 数字、偏移、样式与可访问性

`dot` 按公开优先级覆盖零计数；独立 `text=0` 不再隐藏非零 count。既有状态文本的 `showZero` 行为保留。负整数保留负号，数字继续滚动；动画中其他数字仅作视觉轨道，不参与朗读。显式 title 同样消费于独立状态点，null/false 继续禁用。

offset 保留小数及 CSS 长度：数字按 px，数字字符串按 px，带单位/百分比/表达式的 x 用 CSS calc 取负，y 保留原长度。逻辑方向随当前 direction 更新。小尺寸轨道使用实际小尺寸高度；匹配系统 reduced-motion 时停止波纹/滚动过渡并关闭出入场动画。

九个已有 Token 从当前 Alias 派生并消费 `theme.components.Badge`，接受适用的 0，覆盖替换和移除立即生效，显式根 CSS 变量仍优先。预设背景不为整改任意改色；普通实色 count / Ribbon 前景按背景的线性 sRGB 亮度选择可读的黑/白，显式 indicator/content color 仍优先。自定义渐变、透明背景和完整样式覆盖由作者配对前景，不能据默认配色验收声称任意作者样式都满足对比度。

原二十六机械场景继续运行；仅两个自定义色场景新增私有背景变量以推导前景，精确差异登记在 semantic.test.ts。原始 HTML、参考渲染器与十八张参考 PNG 不改，未放宽比较阈值。

## 验证状态

修前整组32项行为复现8通过/24失败，真实浏览器146检查42通过/104失败；原有95项运行时继续通过。Provider 复现使用真实 Teleport，未把替身重挂载误判为生产根替换。最终统一验收、实际命令、提交与剩余边界持续记录在 [本轮清单](../audit/2026-10-28-badge-contract-audit.md) 和证据目录；实现阶段不等于全库完成。
