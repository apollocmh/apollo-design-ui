# Space / Compact / Addon 契约修正

适用版本：`0.0.0` 未发布开发阶段。依据当前公开 VNodeChild 文档、Vue 原生内容/身份语义及 ADR 0006 / 0007 直接修正。没有兼容回调通道或弃用期；既有 direction/split 弃用别名继续可用并告警。本轮不改公开导出名，不新增组件 Token。

## 内容与当前配置

旧实现缓存默认/分隔槽的存在性，条件新增的槽可能不出现。现在在 render 读取当前槽；`#separator` 存在即优先，空槽有意隐藏分隔符，移除槽恢复内容 prop。

```vue
<Space :separator="separatorData">
  <Editor />
  <Button>Save</Button>
  <template v-if="customSeparator" #separator><strong>·</strong>{{ 0 }}</template>
</Space>
```

separator/split 的旧导出类型被错误限制为 string；原双语 API 声明为 VNodeChild。本轮保留完整 VNode 数据（数字、VNode、数组、空值），函数仍不属于内容数据。模板富内容也可用具名槽，不恢复 React 内容函数 prop。

`separator=0` 以前被真值过滤，现为带语义类名的 `<span class="apollo-space-item-separator">0</span>`。null、布尔、空字符串、注释仍不产生分隔宿主。历史 React 参考的裸 0 文本没有被复制；原始参考不变，DOM 回归精确登记仅该宿主差异，另有文本/宿主断言覆盖。

Provider 的 size/className/style/classNames/styles 现在从当前配置读取。替换与移除不会残留 setup 快照；原生 class/style 仍最后合并。语义函数继续接收合并后的当前 size/orientation/align。

## 身份、焦点与紧凑协议

旧包装键可能随 item class/prefix 改变，并丢弃 Symbol 和 keyed Fragment 的 key 作用域。现在键与外观解耦，数组/Fragment 展平保留 key 作用域，同名子 key 可以处于不同 keyed Fragment 中。无 key 的内容按位置保持身份；删除项的历史键缓存不保留。

Space/Compact 在实际原生 DOM 移动后，仅当原聚焦元素仍在本实例中且浏览器焦点退回 body 时恢复焦点；不会抢占外部控件或恢复已移除的控件。不会为保持旧树形态添加 DOM 包装。

Compact 的空文本现与 null/注释一样不占首尾位置；数字 0 保留。当前 size/direction/first/last、嵌套边界合取、NoCompactStyle 隔离与三个可空 nativeElement ref 保持既有公开形态。

## 当前 Alias、Addon 与关联 Select

Space、Compact、Addon 在自身作用域消费当前 Alias，覆盖 ThemeProvider 不注入 CSS、SSR 和嵌套主题场景；原生 style 变量最后胜出。预设 gap 仍为 paddingXS / padding / paddingLG；ComponentToken 仍为空。

Addon 横/纵紧凑边界由上下文控制，保留独项四角及外侧圆角；去掉旧的 :first-child/:last-child 边框删除规则，避免没有实际共享边框。已有 outlined/filled/borderless/underlined 和 status/disabled 绘制优先级保留。error/warning 的文字由现有 colorErrorText/colorWarningText 与当前 colorText 等量混合派生，替代对比度不足的装饰色；边框仍使用原状态色，filled 背景与禁用优先级保留。disabled 只描述单元格外观，不会自动禁用槽中的真实控件。

关联 Select 的局部修正独立交付：尺寸按本地 size → 当前 compactSize → Provider size；原生 NoCompactStyle 回落与节点/焦点保持有专门回归。selector 背景的静态默认值由固定白色改为现有 colorBgContainer Alias，保留原生内联组件变量优先级。此改动不代表 Select 全部主题 Token 或 API 已审计完成。

## Demo、样式入口与验证

十五个 Demo 使用真实 Button/Input/Select/picker 等控件及公开包入口，旧 `_standin` helper 在引用归零后移除；配对 Markdown 展示同一源码。`@apollo-design/ui/space/style.css` 已在 exports 中，原文档称不可用的结论已更正。任意自定义前缀的自动 CSS 仍属共享 D04；prefixCls 不生成运行时选择器。

源码验证入口：

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/space --maxWorkers=1
SPACE_SOURCE=1 node tests/consumer/space-types.mjs
SPACE_SOURCE=1 node tests/browser/space-contracts.mjs
```

发布 JS/CSS 验证需在主线程统一构建并通知 dist-ready 后运行不带 SPACE_SOURCE 的消费/浏览器脚本；不得混入源码 CSS。正式 Apollo 视觉与最终同提交全库门禁单列，完整红灯、修复与剩余边界见 [审计记录](../audit/2026-10-28-space-contract-audit.md)。
