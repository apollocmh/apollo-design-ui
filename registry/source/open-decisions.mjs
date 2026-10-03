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
    // 注意：这里是 12 个运行包（不含 test-utils —— 它是 private，不发布，但同样需要可构建）
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

  open('prefix-cls-default', {
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

  open('use-id-test-env', {
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

  open('early-extract-table-core-tree-core', {
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

  open('docs-site-framework', {
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
    impact: '影响 packages/docs（Phase 3 后期），不阻塞 foundation 包',
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

  open('ui-style-output', {
    raisedAt: '2026-09-17',
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
      '决定 packages/ui 的 build.config.ts 形态、tests/build/run.mjs 的 B5/B6/B7 判据，以及全部 72 个组件的样式落地方式',
    blocks: [],
  }),

  open('empty-semantic-fn', {
    raisedAt: '2026-09-17',
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

  open('visual-harness-base-font', {
    raisedAt: '2026-09-28',
    question: 'L6 视觉 harness 的 react 侧是否要补上 antd 的页面基座字体（reset.css）？',
    context:
      'harness 的 react 侧不加载 `antd/dist/reset.css` ⇒ `body` 的 `font-family` 是浏览器初始值（实测 Chrome/macOS = `sans-serif`）；本仓 `ui/dist/index.css` **自带** html/body 的 reset（`font-family: var(--apollo-font-family)`）⇒ vue 侧 `body` = `-apple-system,…`。绝大多数组件无感（根类都显式声明 `font-family`，两侧归到同一份 token ⇒ 逐像素一致）；唯一暴露点是 **cascader 的面板与列** —— antd 的 `style/panel.js` 与 `style/index.js` 都是 `resetFont: false`，面板/列**没有** font-family、靠继承 ⇒ 两侧页面基座的差异直接显形。证据：`node tests/visual/debug/rect.mjs cascader basic body body` 输出两侧 body 的 `ff` 分别为 `sans-serif` / `-apple-system`；L6 残留差异像素全部落在文字与 1px 边框上（面板 0.002–0.009%、multiple 0.068–0.261%、basic 0.184–0.705%）。',
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
    impact:
      '决定 cascader 的 `visual` 维度能否收口（未裁决前不得置 done）；选项 A 还会影响全部 L6 用例的 react 基线',
    blocks: ['cascader'],
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
    blocks: ['date-picker'],
  }),
];

export default OPEN_DECISIONS;
