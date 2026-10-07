#!/usr/bin/env node
/**
 * open-decisions.mjs — 跨切面开放决策的**种子源**
 *
 * 为什么需要这个文件：
 *   `registry/foundation.json` 是生成文件。之前 openDecisions 只能靠「生成时从旧文件
 *   原样保留」存活 —— 一旦文件丢失或首次生成，9 项决策就永久消失，而它们恰恰是
 *   「项目当前卡在哪」的唯一机器可读记录。决策不能只活在某次对话里。
 *
 *   所以：内容写在这里（工具拥有），运行时状态（status / decision / decidedAt /
 *   decidedBy / note）由 foundation.json 反向合入。
 *
 * 合并规则（见 foundation-status.mjs 的 mergeOpenDecisions）：
 *   - 本文件是「问题 / 选项 / 影响 / 建议」的唯一真源，每次生成覆盖；
 *   - foundation.json 里的 status / decision / decidedAt / decidedBy 优先；
 *   - 本文件里没有、但 foundation.json 里有的条目会被保留（允许手工追加）。
 *
 * 字段契约见 registry/schema.json#/definitions/OpenDecision。
 */

/**
 * 便捷构造：未裁决的决策。
 * @param {string} id
 * @param {object} spec
 */
function open(id, spec) {
  return {
    id,
    status: 'open',
    hardBlock: false,
    raisedAt: '2026-09-15',
    decidedAt: null,
    decision: null,
    decidedBy: null,
    blocks: [],
    ...spec,
  };
}

/**
 * 便捷构造：已裁决的决策（作为**记录**保留，方便回溯为什么这么定）。
 * @param {string} id
 * @param {object} spec
 */
function decided(id, spec) {
  return {
    id,
    status: 'decided',
    hardBlock: false,
    raisedAt: '2026-09-16',
    decidedAt: '2026-09-16',
    decidedBy: 'Phase 2 架构设计',
    blocks: [],
    decision: null,
    ...spec,
  };
}

