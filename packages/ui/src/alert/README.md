# Alert 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/alert/`（只读参照，H2）
- 分析产物：`docs/analysis/alert.md`（G1，先于实现存在）
- 复合组件：`Alert`（注册名 `AAlert`）/ `Alert.ErrorBoundary`（`AAlertErrorBoundary`）

## 2. 与 antd 的行为差异清单

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D6 | 前缀 `apollo-alert`；默认图标走 `.apollo-icon-*`（ConfigProvider iconPrefixCls 对齐） | INTENDED | L4 全部 |
| D5 | 无 hash 包裹；Component Token 4 变量声明在根类 | INTENDED | L4 全部 |
| — | 废弃告警（closeText / message）setup 期发一次；antd 每次 render 发 | PLATFORM | L1 告警用例 |
| — | `title` / `description` / `action` 增加**插槽**通道（prop 优先） | PLATFORM | L1 插槽双通道用例 |
| — | ErrorBoundary 用 `onErrorCaptured`：只捕获后代组件渲染/生命周期错误（React 还捕获事件处理器错误，Vue 事件错误本就不进边界） | PLATFORM | L1 错误切换用例 |
| — | demo `loop-banner` 用等价 CSS 跑马灯替换 react-fast-marquee | PLATFORM | demo 文件头 |

## 3. .vue / .tsx 选择

- `Alert.ts` 渲染函数：CSSMotion 函数插槽要求根 div 在 slot 内产出（motion 类 +
  data-show 落根元素），IconNode / CloseIconNode 是带判据的子结构。
- `ErrorBoundary.ts`：`onErrorCaptured`（return false 阻断传播）。

## 4. Component Token 清单（4 个）

| token | 默认值 | 落地形态 |
|---|---|---|
| borderRadius | `borderRadiusLG`（8） | `--{root}-alert-border-radius: var(--apollo-border-radius-lg)` |
| withDescriptionIconSize | `fontSizeHeading3`（30） | `--{root}-alert-with-description-icon-size: var(…)` |
| defaultPadding | `` `${paddingContentVerticalSM}px 12px` `` | `8px 12px`（antd cssVar 产物同为实串） |
| withDescriptionPadding | `` `${paddingMD}px ${paddingContentHorizontalLG}px` `` | `20px 24px` |

## 5. 已知缺口

- Tooltip / Popconfirm 组合（上游测试有）：两个组件未落地，落地后补组合用例。
- demo `loop-banner` 的跑马灯是等价实现（antd 依赖 react-fast-marquee）。

## 6. 关键判据速查

- **isClosable 链**：closable 对象 ⇒ true；closeText 真值 ⇒ true；boolean ⇒ 原值；
  `closeIcon !== false && != null` ⇒ true（0/'' 也算）；否则 `!!contextClosable`。
- **closeIcon 优先级**：closable.closeIcon → closeText → closeIcon →
  contextClosable.closeIcon → contextCloseIcon；`true/undefined` ⇒ 默认 CloseOutlined。
- **role**：默认 `role="alert"`，用户 role 经 attrs/pickAttrs **覆盖**默认。
- **motion**：`-motion-leave`（onLeaveStart 回填 maxHeight）→ `-motion-leave-active`
  （收拢 0）→ transitionend → 卸载 → afterClose。
- 关闭按钮的 aria-* 来自 **closable 对象**（pickAttrs 过滤），不是根元素。
