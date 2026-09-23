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

  open('visual-baseline-in-git', {
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
];

export default OPEN_DECISIONS;
