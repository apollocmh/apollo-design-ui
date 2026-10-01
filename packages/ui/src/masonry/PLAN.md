# Masonry · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **analyzing** · priority P5 · complexity M
- 依赖组件: 无
- foundation: @apollo-design/motion, @apollo-design/theme, @apollo-design/utils
- antd 规模: 349 行 / 14 文件 · token 0

## Gate 检查单

- [x] G0 CLAIM —— 已由 `next-task.mjs --component masonry` 授权开工；骨架由 `gen-component.mjs` 生成
- [x] G1 ANALYZE —— **`docs/analysis/masonry.md`**（先于实现）。
      核心结论：**无 foundation 缺口，全部可复用**（依赖面逐条列在 §0）；
      两处已实测的硬结论：① 上游根 div 的 `onLoad`/`onError` 是**死监听**（§6.1）；
      ② `mergedItems` 的**一拍延迟**必须复刻（§6.2）
- [x] G2 API DESIGN —— `interface.ts` 全量枚举 props / emits / expose。
      ⚠️ **没有 `v-model`**（上游无 value/onChange）· **没有默认插槽**（上游不读 children）·
      4 处平台映射（`React.Key`→`string|number` / `ReactNode`→`VNodeChild` /
      `CSSProperties`→`Record<string,string|number>` / 泛型 `any`→`unknown`）
- [x] G3 TOKEN —— `style/token.ts`：**该组件无 Component Token**（上游 `ComponentToken` 是空接口）。
      比 Flex 还干净 —— 连 `mergeToken` 派生值都没有，只消费全局 alias
      （`motionDurationSlow` / `motionDurationFast` / `motionEaseOut`）
- [x] G4 IMPLEMENT —— `Masonry.vue` + `components/MasonryItem.ts` + `hooks/{use-delay,positions,column-count}.ts`
      + `style/index.ts`；已注册进 `COMPONENT_STYLES` 与 `packages/ui/src/index.ts`。
      三处**实现期才暴露**的判据（都写在代码注释里）：
      ① 🚨 **不要加 `onMounted(collectItemSize)`** —— 它会跑在「`mergedItems` 刚赋值、
      DOM 还没重渲染」的位置 ⇒ 量到全 0 高度 ⇒ 先写一版全 0 列号 ⇒ **`layoutChange` 发两次**
      （L2 实测抓到）；`watch(…, {flush:'post'})` 已经覆盖首次量测。
      ② 🚨 **只 `emit('layoutChange')`**，不要再手写 `props.onLayoutChange?.(…)`（Vue 的 emit
      自己就会调同名 prop ⇒ 两次）。→ PITFALLS 267（splitter 的 5 个回调也是这个 bug，同批修掉）
      ③ `MasonryItem` 用 `.ts`（`COMPONENT-RULES.md` §2 **条件 1**：纯渲染函数型内部件）——
      理由同步登记 README §3。
- [x] G5 L1 单元 + G6 L2 交互 —— `__tests__/index.test.ts` **20 条**：
      L1 纯函数 12 条（排布算法用**上游同一组输入**：15 项 / 3 列 ⇒ 480px；平局取最左；
      显式列号夹取；总高减一个 gutter；空列表兜底；单列前缀和）+ 列数解析 6 条
      （默认 3 / `columns={0}` 也是 3 / 数字 / 从大到小 / `xs ?? 1` / 命中但值为 undefined）；
      L2 接线 8 条（根类名 · children 优先于 itemRender · 量测后的内联样式与根高 ·
      `layoutChange` 双通道各一次 · 不传回调则不发 · 空列表不崩 · rtl · fresh）。
      ⚠️ jsdom 无布局 ⇒ L2 用 `getBoundingClientRect` mock（判据照抄上游：
      读 `.bamboo` 的 `data-height`）；真布局归 **L6**。
- [x] G7 L3 类型 —— `__tests__/type.test-d.ts` **13 条**（props 形态 / 两个「展开」类型的
      `column` 是**非可选 number** / 泛型 `ItemDataType` 的流向 / `emits` / `expose` +
      **3 条负例**包在永不调用的闭包里）。实测 `--project types`：**26 passed / Type Errors no errors**。
