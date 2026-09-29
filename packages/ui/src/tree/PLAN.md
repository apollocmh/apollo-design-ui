# Tree · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **todo** · priority P4 · complexity L
- 依赖组件: config-provider
- foundation: @apollo-design/a11y, @apollo-design/icons, @apollo-design/theme, @apollo-design/utils, @apollo-design/virtual-list
- antd 规模: 955 行 / 16 文件 · token 2

## Gate 检查单

- [x] G0 CLAIM —— 本组件已由 next-task.mjs 授权开工（2026-09-29）
- [x] G1 ANALYZE —— docs/analysis/tree.md 完成：rc-tree class 内核（23 state 槽 + gDSFP 八步 + 键盘全套 + 拖拽 9 槽）+ NodeList 虚拟滚动/motion diff + DirectoryTree shift/ctrl 多选；R1–R8 全部闭环
- [x] G2 API DESIGN —— interface.ts：TreeProps 全量（数据/展开/勾选/选中/加载/外观/拖拽/滚动/焦点 9 组）+ TreeEmits 21 个（C11 四键 v-model 双发）+ 5 语义槽（函数形态）+ TreeRef/TreeScrollConfig + DirectoryTree 同构；TreeNode children 形态不实现（v6 deprecated）
- [x] G3 TOKEN —— **9 个 ComponentToken**（7 shared + 2 directory；registry 的 tokenCount=2 与产物不符，以 extract-tree-css.mjs 对拍为准）。prepareComponentToken 全部 alias 直引；6 个源值（controlHeightSM/controlItemBgHover/controlItemBgActive/colorText/colorTextLightSolid/colorPrimary）与 antd 产物逐字一致（node 直连 theme dist 验证）
- [~] G4 IMPLEMENT —— 按 §7 顺序进行中：
  ✅ 步骤 1 utils 纯函数层（~876 行移植完毕）：treeUtil（entities/flatten/节点态投影）+
     conductUtil（fill/clean 两段式级联）+ util（arrAdd/arrDel/calcDropPosition/
     parseCheckedKeys/conductExpandParent）+ diffUtil（motion diff）。L1 31 用例全绿。
     移植期发现：traverseDataNodes 根层 parent 必须为 undefined（塞 level:-1 种子对象
     会让顶层 level 变 1）——rc 的「隐式默认参」语义已注释钉死。
  ✅ 步骤 2 核心（G4-2，2026-09-29）：Tree.ts（gDSFP 拆分 watch + setUncontrolled +
     键盘全套 + 拖拽 9 槽 + antd 壳六件事并入）+ TreeContext（reactive getters）+
     NodeList（VirtualList + motion diff 哨兵 + indent 量测）+ MotionTreeNode +
     TreeNode（role=treeitem + aria + checkbox 自定义元素 + loadData watch）+
     Indent / DropIndicator / iconUtil。冒烟 8/8（渲染/选中/展开二连/级联/
     checkStrictly/defaultExpandAll/键盘/fieldNames）。
  ✅ 步骤 3 DirectoryTree（G4-3）：utils/dictUtil（calcRangeKeys/
     convertDirectoryKeysToNodes 逐字移植）+ DirectoryTree.ts（受控包装
     expanded/selected + shift/ctrl 范围多选 + selectedNodes 反查 + Folder/
     File 图标 + defaultExpandAll 全 key 语义）。冒烟 4/4。
     ⚠️ 集成发现：Vue prop default 会把「未传」变具体值 —— showIcon/
     expandAction 的 default 改为 undefined，由消费侧 `?? false` 兜底，
     否则 DirectoryTree 的 `?? true` / `?? 'click'` 覆盖失效。
  ✅ 步骤 4 style/index.ts（G4-4）：100 条规则机械提取（extract-tree-css.mjs，
     含 -checkbox 视觉与 -motion-collapse 动效类）+ genTreeTokenDecls（9 token）+
     genTreeStyle(prefixCls) 替换范式；COMPONENT_STYLES 注册 + ui 主入口导出。
- [ ] G5 L1 单元 + G6 L2 交互 —— __tests__/index.test.ts
- [ ] G7 L3 类型（含负例，负例包在永不调用的闭包里）
- [ ] G8 L5 a11y —— axe + role/键盘断言
- [ ] G9 L6 视觉 —— 先建基线再 compare；对比不过先怀疑实现（px 字符串！）
- [ ] G10 L4/L4 DOM 契约 + compat 比对
- [ ] G11 DOCS —— demo 与 antd 一一对应（demo.test.ts 的 expectCount 钉死数量）
- [ ] G12 REGISTRY —— 11 维度置 done（唯一让进度被承认的方式）
- [ ] G13 BUILD —— pnpm run registry:check && lint && test && test:build 四道全绿
- [ ] G14 COMMIT —— commit message 带 [COMP:tree]

## 开工避坑清单（全部真实踩过，详见 .workbuddy-ai/memory/PITFALLS.md）

1. **内联 style 的数字必须转 px 字符串** —— Vue patchStyle 不做转换（React 才有），裸数字被静默丢弃。
2. **L3 负例必须包在永不调用的闭包里** —— *.test-d.ts 会被 vitest 真执行。
3. **vitest 必须从仓库根跑** —— 在 packages/<x>/ 下跑不应用根 config，大面积假失败。
4. **demo 显式指定字体** —— 继承字体差异是平台差异，会让 L6 全红。
5. **Boolean prop 未传 ≠ false** —— withDefaults 里给 undefined，否则布尔语义静默失效。
6. **cssinjs 嵌套语义**：`&` 是复合选择器、普通键是后代 —— 搞反会让样式作用到所有形态。
7. **var(--apollo-*) 必须在 theme tokens.css 有声明** —— 写错不报错，由 test:build B7 兜底。
8. **凡是要断言「某决策/约定是这样」先跑 node registry/tools/ask.mjs**，不凭记忆。
9. **跑重型门禁前关 IDE** —— 实测 16 分钟 → 7 分 49 秒。
10. **改完文件回读** —— Edit 偶发报 success 但内容未变；biome 会重排 import。
