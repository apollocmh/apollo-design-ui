# menu 分析（G1）

契约来源：antd 6.6.4 `components/menu/`（index.tsx 97 / menu.tsx 342 /
MenuItem 194 / SubMenu 81 / MenuContext 43 / OverrideContext 61 /
style 1109 行）+ `@rc-component/menu@1.5.0`（Menu 440 / SubMenu 系 575 /
MenuItem 221 / hooks+context+utils 627 / placements 72 —— 共 ~2620 行）。
参考源已解包：`/tmp/ant-design-master/components/menu/`、`/tmp/rcmenu/package/es/`。
上游是**兼容性规格**，不是代码来源。

## 1. 结构总览：三个组成层

```
1. 交互内核（rc-menu 的 Vue 自建 —— 本组件的主工程量）
   ├─ Menu.js 440 行：items 解析、open/active 状态、mode 分支、flushSync 选择
   ├─ useAccessibility 278 行：roving tabindex 键盘导航（Home/End/箭头/Enter）
   ├─ useKeyRecords 93 行：key→路径记录（active/open 查找）
   ├─ Overflow（@rc-component/overflow ~350 行）：横向模式的溢出折叠
   │   + overflowedIndicator（… 按钮，点击弹 overflowed 菜单）
   ├─ SubMenu 系 575 行：PopupTrigger（horizontal 弹层）/ InlineSubMenuList（inline 展开）
   └─ MenuItem/ItemGroup/Divider（纯受控子组件）
2. antd 壳（menu.tsx 342 行 —— 组装 + 上下文）
   ├─ OverrideContext（dropdown 注入 mode/selectable/expandIcon；Popover 不注入）
   ├─ MenuContext（prefixCls/inlineCollapsed/theme/tooltip/semantic 语义）
   ├─ MenuItem 在 inlineCollapsed 且 firstLevel 时把标题包进 **Tooltip**（本组件是
   │   tooltip 的第 4 个消费者，验证 AR1 复用面）
   └─ defaultMotions：horizontal=slide-up / inline=collapse-motion / other=zoom-big
3. 样式（style 1109 行 —— SSR 产物机械转换，管线同 tooltip/popover）
```

## 2. 渲染树预判（L4 基线生成后钉死）

```
ul.apollo-menu.apollo-menu-root.apollo-menu-{mode} .apollo-menu-light
├─ li.apollo-menu-item[role=menuitem] > span.apollo-menu-title-content
├─ li.apollo-menu-submenu.apollo-menu-submenu-{mode}
│   ├─ div.apollo-menu-submenu-title[role/menuitem expanded…]
│   │   └─ span.apollo-menu-title-content + span.apollo-menu-submenu-expand-icon
│   ├─ (horizontal/popup) div.apollo-menu-submenu-popup > ul.apollo-menu.apollo-menu-sub[role=menu]
│   └─ (inline) ul.apollo-menu.apollo-menu-inline.apollo-menu-sub[role=menu]
├─ li.apollo-menu-item-group > div.-item-group-title + ul[role=group] > …
└─ li.apollo-menu-item-divider[role=separator]
```
`role`：root/menu=menu、group=group、divider=separator；item 经 roving
tabindex（active 项 tabIndex=0，其余 -1）；`aria-owns`/`aria-expanded` 在 popup。

## 3. 行为契约（L1 断言源，14 条）

1. items 数组解析：`{label, key, icon, children, type: 'group'|'divider', extra,
   danger, disabled}` → 对应节点；无 key ⇒ `tmp-${index}`；children+type==='group'
   ⇒ group，children 无 type ⇒ submenu，type==='divider' ⇒ divider。
2. children 写法仍支持（deprecated 告警，'items' in props && children）。
3. selectable 缺省 true：点击 item ⇒ selectedKeys 更新（受控 selectable=false 则不更新）
   + onClick({item, key, keyPath, selectedKeys, domEvent})。
4. selectedKeys/defaultSelectedKeys 受控/非受控；selectedKeys 含不在菜单中的 key
   ⇒ 只保留有效的（warnUtil）。
5. openKeys/defaultOpenKeys 受控/非受控（inline/vertical）；onOpenChange(keys)。
6. inlineCollapsed（或 Sider 注入）⇒ 菜单折叠为图标条；firstLevel item 的
   title 包进 Tooltip（title prop 或 children 字符串首字符 —— 无 icon 时显示
   `{label[0]}` 的 `-inline-collapsed-noicon` 块）。
