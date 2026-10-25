# Tooltip / Popover / Popconfirm 内容插槽迁移

适用当前未发布开发版。依据 ADR 0006 / 0007 直接修正，无函数兼容层或弃用期。

| 旧函数 prop | 新 Vue 模板入口 |
| --- | --- |
| Tooltip.title | `#title` |
| Popover.title / content | `#title` / `#content` |
| Popconfirm.title / description | `#title` / `#description` |

对应 PurePanel 采用同样规则。`TooltipContent` 现为 `VNodeChild`，不再包括函数。已有字符串、数字（包括 `0`）、VNode 和数组数据保留；Tooltip / TooltipPurePanel / PopoverPurePanel 的运行时声明同步公开数据类型，富内容模板优先使用插槽。

```vue
<!-- 旧：<Popover :title="() => h('strong', label)" /> -->
<Popover title="Fallback">
  <button>Open</button>
  <template v-if="show" #title><strong>{{ label }}</strong></template>
  <template #content><input aria-label="Note" /></template>
</Popover>
```

槽存在即优先于同名 prop，显式空槽不回退；条件移除槽才恢复数据 prop。Popconfirm 的 `#okText/#cancelText` 也在当前 render 读取，空槽不会恢复 prop 或 locale；未提供槽时，空字符串按钮 prop 继续回退 locale。导出 `TooltipSlots`、`PopoverSlots`、`PopconfirmSlots` 并绑定六个公开组件的槽声明。

Tooltip 不再在 computed 或事件处理器里求值标题槽。无内容时抑制非受控打开和通知；受控 open 保留原有契约。取消顺序、Promise 确认、防重复提交及其他业务/样式函数保留。Popconfirm 的四个业务回调显式声明为 props，修复旧 attrs 通道忽略 `:on-confirm` 等 kebab-case 绑定；onConfirm 返回 unknown 保留 Promise，动态替换处理器即时生效。Popover 的 autoAdjustOverflow 声明同步既有公开类型，允许数字 adjustX/adjustY 与 shiftX/shiftY，不以断言绕过 Props 绑定。

历史 DOM 用例 ID 保留，Vue 调用迁为槽，原内容断言、参考基线和阈值不变。验证与仍未完成的视觉验收见 [专项报告](../audit/2026-10-25-overlay-content-slots-remediation.md)。