- [x] G8 L5 a11y —— `__tests__/a11y.test.ts` **15 条**（4 条 role/ARIA 契约 + 11 组 axe 扫描），
      **零 axe violation、零豁免**。判据：根与条目都是 `div` 且**无 `role`**、**无 `tabindex`**、
      **不产生任何 `aria-*`** —— 上游零 ARIA 是**有意**的（纯布局组件），钉住它防止后来者
      「顺手加个 `role="list"`」。
      🚨 **本文件不能用 `vi.useFakeTimers()`**：`axe.run()` 内部靠 `setTimeout`/rAF 推进，
      定时器被 mock 后它**永不完成** ⇒ 下一次 `axe.run()` 抛「Axe is already running」
      （实测：带假定时器 11 条全红，去掉即绿）。条目由 `mergedItems` 驱动渲染，**不依赖** raf 去抖。
- [x] G9 L6 视觉 —— ✅ **21 / 21 exact**（7 variant × 3 viewport）。
      变体：`basic` / `gutter`（非对称间距）/ `columns`（4 列）/ `responsive`（按视口 1/2/3 列）/
      `fresh` / `semantic` / `rtl`。**首跑即全绿**（布局、`-item-fade` 类、响应式列数、
      RTL 的 `inset-inline-start`、`fresh` 的观察者路径全部逐像素一致）。
      React 基线已入库（`tests/visual/baselines/react/masonry/`，21 张）。
      ⚠️ 两条硬约定写在用例文件头：**字体必须在用例内钉住**（条目内容是用户渲染的，
      两侧页面字体栈不同）+ **高度必须是字面量**（排布由实测高度决定，随机值 = 每天红）。
- [x] G10 L4 DOM 契约 —— `tests/compat/baseline/masonry.mjs` + `baselines/masonry.dom.json`
      （**20 用例**）+ `semantic.test.ts` **20 条**，**只有 1 条豁免**（D1 默认前缀）。
      🚨 **这个契约几乎是空的，而那正是上游的真实行为**：antd 的 SSR 产物是
      `<div class="apollo …" style="height:0"></div>` —— **一个条目都没有**
      （`mergedItems` 的一拍延迟在服务端不跑）。⇒ 本契约钉的是**结构**
      （根类名 / 语义槽 / RTL），条目结构归 L2、排布归 L1 + L6。
      ⚠️ `keepStyle: false`（与 date-picker 同判）：SSR 的根高**恒为 0** ⇒ 这条声明零信息量；
      保留它只会引入一条纯序列化差异（React 字符串 `height:0` vs Vue 经 CSSOM 读回 `height:0px`）。
      真正有意义的「用户 `styles.root` 排在 `height` 之后」改由 **L2** 钉。
- [x] G11 DOCS —— `demo/` **6 个**（basic / responsive / dynamic / fresh / image / style-class，
      与 antd 用户可见 demo 一一对应，`demo.test.ts` 的 `expectCount: 6` 钉死）+
      `index.zh-CN.md` / `index.en-US.md`（何时使用 / demo 表 / API 四表 / Theme / 设计说明）+
      `README.md`（差异清单 D1–D12 / `.ts` 选型理由 / token 清单 / 已知缺口）。
      ⚠️ demo 用**原生元素**替换了未落地的 `Card` / `Flex` / `Divider` / `Typography` /
      `antd-style`（缺口登记 README §5）；随机高度改成**确定值**（否则 demo 冒烟不可复现）。
- [x] G12 REGISTRY —— 11 维度全部 done + `status: completed`（2026-10-01，60/72）。
      ⚠️ 组件完成数变了要**依次刷新**两个派生文件（`--check` 会先红）：
      `node registry/tools/foundation-status.mjs`（**不带 `--check`**）→
      `node registry/tools/gen-workstreams.mjs`（**不带 `--check`**）→ 再 `registry:check`。
      新增 `tests/compat/fixtures/masonry/basic.json`（E9 要求）。
- [x] G13 BUILD —— `registry:check` **18 checks / 0 warnings** · `lint:types` / `lint:format`
      **0 error** · `test`（unit + dom-contract + a11y + theme）**全过** · `test:build`（L7）
      **141 项 / FAIL 0** · `test:types` **26 passed / Type Errors no errors** ·
      `test:visual --component masonry --mode compare` **21 / 21 exact**。
- [x] G14 COMMIT —— commit message 带 `[COMP:masonry]`（2026-10-01）。

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