7. mode='horizontal' ⇒ Overflow 溢出折叠：放不下的 item 收进
   `-overflowed-indicator`（… 图标）弹出层；disabledOverflow 关闭该行为。
8. 键盘：ArrowUp/Down/Left/Right 在 item 间移动 active（roving tabindex）；
   Home/End；Enter/Space 触发；Esc 关子菜单并回焦点 —— useAccessibility 全套。
9. submenu 展开：horizontal/vertical ⇒ hover（subMenuOpenDelay/CloseDelay）弹层；
   inline ⇒ 点击展开/收起（collapse motion）；expandIcon 可覆盖（函数/元素/null）。
10. danger ⇒ `-item-danger` 类；disabled ⇒ 不可激活不可选中（aria-disabled）。
11. theme='dark' ⇒ `-dark` 类族（背景/文字色切换；dark 下 inlineCollapsed
    tooltip 主题同步）。
12. inlineCollapsed 与 mode!=='inline' 同用 ⇒ usage 告警（保持）。
13. MenuRef：`{ menu: RcMenuRef, focus(options) }` —— expose 转发。
14. 语义槽 5+3 组：classNames/styles 的 root/list/itemTitle/item/itemIcon/
    itemContent + popup（_default→root）+ subMenu（_default→item）。

## 4. 依赖缺口（P1–P6）

| # | 缺口 | 对策 |
|---|---|---|
| P1 | **@rc-component/overflow**（横向溢出折叠，ResizeObserver 测量） | 自建 `packages/ui/src/_internal/overflow.ts`（Vue 版，~300 行：子项测量 + 可见数量状态 + resize 重算）；jsdom 无布局 ⇒ 测量早退全显示（L4/L6 处理） |
| P2 | SiderContext（layout 的 collapsed 注入） | layout 已完成 ⇒ 读其 Sider 上下文；无 Provider 时取 props.inlineCollapsed |
| P3 | submenu 弹层定位 | horizontal 用 Trigger（`_internal/trigger.ts`，popup placement 复用）或轻量 PopupTrigger；**倾向 Trigger 复用**（15 下游红利的直接验证） |
| P4 | initCollapseMotion（inline 展开/收起） | motion 包已有 collapse motion？核实 `packages/motion`；无则照 rc-motion 的 collapse-motion 手写 |
| P5 | flushSync 选择更新 | Vue 无对应物 —— 响应式同步即等价（D72 同判，登记 PLATFORM） |
| P6 | style 1109 行 | 提取管线（extract-menu.mjs，过滤 ant-menu + slide-up/collapse motion） |

## 5. 实现顺序（§7）

1. `_internal/overflow.ts`（P1，Vue 版 Overflow + 冒烟）
2. rc-menu 内核 Vue 自建：`menu/engine/`（parseItems/useKeyRecords/
   useAccessibility 三文件）+ `MenuItem.ts`/`ItemGroup.ts`/`Divider.ts`/
   `SubMenu.ts`（PopupTrigger 走 Trigger 复用 / InlineSubMenuList 走 CSSMotion）
3. `Menu.ts`（antd menu.tsx 的 Vue 化：Override/MenuContext + semantic 合并 +
   defaultMotions + items 解析）+ Tooltip 集成（collapsed 态）
4. style 三件套（token：4 个；index：SSR 提取）
5. demo ×13（antd 用户可见 demo 一一对应；缺失依赖按替换约定登记）
6. 七层测试（L1/L4 基线+fixtures/L5/L7/L3/L6）→ registry 11 维 → 文档 → 门禁 → push

## 6. 差异预登记（→ COMPATIBILITY）

| # | 差异 | 判定 |
|---|---|---|
| D87 | flushSync 强制同步批选择更新 | PLATFORM（D72/D77 同判） |
| D88 | Overflow 测量基于 ResizeObserver 的时序 | PLATFORM（jsdom 无布局；L6 真浏览器钉住） |
| D89 | children 写法仅告警不阻断（与 antd 一致）；Vue 里 items 为唯一真源、children 经 slot 解析 | INTENDED |

## 7. 风险

- Overflow 是**新基建**且 menu 的 horizontal 模式强依赖 —— 若本轮时间不够，
  可按 overlay-contract 的裁剪策略先落 vertical/inline 模式（L6 只比 vertical/
  inline 的 variant），horizontal 标 PENDING（与 picker 的处理同模式）。
- useAccessibility 的键盘矩阵用例多（~10 条 L2）—— 直接照 rc-menu
  `__tests__/a11y.test.tsx` 的断言移植。
