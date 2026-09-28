# Tour · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **todo** · priority P4 · complexity L
- 依赖组件: config-provider
- foundation: @apollo-design/a11y, @apollo-design/icons, @apollo-design/overlay, @apollo-design/portal, @apollo-design/position, @apollo-design/theme, @apollo-design/utils
- antd 规模: 513 行 / 10 文件 · token 4

## Gate 检查单

- [x] G0 CLAIM —— 本组件已由 next-task.mjs 授权开工
- [x] G1 ANALYZE —— 读 /tmp/antd-src/package/es/tour/ 的 .d.ts + demo + 测试，产出 **docs/analysis/tour.md**（先于实现！）
- [x] G2 API DESIGN —— interface.ts 枚举 props/emits/slots/expose；v-model 取代 value+onChange
- [x] G3 TOKEN —— style/token.ts 对齐 antd ComponentToken（名称/数量/默认值，规则 R7）
- [x] G4 IMPLEMENT —— panel.ts + Mask.ts + Tour.ts + PurePanel.ts + style/index.ts（60 条规则机械提取；
     Tour.vue 骨架已由 Tour.ts 取代）。冒烟 3/3（受控 open、蒙层挖洞、PurePanel）；vue-tsc tour 零错误。
      实现期修正：mask 缺省值 = true（rc 解构默认，冒烟抓到）
- [x] G5 L1 单元 + G6 L2 交互 —— index.test.ts 31 用例（镜像 antd index.test.tsx 主矩阵 +
      §9-V6 open 语义）+ keyboard.test.ts 7 用例（←/→、Esc 层栈、isEditableTarget 守卫）。
      **G5 期发现并修复 motion 包缺陷**：`isSupportTransition` 要求 motionName 存在
      （rc-motion CSSMotion.js 逐字），否则离场永不完成、autoDestroy 卸载被推迟 ——
      已在 use-motion-status 落实（全量单测 4574 绿，零回归）
- [x] G7 L3 类型（含负例，负例包在永不调用的闭包里）—— type.test-d.ts 6 用例 ×2 通道
- [x] G8 L5 a11y —— a11y.test.ts 5 用例（ARIA 契约；axe demo 扫描待 G11 demo 落地后补
      `a11yDemoTest` + expectCount=9）
      ⚠️ G9（视觉）/G10（compat 基线）/G11（docs+demo）未动——依赖 demo 清单落地
- [x] G9 L6 视觉 —— 9/9 exact。基线抓到 `arrow` 默认值缺失（rc 解构默认 true，
     面板无箭头 → 像素 diff 钉住）；已修 + 重建 dist。
- [x] G10 L4 DOM 契约 + compat 比对 —— 基线 10 用例（tests/compat/baseline/tour.mjs）；
     抓到 PurePanel 真实结构（RawPurePanel 壳 -placement-top + 双 -pure + container
     role=tooltip）、closeIcon 的 aria-label 注入（locale.global.close）、
     React 19 SSR 的 preload link 伪影（剥除）。
- [x] G11 DOCS —— 9 个 demo 与 antd 一一对应（expectCount=9）；中英文档 + README。
     gap.vue 用原生 range 替换 Slider（README §7 登记）；a11y 15/15。
- [x] G12 REGISTRY —— 11 维度置 done（2026-09-29）
- [x] G13 BUILD —— registry:check 18 ✅ / test 全绿（unit 4592 + dom 1178 + a11y 741
     + theme 559）/ 视觉 9/9；lint:types tour 零命中（25 个预存红全在 cascader/segmented）
- [x] G14 COMMIT —— commit message 带 [COMP:tour]

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