export const OPEN_DECISIONS = [
  open('build-output-contract', {
    question: '包的构建产物契约是什么？exports 里声明 ./es/* 与 ./css/* 是否要真正落实？',
    context:
      'ARCHITECTURE.md 声明产物为「es/（ESM，保留模块结构，tree-shaking 友好）+ dist/（单文件，可选）」。但 scaffold-packages.mjs 生成的 scripts.build 是裸 `unbuild`，默认只打包出 dist/ 单文件。结果是 exports 声明了不存在的子路径，unbuild 以退出码 1 失败，`pnpm -r build` 对全部包不可用。这是实现与文档不一致，必须先裁决。',
    options: [
      {
        label: 'A. 只保留 dist/（单文件打包）',
        tradeoff:
          '改动最小、立刻可构建；但失去组件级深导入能力，tree-shaking 依赖打包器而非模块结构，且与文档声明矛盾。',
      },
      {
        label: 'B. es/ 用 mkdist 保留模块结构 + dist/ 用 unbuild 出单文件（推荐）',
        tradeoff:
          '符合文档声明，保留组件级深导入与按模块 .d.ts；代价是每个包多一套构建配置与一份产物，构建时间与 L7 校验复杂度上升。',
      },
      {
        label: 'C. es/ 用 Vite/Rollup 的 preserveModules 自行配置',
        tradeoff:
          '控制力最强，可为 .vue SFC 定制；但等于自建构建管线，偏离已锁定的 unbuild 选型，维护成本最高。',
      },
    ],
    recommendation:
      'B。文档已经声明了这个契约，且 72 个组件库的深导入能力对 tree-shaking 是刚需；mkdist 与 unbuild 同作者，组合成本最低。无论选哪个，都必须同步修正 scaffold 模板，使 exports 只声明真实存在的子路径。',
    impact:
      '阻塞全部 foundation 包的 pkg 维度（无法收口），并使 pnpm build / L7 构建门禁全仓不可用；@apollo-design/ui 的对外入口形态也取决于此',
    // 注意：这里是全部 13 个 foundation 包（含 test-utils —— 它是 private、不发布，但同样需要可构建）
    blocks: [
      '@apollo-design/utils',
      '@apollo-design/theme',
      '@apollo-design/icons',
      '@apollo-design/motion',
      '@apollo-design/portal',
      '@apollo-design/position',
      '@apollo-design/a11y',
      '@apollo-design/virtual-list',
      '@apollo-design/overlay',
      '@apollo-design/locale',
      '@apollo-design/form-core',
      '@apollo-design/picker',
      '@apollo-design/test-utils',
    ],
  }),

  decided('prefix-cls-default', {
    decidedAt: '2026-09-16',
    decidedBy: '用户裁决 2026-09-16',
    decision:
      'A —— 默认 `apollo`。⚠️ 其中的「允许 ConfigProvider 覆盖为 `ant`」这一半已于 2026-10-07 ' +
      '被裁决 **`css-ant-prefix-cost` = B 撤回**：静态 CSS 不再生成 `ant` 变体。' +
      '任意 `prefixCls`（含 `ant`）仍然是合法 API，但用户需自行用 `genComponentCss(name, prefixCls)` / ' +
      '`genAllStyles()` 产出并引入 CSS —— 零运行时下这是唯一可行的路径。',
    note:
      '默认 apollo。DOM 契约测试必须做前缀归一化，否则 prefixCls 这个 API 自身就测不了。' +
      '⚠️ 2026-10-07 修订：原裁决里「ConfigProvider 可覆盖为 ant」的**开箱即用**那一层已撤回' +
      "（`STATIC_PREFIX_CLS` 从 `['apollo','ant']` 缩为 `['apollo']`）—— 实测 `ant` 变体占组件 CSS " +
      '32.8%（827.2 KB / 2522.2 KB），却只在 45/69 个组件上完整。见 `css-ant-prefix-cost`。',
    question: 'prefixCls 与 CSS 变量的默认前缀用 `apollo` 还是 `ant`？',
    context:
      'antd 的默认 prefixCls 是 `ant`，CSS 变量是 `--ant-*`。本项目用 `--apollo-*` 更符合自有品牌，但会改变 DOM class 与 CSS 变量名 —— 这直接影响 L4 DOM 契约测试与 L6 视觉回归的可比对性，也影响用户从 antd 迁移时是否需要改覆盖样式。',
    options: [
      {
        label: 'A. 默认 `apollo`，允许 ConfigProvider 覆盖为 `ant`（推荐）',
        tradeoff:
          '品牌清晰、不误导用户以为这是 antd；代价是 DOM 契约测试需要一层前缀归一化，迁移用户的样式覆盖需调整。',
      },
      {
        label: 'B. 默认 `ant`',
        tradeoff:
          '与 antd 逐字节对齐，DOM 契约与视觉回归最省事，迁移零成本；代价是品牌混淆，且放弃了自有命名空间。',
      },
    ],
    recommendation: 'A。DOM 契约测试本来就该做前缀归一化（否则 prefixCls 这个 API 本身就测不了）。',
    impact:
      '阻塞 @apollo-design/theme 的收口（Token 变量命名），并影响全部 72 个组件的 DOM 契约与视觉回归基线',
    blocks: ['@apollo-design/theme'],
  }),

  open('zero-runtime-mode', {
    question: '「零运行时 CSS 变量」是否作为唯一模式，不再提供 CSS-in-JS 等价路径？',
    context:
      'Phase 1 已确定用零运行时 CSS 变量（--apollo-*）替代 antd 的 CSS-in-JS。但 antd 支持运行时动态 token。零运行时下，动态 token 需要重写 CSS 变量到 :root 或作用域元素上。需要确认这是唯一支持的模式。',
    options: [
      {
        label: 'A. 零运行时为唯一模式（运行时改 token 通过重写 CSS 变量实现）（推荐）',
        tradeoff:
          '产物不含 CSS-in-JS 运行时，体积与性能最优；代价是动态 token 的实现复杂度落在 theme 包上，且与 antd 的 hash 类名机制不可能完全一致。',
      },
      {
        label: 'B. 同时提供运行时注入路径',
        tradeoff:
          '更贴近 antd 的运行时能力；代价是引入运行时开销，与「零运行时」的核心决策冲突，并显著增加 theme 包复杂度。',
      },
    ],
    recommendation: 'A。这是 Phase 1 已确立的方向，只是需要显式确认它排除 B。',
    impact: '阻塞 @apollo-design/theme 的收口（决定 CSS 变量注入策略与动态 token 的实现路径）',
    blocks: ['@apollo-design/theme'],
  }),

  open('event-name-rewrite', {
    question:
      '接受 pickAttrs 把 React 合成事件名重写为 Vue 事件键（onKeyDown → onKeydown）这一偏差吗？',
    context:
      "实测确认：Vue 的 runtime-dom 不会规范化 React 合成事件名。绑定 onKeyDown 会走 addEventListener('key-down') 永不触发；绑 onkeydown 会走 DOM0 属性（每元素每事件单槽位，会静默覆盖，且在 SVG/自定义元素上退化为属性字符串）。正确形式是 on + 首字母大写的原生名（onKeydown）。因此 pickAttrs 的输出键与 antd 不同 —— 这是不可避免的行为偏差。**当前实现已经按 A 落地（`toVueEventName()`），本项是在追认这个偏差并补登记到 COMPATIBILITY.md。**",
    options: [
      {
        label: 'A. 接受偏差并登记（推荐）',
        tradeoff:
          '输出与 Vue 自身编译 @keydown 的形式一致，事件能正确触发；代价是 pickAttrs 的输出键不再与 antd 逐字节相同。',
      },
      {
        label: 'B. 保持 antd 原样输出（onKeyDown），由调用方自行转换',
        tradeoff:
          '输出键与 antd 一致；代价是把「事件永不触发」这个坑留给每一个调用方，且本项目内部必然要转换，等于自相矛盾。',
      },
    ],
    recommendation: 'A。证据（三种绑定方式的实测触发次数）已经明确，B 会把已知缺陷外推给使用者。',
    impact:
      '影响 @apollo-design/utils 的公共 API 契约与 COMPATIBILITY.md 的偏差登记；不阻塞实现（已按 A 落地）',
    blocks: ['@apollo-design/utils'],
  }),

  decided('use-id-test-env', {
    decidedAt: '2026-10-07',
    decidedBy: '用户裁决 2026-10-07（选 C）',
    decision:
      '**C —— 不固定生产输出，只在断言侧归一化**：生产行为完全不动；需要比对 id 时，' +
      '在断言前把 id 值映射成稳定占位符，并保留「谁指向谁」的引用关系。',
    note:
      '⚠️ **这条挂着 open 快两个月，但实践早已定型**（`dom-contract.ts` 的 `contract` 档已经在这么做）：\n' +
      '  · `id` 本身不进契约，按文档序映射成 `{i0}` `{i1}`…；`aria-*` 引用属性按空白拆 token 查表 ⇒ 引用关系**保留**。\n' +
      '  · `full` 档 id 原样保留（icons 基线有 `id="my-icon"` 透传的真实契约，归一化掉会丢一条）。\n' +
      '\n**2026-10-07 用实验回答了「固定是不是更简单」**（不靠讲道理，靠跑）：\n' +
      '  · 用 `vue/server-renderer` 渲染两个会要 id 的组件 ⇒ `v-0` / `v-1`；\n' +
      '    前面插一个**无关**组件 ⇒ 同一批组件变成 `v-1` / `v-2`；再插两个 ⇒ `v-3` / `v-4`。\n' +
      '    ⇒ **「固定成可预测编号」并不能带来稳定**：漂移来自「在你之前有多少组件要过 id」，' +
      '      跟随机性**无关**，mock 修不掉。它买的只是**格式**可预测，不是**值**稳定。\n' +
      '  · 用 jsdom 实测「固定成常量」（rc-util 在 NODE_ENV=test 时固定返回 test-id）：\n' +
      '    两个 input 拿到同一个 id ⇒ 第二个的 `aria-labelledby` **解析到第一个 label** ——\n' +
      '    一个静默错位的 a11y bug，而用固定 id 的测试只会断言「id 等于那个常量」然后**通过**。\n' +
      '  ⇒ C 的归一化**恰好能抓到**上面那个 bug（引用被映射成 token，指错了 token 就对不上），\n' +
      '    而固定常量抓不到。另：`useId` 包的是 Vue 3.5 的 `useId()`，它保证 SSR 与客户端一致；\n' +
      '    换成自己的计数器会丢掉这层覆盖。',
    question: '是否在测试环境中固定 useId 的输出，使其可断言？',
    context:
      'useId 用于 lockFocus 等场景生成稳定 id。测试中若 id 随运行变化，DOM 契约测试无法断言具体属性值，只能断言格式。',
    options: [
      {
        label: 'A. 不固定，测试只断言格式与唯一性（当前做法，推荐）',
        tradeoff:
          '测试不侵入生产行为，最诚实；代价是 DOM 契约测试无法断言 id 的字面值，只能断言「存在且唯一」。',
      },
      {
        label: 'B. 在 vitest.setup.ts 中固定 useId 输出',
        tradeoff: 'DOM 契约可断言字面值；代价是测试环境与生产行为不一致，可能掩盖真实问题。',
      },
    ],
    recommendation: 'A。DOM 契约的目标是结构一致，不是 id 字面值一致。',
    impact: '仅影响测试写法，不阻塞任何包的实现',
  }),

  open('button-children-wrapper', {
    raisedAt: '2026-10-07',
    question:
      'Button 要不要照 antd 那样**不包裹** children？（实测：我们多包了一层 `<span>`，' +
      '打断了从 antd 移植过来的 `>` 直接子选择器）',
    context:
      '2026-10-07 修 `dropdown` 的死规则（`.ant-btn` → `.apollo-btn`）时，为了验证修复是否真的生效，\n' +
      '临时加了一个 L6 变体（Dropdown + Button 触发器 + 下箭头图标），结果**它红了**（3 张，0.018–0.069%）。\n' +
      '用 playwright 量两侧计算样式后定位到真正的根因 —— **不是前缀问题**：\n' +
      '\n' +
      '```\n' +
      'React: SPAN.anticon.anticon-down  → BUTTON.ant-btn            ← 直接子元素，规则命中，font-size=12px\n' +
      'Vue:   SPAN.apollo-icon.apollo-icon-down → SPAN → BUTTON.apollo-btn  ← 多一层，规则不命中，font-size=14px（继承）\n' +
      '```\n' +
      '\n' +
      '即：**本仓 Button 在 children 含文字时会额外包一层 `<span>`**（`Button.vue` 的\n' +
      '`hasChildren && elementContentNodes === null` 分支），而 antd 是**直接渲染 children** ——\n' +
      'antd 只在 `icon` **prop** 上包 `<span class="ant-btn-icon">`（`button/IconWrapper.js`）。\n' +
      '\n' +
      '⇒ 所以 `dropdown/style` 里那两条 `.apollo-dropdown-trigger.apollo-btn > .apollo-icon-down`\n' +
      '  （直接子选择器）在本仓**永不命中**：前缀改对了也不够。\n' +
      '  受影响的不止 dropdown —— 任何从 antd 移植、用 `>` 连到 Button 子节点的规则都会失效。',
    options: [
      {
        label: 'A. Button 改为**不包裹** children，与 antd 结构对齐（★ 推荐）',
        tradeoff:
          '从根上解决，也让所有移植来的 `>` 规则恢复生效。代价：**Button 是 72 个组件里最高频的组件**，\n' +
          '      改结构影响面极大 ⇒ 必须跑**全量 L6**（1137 张，约 33 分钟）+ L4 DOM 契约后才能定。\n' +
          '      ⚠️ 那层 wrapper 可能与 `autoInsertSpace`（两字中文插空格）有关，改动前要先确认\n' +
          '      两字中文按钮的渲染不被破坏（button 的 L6 基线里有中文用例，可覆盖）。',
      },
      {
        label: 'B. 不去 wrapper，改把受影响的 CSS 从 `>` 放宽成后代选择器',
        tradeoff:
          '改动小、风险低。代价：我们的 CSS 与 antd 的 CSS **不再逐条对应** ——\n' +
          '      这正是本仓一直避免的（CSS 是「机械移植产物」，判据靠与 antd 对拍）。\n' +
          '      且放宽后可能命中本不该命中的深层节点，属于「改判据去迁就实现」。',
      },
      {
        label: 'C. 维持现状，接受这几条规则是死规则',
        tradeoff:
          '零风险。代价：dropdown 那两条规则继续失效（触发器是 Button 时的箭头字号不对），\n' +
          '      且**结构分叉本身不解决** —— 将来再移植带 `>` 的 antd 规则会继续静默失效。',
      },
    ],
    recommendation:
      '**A**。这是**结构**层面的对齐，不是样式层面的妥协；B 是在改判据迁就实现，C 是把分叉留在地基里。\n' +
      '但 A 必须先跑全量 L6 与 L4 才能落地 —— 不要在没有验证的情况下改 Button。',
    impact:
      '决定本仓 Button 的 DOM 结构是否与 antd 对齐；影响所有从 antd 移植的、以 Button 为祖先的\n' +
      '**直接子选择器** CSS 规则。',
    blocks: [],
  }),

  decided('early-extract-table-core-tree-core', {
    decidedAt: '2026-10-07',
    decidedBy: '用户裁决 2026-10-07（选 C）',
    decision:
      '**C —— 不抽独立包，把共享的纯逻辑挪到 `packages/ui/src/_internal/`**。' +
      '判别式：能进独立包的要「**≥2 个消费者**且无视觉语义」，而这两个 core 只会被 `ui` 一个包消费' +
      ' ⇒ 不够格做包；但它们确实被多个**组件**共用，就该放共享层。',
    note:
      '⚠️ **2026-10-07 复核时发现：决策自己写的触发条件「等第二个消费者出现」已经满足**（对 `tree` 而言）——\n' +
      '  · `tree`：**已有 ≥2 个消费者** —— `tree-select`（`Tree` 组件 + `conductCheck` + `convertDataToEntities`）\n' +
      '    和 `table`（`use-filter` / `use-selection` 都 import `../../tree/...`）；\n' +
      '  · `table`：**仍然只有 1 个消费者**（除 `style/index.ts` 的样式登记外，没有组件 import 它的 hooks）⇒ A 仍成立。\n' +
      '\n**落地内容（2026-10-07）**：\n' +
      '  · `tree` 的数据模型类型（`TreeKey`/`SafeKey`/`DataNode`/`TreeDataEntity`…）→ `_internal/tree/types.ts`；\n' +
      '    算法 `keyUtil`/`treeUtil`/`conductUtil` → `_internal/tree/{key-util,tree-util,conduct-util}.ts`。\n' +
      '    ⚠️ **类型必须跟着一起搬**：那些算法依赖这份数据模型，只搬函数会造成 `_internal/ → tree/` 的反向依赖，\n' +
      '      比原来的「组件间互 import」更糟。`tree/interface.ts` 原样再导出 ⇒ 公开 API 面零变化。\n' +
      '  · `arrAdd` / `arrDel` → `_internal/array-util.ts`（跟「树」无关，是通用键数组操作；顺手改成泛型）。\n' +
      '\n**顺带修掉的一处更大、同类的债**：`clsx` 定义在 `notification/engine/util.ts`，\n' +
      '  却被 **20 个文件 / 8 个组件**跨目录 import（`tree` ×6、`table` ×5、`progress` ×4、`transfer`、`steps`、\n' +
      '  `float-button`、`message` ×2、`notification` 自己）⇒ 已搬到 `_internal/clsx.ts`。\n' +
      '  同时**删掉两份重复实现**：`tooltip/util.ts` 的轻量版、`modal/engine/util.ts` 的版本（后者改为再导出）。\n' +
      '  ⚠️ 保留两处**刻意不统一**的局部 clsx：`_internal/use-merge-semantic.ts`（更窄，只收字符串）与\n' +
      '  `drawer/engine/useDrag.ts`、`cascader/OptionList.ts` —— 见各自注释，别为了消重盲目替换。',
    question: '是否提前抽取 table-core / tree-core 为独立包？',
    context:
      'Table 与 Tree 是 DAG 中最重的两个组件。它们的内部引擎（排序/筛选/展开状态机）若只服务一个组件，按包边界准则（≥2 个消费者且无视觉语义）应留在 packages/ui/src/<component>/engine/，等第二个消费者出现再提取。',
    options: [
      {
        label: 'A. 不提前抽取，等第二个消费者出现（符合准则，推荐）',
        tradeoff: '避免过早抽象；代价是将来提取时需要一次重构。',
      },
      {
        label: 'B. 提前抽取为独立包',
        tradeoff:
          'Table/Tree 开工前就定好边界；代价是违反「≥2 个消费者」准则，可能抽出错误的抽象。',
      },
    ],
    recommendation: 'A。这是 Phase 1 已记录的准则，无需现在改变。',
    impact: '影响 packages/ui 内部结构，不阻塞 foundation 包',
  }),

  // 2026-09-23 用户裁决为 B（自建引擎），运行时状态见 foundation.json（可行性核对：docs/analysis/carousel.md §7）。
  open('carousel-engine', {
    question: 'Carousel 自建引擎还是复用 embla-carousel？',
    context:
      'antd 的 Carousel 基于 react-slick。Vue 生态没有等价物，需在自建与复用 embla-carousel（框架无关）之间选择。',
    options: [
      {
        label: 'A. 复用 embla-carousel',
        tradeoff:
          '省下大量实现成本，框架无关可复用；代价是引入第三方运行时依赖，需核对 API 与 DOM 契约是否可对齐。',
      },
      {
        label: 'B. 自建引擎',
        tradeoff:
          '完全可控、可精确对齐 antd 的 DOM 与行为；代价是工作量最大，且触屏/拖拽边界情况多。',
      },
    ],
    recommendation: 'A，但需先做 API 与 DOM 契约的可行性核对再定。',
    impact: '仅影响 Carousel 一个组件（P5），不阻塞 foundation 包',
  }),

  decided('docs-site-framework', {
    raisedAt: '2026-09-15',
    decidedAt: '2026-10-04',
    decidedBy: '用户裁决 2026-10-04',
    decision:
      'A —— **VitePress**。API 表格由脚本从组件源码生成（本仓每个组件已带 `index.zh-CN.md` / `index.en-US.md` 与 `demo/*.md`，可机械汇总）。理由：开箱即用、Markdown 友好；代价（demo 实时预览与 API 表格自动化需自建）由脚本补足。',
    question: '文档站点用什么框架？',
    context:
      '组件文档需要 API 表格、demo 预览、主题切换。antd 用 dumi。本项目需在 VitePress / 自建 Vite 应用 / dumi 之间选择。',
    options: [
      {
        label: 'A. VitePress（推荐）',
        tradeoff:
          '开箱即用、Markdown 友好；代价是 Vue 组件 demo 的实时预览与 API 表格自动化需自行搭建。',
      },
      {
        label: 'B. 自建 Vite 应用',
        tradeoff: 'demo 预览与 API 表格可完全按需定制；代价是文档基建成本最高。',
      },
      {
        label: 'C. dumi',
        tradeoff:
          'antd 生态一致、API 表格自动化最省事；代价是 dumi 面向 React，与 Vue 项目耦合不良。',
      },
    ],
    recommendation: 'A 起步，API 表格用脚本从组件源码生成。',
    impact: '影响 packages/docs（Phase 4），不阻塞 foundation 包；**解锁横切项 `X:docs-site`**',
    blocks: [],
  }),

  decided('visual-baseline-in-git', {
    decidedAt: '2026-10-03',
    decidedBy: '用户（2026-10-03 指令：「visual-baseline-in-git 需要入库」）',
    decision:
      'A —— **基线截图入库 git**。理由：① 基线变更在 PR 中可见可审（diff 就是「这次视觉改了什么」的天然证据）；② CI 无需对象存储凭据与额外拉取步骤；③ 与仓库「证据先于断言」的纪律一致 —— 基线本身就是可复现的判据。代价（仓库体积）按推荐语**配合图片压缩**控制。',
    note:
      '落库范围：`tests/visual/baselines/react/**` 与 `tests/visual/baselines/vue/**`（PNG）。' +
      '⚠️ 新增/重生成基线后必须 `git add` 并提交，否则 L6 会持续报 `missing-baseline`。',
    question: '视觉回归基线截图是否入库 git？',
    context:
      'L6 视觉回归需要基线图。入库则 diff 可审、CI 可比对；不入库则需对象存储与额外拉取步骤。',
    options: [
      {
        label: 'A. 入库 git（推荐）',
        tradeoff:
          '基线变更在 PR 中可见可审，CI 无需外部依赖；代价是仓库体积增长（72 个组件 × 主题矩阵）。',
      },
      {
        label: 'B. 存对象存储',
        tradeoff: '仓库保持轻量；代价是 CI 需凭据与网络，基线变更的评审链路变长。',
      },
    ],
    recommendation: 'A，并配合图片压缩与按里程碑分批入库。',
    impact: '影响 tests/visual 的基建（Phase 3 中期），不阻塞 foundation 包',
  }),

  decided('ui-style-output', {
    raisedAt: '2026-09-17',
    decidedAt: '2026-10-04',
    decidedBy: '用户裁决 2026-10-04',
    decision:
      'A —— **每组件一份 CSS + 汇总 `dist/index.css`**。理由：72 组件规模下唯一「体积可控 + 保留整体引入便利」的形态，且支持 `import "@apollo-design/ui/<component>/style.css"` 按需引入。落地范围：ui 的 `build.config.ts`（每组件一条 CSS 入口）+ `tests/build/run.mjs` 的 B5/B6/B7 判据 —— 其中 **B6（体积预算 `budget.json`）从 PENDING 转真检查**。',
    question:
      'packages/ui 的组件样式产物是什么形态？按需引入（`@apollo-design/ui/<component>/style.css`）是否要真正落实？',
    context:
      '`build-output-contract` 的裁决 A 把 foundation 层定为**单文件 dist/**，并明确「ui 的按需引入需求留待组件阶段单独裁决」。现在第一个组件（empty）落地，必须定：组件样式是全部汇总成一份 CSS，还是每组件一份 + 汇总。这决定了 ui 的 build.config.ts 形态、L7 的 B5/B6 判据（体积预算 budget.json），以及用户能否只引一个组件的样式。',
    options: [
      {
        label: 'A. 每组件一份 CSS + 汇总 index.css（推荐）',
        tradeoff:
          '支持 `import "@apollo-design/ui/empty/style.css"` 按需引入，同时保留整体引入；72 个组件规模下体积可控。代价是构建配置与 L7 的 B6（体积预算）复杂度上升。',
      },
      {
        label: 'B. 只出汇总单文件 dist/index.css',
        tradeoff:
          '改动最小、与 foundation 层一致；代价是任何组件都带全量样式，按需引入无从谈起，L7 的 B6 只能判 n/a。',
      },
      {
        label: 'C. 每组件一份 CSS，不出汇总',
        tradeoff:
          '最纯粹；代价是用户需手动引 N 份样式，L7 的 B5「dist 下存在 CSS 产物」判据要改写成按组件查找。',
      },
    ],
    recommendation: 'A。这是 72 组件规模下唯一体积可控、且保留整体引入便利的形态。',
    impact:
      '决定 packages/ui 的 build.config.ts 形态、tests/build/run.mjs 的 B5/B6/B7 判据（B6 体积预算从 PENDING 转真检查），以及全部 72 个组件的样式落地方式',
    blocks: [],
  }),

  decided('empty-semantic-fn', {
    raisedAt: '2026-09-17',
    decidedAt: '2026-10-07',
    decidedBy: '用户裁决 2026-10-07（确认 B）',
    decision:
      '**B —— 支持，与 antd 完全对齐**。⚠️ 这条**此前挂着 open，但代码早已按 B 在跑** —— ' +
      '本次只是补登记，没有改代码。',
    note:
      '已实现的证据（2026-10-07 核对）：\n' +
      '  · `_internal/use-merge-semantic.ts:102` —— `return isFunction(value) ? value(info) : value;`\n' +
      '  · `useMergeSemantic` 在 375 / 385 行对它求值；prop 类型是 `[Object, Function]`。\n' +
      '  · `empty/interface.ts` 的注释里甚至已经写着「函数式由裁决 `empty-semantic-fn` = B 决定支持」。\n' +
      '  ⇒ 状态挂着 open 会让 `ask.mjs decisions --open` 误报、也可能让 `gen-workstreams` 误当阻塞项。\n' +
      '\n📌 **教训（与 `use-id-test-env` 同一类，一天内撞到两次）**：' +
      '看到 `open` 决策，**先去代码里查它是不是已经在跑了** —— 本仓这类「实践已定型、记录没跟上」的情况不少。',
    question:
      '`classNames` / `styles` 是否支持 antd 的函数式变体（`EmptySemanticAllType` 的 `classNamesAndFn` / `stylesAndFn`）？',
    context:
      'antd 6 的语义化 classNames/styles 允许传对象或函数（`(info: { props }) => 对象`）。Empty 是无状态纯展示组件，函数式变体拿不到任何组件内部状态，传函数在语义上等价于传常量。组件分析文档 §9 的 D4 原本倾向不支持。',
    options: [
      {
        label: 'A. 不支持（组件分析文档原推荐）',
        tradeoff:
          '少一条用不到的代码路径；代价是 API 面与 antd 出现差异，从 antd 迁移的代码若用了函数式会静默失效。',
      },
      {
        label: 'B. 支持，与 antd 完全对齐（已选）',
        tradeoff:
          'API 面零差异、迁移零成本，且 `useMergeSemantic` 的合并语义可以整套复用（对后续 71 个组件同样是基础设施）；代价是这条路径在 Empty 上无法被「真实状态」覆盖测试，只能用「函数被调用且收到 `{props}`」来断言。',
      },
    ],
    recommendation: 'B。语义化合并是横切基础设施，形态统一比单组件省一行代码更重要。',
    impact:
      '决定 packages/ui 的语义化合并工具（`useMergeSemantic` 等价物）是否实现函数式分支；影响全部使用 classNames/styles 的组件',
    blocks: [],
  }),

  // -------------------------------------------------------------------------
  // 已裁决项：不是待办，是**决策记录**。保留在此以便回溯「为什么这么定」。
  // -------------------------------------------------------------------------

  decided('position-overlay-split', {
    question: '`@rc-component/trigger` 是一个包还是拆成两个？',
    context:
      'trigger 同时承担两件事：① 纯几何计算（对齐点、翻转、偏移、箭头位置、尺寸测量）；② 生命周期与交互（触发时机、延迟、关闭行为、层级栈、portal 挂载）。前者是纯函数、极易测试；后者与 DOM/组件生命周期强耦合，是本项目最大的架构风险（AR1）。混在一个包里，PoC 无法只验证风险最大的那部分。',
    options: [
      {
        label: 'A. 拆为 position（纯几何，L1）+ overlay（生命周期，L2）（已选）',
        tradeoff:
          'AR1 的 PoC 可以只用纯函数 + 尺寸测量完成，不需要碰触发时机与生命周期；代价是多一个包、多一层依赖。',
      },
      {
        label: 'B. 保持单包 trigger',
        tradeoff:
          '与 antd 结构一一对应；代价是最大风险点无法被单独验证，且纯几何逻辑被 DOM 依赖污染。',
      },
    ],
    recommendation: 'A',
    decision: 'A —— 已拆为 @apollo-design/position（L1）与 @apollo-design/overlay（L2）',
    impact: '确定 foundation 包数量（13 个）与 AR1 的 PoC 方式',
  }),

  decided('intersection-area-clamp', {
    question:
      '相交面积计算是否复刻 antd 的 `Math.max(0, w * h)`（含「完全在外侧算出正面积」的缺陷）？',
    context:
      'antd `useAlign` 用 `Math.max(0, (visibleR - visibleL) * (visibleB - visibleT))` 度量「翻转后是否更可见」。当浮层**整体**落在区域外侧时，两个差值同为负数，乘积为正，`Math.max(0, ·)` 兜不住 —— 「完全不可见」被算成一个巨大的正面积（实测 17,600,000），翻转判定会据此接受一个明显更差的位置。本项目规则是「antd 自身的缺陷 → 登记差异，不复刻」。',
    options: [
      {
        label: 'A. 逐轴先夹到 0 再相乘（已选）',
        tradeoff:
          '数学上正确；与 antd 在所有「部分相交」的常见情形下结果完全一致（两条轴同号时两式等价）。代价是退化情形下与 antd 的翻转结果可能不同。',
      },
      {
        label: 'B. 逐字复刻含缺陷的算式',
        tradeoff:
          '与 antd 逐位一致；代价是把一个已知的错误度量固化进本项目，且它只在 antd 自己也会提前返回（`isVisible(target)` 为假）的场景下才起作用 —— 也就是说复刻它换不来任何实际一致性。',
      },
    ],
    recommendation: 'A',
    decision:
      'A —— 见 packages/position/src/area.ts。oracle.js 保留 clampIntersection 开关（默认 false = 逐字 antd），差分测试用 true 证明「这是唯一差异」。证据：align.test.ts 断言「不开夹取时分歧数 > 0，开夹取时分歧数 = 0」，把本条登记变成可证伪的断言，而非口头声明。',
    impact:
      '影响 position 包的翻转判定；差分测试中的 5000 组用例里确实存在分歧（已用可证伪的断言锁定）',
    blocks: [],
  }),

  decided('hooks-package-vs-colocated', {
    question: 'Vue 的 composables 是否要抽成独立的 @apollo-design/hooks 包？',
    context:
      'antd 有大量 hooks（useMemo/useMergedState/useLayoutEffect…）。直觉是照搬成 hooks 包。但 Vue 的 composable 与组件实例强耦合（inject/provide、生命周期、ref 生命周期），抽出来要么退化成纯函数（无意义），要么带着 Vue 语义（等于又一个 utils）。',
    options: [
      {
        label: 'A. 三层共置，不建 hooks 包（已选）',
        tradeoff:
          'utils/hooks = 框架无关纯逻辑；各包自带 composables/ = 该包能力相关；ui/src/hooks = 与组件耦合。代价是 hooks 分散在三个地方，查找需按层级判断。',
      },
      {
        label: 'B. 建 @apollo-design/hooks 包',
        tradeoff: '集中管理；代价是包本身无内聚职责，会变成「什么都能放」的垃圾桶。',
      },
    ],
    recommendation: 'A',
    decision: 'A —— 三层共置，见 ARCHITECTURE.md §6.3',
    impact: '决定 composables 的落位规则，影响全部包与组件的目录约定',
  }),

  decided('visual-harness-base-font', {
    raisedAt: '2026-09-28',
    decidedAt: '2026-10-04',
    decidedBy: '用户裁决 2026-10-04（台账同步：cascader 已 completed，本条不再阻塞）',
    question: 'L6 视觉 harness 的 react 侧是否要补上 antd 的页面基座字体（reset.css）？',
    context:
      '⚠️ **2026-10-04 更正**：原 context 的「harness 的 react 侧**不加载** `antd/dist/reset.css`」是**误诊** —— react 侧自 `befcdb3`（2026-09-18，L6 基建落地那次提交）起就 import 了 `antd/dist/reset.css`（`tests/visual/render/react-main.jsx:8`）。而 antd 的 `reset.css` 本身就把 `html` 设成**泛型** `font-family: sans-serif`；本仓 `ui/dist/index.css` 的 html/body reset 是 `font-family: var(--apollo-font-family)`（具体栈 `-apple-system,…`）。⇒ 两侧页面基座的差异（泛型 `sans-serif` vs 具体栈）是**设计如此**，不是「缺 reset.css」，选项 A 无法消除它。绝大多数组件无感（根类都显式声明 `font-family`）；唯一暴露点是**继承页面字体**的浮层内容 —— antd 的 `style/panel.js` 与 `style/index.js` 都是 `resetFont: false`（cascader 的面板与列、date-picker 的面板等）。',
    options: [
      {
        label: 'A. react 侧加载 antd/dist/reset.css',
        tradeoff:
          '最贴近真实 antd 应用（官方 demo 都引它），两侧页面基座一致；代价是 react 截图会变（需重生成入库的 react 基线，并复核所有组件的 L6 结论）。',
      },
      {
        label: 'B. 接受为 harness 差异，用白名单放行',
        tradeoff:
          '不动基线、不扩范围；代价是给 L6 引入「按组件放行」的先例（阈值本身不放宽），且 cascader 面板的字体仍是「继承页面」这一隐含契约未被真正验证。',
      },
      {
        label: 'C. 判为 antd 的可改进项（DEFECT），本仓给面板/列补 font-family',
        tradeoff:
          '让面板自带字体、不再依赖页面基座；代价是与 antd 产物分叉（上游 `resetFont: false` 是刻意的），可能引入新的逐像素差异。',
      },
    ],
    recommendation: 'A',
    decision:
      'B —— 接受两侧页面基座的固有差异，**用例内钉字体**解决（不放宽 L6 阈值、不加白名单、不改全局 BASE_CSS）。⚠️ 选项 A 系误诊：react 侧早已 import `antd/dist/reset.css`（`befcdb3` / 2026-09-18），而 antd 的 reset 给的是**泛型** `sans-serif`，加载后两侧仍不同。实证：cascader L6 `--mode compare` **9/9 exact（0.000%）**，9 张基线已入库。',
    impact:
      '（已解除）原为「决定 cascader 的 `visual` 维度能否收口（未裁决前不得置 done）」。cascader 已于 2026-10-04 置 `visual: done` 且 `completed`（`blockers: []`、9 张基线入库），本条不再阻塞任何组件或 foundation 包。',
    blocks: [],
  }),
  decided('picker-panel-ownership', {
    raisedAt: '2026-09-19',
    decidedAt: '2026-09-30',
    decidedBy: '用户裁决 2026-09-30',
    question:
      '面板 Vue 组件（PickerPanel / PanelHeader / DatePanel…YearPanel / TimePanelBody）属 @apollo-design/picker 还是 packages/ui/date-picker？这一条决定 picker 的 L2 / L4 / L5 是硬门禁还是 n/a。',
    context:
      '契约 docs/foundation/picker-contract.md §9 P3 提出：包职责原文与 README 的「公开 API」都写着「面板：DatePanel / WeekPanel / MonthPanel / QuarterPanel / YearPanel / TimePanel」与「面板切换 / 键盘导航」，但 §6.2 当时**暂定**面板属 ui（本包只出 buildPanelCells 的状态位），于是 L2/L4/L5 只能取最保守的 todo（E16 禁止用 n/a 掩盖未做）。当时不裁决的理由是「B 需要 config-provider / overlay / position 先被真实消费过」，而截至 2026-09-30 这三者都已被多个组件真实消费（tabs 用 dropdown 的溢出下拉、dropdown 用 overlay+position、全部组件用 config-provider 的 Size/Direction/Locale）。另核到一条新证据：antd 侧 rc-picker 的面板有 3 个消费者 —— date-picker / time-picker / **calendar**（antd 6.6.4 es/calendar/generateCalendar.js:4 直接 import RCPickerPanel），符合本仓「消费者 ≥2 且无视觉语义才独立成包」的包边界规则。',
    options: [
      {
        label: 'A. 面板留在 ui 层',
        tradeoff:
          'picker 保持「无 DOM 的纯函数引擎」，面板写在 packages/ui/date-picker 里、三个消费者共享 _internal/；picker 的 L2/L4/L5 判 n/a（依据同 form-core），impl 维度即可收口、foundation 立刻 13/13。代价：要改 README 的公开 API，把 replaces 的语义收窄到「只替代 rc-picker 的纯函数与状态机层」，并与本仓「消费者 ≥2 就独立成包」的自有规则相抵。',
      },
      {
        label: 'B. 面板进 picker 包（★ 已选）',
        tradeoff:
          '面板组件落在 packages/picker（defineComponent 写在 .ts，先例为 motion 的 CSSMotion / portal 的 Portal），只出 DOM 与 ARIA、**不产 CSS**（R4 允许），ui 只负责输入框、浮层与样式；L2/L4/L5 成为本包硬门禁。代价：约 1800 行上游面板代码的 Vue 化 + 本包自己的一套三层测试。',
      },
    ],
    recommendation: 'B —— 与 README 的公开 API、包边界规则、replaces 的语义三者一致。',
    decision:
      'B —— 面板组件（PickerPanel / PanelHeader / DatePanel…YearPanel / TimePanelBody）落在 @apollo-design/picker；ui 的 DatePicker / TimePicker / Calendar 只负责输入框、浮层与样式。L2/L4/L5 自本决策起是 picker 的**硬门禁**（不再是 todo，也不判 n/a）。',
    impact:
      '决定 @apollo-design/picker 能否置 completed（L2/L4/L5 必须在收口前补齐），并决定 date-picker / time-picker / calendar 三个组件的代码分工。未裁决期间 picker 已按最保守记法持 todo。',
    blocks: ['@apollo-design/picker'],
  }),
  decided('date-picker-input-kernel', {
    raisedAt: '2026-09-30',
    decidedAt: '2026-09-30',
    decidedBy: '用户裁决 2026-09-30',
    question:
      'date-picker 的输入框内核（rc 的 `PickerInput`）怎么落地？它是 37 个 .js / 4290 行、绑 React（useState + useEvent），而 @apollo-design/picker 已明确不做输入框（README 的 notDo）。这一条决定 G4 的工作量与「11 维度能否全 done」。',
    context:
      'G1 实测（docs/analysis/date-picker.md §1.0）：antd 侧是薄壳（非 locale 2650 行），真正的大头在 rc 的 `lib/PickerInput`（4290 行）。逐文件拆解：两个壳 1121（SinglePicker 538 / RangePicker 583）、值管理 hooks 878（useRangeValueChange 412 / useRangeValue 254 / useRangePickerValue 166 / useDelayState 46）、Selector+Input 层约 1200（Input 368 / RangeSelector 218 / SingleSelector 196 / useInputProps 177 / MaskFormat 88 / MultipleDates 86 / ClearIcon 37）、Popup 层 403（可用本仓 overlay/position/portal 大幅替代）、辅助 hooks 约 450。列出的全部是**真行为**（解析格式数组、算 size、掩码、字段导航），不是 React 样板。判据：H8「禁止降低验收标准以换取进度」；先例 `cascader` 带 1 条 DEFERRED 仍判 completed，但那条是**样式集成**，与「键入解析是主交互」量级不同。',
    options: [
      {
        label: 'A. 完整对齐（分阶段落地）（★ 已选）',
        tradeoff:
          '逐块重写 PickerInput：键入解析、format 的函数/数组形态、掩码模式（format.type: "mask"）、键盘字段导航、分段（-input-active）、inputReadOnly / preserveInvalidOnBlur / previewValue 全部落地。11 维度可全 done、无缺口，符合 H8。代价：估计新增约 2500 行 Vue（Popup 403 行可由本仓 overlay/position/portal 替代、Selector 部分可参照 select 的 engine）+ 对应 7 层测试，是本仓迄今最大的单组件工作量。分阶段落地：每阶段自成绿灯，先「值/开合/面板接线」再「键入与掩码」再「键盘与分段」。',
      },
      {
        label: 'B. 核心功能 + 明确缺口',
        tradeoff:
          '值 / 开合 / 面板 / 格式化 / 约束 / 状态 / 语义槽 / 预设 / 无障碍 全落地；「键入解析 + 掩码模式」标 DEFERRED（登 README §5 + registry 的 layerNotes + COMPATIBILITY），输入框只读展示 + 点击选择。代价：`completed` 时带一个**主交互**级别的缺口 —— 用户无法键入日期，这与 H8 的精神相抵，且 L2 的键入用例整组缺席。',
      },
      {
        label: 'C. 先做与分叉无关的部分，G4 前再裁决',
        tradeoff:
          '先做 G3（style/token.ts：3 个自有 token presetsWidth / presetsMaxWidth / zIndexPopup + input/select/roundedArrow 三处继承面）与 L4 的输入框 DOM 契约基线 —— 这两步与内核怎么实现无关。代价：把最贵的裁决往后推，G4 开始时仍要停一次。',
      },
    ],
    recommendation:
      'A —— H8 禁止用降低标准换进度，且键入是日期选择器的主交互；分阶段落地可让每阶段自成绿灯。',
    decision:
      'A —— 完整对齐，分阶段落地。G4 必须实现：① 值/开合/面板接线（受控 + 非受控，含多处 v-model 的 C11 双发）；② 键入解析与 format 的函数/数组形态；③ 掩码模式（format.type: "mask"）；④ 键盘字段导航与分段（-input-active）；⑤ inputReadOnly / preserveInvalidOnBlur / previewValue / order / needConfirm / maxTagCount / tagRender / multiple。分阶段顺序：接线 → 键入与格式化 → 掩码 → 键盘与分段；⑥ 不得以「先跳过、回头补」的方式落 DEFERRED。',
    impact:
      '决定 date-picker 的 11 维度能否全 done（A 下无缺口），并顺带清偿跨包欠账：@apollo-design/picker 的 PickerFormat 要加回 DateType 泛型 + CustomFormat<DateType>（PITFALLS 214）。另决定 time-picker（唯一被 date-picker 阻塞的下游）能拿到一个**完整**的可复用输入框内核。',
    // ⚠️ 原为 `['date-picker']`（**组件名**）—— 违反 schema「blocks 只填 foundation 包名」。
    //    2026-10-04 台账同步改为本条 impact 里点名的那个包（"@apollo-design/picker 的
    //    PickerFormat 要加回 DateType 泛型"）；组件侧的范围由上面的 impact 文本承载。
    blocks: ['@apollo-design/picker'],
  }),
  decided('ui-tree-shaking', {
    raisedAt: '2026-10-07',
    decidedAt: '2026-10-07',
    decidedBy: '用户裁决（2026-10-07，前提「不计成本、避免日后技术债」）',
    decision:
      '**A + B + D 三件一起做**：' +
      'A 是**机制** —— ui 走 unbuild/rollup 的 `preserveModules` 出多模块产物，`dist/index.mjs` 降级为 re-export barrel；' +
      'B 是**契约** —— `exports` 增加按组件深入口 `@apollo-design/ui/<component>`（与既有的 `<component>/style.css` 对称），' +
      '**只暴露入口名、不暴露内部文件路径**，这样内部布局仍可自由演进、深导入不会退化成隐式公开契约；' +
      'D **消除地板** —— 13 个 foundation 包同步保留模块结构（即重开 `build-output-contract` 的 B 项）。' +
      'C 违反 AGENTS.md H8（把预算设成实测值 = 宣告门禁永不失败），不选。',
    note:
      '落地实测（2026-10-07，与提问时**同一测量方法**复测；全量 `import * as all` 2009.0 KB，与修复前 2010.1 KB 一致 ⇒ 「全量」没被牺牲）：' +
      'Divider **1272.9 KB → 7.5 KB**（全量的 0.4%，此前 63%）；App 2.2 KB；Button 20.9 KB；Empty 33.6 KB；' +
      'Select 133.2 KB；Table 318.7 KB（15.9%，最重）。73 个组件逐个有预算，落在 `tests/build/budget.json`；B6 据此从 PENDING 转真检查。' +
      '⚠️ 实测里另一个坑：用 `import * as all` 探**深入口**会把整个模块的导出都留住（divider 29.9 KB vs 具名导入 7.5 KB）' +
      ' ⇒ 预算只认「根入口 + 具名导入」这一列，别拿 `import * as` 的数字当真实场景。' +
      '⚠️ 两点诚实的收尾：① **theme 一开始漏了**（它有 `ownBuildConfig`，被共享配置跳过）⇒ D 一度只落地 12/13，' +
      '而门禁里那句「产物已是模块结构」对 theme 是**假的**；补上后 13/13。' +
      '② 补 theme 后**复测 ui 的组件体积零变化**（divider/button/empty/color-picker/table 逐个比对，差 < 0.05 KB）' +
      ' —— 因为 ui 本来就整块消费 theme 的模块，theme 的粒度对 ui 消费者无影响。' +
      '⇒ 别把 Divider 1272.9→7.5 的功劳算到 D 头上，那是 **A** 的；D 的收益在**直接消费 foundation 包**的场景。',
    question:
      '@apollo-design/ui 的 JS 产物形态要不要为 tree-shaking 改？现状「单文件 dist/」下，**按需引入任意一个组件 = 1272.9 KB，占全量的 63%** —— 即 `@apollo-design/ui` 事实上无法按需引入。',
    context:
      '来源：VNA 共享面审计（2026-10-07）在落实 L7 的 B6（`ui-style-output` 裁决要求「B6 从 PENDING 转真检查」）时**实测**出来的。' +
      '测量方法：Vite 8（rolldown）lib 构建一个只 import 一个导出的入口，`external: [vue, dayjs]`，`minify: esbuild`，`write: false` 读内存产物字节数。' +
      '实测（2026-10-07）：\n' +
      '  · 空基线 / `import "@apollo-design/ui"`（裸副作用）/ 只 re-export 不使用 ⇒ **0.0 KB**；\n' +
      '  · **真正使用**任一个组件（Button / Empty / Divider / Table / ConfigProvider 逐个测）⇒ **全部恰好 1272.9 KB**；\n' +
      '  · 全量 `import * as all` ⇒ 2010.1 KB；\n' +
      '  · 对照：`@apollo-design/theme` 的 `useToken` 单独使用只有 22.6 KB。\n' +
      '根因定位（逐条实测）：\n' +
      '  ① `sideEffects: false` **已正确声明** —— 裸副作用导入与未使用的 re-export 都被摇成 0 KB，说明包元数据没问题；\n' +
      '  ② 问题在**模块粒度**：`packages/ui/dist/index.mjs` 是**一个** 3.2 MB / 77668 行的单文件打包产物（unbuild 默认行为），rollup/rolldown 只能整模块丢弃 —— 「全不用 ⇒ 0 KB」与「用一个 ⇒ 全留」正是这个形态的必然结果；\n' +
      '  ③ 产物里有 **329 处 `defineComponent(...)` 与 126 处 `withInstall(...)` 顶层调用，0 处带 `/*#__PURE__*/`**；但给它们全加上 PURE 标注后只从 1272.9 降到 **1168.8 KB**（仅省 104.1 KB）⇒ 不是主因；\n' +
      '  ④ 压缩产物里仍能搜到 `"ATable"` / `"AForm"` / `"ApolloPickerPanel"` / `"AActionButton"` ⇒ 只引 `Divider` 却把 Table / Form / picker / ActionButton 整片保留。\n' +
      '⚠️ 这与 `build-output-contract`（裁决 A：**foundation 层**单文件 dist）**不冲突** —— 那条只管 13 个 foundation 包，`ARCHITECTURE.md` §8.1 明写「ui 的按组件按需引入需求不在本次裁决范围内」。' +
      'ui 的**样式**侧已有 `ui-style-output` A（每组件一份 CSS，69 个 `dist/<c>/style.css` 实测存在）；**JS 侧没有对应裁决**，本条就是它。',
    options: [
      {
        label:
          'A. ui 改出「保留模块结构」的 ESM（`preserveModules`）（★ 推荐，且应与 B、foundation 同步做）',
        tradeoff:
          '`packages/ui/build.config.ts` 的 `rollup:options` 里打开 `output.preserveModules`，产物变成 `dist/<component>/index.mjs` 等**多文件**，`dist/index.mjs` 降级为 re-export barrel。' +
          '**依据**：本次实测已证明「模块级丢弃」是有效的（整包不用 ⇒ 0 KB），限制因素正是「只有一个模块」。改动小、公开入口不变（`exports["."]` 仍指 `dist/index.mjs`）、不动任何组件源码。' +
          '⚠️ **工具链已核实**：包构建走 unbuild，而 unbuild 3.6.1 依赖 **`rollup ^4.46.2` + `mkdist ^2.3.0`** ⇒ `preserveModules` 可用。' +
          '**但用 Vite 8 做会失败**：实测把 `preserveModules` 传给 Vite 8（rolldown）时**未被采纳**，产物退化成 app 模式的空 chunk ⇒ 这一步必须经 unbuild/rollup，不能用 vite 实现。' +
          '代价：dist 文件数从 4 涨到数百；需重跑 B2（exports 解析）/B5（CSS）/B6/B7/B8 并确认 `files: ["dist"]` 仍覆盖全部产物。',
      },
      {
        label:
          'B. 给 exports 增加按组件 JS 入口（`@apollo-design/ui/button`）—— **A 的薄层，不是替代品**',
        tradeoff:
          '与样式侧的 `@apollo-design/ui/<c>/style.css` 对称，深导入最明确、不依赖消费方打包器的摇树能力。' +
          '⚠️ **不能只要 B 不要 A**：没有模块结构就得**每组件一份 bundle** ⇒ 共享代码在每个入口里重复，那是**制造**技术债而不是消除。' +
          '⚠️ **只暴露入口名、不暴露内部文件路径** —— 这样内部布局仍可自由演进，深导入不会变成隐式的公开契约（这是「不留技术债」的关键）。' +
          '代价：需新增 72 条 `exports` 记录（应由脚本生成），且 B2 要覆盖深入口（否则写错会静默 404）。',
      },
      {
        label: 'C. 不改产物形态，只把 B6 的预算设成实测值（1272.9 KB）',
        tradeoff:
          '立刻让 B6 从 PENDING 转绿、改动最小。**但这是 H8 明禁的「降低验收标准以换取进度」** —— B6 的判据是「按需引入单组件后产物体积 ≤ 预算」，把预算设成「等于全量」等于宣告这条门禁永远不可能失败。**不推荐**，仅列出以说明为何不能选。',
      },
      {
        label: 'D. **同步重开 `build-output-contract`**（foundation 13 包也保留模块结构）',
        tradeoff:
          '⚠️ **不做 D 会留一个新地板**：13 个 foundation 包仍是单文件 dist（实测 `form-core` 84 KB / `picker` 73 KB / `utils` 47 KB，合计约 352 KB 未压缩）⇒ ui 修好后，引一个组件仍会整包拉走它用到的 foundation 包。' +
          '**D 不是新想法，是 `build-output-contract` 自己的推荐**：它的选项 B 原文是「es/ 用 mkdist 保留模块结构 + dist/ 用 unbuild 出单文件（**推荐**）」，被选项 A（「改动最小」）否掉；其 note 明确记下代价「foundation 层无模块级深导入。**ui 的按需引入需求留待组件阶段单独裁决**」—— 即本条。' +
          '好消息：`unbuild` 自带 `mkdist`，正是当初推荐 B 的实现路径。代价：每个包多一套构建配置与一份产物，构建时间与 L7 校验复杂度上升（这正是当初选 A 的理由，而本次前提是「不计成本」）。',
      },
    ],
    recommendation:
      '**A + B + D 三件一起做**（并以此收尾第 4 步 B6 转真检查）：A 是机制（模块结构），B 是契约（显式深入口，只暴露入口名），D 消除地板（foundation 同步）。' +
      '任缺其一都会留一笔日后要还的债：只 A ⇒ 无显式契约且弱打包器仍拿全量；只 B ⇒ 共享代码重复；不做 D ⇒ 地板仍在 foundation。' +
      'C 违反 H8，不应作为选项。实施顺序：D/A（产物形态）→ B（exports）→ 实测各组件体积 → 写 `budget.json` → B6 转真检查。',
    impact:
      '决定 `@apollo-design/ui` 能否真正「按需引入」（当前实测为否：任一组件 = 1272.9 KB / 全量 63%），决定 L7 的 B6 能否从 PENDING 转真检查（`ui-style-output` 裁决的落地范围明确要求它转真检查），' +
      '并决定是否**重开已裁决的 `build-output-contract`**（其 A 把 13 个 foundation 包定为单文件 dist）。',
    // D 项把这 13 个 foundation 包从「单文件 dist」改为「保留模块结构」，故逐一登记影响范围。
    // （schema：`blocks` 只填 foundation 包名；`status: 'decided'` 时它退化为历史影响范围。）
    blocks: [
      '@apollo-design/a11y',
      '@apollo-design/form-core',
      '@apollo-design/icons',
      '@apollo-design/locale',
      '@apollo-design/motion',
      '@apollo-design/overlay',
      '@apollo-design/picker',
      '@apollo-design/portal',
      '@apollo-design/position',
      '@apollo-design/test-utils',
      '@apollo-design/theme',
      '@apollo-design/utils',
      '@apollo-design/virtual-list',
    ],
  }),

  decided('css-ant-prefix-cost', {
    raisedAt: '2026-10-07',
    decidedAt: '2026-10-07',
    decidedBy: '用户裁决（2026-10-07，选 B）',
    decision:
      "**B —— 砍掉 `ant` 前缀**：`STATIC_PREFIX_CLS` 从 `['apollo','ant']` 缩为 `['apollo']`。" +
      '⚠️ 这**推翻**了 `prefix-cls-default` = A 里「允许 ConfigProvider 覆盖为 `ant`」的**开箱即用**那一层 —— ' +
      '该决策已同步修订（见其 `note`）。任意 `prefixCls` 仍是合法 API，但改用者需自行用 ' +
      '`genComponentCss(name, prefixCls)` / `genAllStyles()` 产出并引入 CSS。',
    note:
      '落地实测（2026-10-07，与提问时同一口径复测）：\n' +
      '  · 组件 CSS 合计 **2522.2 KB → 1399.3 KB**（−1122.9 KB，**−44.5%**）；\n' +
      '  · `dist/index.css` **2303.4 KB → 1180.8 KB**（−48.7%）；\n' +
      '  · `button/style.css` **209.9 KB → 109.7 KB**（−48.3%）。\n' +
      '  （降幅比提问时估的 32.8% 更大 —— 那个估算只数了「选择器里含 `.ant-` 且不含 apollo」的顶层块，\n' +
      '    低估了混合选择器里的 ant 内容。）\n' +
      '⚠️ **两个必须留在记录里的副产物**：\n' +
      '  ① B7 当场判 FAIL —— `--ant-timeline-dot-size` / `--ant-timeline-dot-bg` 两条豁免变成**陈旧条目**。' +
      '     这是 `UPSTREAM_UNDECLARED_TOKEN_VARS` 那条「必须至少有一次 var() 引用」自证在干活：' +
      '     **产物形态一变，豁免表会自己报出该删的条目**。已从 `tests/build/run.mjs` 删除该两条。\n' +
      '  ② 砍掉第二份 CSS 后暴露出 **2 个组件在 `apollo` 版里硬编码了 `.ant-` 选择器**' +
      '     （`menu` 的 `>.ant-typography-ellipsis-single-line`、`dropdown` 的 `.ant-btn` / `.ant-btn-icon`）' +
      '     ⇒ 默认前缀下**永不命中**（死规则）。性质未判定（可能照搬 antd 的固定 `antCls` 常量，' +
      '     也可能端口写错），且**改它有视觉回归风险**（改成 `.apollo-*` 就会真的开始匹配）⇒ ' +
      '     **未擅自修**，已用双向校验的 `HARDCODED_ANT_IN_DEFAULT` 钉在 `style-prefix.test.ts` 里。\n' +
      '③ 「`gen(p)` 必须吃 `p`」这条不变量**不能跟着删** —— 该测试改为用**探针前缀**' +
      '     （`zzprobe`，不在 `STATIC_PREFIX_CLS` 里）比对，护栏照旧生效、只是不再进产物。' +
      '    `KNOWN_GAPS` 那 24 条的语义因此变成「**加第二个前缀前必须先修这些**」。',
    question:
      '静态 CSS 还要不要继续为 `ant` 前缀生成一份？（2026-10-07 实测：这份占组件 CSS 总量的 **32.8%**，' +
      '而它支撑的能力在 **24 个组件**上并不完整）',
    context:
      '来源：裁决 `ui-tree-shaking` = A+B+D 收尾后，回头核对「CSS 半边的按需粒度」时实测出来的。' +
      "\n\nprecursors：`STATIC_PREFIX_CLS = ['apollo', 'ant']`（`packages/ui/src/style/index.ts`），" +
      '依据是裁决 `prefix-cls-default` = A「默认 apollo，允许 ConfigProvider 覆盖为 ant」—— ' +
      '零运行时下 CSS 是构建期产物，只生成 apollo 的话用户把 prefixCls 改成 ant 会得到一堆没有样式的类名，' +
      '那条承诺就是空的。所以双份是**有意的**，文件注释里也明写了「代价是 CSS 体积翻倍」。' +
      '\n\n**但 2026-10-07 实测发现这笔账现在是负的**：\n' +
      '  · 组件 CSS 合计 **2522.2 KB**，其中「纯 ant 变体」**827.2 KB = 32.8%**（按顶层块的选择器判定）；\n' +
      '  · 而 `packages/ui/src/__tests__/style-prefix.test.ts` 的 `KNOWN_GAPS` 现有 **24 个组件**的\n' +
      '    `ant` 版类名数少于 `apollo` 版 —— 其中 **7 个是「规则体完全静态」（`gen(p)` 忽略了 `p`）**：\n' +
      '    tabs 885→1 · input 734→3 · upload 1051→1 · **tooltip 213→0** · form 322→2 · pagination 477→1 · slider 136→1\n' +
      '    ⇒ 对这些组件，`prefixCls="ant"` 事实上是**没有样式**的。\n' +
      '  · 其余 17 个是「跨组件类名写成字面量」（`.apollo-icon` / `.apollo-dropdown` …）：部分不一致，\n' +
      '    dropdown 617→488 · modal 188→147 · tree-select 950→851 · form/menu/button 亦有缺口。\n' +
      '  · ⚠️ 顺带实测：`style/index.ts` 注释里写的「22 个组件」是 2026-10-02 的快照，实测已变成 **24** ——\n' +
      '    这类数字会漂移（已据实订正）。\n' +
      '\n另有两点已核，**不是**缺陷、不要当成 bug 去改：\n' +
      '  ① `BASE_CSS`（antd reset + 图标基线）确实嵌进了**每一份**组件 CSS —— 这是有意的「单引自足」\n' +
      '     （注释原文：不然只引单个组件 CSS 也会退回 Times），且是图标基线第三次踩坑后收进全局的；\n' +
      '     代价是引 N 个组件会有 199.5 KB 的重复 reset（90 个重复块，多为 ~150 B 的小规则出现在全部 69 份里）。\n' +
      '  ② 每份组件 CSS 里 `apollo` / `ant` 各一份，换来的是运行时可切前缀 —— 上面已说明它是刻意设计。',
    options: [
      {
        label:
          'A. 保留承诺并**补齐** 24 个组件的 ant 版（`gen(p)` 真正吃 `p`）（★ 若要兑现承诺，这是唯一诚实的做法）',
        tradeoff:
          '保持 `prefix-cls-default`=A 的承诺完好。工作量最大：7 个「规则体静态串」的组件要把写死的\n' +
          '      `.apollo-*` 静态串改成按 `p` 生成（input 734 / upload 1051 / tabs 885 是最大的三块），\n' +
          '      另 17 个要把跨组件类名改成随 `p` 走。**修一个就从 `KNOWN_GAPS` 删一条**（双向校验的测试已存在）。\n' +
          '      ⚠️ 风险：全部 L6 视觉基线都是 `apollo` 前缀 ⇒ 改动**不会影响 L6**，只有 style-prefix 测试的双计数\n' +
          '      会变 —— 所以必须**另补一条**「ANT 版的选择器集合 ⊇ apollo 版集合（按后缀逐条对拍）」的断言，\n' +
          '      否则「类名数相同但换错了后缀」这类错误仍然漏网。代价：CSS 仍是双倍（827 KB 保留）。',
      },
      {
        label: 'B. 砍掉 `ant` 前缀（`STATIC_PREFIX_CLS` 只留 `apollo`）—— **立省 32.8%**',
        tradeoff:
          '组件 CSS 从 2522.2 KB 降到约 1695 KB；`KNOWN_GAPS` 那 24 条一次性全部消失（欠账清零）。\n' +
          '      ⚠️ **推翻**裁决 `prefix-cls-default`=A 的承诺的一半（「允许覆盖为 ant」）⇒ 这是**重开已裁决的决策**，\n' +
          '      必须由用户裁决，不能顺手改。\n' +
          '      📌 值得考虑的理由：**Phase 2（2026-10-06 用户裁决）已经把 antd 降为「参考实现」**，\n' +
          '      「兼容 antd 类名」是 Phase 1 的迁移思维；在这个前提下继续为 ant 付 827 KB 可能已不合时宜。\n' +
          '      代价：需要同步改 `ConfigProvider` 的 prefixCls 能力面（或至少文档明示不再支持 `ant`）、\n' +
          '      `style-prefix.test.ts` 的整体形态、以及所有提到双前缀的注释。',
      },
      {
        label:
          'C. **按前缀拆成两个文件**：`<c>/style.css` 只含 apollo，另出 `<c>/style.ant.css`（★ 推荐）',
        tradeoff:
          '默认用户（apollo）**立即省掉一半** CSS，而 `prefixCls="ant"` 的能力**完整保留** ——\n' +
          '      既不留下 broken promise，也不留技术债，是「体积」与「承诺」两侧都不让步的唯一选项。\n' +
          '      需要的 `ant` 的用户显式引入 `@apollo-design/ui/<c>/style.ant.css`（或配套的 aggregate）。\n' +
          '      代价：exports 再增 69 条（由 `uiExtraExports()` 从同一份 `STATIC_PREFIX_CLS` 推导，不手写）；\n' +
          '      ⚠️ **运行时切前缀**（同一份 bundle 里两种前缀都要）的用户得同时引两个文件 —— 这属于小众场景，\n' +
          '      且比「所有人都被强制双倍」合理。⚠️ `BASE_CSS` 的自包含语义要重新界定（是两份都带，还是抽成\n' +
          '      `base.css` 单独引入）—— 若抽出来会打破现行的「单引自足」，需另行评估。',
      },
      {
        label: 'D. 维持现状，把 24 条缺口作为**已知缺陷**写进 `docs/KNOWN-ISSUES.md`',
        tradeoff:
          '改动最小。但它把一个「付了 827 KB 却只对 45 个组件生效」的事实**固化**下来 ——\n' +
          '      与 `ui-tree-shaking` 那条教训同源：**把问题登记下来不等于解决问题**。\n' +
          '      仅列出以说明为何不应默认选它。',
      },
    ],
    recommendation:
      '**C**（拆文件）：既能立刻让默认用户的 CSS 减半（配合刚落地的 `ui-tree-shaking`，按需引入在 JS 与 CSS 两侧才算都成立），' +
      '又不推翻 `prefix-cls-default`=A 的承诺。**若用户认为 Phase 2 之后已不再需要 antd 类名兼容，则 B 更干净**' +
      '（一次清掉 24 条欠账），但那要显式重开 `prefix-cls-default`。' +
      '⚠️ 无论选哪个，都**不要**选 D —— 登记不是处置。',
    impact:
      '决定组件 CSS 的体积（当前 2522.2 KB，其中 827.2 KB 是 `ant` 变体），决定 `prefixCls="ant"` 到底是可用能力还是空承诺，' +
      '并决定是否**重开已裁决的 `prefix-cls-default`**。',
    blocks: [],
  }),
];

export default OPEN_DECISIONS;
