> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

> 历史实施记录：原勾选、当时结果和缺口保留。2026-10-30 起，本文的 G0–G14 / 逐组件 G13 全仓收口与旧 Registry 进度规则由仓库 `WORKFLOW.md`、`TESTING.md` 两阶段流程替代；当前任务状态只读 `registry/vue-native-audit.json`，不据本文重复派发或重跑已有效验证。

# popover

> **层**：L3（`packages/ui`）｜ **优先级**：P3 ｜ **复杂度**：L ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/popover/`（index.tsx 192 行 / PurePanel / style 259 行）。
> 上游是**兼容性规格**，不是代码来源。
> 分析产物：[`docs/analysis/popover.md`](../../../../docs/analysis/popover.md)。

## 1. 职责

气泡卡片：带标题/正文的点击/悬停浮层。**Tooltip 的薄包装** —— Trigger/portal/
motion/开合协议全部复用 Tooltip 组件，只把内容通道换成 Overlay
（`{p}-title` + `{p}-content` 两块）与动画（`zoom-big` 非 fast）。

## 2. 文件布局与关键决策

```
popover/
├── Popover.ts        # 主组件（antd index.tsx 的 Vue 化，包 Tooltip）
├── PurePanel.ts      # 静态面板（SSR 可达的唯一完整浮层 DOM → L4 主载体）
├── interface.ts      # PopoverProps extends TooltipProps + title/content 语义槽
└── style/{token.ts,index.ts}
```

- **主体是组装**：Popover 管理 open 状态（受控/非受控 + C11 双通道），把
  `open`/`onOpenChange`/`overlay`/`classNames`/`styles` 传给 Tooltip。
- **样式**：77 条规则从 SSR extractStyle 产物机械转换（提取脚本
  `tests/visual/debug/extract-popover.mjs`）+ 2 个 keyframes；
  tooltip css-var 死块丢弃（popover 规则所需变量全部本地定义）。

## 3. 与 antd 的差异

登记于 `COMPATIBILITY.md` §9.2 **D83–D86**：
- D83 ConfigProvider.popover 不消费（D29 同判）
- D84 wireframe 主题态不支持
- D85 `data-popover-inject` attr 不渲染
- D86 PurePanel `style` **双落点**（root + container，rc Popup `{...props}` 的事实契约）

**重要口径**（antd 逐字，L4 钉住）：受控 `open` **不做 noTitle 压制** ——
`title`/`content` 均空时受控 popover 照开（空浮层）；非受控才强制关且不发回调。

L6 视觉 6 张（2 variant × 3 viewport）**全部 0.000% exact**。

## 3.5 Issue #25 的五条判据

1. **`PopoverProps extends TooltipProps` 承诺的公共配置必须**显式声明并下传**（#25.1）：
   本组件 `inheritAttrs: false`，未声明的字段会静默丢进 attrs 再被丢弃。已补齐
   `getPopupContainer` / `getTooltipContainer` / `align` / `builtinPlacements` /
   `onPopupClick` / `openClassName`。
2. **预设色背景的选择器要命中真实容器**（#25.2）：本仓 Popover 的浮层内容容器是
   `-container`（rc-tooltip `Popup.js` 的产物），而 antd 提取产物里写的是 `-inner`
   （antd Popover 有自己的 `-inner`）⇒ 13 个预设色的 `background-color` 全部落空。
   已把 13 条规则改为 `.apollo-popover-container`；自定义 HEX 走 `parseTooltipColor`
   的内联变量（不受影响）。
3. **原生 `class` / `style` 只落弹层根**（#25.3）：不能经 Tooltip 的 attrs 通道转发 ——
   Trigger 会 `cloneVNode(child, {...attrs})` 把它们打到**触发元素**上（双落点）。
   现在并入语义 `root`（`classNames.root` / `styles.root`），触发元素保持干净。
4. **`contextSemantic.className` 要进根类名**（#25.4）：`rootClassNames` 原来只吃
   `mergedClassNames.root`，漏了 ConfigProvider 的 `className`（同层 `style` 早就参与了）。
5. **Overlay 用 Fragment**（#25.5）：antd 的 `-container` 直接子元素就是 title/content，
   多包一层 `div` 会破坏 `container > .title` 与 flex/grid 布局。

## 4. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | ConfigProvider 组件级 token 覆盖 | D25/D83，token 公式已在 L7 判据 |
| P2 | wireframe | D84 |

## 5. 收口证据（G13）

- L1 10 / L4 13（基线 `popover.dom.json`）/ L5 14 / L7 14 / L6 **6/6 0.000% exact**
- demo 12 个（Segmented 未落地 ⇒ 原生 select 替换；wireframe/component-token
  的主题覆盖以默认主题渲染，文件头登记）
- registry 11 维 done，`status: completed`
