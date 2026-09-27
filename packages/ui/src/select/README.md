# select

> **层**：L3（`packages/ui`）｜ **优先级**：P4 ｜ **复杂度**：L ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/select/`（index 518 / style 1317 行）
> + `@rc-component/select@1.10.1`（es 产物 **2815 行 / 24 文件**）。
> 上游是**兼容性规格**，不是代码来源。

## 1. 职责

下拉选择器：值语义（受控/非受控/`labelInValue`）、搜索过滤（`showSearch` 对象形态）、
单选/多选/tags 三形态、虚拟滚动列表、键盘完整导航、combobox ARIA 模式、
以及**命令式句柄**（`focus/blur/scrollTo/nativeElement`）。

## 2. 文件布局与关键决策

```
select/
├── Select.ts         # antd 壳（12 件事）+ rc 的 Select.js 值语义层
├── engine/           # ⭐ rc-select 的 Vue 自建
│   ├── BaseSelect.ts   # 交互外壳：open 状态机 / 键盘 / 焦点 / 清除 / Polite
│   ├── Selector.ts     # 选择器 DOM：prefix / content(单|多) / suffix / clear
│   ├── OptionList.ts   # 列表：virtual-list + activeIndex + a11y 影子 listbox
│   ├── SearchInput.ts  # 唯一的 <input>：ARIA / 输入法 / 粘贴 / syncWidth
│   ├── TransBtn.ts     # 图标外壳（clear / remove / 勾选）
│   ├── useOpen.ts      # open 状态机（宏任务延迟关 + taskId 作废机制）
│   ├── useOptions.ts   # parse/filter/cache/searchConfig/allowClear
│   ├── context.ts      # 两级 context（ComputedRef 注入，D27）
│   └── valueUtil.ts / keyUtil.ts
├── Option.ts / OptGroup.ts   # deprecated 数据载体（渲染 null，同 rc）
├── PurePanel.ts      # _InternalPanelDoNotUseOrYouWillBeFired
├── interface.ts / index.ts
└── style/{token.ts,index.ts}
```

### 实现判据（先读 analysis 再动实现）

1. **不是薄壳**：antd 壳 518 行，内核 2815 行要自建（分析 `docs/analysis/select.md` §0）。
2. **v6 没有 `-selector` 包裹层**：`.ant-select > .ant-select-content`（真实快照判据）。
3. **动效名是 rootPrefixCls 前缀** ⇒ `apollo-slide-up`（写错静默失效，modal 同判）。
4. **默认过滤按 `value` 不按 `label`**（antd FAQ 明说，`optionFilterProp` 默认 `value`）。
5. **关闭是宏任务延迟的** ⇒ 测试必须轮询（PITFALLS 179 同源）。
6. **`activeIndex` 在 BaseSelect 不在 OptionList**：Vue 里不需要 rc 的跨组件命令式转发。

### 状态机（R15/R16）

**open**：`closed --mousedown/Enter/Space/开键--> opening(同步) --...--> open
--Esc/选中(单选)/点外部--> closing(宏任务) --> closed`；
`postOpen` 压缩：`disabled || (notFoundContent 为空 && 无选项)` ⇒ 恒 closed。
**active**：列表变化/搜索变化 ⇒ 激活首项（`defaultActiveFirstOption`，combobox 除外）；
↑↓ 循环移动且跳过 group/disabled/超 maxCount 的未选项；鼠标 mousemove 激活。
每条转移都有对应测试（`__tests__/index.test.ts` 的「打开/关闭」「键盘」两组）。

## 3. 与 antd 的差异

登记于 `COMPATIBILITY.md` §9.2：**D106**（`stretch:'width'` ⇒ `'minWidth'`：
Trigger 的 stretch 协议只实现了 minWidth，「内容更宽时收窄」待基建补齐）、
**D107**（Portal 浮层的组件变量作用域：DECLS 落 `.apollo-select,.apollo-select-css-var`
两个类 —— antd 靠 popupClassName 里的 cssVarCls 同效）、**D108**（`maxTagCount`
只支持 `number`，`'responsive'` 依赖 Overflow 测量待接）、
**D109**（combobox 为内核私有模式：公开类型只声明 `multiple|tags`，同 antd 吞 mode 行为）、
**D110**（`showScrollBar` 接受但不生效 —— virtual-list 契约 §5.1 既有差异）。

## 4. Component Token 清单

registry 数据：token 数 = **16**（`ComponentToken` 自有键；继承 `MultipleSelectorToken`
9 键 ⇒ 公开面 25；另有 `lineWidthFocus` / `INTERNAL_FIXED_ITEM_MARGIN` /
`selectAffixPadding` / `inputPaddingHorizontalBase` / `selectHeight` 5 个 internal）。

关键默认值（`prepareComponentToken` 构建期解析）：`optionPadding = 5px 12px`
（⚠️ lineHeight 是 22/14，不是 1.5 —— 别按 5.5 算）、`optionHeight = 32px`、
`multipleItemHeight = 24px`（`min(controlHeight-2*paddingXXS, controlHeight-2*lineWidth)`）、
`showArrowPaddingInlineEnd = 18px`（`ceil(fontSize*1.25)`）、`zIndexPopup = 1050`。

`clearBg` 上游**只声明不引用**（同 modal 的 `--ant-modal-xs-width`），本仓照样声明。

## 5. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | `maxTagCount: 'responsive'` | 依赖 Overflow 的 ResizeObserver 折叠；demo 以固定值等价展示（D108） |
| P2 | combobox 的 `backfill` | 内核模式已实现（AutoComplete 复用），键盘回填未接 |
| P3 | ConfigProvider 组件级 `classNames`/`styles`/token 覆盖 | staged（同 image/message/notification） |
| P4 | `stretch: 'width'` 的钳制语义 | Trigger 基建未实现（D106） |
| P5 | `showScrollBar` / 自绘滚动条 | virtual-list 契约 §5.1（D110） |

## 6. 收口证据（G13）

- L1/L2 33 + demo 35（`expectCount` 钉死）/ L3 5 + L4 10（基线
  `tests/compat/baselines/select.dom.json`）+ L5 36 + L7(theme) 12；L6 **9/9 全 0.000% exact**
- registry 11 维 done，`status: completed`
