# Tag 实现说明（Tag / CheckableTag / CheckableTagGroup）

## 1. 对应 antd 组件

- antd 6.6.4 · `es/tag/`（只读参照，H2）+ `_util/hooks/useClosable`
- 分析产物：`docs/analysis/tag.md`（G1，先于实现存在）

## 2. 与 antd 的行为差异清单

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D6 | 前缀 `apollo-tag`（基线侧 ConfigProvider iconPrefixCls 对齐图标类） | INTENDED | L4 |
| D5 | 无 hash；3 个 Component Token 变量声明在根类 | INTENDED | L4 |
| — | **Wave 点击波纹未实现**：antd 仅在 onClick/`<a>` children 时包 Wave，无静态 DOM/SSR 差异（运行时动画层） | 已知缺口 | — |
| — | `#2db7f5` → CSSOM 序列化 `rgb()` | PLATFORM | L4 allow ×2 |
| — | `defaultBg`/`solidTextColor` 以 seed 实色落地（antd cssVar 产物同为实色 #f5f5f5/#fff） | 平台一致 | L4 逐字节 |
| — | demo `draggable` 用 HTML5 原生拖拽（dnd-kit 未引入）、`control` 用原生 input（Input/Tooltip 未落地） | 已知缺口（等价替换） | demo 注释 |

## 3. .vue / .tsx 选择

- `Tag.ts` / `CheckableTag.ts` / `CheckableTagGroup.ts`：render 函数
  （icon/closeIcon 要 cloneVNode 注入 role/tabIndex/类/事件 —— badge/ScrollNumber 范式）。
- `hooks/use-color.ts`：useColor 判据链（FastColor → 我们的 Color 类）。
- `_internal/use-closable.ts`：closable/closeIcon 三方合并（Tag 首个消费者；
  Alert/Notification 将复用 —— 三次法则收进共享层）。

## 4. Component Token 清单（3 个）

`defaultBg(#f5f5f5 = colorFillTertiary onBackground 容器色) / defaultColor(var(--color-text)) /
solidTextColor(#fff，isBright(colorBgSolid) 判定)`。antd cssVar 产物同为实色 —— seed
常量落地与「规则侧全 var() 消费」并存（E10 校验豁免声明行）。

## 5. 关键判据（G1 §2 的落地）

1. **variant 判据链**：variant > `-inverse`→solid > bordered=false→filled > context/filled。
2. **关闭流程**：stopPropagation → onClose → defaultPrevented 中止 → href
   preventDefault → visible=false（**DOM 保留**，`-hidden` 隐藏）。
3. **close-icon 单层 DOM**：克隆用户/默认图标元素本身注入 role/tabIndex/aria-label/
   类/事件 —— 键名按 vnode 类型区分（组件 `tabIndex` / 元素 `tabindex`，icons 的
   createIcon 对「有 onClick 无 tabIndex」兜底 -1，必须显式覆盖）。
4. **CheckableTag 键盘**：空格触发 onChange（Enter 不触发，antd 逐字）。
5. **tagStyle 合并**：disabled → 只 styles.root；否则动态色在前、语义槽位覆盖。

## 6. 共享层

- `_internal/use-closable.ts`：computeClosable 纯函数 + useClosable composable
  + pickClosable；closable 三层合并语义（props false 强制关 / props 胜 /
  context false 强制关 / fallback 兜底）。
- 复用 `_internal/preset-color.ts`（badge 期）：13 预设色 + 4 状态色判定。

## 7. 已知缺口

- Wave 波纹（见 §2）。
- Group 的 `item` 语义槽位classNames/styles 已实现，但 `option.className/style`
  仅对 label 外层生效（antd 同构）。
- `bordered` deprecated 告警与 `color="-inverse"` 告警在 setup 期发一次
  （antd 每次 render —— PLATFORM）。
